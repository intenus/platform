/**
 * General IGS Intent Tools
 * These tools help build ANY type of IGS Intent using Intenus Protocol standard
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
      const builder = new IntentBuilder(igsIntent as IGSIntent);
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
export const buildSmartIGSIntentTool = tool({
  description: `
    Build sophisticated IGS Intent with smart defaults and optimization.
    Automatically fills in optimal values based on intent type, market conditions,
    and user preferences. Provides explanations for all choices made.
  `,
  parameters: z.object({
    // Core requirements
    user_address: z.string().describe("User's Sui wallet address"),
    intent_description: z.string().describe("Natural language description of what user wants"),
    
    // Asset specifications
    input_asset: z.string().describe("Input token symbol (SUI, USDC, etc)"),
    input_amount: z.string().describe("Amount to swap/trade"),
    output_asset: z.string().describe("Desired output token symbol"),
    
    // User preferences
    priority: z.enum([
      'maximize_output',     // Best price, willing to pay more gas
      'minimize_gas',        // Cheapest execution
      'fastest_execution',   // Speed over everything
      'balanced',           // Balance all factors
      'maximum_safety'      // Conservative, low risk
    ]).default('balanced').describe("User's primary goal"),
    
    risk_tolerance: z.enum(['low', 'medium', 'high']).default('medium'),
    urgency: z.enum(['low', 'normal', 'urgent']).default('normal'),
    
    // Advanced options (optional)
    custom_slippage_bps: z.number().optional().describe("Custom slippage if not using smart defaults"),
    deadline_minutes: z.number().optional().describe("Custom deadline if not using smart defaults"),
    protocol_preferences: z.array(z.string()).optional().describe("Preferred protocols to use"),
    protocol_blacklist: z.array(z.string()).optional().describe("Protocols to avoid"),
    
    // Market context
    use_market_data: z.boolean().default(true).describe("Whether to use current market data for optimization"),
  }),
  
  execute: async (params) => {
    try {
      // 1. Validate inputs
      if (!isValidSuiAddress(params.user_address)) {
        return { success: false, error: 'Invalid Sui address' };
      }
      
      const inputToken = getTokenInfo(params.input_asset.toUpperCase());
      const outputToken = getTokenInfo(params.output_asset.toUpperCase());
      
      if (!inputToken || !outputToken) {
        return { 
          success: false, 
          error: `Unsupported token: ${!inputToken ? params.input_asset : params.output_asset}`,
          supported_tokens: getPopularTokens().map(t => t.symbol)
        };
      }
      
      // 2. Get market context if needed
      let marketData = null;
      if (params.use_market_data) {
        try {
          marketData = await getMarketContextForPair(inputToken.symbol, outputToken.symbol);
        } catch (e) {
          // Continue without market data if failed
        }
      }
      
      // 3. Calculate smart defaults
      const smartDefaults = calculateSmartDefaults({
        priority: params.priority,
        risk_tolerance: params.risk_tolerance,
        urgency: params.urgency,
        inputToken,
        outputToken,
        amount: params.input_amount,
        marketData
      });
      
      // 4. Build optimized IGS intent
      const now = Date.now();
      const normalized = normalizeSuiAddress(params.user_address);
      const inputAmountRaw = parseTokenAmount(params.input_amount, inputToken.decimals);
      
      const igsIntent: IGSIntent = {
        igs_version: "1.0.0",
        
        object: {
          user_address: normalized,
          created_ts: now,
          policy: {
            solver_access_window: {
              start_ms: now,
              end_ms: now + smartDefaults.access_window_ms
            },
            auto_revoke_time: smartDefaults.auto_revoke_hours * 3600,
            access_condition: {
              requires_solver_registration: true,
              min_solver_stake: smartDefaults.min_solver_stake,
              requires_tee_attestation: smartDefaults.requires_tee,
              expected_measurement: smartDefaults.requires_tee ? "latest" : "none",
              purpose: `${params.intent_description} - optimized for ${params.priority}`
            }
          }
        },
        
        user_address: normalized,
        intent_type: smartDefaults.intent_type,
        description: params.intent_description,
        
        operation: {
          mode: smartDefaults.operation_mode,
          inputs: [{
            asset_id: inputToken.coinType,
            asset_info: {
              symbol: inputToken.symbol,
              decimals: inputToken.decimals,
              name: inputToken.name
            },
            amount: { type: "exact", value: inputAmountRaw }
          }],
          outputs: [{
            asset_id: outputToken.coinType,
            asset_info: {
              symbol: outputToken.symbol,
              decimals: outputToken.decimals,
              name: outputToken.name
            },
            amount: smartDefaults.output_amount
          }],
          expected_outcome: smartDefaults.expected_outcome
        },
        
        constraints: {
          max_slippage_bps: params.custom_slippage_bps || smartDefaults.slippage_bps,
          deadline_ms: now + ((params.deadline_minutes || smartDefaults.deadline_minutes) * 60 * 1000),
          max_gas_cost: smartDefaults.max_gas_cost,
          routing: {
            max_hops: smartDefaults.max_hops,
            whitelist_protocols: params.protocol_preferences,
            blacklist_protocols: params.protocol_blacklist
          }
        },
        
        preferences: {
          optimization_goal: params.priority,
          ranking_weights: smartDefaults.ranking_weights,
          execution: {
            mode: "best_solution",
            show_top_n: 3
          },
          privacy: {
            encrypt_intent: smartDefaults.should_encrypt,
            anonymous_execution: false
          }
        },
        
        metadata: {
          original_input: {
            text: params.intent_description,
            language: "en",
            confidence: 0.95
          },
          client: {
            name: "Intenus AI Assistant",
            version: "1.0.0",
            platform: "web"
          },
          tags: smartDefaults.tags
        }
      };
      
      // 5. Validate and build
      const builder = new IntentBuilder(igsIntent);
      const validatedIntent = builder.build();
      
      // 6. Provide explanation
      const explanation = generateIntentExplanation(validatedIntent, smartDefaults, params);
      
      return {
        success: true,
        intent: validatedIntent,
        smart_choices: smartDefaults,
        explanation,
        estimated_performance: {
          gas_cost_range: smartDefaults.estimated_gas_range,
          slippage_expected: smartDefaults.expected_slippage,
          execution_probability: smartDefaults.execution_probability,
          solver_competition_level: smartDefaults.solver_competition
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build smart intent'
      };
    }
  }
});

// Helper function to calculate smart defaults
function calculateSmartDefaults(params: {
  priority: string;
  risk_tolerance: string;
  urgency: string;
  inputToken: any;
  outputToken: any;
  amount: string;
  marketData: any;
}): SmartDefaults {
  const { priority, risk_tolerance, urgency, marketData } = params;
  
  // Base settings by priority
  const prioritySettings = {
    'maximize_output': {
      slippage_bps: 100, // 1% - willing to accept more slippage for better price
      deadline_minutes: 30, // Longer deadline for better routing
      max_hops: 4,
      min_solver_stake: "1000000000000", // Higher stake requirement
      requires_tee: false,
      ranking_weights: { surplus_weight: 70, gas_cost_weight: 10, execution_speed_weight: 10, reputation_weight: 10 }
    },
    'minimize_gas': {
      slippage_bps: 200, // 2% - accept worse price for gas savings
      deadline_minutes: 60,
      max_hops: 2, // Simpler routes
      min_solver_stake: "500000000000",
      requires_tee: false,
      ranking_weights: { surplus_weight: 20, gas_cost_weight: 60, execution_speed_weight: 10, reputation_weight: 10 }
    },
    'fastest_execution': {
      slippage_bps: 300, // 3% - speed over price
      deadline_minutes: 5,
      max_hops: 2,
      min_solver_stake: "2000000000000", // Higher stake for reliability
      requires_tee: false,
      ranking_weights: { surplus_weight: 20, gas_cost_weight: 20, execution_speed_weight: 50, reputation_weight: 10 }
    },
    'maximum_safety': {
      slippage_bps: 50, // 0.5% - very conservative
      deadline_minutes: 60,
      max_hops: 3,
      min_solver_stake: "5000000000000", // Highest stake requirement
      requires_tee: true, // Require TEE for safety
      ranking_weights: { surplus_weight: 25, gas_cost_weight: 25, execution_speed_weight: 25, reputation_weight: 25 }
    },
    'balanced': {
      slippage_bps: 100, // 1%
      deadline_minutes: 15,
      max_hops: 3,
      min_solver_stake: "1000000000000",
      requires_tee: false,
      ranking_weights: { surplus_weight: 40, gas_cost_weight: 30, execution_speed_weight: 20, reputation_weight: 10 }
    }
  };
  
  const baseSettings = prioritySettings[priority as keyof typeof prioritySettings] || prioritySettings.balanced;
  
  // Adjust based on risk tolerance
  const riskAdjustments = {
    'low': { slippage_multiplier: 0.5, stake_multiplier: 2, requires_tee: true },
    'medium': { slippage_multiplier: 1, stake_multiplier: 1, requires_tee: baseSettings.requires_tee },
    'high': { slippage_multiplier: 1.5, stake_multiplier: 0.5, requires_tee: false }
  };
  
  const riskAdj = riskAdjustments[risk_tolerance as keyof typeof riskAdjustments];
  
  // Adjust based on urgency
  const urgencyAdjustments = {
    'low': { deadline_multiplier: 2, slippage_multiplier: 0.8 },
    'normal': { deadline_multiplier: 1, slippage_multiplier: 1 },
    'urgent': { deadline_multiplier: 0.3, slippage_multiplier: 1.5 }
  };
  
  const urgencyAdj = urgencyAdjustments[urgency as keyof typeof urgencyAdjustments];
  
  // Apply adjustments and market data
  return {
    intent_type: "swap.exact_input" as const,
    operation_mode: "exact_input" as const,
    slippage_bps: Math.round(baseSettings.slippage_bps * riskAdj.slippage_multiplier * urgencyAdj.slippage_multiplier),
    deadline_minutes: Math.round(baseSettings.deadline_minutes * urgencyAdj.deadline_multiplier),
    max_hops: baseSettings.max_hops,
    min_solver_stake: String(BigInt(baseSettings.min_solver_stake) * BigInt(Math.round(riskAdj.stake_multiplier))),
    requires_tee: riskAdj.requires_tee,
    ranking_weights: baseSettings.ranking_weights,
    access_window_ms: Math.round(baseSettings.deadline_minutes * urgencyAdj.deadline_multiplier * 60 * 1000),
    auto_revoke_hours: Math.max(1, Math.round(baseSettings.deadline_minutes * urgencyAdj.deadline_multiplier / 30)),
    should_encrypt: priority === 'maximum_safety' || riskAdj.requires_tee,
    output_amount: { type: "all" as const }, // Smart output calculation
    expected_outcome: generateExpectedOutcome(params, marketData),
    max_gas_cost: calculateMaxGasCost(priority),
    estimated_gas_range: estimateGasRange(params),
    expected_slippage: `${baseSettings.slippage_bps * riskAdj.slippage_multiplier / 100}%`,
    execution_probability: calculateExecutionProbability(baseSettings, marketData),
    solver_competition: estimateSolverCompetition(baseSettings),
    tags: generateTags(params, priority, risk_tolerance)
  };
}

export const validateIGSIntentTool = tool({
  description: `
    Validate and explain IGS Intent structure compliance.
    Use this to check if an intent follows IGS v1.0.0 standard correctly
    and get detailed feedback on any issues or improvements needed.
  `,
  parameters: z.object({
    intent: IGSIntentSchema.describe("IGS Intent to validate"),
    explain_structure: z.boolean().default(false).describe("Whether to explain the intent structure")
  }),
  execute: async ({ intent, explain_structure }) => {
    try {
      // Validate using IntentBuilder
      const builder = new IntentBuilder(intent);
      const validatedIntent = builder.build();
      
      // Analyze intent structure
      const analysis = analyzeIGSIntent(validatedIntent);
      
      return {
        success: true,
        valid: true,
        intent: validatedIntent,
        analysis: explain_structure ? analysis : undefined,
        compliance_score: calculateComplianceScore(validatedIntent),
        recommendations: generateImprovementRecommendations(validatedIntent)
      };
    } catch (error) {
      return {
        success: false,
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        suggestions: generateFixSuggestions(intent)
      };
    }
  }
});

function analyzeIGSIntent(intent: IGSIntent): IntentAnalysis {
  return {
    // Basic info
    intent_summary: {
      type: intent.intent_type,
      operation_mode: intent.operation.mode,
      input_assets: intent.operation.inputs.map(i => i.asset_info?.symbol || i.asset_id),
      output_assets: intent.operation.outputs.map(o => o.asset_info?.symbol || o.asset_id),
      has_constraints: !!intent.constraints,
      has_preferences: !!intent.preferences
    },
    
    // Complexity analysis
    complexity: {
      level: calculateComplexity(intent),
      factors: identifyComplexityFactors(intent),
      estimated_gas_impact: estimateGasComplexity(intent)
    },
    
    // Solver requirements
    solver_requirements: {
      min_stake_required: intent.object.policy.access_condition.min_solver_stake,
      requires_tee: intent.object.policy.access_condition.requires_tee_attestation,
      access_window_hours: (intent.object.policy.solver_access_window.end_ms - 
                           intent.object.policy.solver_access_window.start_ms) / (1000 * 60 * 60),
      estimated_solver_pool: estimateEligibleSolvers(intent)
    },
    
    // Market conditions impact
    market_factors: {
      slippage_sensitivity: intent.constraints?.max_slippage_bps || 'unlimited',
      deadline_pressure: intent.constraints?.deadline_ms ? 
        (intent.constraints.deadline_ms - Date.now()) / (1000 * 60) : 'no_limit',
      routing_restrictions: analyzeRoutingConstraints(intent.constraints?.routing)
    },
    
    // Success probability
    execution_outlook: {
      probability_estimate: calculateExecutionProbability(intent),
      key_risks: identifyExecutionRisks(intent),
      optimization_opportunities: findOptimizationOpportunities(intent)
    }
  };
}

export const compareIGSIntentsTool = tool({
  description: `
    Compare multiple IGS Intents to help users understand trade-offs.
    Useful for showing different optimization strategies for the same goal.
  `,
  parameters: z.object({
    intents: z.array(IGSIntentSchema).min(2).max(5).describe("IGS Intents to compare"),
    comparison_criteria: z.array(z.enum([
      'expected_gas_cost',
      'slippage_tolerance', 
      'execution_speed',
      'solver_requirements',
      'success_probability',
      'privacy_level'
    ])).default(['expected_gas_cost', 'slippage_tolerance', 'execution_speed'])
  }),
  execute: async ({ intents, comparison_criteria }) => {
    try {
      const comparison = generateIntentComparison(intents, comparison_criteria);
      return { success: true, comparison };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to compare intents'
      };
    }
  }
});