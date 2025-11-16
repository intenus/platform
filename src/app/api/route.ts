/**
 * Main Chat API Endpoint
 * Handles conversation flow, tool calling, and IGS Intent generation for Intenus Protocol
 */

import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { IntentBuilder } from '@intenus/common';
import { llamaClient } from '@/libs/llamaClient';
import { suiClient } from '@/libs/suiClient';
import { SYSTEM_PROMPT } from '@/lib/context/system-prompt';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4'),
    messages,
    system: SYSTEM_PROMPT,

    tools: {
      getMarketData: tool({
        description: 'Get real-time market data for Sui tokens and protocols from DeFiLlama',
        parameters: z.object({
          tokens: z.array(z.string()).describe('Token symbols to get data for (e.g. ["SUI", "USDC"])'),
          include_protocols: z.boolean().default(false).describe('Include top protocol data'),
          include_yield: z.boolean().default(false).describe('Include yield opportunities')
        }),
        execute: async (args) => {
          const { tokens, include_protocols, include_yield } = args;
          try {
            const [marketData, protocols, yields] = await Promise.all([
              llamaClient.getSuiMarketData(),
              include_protocols ? llamaClient.getTopSuiProtocols(5) : null,
              include_yield ? llamaClient.getSuiYieldPools() : null
            ]);

            // Get specific token prices
            const tokenPrices: Record<string, any> = {};
            for (const token of tokens) {
              const tokenKey = token.toLowerCase() === 'sui' ? 'sui' : 
                             token.toLowerCase() === 'usdc' ? 'usd-coin' : 
                             token.toLowerCase() === 'usdt' ? 'tether' : null;
              
              if (tokenKey && marketData.tokenPrices[tokenKey]) {
                tokenPrices[token] = {
                  symbol: token,
                  price: marketData.tokenPrices[tokenKey].price,
                  timestamp: marketData.tokenPrices[tokenKey].timestamp
                };
              }
            }

            return {
              success: true,
              market_overview: {
                total_tvl: marketData.totalTvl,
                sui_price: marketData.tokenPrices['sui']?.price || 2.17,
                daily_volume: marketData.volumeData.daily,
                protocol_count: marketData.protocolCount
              },
              token_prices: tokenPrices,
              top_protocols: protocols?.slice(0, 3).map(p => ({
                name: p.name,
                category: p.category,
                tvl: p.currentChainTvls?.Sui,
                description: p.description
              })),
              yield_opportunities: yields?.slice(0, 3).map(y => ({
                protocol: y.project,
                pool: y.pool,
                apy: y.apy,
                tvl: y.tvlUsd
              }))
            };
          } catch (error) {
            return {
              success: false,
              error: `Failed to fetch market data: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
          }
        }
      }),

      getSuiProtocols: tool({
        description: 'Search and get information about Sui DeFi protocols',
        parameters: z.object({
          category: z.enum(['Dexs', 'Lending', 'Yield', 'Derivatives', 'CDP', 'Bridge', 'Staking']).optional(),
          search_query: z.string().optional().describe('Search term for protocol name'),
          limit: z.number().default(5).describe('Number of protocols to return')
        }),
        execute: async (args) => {
          const { category, search_query, limit } = args;
          try {
            let protocols;
            
            if (search_query) {
              protocols = await llamaClient.searchProtocols(search_query);
            } else if (category) {
              protocols = await llamaClient.getProtocolsByCategory(category);
            } else {
              protocols = await llamaClient.getTopSuiProtocols(limit);
            }

            return {
              success: true,
              protocols: protocols.slice(0, limit).map(p => ({
                name: p.name,
                category: p.category,
                tvl: p.currentChainTvls?.Sui || 0,
                description: p.description,
                website: p.url,
                twitter: p.twitter,
                audited: !!p.audits
              }))
            };
          } catch (error) {
            return {
              success: false,
              error: `Failed to fetch protocols: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
          }
        }
      }),

      getUserBalance: tool({
        description: 'Check user token balances on Sui',
        parameters: z.object({
          user_address: z.string().describe('User Sui address'),
          tokens: z.array(z.string()).optional().describe('Specific tokens to check')
        }),
        execute: async (args) => {
          const { user_address, tokens } = args;
          try {
            if (!suiClient.isValidSuiAddress(user_address)) {
              return {
                success: false,
                error: 'Invalid Sui address format'
              };
            }

            const normalizedAddress = suiClient.normalizeSuiAddress(user_address);
            const balances = await suiClient.getUserBalances(normalizedAddress);

            // Filter by requested tokens if specified
            const filteredBalances = tokens 
              ? balances.filter(b => tokens.some(t => 
                  t.toLowerCase() === b.symbol.toLowerCase()
                ))
              : balances.filter(b => parseFloat(b.balanceFormatted) > 0);

            return {
              success: true,
              address: normalizedAddress,
              balances: filteredBalances.map(b => ({
                symbol: b.symbol,
                balance: b.balanceFormatted,
                coin_type: b.coinType,
                value_usd: b.valueUsd || 0
              }))
            };
          } catch (error) {
            return {
              success: false,
              error: `Failed to fetch balance: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
          }
        }
      }),

      validateIntent: tool({
        description: 'Validate intent parameters before generating final intent',
        parameters: z.object({
          intent_type: z.enum(['swap.exact_input', 'swap.exact_output', 'limit.sell', 'limit.buy']),
          input_token: z.string().describe('Input token symbol'),
          input_amount: z.string().describe('Input amount'),
          output_token: z.string().describe('Output token symbol'),
          output_amount: z.string().optional().describe('Expected output amount'),
          user_address: z.string(),
          slippage_bps: z.number().default(50).describe('Slippage tolerance in basis points'),
          deadline_minutes: z.number().default(5).describe('Transaction deadline in minutes')
        }),
        execute: async (args) => {
          const {
            intent_type,
            input_token,
            input_amount,
            output_token,
            output_amount,
            user_address,
            slippage_bps,
            deadline_minutes
          } = args;
          try {
            // Validate address
            if (!suiClient.isValidSuiAddress(user_address)) {
              return {
                valid: false,
                errors: ['Invalid Sui address format'],
                warnings: []
              };
            }

            const errors: string[] = [];
            const warnings: string[] = [];

            // Get token info
            const popularTokens = await suiClient.getPopularTokens();
            const inputToken = popularTokens.find(t => 
              t.symbol.toLowerCase() === input_token.toLowerCase()
            );
            const outputToken = popularTokens.find(t => 
              t.symbol.toLowerCase() === output_token.toLowerCase()
            );

            if (!inputToken) {
              errors.push(`Input token ${input_token} not found or not supported`);
            }
            if (!outputToken) {
              errors.push(`Output token ${output_token} not found or not supported`);
            }

            // Check user balance
            if (inputToken) {
              const balanceCheck = await suiClient.checkSufficientBalance(
                suiClient.normalizeSuiAddress(user_address),
                inputToken.coinType,
                suiClient.parseTokenAmount(input_amount, inputToken.decimals)
              );

              if (!balanceCheck.sufficient) {
                errors.push(`Insufficient balance: need ${input_amount} ${input_token}, have ${suiClient['formatTokenAmount'](balanceCheck.available, inputToken.decimals)}`);
              }
            }

            // Validate parameters
            if (parseFloat(input_amount) <= 0) {
              errors.push('Input amount must be greater than 0');
            }

            if (slippage_bps > 1000) {
              warnings.push('Slippage tolerance is very high (>10%)');
            }

            if (deadline_minutes > 1440) {
              warnings.push('Deadline is longer than 24 hours');
            }

            // Get market data for validation
            const marketData = await llamaClient.getSuiMarketData();
            const inputPrice = input_token.toLowerCase() === 'sui' ? marketData.tokenPrices['sui']?.price : 1;
            const tradeValueUsd = parseFloat(input_amount) * (inputPrice || 1);

            if (tradeValueUsd < 1) {
              warnings.push('Trade value is very small (<$1 USD)');
            }

            return {
              valid: errors.length === 0,
              errors,
              warnings,
              estimated_value_usd: tradeValueUsd,
              gas_estimate_usd: 0.01, // $0.01 typical
              tokens: {
                input: inputToken ? {
                  symbol: inputToken.symbol,
                  coin_type: inputToken.coinType,
                  decimals: inputToken.decimals
                } : null,
                output: outputToken ? {
                  symbol: outputToken.symbol,
                  coin_type: outputToken.coinType,
                  decimals: outputToken.decimals
                } : null
              }
            };
          } catch (error) {
            return {
              valid: false,
              errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
              warnings: []
            };
          }
        }
      }),

      generateIntent: tool({
        description: 'Generate final IGS Intent using Intenus Protocol standard',
        parameters: z.object({
          intent_type: z.enum(['swap.exact_input', 'swap.exact_output', 'limit.sell', 'limit.buy']),
          input_token: z.string().describe('Input token symbol'),
          input_amount: z.string().describe('Input amount in human-readable format'),
          output_token: z.string().describe('Output token symbol'),
          min_output_amount: z.string().optional().describe('Minimum output amount (for slippage protection)'),
          user_address: z.string().describe('User Sui address'),
          slippage_bps: z.number().default(50).describe('Slippage tolerance in basis points'),
          deadline_minutes: z.number().default(5).describe('Transaction deadline in minutes'),
          optimization_goal: z.enum(['maximize_output', 'minimize_gas', 'fastest_execution', 'balanced']).default('balanced'),
          auto_execute: z.boolean().default(false).describe('Auto-execute best solution'),
          privacy_level: z.enum(['public', 'private']).default('public').describe('Intent privacy level'),
          limit_price: z.string().optional().describe('Limit price for limit orders'),
        }),
        execute: async (params) => {
          try {
            // Get token info
            const popularTokens = await suiClient.getPopularTokens();
            const inputTokenInfo = popularTokens.find(t =>
              t.symbol.toLowerCase() === params.input_token.toLowerCase()
            );
            const outputTokenInfo = popularTokens.find(t =>
              t.symbol.toLowerCase() === params.output_token.toLowerCase()
            );

            if (!inputTokenInfo || !outputTokenInfo) {
              return {
                success: false,
                errors: ['Token information not found'],
                warnings: []
              };
            }

            // Parse amounts to base units
            const inputAmountBase = suiClient.parseTokenAmount(params.input_amount, inputTokenInfo.decimals);

            // Calculate min output with slippage
            const marketData = await llamaClient.getSuiMarketData();
            const inputPrice = params.input_token.toLowerCase() === 'sui' ? marketData.tokenPrices['sui']?.price || 2.17 : 1;
            const outputPrice = params.output_token.toLowerCase() === 'usdc' || params.output_token.toLowerCase() === 'usdt' ? 1 : inputPrice;

            const expectedOutputFloat = (parseFloat(params.input_amount) * inputPrice) / outputPrice;
            const minOutputFloat = expectedOutputFloat * (1 - params.slippage_bps / 10000);
            const minOutputBase = suiClient.parseTokenAmount(minOutputFloat.toFixed(outputTokenInfo.decimals), outputTokenInfo.decimals);

            // Build IGS Intent using IntentBuilder from @intenus/common
            const builder = new IntentBuilder(suiClient.normalizeSuiAddress(params.user_address));

            // Configure swap
            const intent = builder
              .swap(
                inputTokenInfo.coinType,
                inputAmountBase,
                outputTokenInfo.coinType,
                params.slippage_bps
              )
              .withSlippage(params.slippage_bps)
              .withDeadline(params.deadline_minutes * 60 * 1000)
              .withOptimization(params.optimization_goal)
              .build();

            // Add description
            intent.description = `Swap ${params.input_amount} ${params.input_token} to ${params.output_token}`;

            return {
              success: true,
              intent: intent,
              intent_id: intent.intent_id,
              summary: {
                operation: `${params.intent_type.replace('.', ' ')} ${params.input_amount} ${params.input_token} → ${params.output_token}`,
                deadline: `${params.deadline_minutes} minutes`,
                slippage: `${(params.slippage_bps / 100).toFixed(2)}%`,
                optimization: params.optimization_goal,
                expected_output: `~${expectedOutputFloat.toFixed(2)} ${params.output_token}`,
                min_output: `≥${minOutputFloat.toFixed(2)} ${params.output_token}`,
                intenus_benefits: [
                  '20-40% better rates via solver competition',
                  'MEV protection through batch auctions',
                  'Optimal routing across all Sui DEXs',
                  'Verifiable execution with cryptographic proof'
                ]
              },
              next_steps: [
                'Review the intent details',
                'Solvers will compete to find the best execution',
                'You\'ll see top-ranked solutions with surplus calculations',
                'Approve and execute the best solution'
              ]
            };
          } catch (error) {
            return {
              success: false,
              errors: [`Intent generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
              warnings: []
            };
          }
        }
      })
    },

    maxSteps: 10,
    temperature: 0.7
  });

  return result.toDataStreamResponse();
}