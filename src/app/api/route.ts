/**
 * Main Chat API Endpoint
 * Handles conversation flow, tool calling, and IGS Intent generation
 */

import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import type { ConversationData } from '../../../lib/intent-builder';
import { llamaClient } from '@/libs/llamaClient';
import { suiClient } from '@/libs/suiClient';
import {IntentBuilder} from"@intenus/common";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4'),
    messages,
    system: `You are an expert DeFi assistant for the Sui blockchain ecosystem. Your role is to help users create optimal DeFi intents using natural language.

**Your Knowledge:**
- Sui is a layer-1 blockchain with $7.9B+ TVL and 200+ DeFi protocols
- Major protocols: Cetus, Turbos Finance, Interest Protocol, FlowX, NAVI Protocol
- Native token: SUI (current price ~$2.17)
- Popular tokens: USDC, USDT, WETH, WBTC
- Categories: DEX, Lending, Yield Farming, Derivatives, Bridges

**Your Process:**
1. **Understand Intent**: What DeFi operation does the user want? (swap, lend, borrow, yield farm, limit order)
2. **Gather Parameters**: Collect all required details step-by-step
3. **Provide Context**: Use tools to fetch real-time market data
4. **Build Intent**: Create a valid IGS Intent for Intenus Protocol
5. **Present Options**: Show the user a clear summary and next steps

**Available Tools:**
- getMarketData: Fetch real-time prices and market data
- getSuiProtocols: Get information about DeFi protocols
- getUserBalance: Check user's token balances  
- validateIntent: Validate intent parameters
- generateIntent: Create final IGS Intent

**Conversation Style:**
- Be conversational and helpful
- Ask clarifying questions when needed
- Provide market context and recommendations
- Explain risks and benefits clearly
- Use emojis sparingly but appropriately

**Current Market Context:** 
- SUI Price: $2.17
- Total Sui TVL: $7.9B
- Daily DEX Volume: $273M+
- Active protocols: 200+

Start by understanding what the user wants to do in DeFi.`,

    tools: {
      getMarketData: tool({
        description: 'Get real-time market data for Sui tokens and protocols',
        parameters: z.object({
          tokens: z.array(z.string()).describe('Token symbols to get data for (e.g. ["SUI", "USDC"])'),
          include_protocols: z.boolean().default(false).describe('Include protocol data'),
          include_yield: z.boolean().default(false).describe('Include yield opportunities')
        }),
        execute: async ({ tokens, include_protocols, include_yield }) => {
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
        execute: async ({ category, search_query, limit }) => {
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
        execute: async ({ user_address, tokens }) => {
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
        execute: async ({ 
          intent_type, 
          input_token, 
          input_amount, 
          output_token, 
          output_amount,
          user_address,
          slippage_bps,
          deadline_minutes
        }) => {
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
        description: 'Generate final IGS Intent from collected conversation data',
        parameters: z.object({
          intent_type: z.enum(['swap.exact_input', 'swap.exact_output', 'limit.sell', 'limit.buy']),
          input_token: z.string(),
          input_amount: z.string(),
          output_token: z.string(),
          min_output_amount: z.string().optional(),
          desired_output_amount: z.string().optional(),
          user_address: z.string(),
          slippage_bps: z.number().default(50),
          deadline_minutes: z.number().default(5),
          optimization_goal: z.enum(['maximize_output', 'minimize_gas', 'fastest_execution', 'balanced']).default('balanced'),
          auto_execute: z.boolean().default(false),
          require_simulation: z.boolean().default(true),
          privacy_level: z.enum(['public', 'private']).default('public'),
          limit_price: z.string().optional().describe('For limit orders only'),
          limit_comparison: z.enum(['gte', 'lte']).optional().describe('For limit orders only')
        }),
        execute: async (params) => {
          try {
            // Get required data
            const [marketData, userBalances, inputTokenInfo, outputTokenInfo] = await Promise.all([
              llamaClient.getSuiMarketData(),
              suiClient.getUserBalances(suiClient.normalizeSuiAddress(params.user_address)),
              suiClient.getTokenInfo(
                params.input_token.toLowerCase() === 'sui' ? '0x2::sui::SUI' :
                params.input_token.toLowerCase() === 'usdc' ? '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN' :
                '0x2::sui::SUI' // fallback
              ),
              suiClient.getTokenInfo(
                params.output_token.toLowerCase() === 'usdc' ? '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN' :
                params.output_token.toLowerCase() === 'sui' ? '0x2::sui::SUI' :
                '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN' // fallback
              )
            ]);

            // Build conversation data
            const conversationData: ConversationData = {
              intent_type: params.intent_type,
              operation: {
                inputs: [{
                  token: inputTokenInfo,
                  amount: suiClient.parseTokenAmount(params.input_amount, inputTokenInfo.decimals),
                  amount_type: 'exact'
                }],
                outputs: [{
                  token: outputTokenInfo,
                  min_amount: params.min_output_amount ? 
                    suiClient.parseTokenAmount(params.min_output_amount, outputTokenInfo.decimals) : 
                    undefined,
                  desired_amount: params.desired_output_amount ?
                    suiClient.parseTokenAmount(params.desired_output_amount, outputTokenInfo.decimals) :
                    undefined
                }]
              },
              constraints: {
                slippage_tolerance_bps: params.slippage_bps,
                deadline_minutes: params.deadline_minutes,
                ...(params.limit_price && {
                  limit_price: {
                    price: params.limit_price,
                    comparison: params.limit_comparison || 'gte',
                    quote_token: outputTokenInfo.coinType
                  }
                })
              },
              user_preferences: {
                optimization_goal: params.optimization_goal,
                urgency: params.deadline_minutes <= 2 ? 'high' : 'normal',
                auto_execute: params.auto_execute,
                require_simulation: params.require_simulation,
                privacy_level: params.privacy_level
              },
              user_context: {
                address: suiClient.normalizeSuiAddress(params.user_address),
                balances: userBalances,
                platform: 'web',
                language: 'en'
              },
              market_context: marketData
            };

            // Generate intent
            const result = await IGSIntentBuilder.build(conversationData);

            if (result.success && result.intent) {
              return {
                success: true,
                intent: result.intent,
                intent_id: result.intent.intent_id,
                validation_score: result.validation_score,
                warnings: result.warnings,
                summary: {
                  operation: `${params.intent_type.replace('.', ' ')} ${params.input_amount} ${params.input_token} → ${params.output_token}`,
                  deadline: `${params.deadline_minutes} minutes`,
                  slippage: `${(params.slippage_bps / 100).toFixed(2)}%`,
                  optimization: params.optimization_goal
                }
              };
            } else {
              return {
                success: false,
                errors: result.errors,
                warnings: result.warnings,
                validation_score: result.validation_score
              };
            }
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

    maxSteps: 5,
    temperature: 0.7
  });

  return result.toDataStreamResponse();
}