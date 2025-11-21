/**
 * Final IGS Intent Tools for AI SDK - Optimal Implementation
 * Wraps optimal utilities with clean AI SDK tool interface
 */

import { tool } from 'ai';
import { z } from 'zod';
import { IGSIntentSchema } from '@intenus/common';
import {
  generateOptimalIntent,
  analyzeOptimalIntent,
  compareOptimalIntents,
  IntentGenerationInput,
  ValidationResult,
  MarketContext
} from './utils';
import { getTokenInfo, getPopularTokens } from '@/libs/suiClient';
import { isValidSuiAddress, normalizeSuiAddress } from '@mysten/sui/utils';

// ============================================================================
// TOKEN SUPPORT TOOL
// ============================================================================

export const getSupportedTokensTool = tool({
  description: `
    Get list of supported tokens on Sui blockchain for DeFi operations.
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
        coinType: t.coinType
      })),
      message: `Found ${tokens.length} supported tokens: ${tokens.map(t => t.symbol).join(', ')}`,
    };
  },
});

// ============================================================================
// MAIN OPTIMAL INTENT GENERATION TOOL
// ============================================================================

export const buildOptimalIGSIntentTool = tool({
  description: `
    **MAIN INTENT GENERATION TOOL - Optimal Implementation**

    Generate IGS Intent with optimal balance of SDK compliance and smart features.
    This tool combines:
    - Strict SDK type compliance (no drift, no loops)
    - Smart parameter calculation based on priority, risk, urgency
    - Market-aware adjustments (when data available)
    - Built-in validation and error handling

    Features:
    - 4 clear priorities: speed, price, gas, safety
    - 3 risk levels: low, medium, high
    - 3 urgency levels: low, normal, urgent
    - Automatic parameter optimization
    - Protocol preference/blacklist support

    Use this for all IGS intent generation needs.
  `,
  inputSchema: z.object({
    // Core requirements
    user_address: z.string().describe("User's Sui wallet address (0x...)"),
    intent_description: z
      .string()
      .describe('Natural language description of what user wants'),

    // Asset specifications  
    input_asset: z.string().describe('Input token symbol (SUI, USDC, USDT, WETH)'),
    input_amount: z.string().describe('Amount to swap (human readable with decimals)'),
    output_asset: z.string().describe('Output token symbol'),

    // Smart preferences
    priority: z
      .enum(['speed', 'price', 'gas', 'safety'])
      .default('price')
      .describe('Primary optimization goal'),
    
    risk_tolerance: z
      .enum(['low', 'medium', 'high'])
      .default('medium')
      .describe('Risk tolerance: low=conservative, high=aggressive'),
      
    urgency: z
      .enum(['low', 'normal', 'urgent'])
      .default('normal')
      .describe('Execution urgency'),

    // Optional overrides
    custom_slippage_bps: z.number().optional().describe('Override calculated slippage (basis points)'),
    custom_deadline_minutes: z.number().optional().describe('Override calculated deadline (minutes)'),
    protocol_preferences: z.array(z.string()).optional().describe('Preferred DEX protocols'),
    protocol_blacklist: z.array(z.string()).optional().describe('Protocols to avoid'),

    // Market context (optional)
    market_volatility: z.enum(['low', 'medium', 'high']).optional().describe('Current market volatility'),
    liquidity_depth: z.enum(['excellent', 'good', 'adequate', 'low']).optional().describe('Token pair liquidity'),
  }),

  execute: async (params) => {
    try {
      // 1. Validate address
      if (!isValidSuiAddress(params.user_address)) {
        return {
          success: false,
          error: 'Invalid Sui address format (must start with 0x)',
        };
      }

      // 2. Validate and get tokens
      const inputToken = getTokenInfo(params.input_asset.toUpperCase());
      const outputToken = getTokenInfo(params.output_asset.toUpperCase());

      if (!inputToken || !outputToken) {
        return {
          success: false,
          error: `Unsupported token: ${!inputToken ? params.input_asset : params.output_asset}`,
          supported_tokens: getPopularTokens().map(t => t.symbol),
        };
      }

      // 3. Parse and validate amount
      const numAmount = parseFloat(params.input_amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return {
          success: false,
          error: `Invalid amount: ${params.input_amount}. Must be positive number.`,
        };
      }

      // Convert to raw amount
      const rawAmount = Math.floor(numAmount * Math.pow(10, inputToken.decimals)).toString();

      // 4. Prepare market context if provided
      let marketContext: MarketContext | undefined;
      if (params.market_volatility || params.liquidity_depth) {
        marketContext = {
          inputToken: inputToken.symbol,
          outputToken: outputToken.symbol,
          volatility: params.market_volatility || 'medium',
          liquidityDepth: params.liquidity_depth || 'adequate',
          recommendedProtocols: [] // Could be enhanced with actual recommendations
        };
      }

      // 5. Build input for generation
      const input: IntentGenerationInput = {
        userAddress: normalizeSuiAddress(params.user_address),
        inputToken: {
          assetId: inputToken.coinType,
          symbol: inputToken.symbol,
          decimals: inputToken.decimals,
          amount: rawAmount,
        },
        outputToken: {
          assetId: outputToken.coinType,
          symbol: outputToken.symbol,
          decimals: outputToken.decimals,
        },
        priority: params.priority,
        riskTolerance: params.risk_tolerance,
        urgency: params.urgency,
        customSlippageBps: params.custom_slippage_bps,
        customDeadlineMinutes: params.custom_deadline_minutes,
        protocolPreferences: params.protocol_preferences,
        protocolBlacklist: params.protocol_blacklist,
      };

      // 6. Generate optimal intent
      const result: ValidationResult = generateOptimalIntent(input, marketContext);

      if (!result.valid || !result.intent) {
        return {
          success: false,
          error: 'Intent generation failed',
          validation_errors: result.errors,
        };
      }

      // 7. Analyze the generated intent
      const analysis = analyzeOptimalIntent(result.intent);

      return {
        success: true,
        intent: result.intent,
        analysis: {
          type: analysis.type,
          complexity: analysis.complexity,
          estimated_gas: analysis.estimatedGas,
          execution_probability: analysis.executionProbability,
          solver_requirements: analysis.solverRequirements,
          constraints: analysis.constraints,
          risks: analysis.risks,
        },
        smart_choices: {
          priority: params.priority,
          risk_tolerance: params.risk_tolerance,
          urgency: params.urgency,
          slippage_bps: analysis.constraints.slippageBps,
          deadline_minutes: analysis.constraints.deadlineMinutes,
          max_hops: analysis.constraints.maxHops,
          solver_stake: analysis.solverRequirements.minStake,
          tee_required: analysis.solverRequirements.requiresTEE,
          estimated_solver_pool: analysis.solverRequirements.estimatedSolverPool,
        },
        warnings: result.warnings,
        message: `✓ Generated ${params.priority}-optimized intent: ${params.input_amount} ${params.input_asset} → ${params.output_asset} (${analysis.executionProbability}% execution probability)`,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error in intent generation',
      };
    }
  },
});

// ============================================================================
// INTENT ANALYSIS TOOL
// ============================================================================

export const analyzeOptimalIGSIntentTool = tool({
  description: `
    Analyze an existing IGS Intent to understand its characteristics and performance.
    Provides comprehensive analysis including:
    - Complexity assessment
    - Gas cost estimates  
    - Solver requirements and pool size
    - Execution probability
    - Risk factors
    - Constraint analysis
  `,
  inputSchema: z.object({
    intent: IGSIntentSchema.describe('IGS Intent object to analyze'),
  }),
  execute: async ({ intent }) => {
    try {
      const analysis = analyzeOptimalIntent(intent);
      
      return {
        success: true,
        analysis: {
          type: analysis.type,
          complexity: analysis.complexity,
          estimated_gas: analysis.estimatedGas,
          execution_probability: analysis.executionProbability,
          solver_requirements: {
            min_stake: analysis.solverRequirements.minStake,
            requires_tee: analysis.solverRequirements.requiresTEE,
            access_window_hours: analysis.solverRequirements.accessWindowHours,
            estimated_solver_pool: analysis.solverRequirements.estimatedSolverPool,
          },
          constraints: {
            slippage_bps: analysis.constraints.slippageBps,
            deadline_minutes: analysis.constraints.deadlineMinutes,
            max_hops: analysis.constraints.maxHops,
          },
          risks: analysis.risks,
        },
        summary: {
          trade_type: intent.intent_type,
          input_assets: intent.operation.inputs.map(i => i.asset_info?.symbol || 'Unknown'),
          output_assets: intent.operation.outputs.map(o => o.asset_info?.symbol || 'Unknown'),
          optimization_goal: intent.preferences?.optimization_goal || 'balanced',
        },
        recommendations: generateRecommendations(analysis),
        message: `Analyzed ${analysis.type} intent - ${analysis.complexity} complexity, ${analysis.executionProbability}% execution probability`,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      };
    }
  },
});

// ============================================================================
// INTENT COMPARISON TOOL
// ============================================================================

export const compareOptimalIntentsTool = tool({
  description: `
    Compare multiple IGS Intents to understand trade-offs and performance differences.
    Shows side-by-side comparison of:
    - Slippage tolerances
    - Deadline constraints  
    - Gas estimates
    - Execution probabilities
    - Complexity levels
    - TEE requirements
  `,
  inputSchema: z.object({
    intents: z
      .array(IGSIntentSchema)
      .min(2)
      .max(5)
      .describe('2-5 IGS Intents to compare'),
  }),
  execute: async ({ intents }) => {
    try {
      const comparison = compareOptimalIntents(intents);
      
      // Find best performers
      const bestByGas = comparison.reduce((best, current, index) => {
        const currentGas = parseFloat(current.estimatedGas.replace('$', ''));
        const bestGas = parseFloat(comparison[best].estimatedGas.replace('$', ''));
        return currentGas < bestGas ? index : best;
      }, 0);

      const bestByProbability = comparison.reduce((best, current, index) => {
        const currentProb = parseInt(current.executionProbability.replace('%', ''));
        const bestProb = parseInt(comparison[best].executionProbability.replace('%', ''));
        return currentProb > bestProb ? index : best;
      }, 0);

      return {
        success: true,
        comparison: comparison.map((item, index) => ({
          intent_index: index,
          type: item.type,
          slippage: item.slippage,
          deadline: item.deadline,
          complexity: item.complexity,
          estimated_gas: item.estimatedGas,
          execution_probability: item.executionProbability,
          priority: item.priority,
          requires_tee: item.requiresTEE,
        })),
        recommendations: {
          best_for_gas: bestByGas,
          best_for_execution_probability: bestByProbability,
          overall_recommendation: bestByProbability, // Favor execution probability
        },
        summary: {
          total_intents: intents.length,
          complexity_range: getComplexityRange(comparison),
          gas_range: getGasRange(comparison),
          probability_range: getProbabilityRange(comparison),
        },
        message: `Compared ${intents.length} intents - Intent #${bestByProbability} recommended for best overall execution`,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Comparison failed',
      };
    }
  },
});

// ============================================================================
// QUICK TEMPLATE TOOL
// ============================================================================

export const quickOptimalTemplateTool = tool({
  description: `
    Generate IGS Intent from optimized templates for common scenarios.
    Templates available:
    - best_price: 30min, 1% slippage, price-optimized
    - fastest: 5min, 3% slippage, speed-optimized
    - cheapest_gas: 15min, 2% slippage, gas-optimized  
    - safest: 60min, 0.5% slippage, TEE required, safety-optimized

    Perfect for quick intent generation.
  `,
  inputSchema: z.object({
    user_address: z.string().describe("User's Sui wallet address"),
    template: z
      .enum(['best_price', 'fastest', 'cheapest_gas', 'safest'])
      .describe('Template type'),
    input_asset: z.string().describe('Input token symbol'),
    input_amount: z.string().describe('Amount to swap'),
    output_asset: z.string().describe('Output token symbol'),
  }),
  execute: async (params) => {
    // Map template to parameters
    const templateConfig = {
      best_price: { priority: 'price' as const, risk: 'medium' as const, urgency: 'normal' as const },
      fastest: { priority: 'speed' as const, risk: 'medium' as const, urgency: 'urgent' as const },
      cheapest_gas: { priority: 'gas' as const, risk: 'medium' as const, urgency: 'normal' as const },
      safest: { priority: 'safety' as const, risk: 'low' as const, urgency: 'low' as const },
    };

    const config = templateConfig[params.template];
    
    // Use main tool with template config
    const mainTool = buildOptimalIGSIntentTool;
    const result = await mainTool.execute({
      user_address: params.user_address,
      intent_description: `${params.template} template for ${params.input_asset} to ${params.output_asset}`,
      input_asset: params.input_asset,
      input_amount: params.input_amount,
      output_asset: params.output_asset,
      priority: config.priority,
      risk_tolerance: config.risk,
      urgency: config.urgency,
    });

    return {
      ...result,
      template_info: {
        name: params.template,
        priority: config.priority,
        risk_tolerance: config.risk,
        urgency: config.urgency,
        description: getTemplateDescription(params.template),
      },
    };
  },
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateRecommendations(analysis: ReturnType<typeof analyzeOptimalIntent>): string[] {
  const recommendations: string[] = [];

  if (analysis.executionProbability < 80) {
    recommendations.push("Consider increasing slippage tolerance or deadline for better execution probability");
  }

  if (analysis.risks.includes("TEE requirement reduces solver pool")) {
    recommendations.push("TEE requirement limits solvers - consider if maximum security is necessary");
  }

  if (analysis.constraints.slippageBps > 300) {
    recommendations.push("High slippage tolerance - you might get worse prices than expected");
  }

  if (analysis.complexity === 'complex') {
    recommendations.push("Complex intent may have higher gas costs and execution risks");
  }

  return recommendations.length > 0 ? recommendations : ["Intent is well-optimized"];
}

function getComplexityRange(comparison: ReturnType<typeof compareOptimalIntents>): string {
  const complexities = comparison.map(c => c.complexity);
  const unique = [...new Set(complexities)];
  return unique.join(' to ');
}

function getGasRange(comparison: ReturnType<typeof compareOptimalIntents>): string {
  const gases = comparison.map(c => parseFloat(c.estimatedGas.replace('$', '')));
  const min = Math.min(...gases);
  const max = Math.max(...gases);
  return `$${min.toFixed(3)}-$${max.toFixed(3)}`;
}

function getProbabilityRange(comparison: ReturnType<typeof compareOptimalIntents>): string {
  const probs = comparison.map(c => parseInt(c.executionProbability.replace('%', '')));
  const min = Math.min(...probs);
  const max = Math.max(...probs);
  return `${min}%-${max}%`;
}

function getTemplateDescription(template: string): string {
  const descriptions = {
    best_price: 'Optimized for maximum output with balanced time and slippage',
    fastest: 'Optimized for speed with higher slippage tolerance',
    cheapest_gas: 'Optimized for lowest gas costs with moderate execution time',
    safest: 'Maximum security with TEE requirements and conservative parameters',
  };
  return descriptions[template as keyof typeof descriptions] || 'Standard template';
}