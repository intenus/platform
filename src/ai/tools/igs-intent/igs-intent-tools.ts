/**
 * IGS Intent Tools for AI SDK
 * These tools help AI generate compliant IGS Intents that work seamlessly
 * with market data and user preferences
 */

import { tool } from 'ai';
import { z } from 'zod';
import { IGSIntent, IGSIntentSchema, IntentBuilder } from '@intenus/common';
import {
  getTokenInfo,
  parseTokenAmount,
  getAllBalances,
  isValidSuiAddress,
  normalizeSuiAddress,
  getPopularTokens,
} from '@/libs/suiClient';
import {
  calculateSmartDefaults,
  getMarketContextForPair,
  generateIntentExplanation,
  analyzeIGSIntent,
  calculateComplianceScore,
  generateImprovementRecommendations,
  generateFixSuggestions,
  generateIntentComparison,
} from './utils';
import { SmartDefaultsParams } from './type';

// ===== TOKEN & BALANCE TOOLS =====

/**
 * Get list of supported tokens
 * Use when user asks "what tokens can I swap?"
 */
export const getSupportedTokensTool = tool({
  description: `
    Get list of all supported tokens on Sui blockchain for DeFi operations.
    Returns token symbols, names, and decimals. Use this when:
    - User asks "what tokens can I trade?"
    - You need to validate if a token is supported
    - Building intent and unsure about available tokens
  `,
  inputSchema: z.object({}),
  execute: async () => {
    const tokens = getPopularTokens();
    return {
      success: true,
      tokens: tokens.map((t) => ({
        symbol: t.symbol,
        name: t.name,
        decimals: t.decimals,
      })),
      message: `Found ${tokens.length} supported tokens: ${tokens.map(t => t.symbol).join(', ')}`,
    };
  },
});

/**
 * Check user's token balances
 * Use before creating swap intent to verify user has sufficient funds
 */
export const getUserBalanceTool = tool({
  description: `
    Check user's token balances on Sui blockchain for all supported tokens.
    ALWAYS use this tool before creating a swap intent to:
    - Verify user has sufficient balance for the swap
    - Suggest appropriate swap amounts based on available balance
    - Avoid creating intents that will fail due to insufficient funds
  `,
  inputSchema: z.object({
    user_address: z.string().describe('User Sui wallet address (0x... format)'),
  }),
  execute: async ({ user_address }) => {
    try {
      if (!isValidSuiAddress(user_address)) {
        return {
          success: false,
          error: 'Invalid Sui address format. Must be 0x followed by 64 hex characters.',
        };
      }

      const normalized = normalizeSuiAddress(user_address);
      const balances = await getAllBalances(normalized);

      return {
        success: true,
        address: normalized,
        balances: balances.map((b) => ({
          symbol: b.symbol,
          balance: b.balanceFormatted,
          decimals: b.decimals,
          coinType: b.coinType,
        })),
        summary: `User has ${balances.length} token(s) with non-zero balance`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balance',
      };
    }
  },
});

// ===== SIMPLE SWAP INTENT TOOL =====

/**
 * Create simple swap intent (beginner-friendly)
 * Use for straightforward swaps when user provides clear parameters
 */
export const createSwapIntentTool = tool({
  description: `
    Create basic swap intent with user-provided parameters.
    Use this when:
    - User provides exact input/output amounts and tokens
    - Simple swap without advanced optimization needed
    - Teaching/demonstrating intent creation

    For smart, optimized intents use buildSmartIGSIntentTool instead.
  `,
  inputSchema: z.object({
    user_address: z.string().describe('User Sui wallet address'),
    intent_type: z
      .enum(['swap.exact_input', 'swap.exact_output', 'limit.sell', 'limit.buy'])
      .describe('Type of swap operation'),
    input_token: z.string().describe('Input token symbol (SUI, USDC, USDT, WETH, WALRUS)'),
    input_amount: z.string().describe('Input amount (human readable, e.g. "100" for 100 SUI)'),
    output_token: z.string().describe('Output token symbol'),
    output_amount_min: z.string().optional().describe('Minimum output amount (optional)'),
    slippage_bps: z.number().default(50).describe('Slippage tolerance in basis points (50 = 0.5%)'),
    deadline_minutes: z.number().default(10).describe('Deadline in minutes'),
    optimization_goal: z
      .enum(['balanced', 'maximize_output', 'minimize_gas', 'fastest_execution'])
      .default('balanced'),
  }),
  execute: async (params) => {
    try {
      // Validate address
      if (!isValidSuiAddress(params.user_address)) {
        return { success: false, error: 'Invalid Sui address format' };
      }

      // Get token info
      const inputTokenInfo = getTokenInfo(params.input_token.toUpperCase());
      const outputTokenInfo = getTokenInfo(params.output_token.toUpperCase());

      if (!inputTokenInfo) {
        return {
          success: false,
          error: `Unsupported input token: ${params.input_token}. Use getSupportedTokensTool to see available tokens.`,
        };
      }
      if (!outputTokenInfo) {
        return {
          success: false,
          error: `Unsupported output token: ${params.output_token}. Use getSupportedTokensTool to see available tokens.`,
        };
      }

      const now = Date.now();
      const normalized = normalizeSuiAddress(params.user_address);
      const inputAmountRaw = parseTokenAmount(params.input_amount, inputTokenInfo.decimals);

      // Build output amount
      const buildOutputAmount = () => {
        if (params.intent_type === 'swap.exact_output' && params.output_amount_min) {
          const outputAmountRaw = parseTokenAmount(params.output_amount_min, outputTokenInfo.decimals);
          return { type: 'exact' as const, value: outputAmountRaw };
        }
        if (params.output_amount_min) {
          const minOutputRaw = parseTokenAmount(params.output_amount_min, outputTokenInfo.decimals);
          return { type: 'range' as const, min: minOutputRaw, max: '99999999999999999' };
        }
        return { type: 'all' as const };
      };

      // Get operation mode
      const getOperationMode = () => {
        switch (params.intent_type) {
          case 'swap.exact_input':
            return 'exact_input';
          case 'swap.exact_output':
            return 'exact_output';
          case 'limit.sell':
          case 'limit.buy':
            return 'limit_order';
          default:
            return 'exact_input';
        }
      };

      // Build IGS Intent
      const igsIntent: IGSIntent = {
        igs_version: '1.0.0',
        object: {
          user_address: normalized,
          created_ts: now,
          policy: {
            solver_access_window: {
              start_ms: now,
              end_ms: now + params.deadline_minutes * 60 * 1000,
            },
            auto_revoke_time: 3600,
            access_condition: {
              requires_solver_registration: true,
              min_solver_stake: '100000000',
              requires_tee_attestation: false,
              expected_measurement: 'none',
              purpose: `${params.intent_type} - ${params.input_token} to ${params.output_token}`,
            },
          },
        },
        user_address: normalized,
        intent_type: params.intent_type,
        operation: {
          mode: getOperationMode(),
          inputs: [
            {
              asset_id: inputTokenInfo.coinType,
              asset_info: {
                symbol: inputTokenInfo.symbol,
                decimals: inputTokenInfo.decimals,
                name: inputTokenInfo.name,
              },
              amount: { type: 'exact' as const, value: inputAmountRaw },
            },
          ],
          outputs: [
            {
              asset_id: outputTokenInfo.coinType,
              asset_info: {
                symbol: outputTokenInfo.symbol,
                decimals: outputTokenInfo.decimals,
                name: outputTokenInfo.name,
              },
              amount: buildOutputAmount(),
            },
          ],
        },
        constraints: {
          max_slippage_bps: params.slippage_bps,
          deadline_ms: now + params.deadline_minutes * 60 * 1000,
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
      const builder = new IntentBuilder(igsIntent);
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
        message: `Created ${params.intent_type} intent: ${params.input_amount} ${params.input_token} → ${params.output_token}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create intent',
      };
    }
  },
});

// ===== SMART INTENT BUILDER (RECOMMENDED) =====

/**
 * Build optimized IGS Intent with AI assistance
 * This is the MAIN tool for creating intents - it's smart and context-aware
 */
export const buildSmartIGSIntentTool = tool({
  description: `
    **PRIMARY INTENT CREATION TOOL - Use this for most intent generation!**

    Build sophisticated, optimized IGS Intent with smart defaults and market awareness.
    This tool:
    - Automatically fetches current market data
    - Optimizes parameters based on user goals (best price, low gas, speed, safety)
    - Adjusts for risk tolerance and urgency
    - Provides detailed explanations of all choices made
    - Integrates with market tools for real-time recommendations

    Use this when:
    - User wants to swap tokens (this is the default choice)
    - You need intelligent parameter optimization
    - Market conditions should influence the intent
    - User mentions goals like "best price", "fastest", "safest", "cheapest"

    The tool automatically:
    ✓ Fetches current market prices and liquidity
    ✓ Recommends optimal protocols based on conditions
    ✓ Calculates smart slippage and deadline values
    ✓ Estimates gas costs and execution probability
    ✓ Provides full explanation of all decisions
  `,
  inputSchema: z.object({
    // Core requirements
    user_address: z.string().describe("User's Sui wallet address (0x...)"),
    intent_description: z
      .string()
      .describe('Natural language description of what user wants (e.g., "swap 100 SUI for USDC")'),

    // Asset specifications
    input_asset: z.string().describe('Input token symbol (SUI, USDC, USDT, WETH, WALRUS)'),
    input_amount: z.string().describe('Amount to swap/trade (human readable number)'),
    output_asset: z.string().describe('Desired output token symbol'),

    // User preferences (AI helps choose optimal values)
    priority: z
      .enum(['maximize_output', 'minimize_gas', 'fastest_execution', 'balanced', 'maximum_safety'])
      .default('balanced')
      .describe("User's primary goal - drives all optimization decisions"),

    risk_tolerance: z
      .enum(['low', 'medium', 'high'])
      .default('medium')
      .describe('Risk tolerance: low=conservative, high=aggressive'),

    urgency: z
      .enum(['low', 'normal', 'urgent'])
      .default('normal')
      .describe('How quickly intent needs to execute'),

    // Advanced options (optional)
    custom_slippage_bps: z.number().optional().describe('Override smart slippage calculation'),
    deadline_minutes: z.number().optional().describe('Override smart deadline calculation'),
    protocol_preferences: z.array(z.string()).optional().describe('Preferred DEXs (Cetus, Turbos, etc)'),
    protocol_blacklist: z.array(z.string()).optional().describe('DEXs to avoid'),

    // Market integration
    use_market_data: z
      .boolean()
      .default(true)
      .describe('Whether to fetch and use current market data for optimization'),
  }),

  execute: async (params) => {
    try {
      // 1. Validate inputs
      if (!isValidSuiAddress(params.user_address)) {
        return { success: false, error: 'Invalid Sui address format (must be 0x followed by 64 hex chars)' };
      }

      const inputToken = getTokenInfo(params.input_asset.toUpperCase());
      const outputToken = getTokenInfo(params.output_asset.toUpperCase());

      if (!inputToken || !outputToken) {
        return {
          success: false,
          error: `Unsupported token: ${!inputToken ? params.input_asset : params.output_asset}`,
          supported_tokens: getPopularTokens().map((t) => t.symbol),
          suggestion: 'Use getSupportedTokensTool to see all available tokens',
        };
      }

      // 2. Get market context if needed
      let marketData = null;
      if (params.use_market_data) {
        try {
          marketData = await getMarketContextForPair(inputToken.symbol, outputToken.symbol);
          if (marketData) {
            console.log(`✓ Fetched market data: ${inputToken.symbol}/${outputToken.symbol} - ${marketData.market_volatility} volatility`);
          }
        } catch (e) {
          console.log('⚠ Continuing without market data');
        }
      }

      // 3. Calculate smart defaults using utility function
      const smartDefaultsParams: SmartDefaultsParams = {
        priority: params.priority,
        risk_tolerance: params.risk_tolerance,
        urgency: params.urgency,
        inputToken,
        outputToken,
        amount: params.input_amount,
        marketData,
      };  

      const smartDefaults = calculateSmartDefaults(smartDefaultsParams);

      // 4. Build optimized IGS intent
      const now = Date.now();
      const normalized = normalizeSuiAddress(params.user_address);
      const inputAmountRaw = parseTokenAmount(params.input_amount, inputToken.decimals);

      const igsIntent: IGSIntent = {
        igs_version: '1.0.0',

        object: {
          user_address: normalized,
          created_ts: now,
          policy: {
            solver_access_window: {
              start_ms: now,
              end_ms: now + smartDefaults.access_window_ms,
            },
            auto_revoke_time: smartDefaults.auto_revoke_hours * 3600,
            access_condition: {
              requires_solver_registration: true,
              min_solver_stake: smartDefaults.min_solver_stake,
              requires_tee_attestation: smartDefaults.requires_tee,
              expected_measurement: smartDefaults.requires_tee ? 'latest' : 'none',
              purpose: `${params.intent_description} - optimized for ${params.priority}`,
            },
          },
        },

        user_address: normalized,
        intent_type: smartDefaults.intent_type,
        description: params.intent_description,

        operation: {
          mode: smartDefaults.operation_mode,
          inputs: [
            {
              asset_id: inputToken.coinType,
              asset_info: {
                symbol: inputToken.symbol,
                decimals: inputToken.decimals,
                name: inputToken.name,
              },
              amount: { type: 'exact', value: inputAmountRaw },
            },
          ],
          outputs: [
            {
              asset_id: outputToken.coinType,
              asset_info: {
                symbol: outputToken.symbol,
                decimals: outputToken.decimals,
                name: outputToken.name,
              },
              amount: smartDefaults.output_amount,
            },
          ],
          expected_outcome: smartDefaults.expected_outcome,
        },

        constraints: {
          max_slippage_bps: params.custom_slippage_bps || smartDefaults.slippage_bps,
          deadline_ms: now + ((params.deadline_minutes || smartDefaults.deadline_minutes) * 60 * 1000),
          max_gas_cost: smartDefaults.max_gas_cost,
          routing: {
            max_hops: smartDefaults.max_hops,
            whitelist_protocols: params.protocol_preferences,
            blacklist_protocols: params.protocol_blacklist,
          },
        },

        preferences: {
          optimization_goal: params.priority,
          ranking_weights: smartDefaults.ranking_weights,
          execution: {
            mode: 'best_solution',
            show_top_n: 3,
          },
          privacy: {
            encrypt_intent: smartDefaults.should_encrypt,
            anonymous_execution: false,
          },
        },

        metadata: {
          original_input: {
            text: params.intent_description,
            language: 'en',
            confidence: 0.95,
          },
          client: {
            name: 'Intenus AI Assistant',
            version: '1.0.0',
            platform: 'web',
          },
          tags: smartDefaults.tags,
        },
      };

      // 5. Validate and build
      const builder = new IntentBuilder(igsIntent);
      const validatedIntent = builder.build();

      // 6. Generate explanation using utility function
      const explanation = generateIntentExplanation(validatedIntent, smartDefaults, params);

      return {
        success: true,
        intent: validatedIntent,
        smart_choices: {
          slippage: `${smartDefaults.slippage_bps} bps (${smartDefaults.expected_slippage})`,
          deadline: `${smartDefaults.deadline_minutes} minutes`,
          max_hops: smartDefaults.max_hops,
          solver_requirements: `Min stake: ${smartDefaults.min_solver_stake}, TEE: ${smartDefaults.requires_tee}`,
          optimization_weights: smartDefaults.ranking_weights,
        },
        explanation,
        market_insights: marketData
          ? {
              volatility: marketData.market_volatility,
              liquidity: marketData.liquidity_depth,
              recommended_protocols: marketData.recommended_protocols,
            }
          : undefined,
        estimated_performance: {
          gas_cost_range: smartDefaults.estimated_gas_range,
          slippage_expected: smartDefaults.expected_slippage,
          execution_probability: smartDefaults.execution_probability,
          solver_competition_level: smartDefaults.solver_competition,
        },
        message: `✓ Created optimized ${params.priority} intent with ${smartDefaults.execution_probability}% execution probability`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build smart intent',
      };
    }
  },
});

// ===== VALIDATION & ANALYSIS TOOLS =====

/**
 * Validate IGS Intent compliance
 * Use to check if an intent follows IGS v1.0.0 standard
 */
export const validateIGSIntentTool = tool({
  description: `
    Validate IGS Intent structure and get compliance feedback.
    Use this to:
    - Verify an intent is correctly formatted
    - Get detailed compliance score
    - Understand what could be improved
    - Debug intent creation issues
  `,
  inputSchema: z.object({
    intent: IGSIntentSchema.describe('IGS Intent object to validate'),
    explain_structure: z
      .boolean()
      .default(false)
      .describe('Whether to provide detailed structural analysis'),
  }),
  execute: async ({ intent, explain_structure }) => {
    try {
      // Validate using IntentBuilder
      const builder = new IntentBuilder(intent);
      const validatedIntent = builder.build();

      // Analyze intent structure using utility function
      const analysis = explain_structure ? analyzeIGSIntent(validatedIntent) : undefined;

      return {
        success: true,
        valid: true,
        intent: validatedIntent,
        analysis,
        compliance_score: calculateComplianceScore(validatedIntent),
        recommendations: generateImprovementRecommendations(validatedIntent),
        message: '✓ Intent is valid and complies with IGS v1.0.0 standard',
      };
    } catch (error) {
      return {
        success: false,
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        suggestions: generateFixSuggestions(intent),
      };
    }
  },
});

/**
 * Compare multiple IGS Intents
 * Use to help users understand trade-offs between different strategies
 */
export const compareIGSIntentsTool = tool({
  description: `
    Compare multiple IGS Intents side-by-side to understand trade-offs.
    Useful for:
    - Showing different optimization strategies for same goal
    - Explaining why one approach is better than another
    - Helping users make informed decisions
    - Demonstrating impact of different parameters
  `,
  inputSchema: z.object({
    intents: z
      .array(IGSIntentSchema)
      .min(2)
      .max(5)
      .describe('2-5 IGS Intents to compare'),
    comparison_criteria: z
      .array(
        z.enum([
          'expected_gas_cost',
          'slippage_tolerance',
          'execution_speed',
          'solver_requirements',
          'success_probability',
          'privacy_level',
        ])
      )
      .default(['expected_gas_cost', 'slippage_tolerance', 'execution_speed'])
      .describe('Criteria to compare across intents'),
  }),
  execute: async ({ intents, comparison_criteria }) => {
    try {
      const comparison = generateIntentComparison(intents, comparison_criteria);
      return {
        success: true,
        comparison,
        message: `Compared ${intents.length} intents across ${comparison_criteria.length} criteria`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to compare intents',
      };
    }
  },
});
