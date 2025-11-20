/**
 * General IGS Intent Tools
 * These tools help build ANY type of IGS Intent using Intenus Protocol standard
 */

import { tool } from 'ai';
import { z } from 'zod';
import { IGSIntentSchema, IntentBuilder } from '@intenus/common';
import {
  getTokenInfo,
  parseTokenAmount,
  getAllBalances,
  isValidSuiAddress,
  normalizeSuiAddress,
  getPopularTokens,
  POPULAR_TOKENS
} from '@/libs/suiClient';

/**
 * Get supported tokens list
 */
export const getSupportedTokensTool = tool({
  description: 'Get list of all supported tokens on Sui for swapping',
  inputSchema: z.object({}),
  execute: async () => {
    const tokens = getPopularTokens();
    return {
      success: true,
      tokens: tokens.map(t => ({
        symbol: t.symbol,
        name: t.name,
        decimals: t.decimals,
      })),
    };
  },
});

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
 * Simplified Intent Creator (User-friendly inputs)
 */
export const createSwapIntentTool = tool({
  description: 'Create swap intent with simplified user inputs. Handles exact input/output swaps and limit orders. Use this for creating user-friendly swap intents.',
  inputSchema: z.object({
    user_address: z.string().describe('User Sui wallet address'),
    intent_type: z.enum(['swap.exact_input', 'swap.exact_output', 'limit.sell', 'limit.buy']).describe('Type of swap operation'),
    input_token: z.string().describe('Input token symbol (SUI, USDC, etc)'),
    input_amount: z.string().describe('Input amount to swap (in human readable format, e.g., "100" for 100 SUI)'),
    output_token: z.string().describe('Output token symbol'),
    output_amount_min: z.string().optional().describe('Minimum output amount'),
    slippage_bps: z.number().default(50).describe('Slippage tolerance in basis points (50 = 0.5%)'),
    deadline_minutes: z.number().default(10).describe('Deadline in minutes'),
    optimization_goal: z.enum(['balanced', 'maximize_output', 'minimize_gas', 'fastest_execution']).default('balanced'),
  }),
  execute: async (params) => {
    try {
      if (!isValidSuiAddress(params.user_address)) {
        return { success: false, error: 'Invalid Sui address format' };
      }

      const inputTokenInfo = getTokenInfo(params.input_token.toUpperCase());
      const outputTokenInfo = getTokenInfo(params.output_token.toUpperCase());

      if (!inputTokenInfo) {
        return { success: false, error: `Unsupported input token: ${params.input_token}` };
      }
      if (!outputTokenInfo) {
        return { success: false, error: `Unsupported output token: ${params.output_token}` };
      }

      const now = Date.now();
      const normalized = normalizeSuiAddress(params.user_address);

      // Parse amounts to smallest unit
      const inputAmountRaw = parseTokenAmount(params.input_amount, inputTokenInfo.decimals);

      // Build output amount structure
      const buildOutputAmount = () => {
        if (params.intent_type === 'swap.exact_output' && params.output_amount_min) {
          const outputAmountRaw = parseTokenAmount(params.output_amount_min, outputTokenInfo.decimals);
          return {
            type: "exact" as const,
            value: outputAmountRaw,
          };
        }

        if (params.output_amount_min) {
          const minOutputRaw = parseTokenAmount(params.output_amount_min, outputTokenInfo.decimals);
          return {
            type: "range" as const,
            min: minOutputRaw,
            max: "99999999999999999",
          };
        }

        return { type: "all" as const };
      };

      // Get operation mode
      const getOperationMode = () => {
        switch (params.intent_type) {
          case 'swap.exact_input': return 'exact_input';
          case 'swap.exact_output': return 'exact_output';
          case 'limit.sell':
          case 'limit.buy': return 'limit_order';
          default: return 'exact_input';
        }
      };

      // Build complete IGS Intent structure
      const igsIntent = {
        igs_version: "1.0.0" as const,
        object: {
          user_address: normalized,
          created_ts: now,
          policy: {
            solver_access_window: {
              start_ms: now,
              end_ms: now + (params.deadline_minutes * 60 * 1000),
            },
            auto_revoke_time: 3600,
            access_condition: {
              requires_solver_registration: true,
              min_solver_stake: "100000000",
              requires_tee_attestation: false,
              expected_measurement: "none",
              purpose: `${params.intent_type} - ${params.input_token} to ${params.output_token}`,
            },
          },
        },
        user_address: normalized,
        intent_type: params.intent_type,
        operation: {
          mode: getOperationMode(),
          inputs: [{
            asset_id: inputTokenInfo.coinType,
            asset_info: {
              symbol: inputTokenInfo.symbol,
              decimals: inputTokenInfo.decimals,
              name: inputTokenInfo.name,
            },
            amount: {
              type: "exact" as const,
              value: inputAmountRaw,
            },
          }],
          outputs: [{
            asset_id: outputTokenInfo.coinType,
            asset_info: {
              symbol: outputTokenInfo.symbol,
              decimals: outputTokenInfo.decimals,
              name: outputTokenInfo.name,
            },
            amount: buildOutputAmount(),
          }],
        },
        constraints: {
          max_slippage_bps: params.slippage_bps,
          deadline_ms: now + (params.deadline_minutes * 60 * 1000),
        },
        preferences: {
          optimization_goal: params.optimization_goal,
          ranking_weights: {
            surplus_weight: params.optimization_goal === 'maximize_output' ? 0.6 : 0.25,
            gas_cost_weight: params.optimization_goal === 'minimize_gas' ? 0.6 : 0.25,
            execution_speed_weight: params.optimization_goal === 'fastest_execution' ? 0.6 : 0.25,
            reputation_weight: 0.25,
          },
        },
      };

      // Validate with IntentBuilder
      const builder = new IntentBuilder(igsIntent as any);
      const validated = builder.build();

      return {
        success: true,
        intent: validated,
        summary: {
          type: params.intent_type,
          from: `${params.input_amount} ${params.input_token.toUpperCase()}`,
          to: params.output_token.toUpperCase(),
          slippage: `${params.slippage_bps / 100}%`,
          deadline: `${params.deadline_minutes} minutes`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create intent',
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
  inputSchema: IGSIntentSchema,
  execute: async (params) => {
    const {
      user_address,
      intent_type,
      object,
      ...rest
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
      const builder = new IntentBuilder(params);

      const intent = builder.build();

      return {
        success: true,
        intent,
        summary: {
          type: intent_type,
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
