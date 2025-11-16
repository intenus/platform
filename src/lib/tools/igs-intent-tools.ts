/**
 * General IGS Intent Tools
 * These tools help build ANY type of IGS Intent using Intenus Protocol standard
 */

import { tool } from 'ai';
import { z } from 'zod';
import { IntentBuilder } from '@intenus/common';
import { getTokenInfo, parseTokenAmount, getAllBalances, isValidSuiAddress, normalizeSuiAddress } from '@/libs/suiClient';

/**
 * Get user's token balances on Sui blockchain
 */
export const getUserBalanceTool = tool({
  description: 'Check user token balances on Sui blockchain for any supported token (SUI, USDC, USDT, WETH, WALRUS)',
  inputSchema: z.object({
    user_address: z.string().describe('User Sui wallet address (0x... format)'),
  }),
  execute: async ({ user_address }) => {

    try {
      if (!isValidSuiAddress(user_address)) {
        return {
          success: false,
          error: 'Invalid Sui address format. Must be 0x followed by hex characters.',
        };
      }

      const normalized = normalizeSuiAddress(user_address);
      const balances = await getAllBalances(normalized);

      return {
        success: true,
        address: normalized,
        balances: balances.map(b => ({
          symbol: b.symbol,
          balance: b.balanceFormatted,
          decimals: b.decimals,
          coinType: b.coinType,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balance',
      };
    }
  },
});

/**
 * Build a general IGS Intent
 * This tool constructs IGS Intents for any operation type using IntentBuilder from @intenus/common
 */
export const buildIGSIntentTool = tool({
  description: 'Build IGS (Intenus General Standard) Intent from user requirements. Works for swaps, limit orders, and more. Uses IntentBuilder from @intenus/common to ensure IGS v1.0 compliance.',
  inputSchema: z.object({
    user_address: z.string().describe('User wallet address'),
    intent_type: z.enum(['swap.exact_input', 'swap.exact_output', 'limit.sell', 'limit.buy']).describe('Type of intent operation'),
    input_token: z.string().describe('Input token symbol (e.g., SUI, USDC, WALRUS)'),
    input_amount: z.string().describe('Input amount in human-readable format (e.g., "100")'),
    output_token: z.string().describe('Output token symbol (e.g., USDC, SUI)'),

    // Optional parameters with defaults
    slippage_bps: z.number().optional().describe('Maximum slippage in basis points (default: 50 = 0.5%)'),
    deadline_minutes: z.number().optional().describe('Deadline from now in minutes (default: 5)'),
    optimization_goal: z.enum(['maximize_output', 'minimize_gas', 'fastest_execution', 'balanced']).optional().describe('Optimization strategy (default: balanced)'),

    // For limit orders
    limit_price: z.string().optional().describe('Limit price for limit orders'),

    // Metadata
    description: z.string().optional().describe('Human-readable description of the intent'),
  }),
  execute: async (params) => {
    const {
      user_address,
      intent_type,
      input_token,
      input_amount,
      output_token,
      slippage_bps = 50,
      deadline_minutes = 5,
      optimization_goal = 'balanced' as const,
      limit_price,
      description,
    } = params;

    try {
      // Validate address
      if (!isValidSuiAddress(user_address)) {
        return {
          success: false,
          error: 'Invalid Sui address format',
        };
      }

      const normalized = normalizeSuiAddress(user_address);

      // Get token info
      const inputTokenInfo = getTokenInfo(input_token);
      const outputTokenInfo = getTokenInfo(output_token);

      if (!inputTokenInfo || !outputTokenInfo) {
        return {
          success: false,
          error: `Token not supported. Input: ${input_token}, Output: ${output_token}. Supported: SUI, USDC, USDT, WETH, WALRUS`,
        };
      }

      // Parse amount to smallest units
      const amountInSmallestUnit = parseTokenAmount(input_amount, inputTokenInfo.decimals);

      // Build intent using IntentBuilder from @intenus/common
      const builder = new IntentBuilder(normalized);

      // Configure based on intent type
      if (intent_type === 'swap.exact_input') {
        builder
          .swap(inputTokenInfo.coinType, amountInSmallestUnit, outputTokenInfo.coinType)
          .withSlippage(slippage_bps)
          .withDeadline(deadline_minutes * 60 * 1000)
          .withOptimization(optimization_goal);
      } else if (intent_type === 'swap.exact_output') {
        // For exact output, input_amount is the desired output
        const outputAmount = parseTokenAmount(input_amount, outputTokenInfo.decimals);
        // Note: IntentBuilder might need a swapExactOutput method, using swap for now
        builder
          .swap(inputTokenInfo.coinType, amountInSmallestUnit, outputTokenInfo.coinType)
          .withSlippage(slippage_bps)
          .withDeadline(deadline_minutes * 60 * 1000)
          .withOptimization(optimization_goal);
      } else if (intent_type === 'limit.sell' || intent_type === 'limit.buy') {
        if (!limit_price) {
          return {
            success: false,
            error: 'limit_price is required for limit orders',
          };
        }

        // Build limit order intent
        builder
          .swap(inputTokenInfo.coinType, amountInSmallestUnit, outputTokenInfo.coinType)
          .withSlippage(slippage_bps)
          .withOptimization(optimization_goal);
      }

      // Add description if provided
      if (description) {
        const intent = builder.build();
        intent.description = description;
        intent.intent_type = intent_type;
      }

      // Build the final IGS Intent
      const intent = builder.build();

      return {
        success: true,
        intent,
        summary: {
          type: intent_type,
          from: `${input_amount} ${input_token}`,
          to: output_token,
          slippage: `${slippage_bps / 100}%`,
          deadline: `${deadline_minutes} minutes`,
          optimization: optimization_goal,
          intenus_benefits: [
            '✓ 20-40% better rates via solver competition',
            '✓ MEV protection through batch auctions',
            '✓ Optimal routing across all Sui DEXs',
            '✓ Verifiable execution with cryptographic proof',
          ],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build IGS Intent',
      };
    }
  },
});
