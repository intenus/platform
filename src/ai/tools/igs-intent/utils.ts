/**
 * Final IGS Intent Utilities - Optimal Version
 * Combines strict SDK compliance with smart features
 */

import { 
  IGSIntent, 
  IGSOperation, 
  IGSConstraints, 
  IGSPreferences,
  IGSRankingWeights,
  IGSAmount,
  IGSObject,
  validateIGSIntent
} from "@intenus/common";
import type { z } from 'zod';

// ============================================================================
// TYPES - SDK COMPLIANT ONLY
// ============================================================================

export interface IntentGenerationInput {
  userAddress: string;
  inputToken: {
    assetId: string;
    symbol: string; 
    decimals: number;
    amount: string; // Raw amount (adjusted for decimals)
  };
  outputToken: {
    assetId: string;
    symbol: string;
    decimals: number;
  };
  
  // Smart preferences
  priority?: 'speed' | 'price' | 'gas' | 'safety';
  riskTolerance?: 'low' | 'medium' | 'high';
  urgency?: 'low' | 'normal' | 'urgent';
  
  // Optional overrides
  customSlippageBps?: number;
  customDeadlineMinutes?: number;
  protocolPreferences?: string[];
  protocolBlacklist?: string[];
}

export interface ValidationResult {
  valid: boolean;
  intent?: IGSIntent;
  errors: string[];
  warnings: string[];
}

// Market context (optional, simplified)
export interface MarketContext {
  inputToken: string;
  outputToken: string;
  volatility: 'low' | 'medium' | 'high';
  liquidityDepth: 'excellent' | 'good' | 'adequate' | 'low';
  recommendedProtocols: string[];
}

// ============================================================================
// MAIN GENERATION FUNCTION - SDK STRICT + SMART FEATURES
// ============================================================================

/**
 * Generate IGS Intent with strict SDK compliance and smart defaults
 */
export function generateOptimalIntent(
  input: IntentGenerationInput,
  marketData?: MarketContext
): ValidationResult {
  try {
    // 1. Calculate smart parameters
    const smartParams = calculateSmartParameters(input, marketData);
    
    // 2. Build strictly compliant intent
    const intent = buildSDKStrictIntent(input, smartParams);
    
    // 3. Validate with SDK
    const validation = validateIGSIntent(intent);
    
    if (validation.compliance_score && validation.compliance_score >= 0.95) {
      return {
        valid: true,
        intent,
        errors: [],
        warnings: []
      };
    } else {
      return {
        valid: false,
        errors: validation.errors.map(err => err.message),
        warnings: []
      };
    }
    
  } catch (error) {
    return {
      valid: false,
      errors: [`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    };
  }
}

// ============================================================================
// SMART PARAMETER CALCULATION (simplified from old utils)
// ============================================================================

interface SmartParameters {
  slippageBps: number;
  deadlineMinutes: number;
  maxHops: number;
  minSolverStake: string;
  requiresTEE: boolean;
  rankingWeights: IGSRankingWeights;
  shouldEncrypt: boolean;
}

function calculateSmartParameters(
  input: IntentGenerationInput,
  marketData?: MarketContext
): SmartParameters {
  const priority = input.priority || 'price';
  const risk = input.riskTolerance || 'medium';
  const urgency = input.urgency || 'normal';
  
  // Base settings by priority
  const baseSettings = {
    speed: {
      slippageBps: 300,
      deadlineMinutes: 5,
      maxHops: 2,
      minSolverStake: "2000000000000",
      requiresTEE: false,
      rankingWeights: { surplus_weight: 20, gas_cost_weight: 20, execution_speed_weight: 50, reputation_weight: 10 }
    },
    price: {
      slippageBps: 100,
      deadlineMinutes: 30,
      maxHops: 4,
      minSolverStake: "1000000000000",
      requiresTEE: false,
      rankingWeights: { surplus_weight: 70, gas_cost_weight: 10, execution_speed_weight: 10, reputation_weight: 10 }
    },
    gas: {
      slippageBps: 200,
      deadlineMinutes: 15,
      maxHops: 2,
      minSolverStake: "500000000000",
      requiresTEE: false,
      rankingWeights: { surplus_weight: 20, gas_cost_weight: 60, execution_speed_weight: 10, reputation_weight: 10 }
    },
    safety: {
      slippageBps: 50,
      deadlineMinutes: 60,
      maxHops: 3,
      minSolverStake: "5000000000000",
      requiresTEE: true,
      rankingWeights: { surplus_weight: 25, gas_cost_weight: 25, execution_speed_weight: 25, reputation_weight: 25 }
    }
  };

  const base = baseSettings[priority];
  
  // Risk adjustments
  const riskMultipliers = {
    low: { slippage: 0.5, stake: 2.0, tee: true },
    medium: { slippage: 1.0, stake: 1.0, tee: base.requiresTEE },
    high: { slippage: 1.5, stake: 0.5, tee: false }
  };
  
  const riskAdj = riskMultipliers[risk];
  
  // Urgency adjustments
  const urgencyMultipliers = {
    low: { deadline: 2.0, slippage: 0.8 },
    normal: { deadline: 1.0, slippage: 1.0 },
    urgent: { deadline: 0.3, slippage: 1.5 }
  };
  
  const urgencyAdj = urgencyMultipliers[urgency];
  
  // Market adjustments (simplified)
  let marketSlippageAdj = 1.0;
  if (marketData?.volatility === 'high') {
    marketSlippageAdj = 1.3;
  } else if (marketData?.volatility === 'low') {
    marketSlippageAdj = 0.8;
  }
  
  // Calculate final values
  const finalSlippageBps = Math.round(
    base.slippageBps * 
    riskAdj.slippage * 
    urgencyAdj.slippage * 
    marketSlippageAdj
  );
  
  const finalDeadlineMinutes = Math.round(
    base.deadlineMinutes * urgencyAdj.deadline
  );
  
  const finalStake = String(
    BigInt(base.minSolverStake) * BigInt(Math.round(riskAdj.stake * 100)) / BigInt(100)
  );

  return {
    slippageBps: input.customSlippageBps || Math.min(1000, Math.max(10, finalSlippageBps)),
    deadlineMinutes: input.customDeadlineMinutes || Math.min(120, Math.max(1, finalDeadlineMinutes)),
    maxHops: base.maxHops,
    minSolverStake: finalStake,
    requiresTEE: riskAdj.tee,
    rankingWeights: base.rankingWeights,
    shouldEncrypt: priority === 'safety' || riskAdj.tee
  };
}

// ============================================================================
// SDK STRICT INTENT BUILDING
// ============================================================================

function buildSDKStrictIntent(
  input: IntentGenerationInput,
  params: SmartParameters
): IGSIntent {
  const now = Date.now();
  const deadlineMs = params.deadlineMinutes * 60 * 1000;
  
  // Validate and normalize
  const userAddress = validateSuiAddress(input.userAddress);
  validateAmountString(input.inputToken.amount);
  
  // Build IGS Object
  const igsObject: IGSObject = {
    user_address: userAddress,
    created_ts: now,
    policy: {
      solver_access_window: {
        start_ms: now,
        end_ms: now + deadlineMs
      },
      auto_revoke_time: now + deadlineMs,
      access_condition: {
        requires_solver_registration: true,
        min_solver_stake: params.minSolverStake,
        requires_tee_attestation: params.requiresTEE,
        min_solver_reputation_score: 50
      }
    }
  };

  // Build Operation
  const inputAmount: IGSAmount = {
    type: "exact" as const,
    value: input.inputToken.amount
  };
  
  const outputAmount: IGSAmount = {
    type: "all" as const
  };

  const operation: IGSOperation = {
    mode: "exact_input" as const,
    inputs: [{
      asset_id: input.inputToken.assetId,
      asset_info: {
        symbol: validateTokenSymbol(input.inputToken.symbol),
        decimals: input.inputToken.decimals,
        name: input.inputToken.symbol
      },
      amount: inputAmount
    }],
    outputs: [{
      asset_id: input.outputToken.assetId,
      asset_info: {
        symbol: validateTokenSymbol(input.outputToken.symbol),
        decimals: input.outputToken.decimals,
        name: input.outputToken.symbol
      },
      amount: outputAmount
    }]
  };

  // Build Constraints
  const constraints: IGSConstraints = {
    max_slippage_bps: params.slippageBps,
    deadline_ms: now + deadlineMs,
    routing: {
      max_hops: params.maxHops,
      whitelist_protocols: input.protocolPreferences,
      blacklist_protocols: input.protocolBlacklist
    }
  };

  // Build Preferences
  const preferences: IGSPreferences = {
    optimization_goal: mapPriorityToGoal(input.priority),
    ranking_weights: params.rankingWeights,
    execution: {
      mode: "best_solution" as const,
      show_top_n: 3
    },
    privacy: {
      encrypt_intent: params.shouldEncrypt,
      anonymous_execution: false
    }
  };

  // Assemble final intent
  return {
    igs_version: "1.0.0" as const,
    object: igsObject,
    user_address: userAddress,
    intent_type: "swap.exact_input" as const,
    operation: operation,
    constraints: constraints,
    preferences: preferences,
    metadata: {
      client: {
        name: "intenus-optimal-sdk",
        version: "1.0.0",
        platform: "web"
      },
      tags: [
        "swap",
        `${input.inputToken.symbol}-${input.outputToken.symbol}`,
        input.priority || "price",
        `risk-${input.riskTolerance || 'medium'}`
      ]
    }
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function validateSuiAddress(address: string): string {
  if (!address.startsWith('0x') || address.length < 3) {
    throw new Error(`Invalid Sui address format: ${address}`);
  }
  return address.toLowerCase();
}

function validateTokenSymbol(symbol: string): string {
  const cleaned = symbol.toUpperCase();
  if (!/^[A-Z0-9]+$/.test(cleaned) || cleaned.length > 20) {
    throw new Error(`Invalid token symbol: ${symbol}`);
  }
  return cleaned;
}

function validateAmountString(amount: string): void {
  if (!/^[0-9]+$/.test(amount)) {
    throw new Error(`Amount must be string with digits only: ${amount}`);
  }
}

function mapPriorityToGoal(priority?: string): IGSPreferences['optimization_goal'] {
  const goals = {
    speed: 'fastest_execution' as const,
    price: 'maximize_output' as const,
    gas: 'minimize_gas' as const,
    safety: 'balanced' as const
  };
  return goals[priority as keyof typeof goals] || goals.price;
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

export function analyzeOptimalIntent(intent: IGSIntent) {
  return {
    type: intent.intent_type,
    complexity: calculateComplexity(intent),
    estimatedGas: estimateGas(intent),
    solverRequirements: {
      minStake: intent.object.policy.access_condition.min_solver_stake,
      requiresTEE: intent.object.policy.access_condition.requires_tee_attestation,
      accessWindowHours: (
        intent.object.policy.solver_access_window.end_ms - 
        intent.object.policy.solver_access_window.start_ms
      ) / (1000 * 60 * 60),
      estimatedSolverPool: estimateSolverPool(intent)
    },
    constraints: {
      slippageBps: intent.constraints?.max_slippage_bps || 0,
      deadlineMinutes: intent.constraints?.deadline_ms 
        ? Math.round((intent.constraints.deadline_ms - Date.now()) / 60000)
        : null,
      maxHops: intent.constraints?.routing?.max_hops || null
    },
    risks: identifyRisks(intent),
    executionProbability: estimateExecutionProbability(intent)
  };
}

function calculateComplexity(intent: IGSIntent): 'simple' | 'moderate' | 'complex' {
  let score = 0;
  
  if (intent.operation.inputs.length > 1) score += 2;
  if (intent.operation.outputs.length > 1) score += 2;
  if (intent.constraints?.routing?.max_hops && intent.constraints.routing.max_hops > 2) score += 1;
  if (intent.object.policy.access_condition.requires_tee_attestation) score += 2;
  if (intent.constraints?.max_slippage_bps && intent.constraints.max_slippage_bps < 100) score += 1;
  
  if (score <= 2) return 'simple';
  if (score <= 5) return 'moderate';
  return 'complex';
}

function estimateGas(intent: IGSIntent): string {
  const hops = intent.constraints?.routing?.max_hops || 2;
  const baseGas = 0.02;
  const hopMultiplier = 0.015;
  const estimated = baseGas + (hops - 1) * hopMultiplier;
  return `$${estimated.toFixed(3)}`;
}

function estimateSolverPool(intent: IGSIntent): number {
  let base = 50;
  
  if (intent.object.policy.access_condition.requires_tee_attestation) {
    base *= 0.3;
  }
  
  const stake = BigInt(intent.object.policy.access_condition.min_solver_stake);
  if (stake > BigInt("2000000000000")) base *= 0.5;
  else if (stake > BigInt("5000000000000")) base *= 0.2;
  
  return Math.max(3, Math.round(base));
}

function identifyRisks(intent: IGSIntent): string[] {
  const risks: string[] = [];
  
  // Deadline risk
  if (intent.constraints?.deadline_ms) {
    const timeLeft = intent.constraints.deadline_ms - Date.now();
    if (timeLeft < 5 * 60 * 1000) {
      risks.push("Very tight deadline (<5 min)");
    }
  }
  
  // Slippage risk
  if (intent.constraints?.max_slippage_bps && intent.constraints.max_slippage_bps < 50) {
    risks.push("Extremely tight slippage tolerance");
  }
  
  // TEE requirement
  if (intent.object.policy.access_condition.requires_tee_attestation) {
    risks.push("TEE requirement reduces solver pool");
  }
  
  return risks.length > 0 ? risks : ["Standard execution risk"];
}

function estimateExecutionProbability(intent: IGSIntent): number {
  let probability = 85;
  
  // Slippage impact
  const slippage = intent.constraints?.max_slippage_bps || 100;
  if (slippage < 100) probability -= 5;
  
  // TEE impact
  if (intent.object.policy.access_condition.requires_tee_attestation) {
    probability -= 10;
  }
  
  // Deadline impact
  if (intent.constraints?.deadline_ms) {
    const timeLeft = intent.constraints.deadline_ms - Date.now();
    if (timeLeft > 30 * 60 * 1000) probability += 5; // More time = better chance
  }
  
  return Math.min(95, Math.max(60, probability));
}

// ============================================================================
// COMPARISON
// ============================================================================

export function compareOptimalIntents(intents: IGSIntent[]) {
  return intents.map((intent, index) => ({
    index,
    type: intent.intent_type,
    slippage: `${intent.constraints?.max_slippage_bps || 0} bps`,
    deadline: intent.constraints?.deadline_ms 
      ? `${Math.round((intent.constraints.deadline_ms - Date.now()) / 60000)} min`
      : "No limit",
    complexity: calculateComplexity(intent),
    estimatedGas: estimateGas(intent),
    priority: intent.preferences?.optimization_goal || 'balanced',
    executionProbability: `${estimateExecutionProbability(intent)}%`,
    requiresTEE: intent.object.policy.access_condition.requires_tee_attestation
  }));
}