/**
 * Utility Functions for IGS Intent Tools
 * All helper functions for intent building, validation, and analysis
 */

import { IGSIntent } from "@intenus/common";
import {
  IntentAnalysis,
  IntentExplanation,
  SmartDefaults,
  SmartDefaultsParams,
  MarketContext,
  IntentComparison,
  RoutingConstraints,
} from "./type";
import { llama } from "@/libs/llamaClient";
import { getTokenPriceId } from "@/libs/suiClient";
import { Chain } from "@/libs/llama.type";
import { summarizeMarketData, getRecommendedProtocols } from "../market/utils";

// ===== MARKET DATA INTEGRATION =====

/**
 * Get market context for a token pair
 * Uses llamaClient directly (NOT tools - tools are for UI only)
 */
export async function getMarketContextForPair(
  inputSymbol: string,
  outputSymbol: string
): Promise<MarketContext | null> {
  try {
    // Fetch prices using llamaClient directly
    const inputPriceId = getTokenPriceId(inputSymbol);
    const outputPriceId = getTokenPriceId(outputSymbol);

    if (!inputPriceId || !outputPriceId) {
      return null;
    }

    const prices = await llama.getTokenPricesByIds([
      inputPriceId,
      outputPriceId,
    ]);

    // Fetch DEX overview for liquidity
    const dexOverview = await llama.getDexOverview(Chain.Sui);
    const marketSummary = summarizeMarketData(dexOverview);

    const inputPrice = prices[inputPriceId]?.price;
    const outputPrice = prices[outputPriceId]?.price;

    return {
      input_token: inputSymbol,
      output_token: outputSymbol,
      current_price:
        inputPrice && outputPrice ? inputPrice / outputPrice : undefined,
      liquidity_depth: marketSummary.liquidity_assessment || "unknown",
      typical_slippage: "0.3-1%",
      recommended_protocols: getRecommendedProtocols(
        "swap",
        "medium",
        "balanced"
      ),
      market_volatility:
        Math.abs(marketSummary.key_metrics.volume_change_24h || 0) > 10
          ? "high"
          : Math.abs(marketSummary.key_metrics.volume_change_24h || 0) > 5
          ? "medium"
          : "low",
    };
  } catch (error) {
    console.error("Failed to fetch market context:", error);
    return null;
  }
}

// ===== SMART DEFAULTS CALCULATION =====

/**
 * Calculate smart defaults based on user preferences and market conditions
 */
export function calculateSmartDefaults(
  params: SmartDefaultsParams
): SmartDefaults {
  const { priority, risk_tolerance, urgency, marketData } = params;

  // Base settings by priority
  const prioritySettings = {
    maximize_output: {
      slippage_bps: 100, // 1%
      deadline_minutes: 30,
      max_hops: 4,
      min_solver_stake: "1000000000000",
      requires_tee: false,
      ranking_weights: {
        surplus_weight: 70,
        gas_cost_weight: 10,
        execution_speed_weight: 10,
        reputation_weight: 10,
      },
    },
    minimize_gas: {
      slippage_bps: 200, // 2%
      deadline_minutes: 60,
      max_hops: 2,
      min_solver_stake: "500000000000",
      requires_tee: false,
      ranking_weights: {
        surplus_weight: 20,
        gas_cost_weight: 60,
        execution_speed_weight: 10,
        reputation_weight: 10,
      },
    },
    fastest_execution: {
      slippage_bps: 300, // 3%
      deadline_minutes: 5,
      max_hops: 2,
      min_solver_stake: "2000000000000",
      requires_tee: false,
      ranking_weights: {
        surplus_weight: 20,
        gas_cost_weight: 20,
        execution_speed_weight: 50,
        reputation_weight: 10,
      },
    },
    maximum_safety: {
      slippage_bps: 50, // 0.5%
      deadline_minutes: 60,
      max_hops: 3,
      min_solver_stake: "5000000000000",
      requires_tee: true,
      ranking_weights: {
        surplus_weight: 25,
        gas_cost_weight: 25,
        execution_speed_weight: 25,
        reputation_weight: 25,
      },
    },
    balanced: {
      slippage_bps: 100, // 1%
      deadline_minutes: 15,
      max_hops: 3,
      min_solver_stake: "1000000000000",
      requires_tee: false,
      ranking_weights: {
        surplus_weight: 40,
        gas_cost_weight: 30,
        execution_speed_weight: 20,
        reputation_weight: 10,
      },
    },
  };

  const baseSettings =
    prioritySettings[priority as keyof typeof prioritySettings] ||
    prioritySettings.balanced;

  // Adjust based on risk tolerance
  const riskAdjustments = {
    low: { slippage_multiplier: 0.5, stake_multiplier: 2, requires_tee: true },
    medium: {
      slippage_multiplier: 1,
      stake_multiplier: 1,
      requires_tee: baseSettings.requires_tee,
    },
    high: {
      slippage_multiplier: 1.5,
      stake_multiplier: 0.5,
      requires_tee: false,
    },
  };

  const riskAdj =
    riskAdjustments[risk_tolerance as keyof typeof riskAdjustments] ||
    riskAdjustments.medium;

  // Adjust based on urgency
  const urgencyAdjustments = {
    low: { deadline_multiplier: 2, slippage_multiplier: 0.8 },
    normal: { deadline_multiplier: 1, slippage_multiplier: 1 },
    urgent: { deadline_multiplier: 0.3, slippage_multiplier: 1.5 },
  };

  const urgencyAdj =
    urgencyAdjustments[urgency as keyof typeof urgencyAdjustments] ||
    urgencyAdjustments.normal;

  const finalSlippageBps = Math.round(
    baseSettings.slippage_bps *
      riskAdj.slippage_multiplier *
      urgencyAdj.slippage_multiplier
  );
  const finalDeadlineMinutes = Math.round(
    baseSettings.deadline_minutes * urgencyAdj.deadline_multiplier
  );

  return {
    intent_type: "swap.exact_input",
    operation_mode: "exact_input",
    slippage_bps: finalSlippageBps,
    deadline_minutes: finalDeadlineMinutes,
    max_hops: baseSettings.max_hops,
    min_solver_stake: String(
      BigInt(baseSettings.min_solver_stake) *
        BigInt(Math.round(riskAdj.stake_multiplier))
    ),
    requires_tee: riskAdj.requires_tee,
    ranking_weights: baseSettings.ranking_weights,
    access_window_ms: finalDeadlineMinutes * 60 * 1000,
    auto_revoke_hours: Math.max(1, Math.round(finalDeadlineMinutes / 30)),
    should_encrypt: priority === "maximum_safety" || riskAdj.requires_tee,
    output_amount: { type: "all" as const },
    expected_outcome: generateExpectedOutcome(params, marketData),
    max_gas_cost: calculateMaxGasCost(priority),
    estimated_gas_range: estimateGasRange(params),
    expected_slippage: `${(finalSlippageBps / 100).toFixed(2)}%`,
    execution_probability: calculateExecutionProbability(
      baseSettings,
      marketData
    ),
    solver_competition: estimateSolverCompetition(baseSettings),
    tags: generateTags(params, priority, risk_tolerance),
  };
}

// ===== ESTIMATION FUNCTIONS =====

export function generateExpectedOutcome(
  params: SmartDefaultsParams,
  marketData: MarketContext | null
): string {
  const { inputToken, outputToken, amount } = params;
  return `Expected to receive ${outputToken.symbol} in exchange for ${amount} ${inputToken.symbol} with optimal routing`;
}

export function calculateMaxGasCost(priority: string): string {
  const gasCosts = {
    minimize_gas: "0.01",
    fastest_execution: "0.1",
    maximize_output: "0.05",
    balanced: "0.03",
    maximum_safety: "0.05",
  };
  return gasCosts[priority as keyof typeof gasCosts] || "0.03";
}

export function estimateGasRange(params: SmartDefaultsParams): string {
  const { priority } = params;
  const ranges = {
    minimize_gas: "$0.01-0.03",
    fastest_execution: "$0.05-0.15",
    maximize_output: "$0.03-0.08",
    balanced: "$0.02-0.06",
    maximum_safety: "$0.03-0.10",
  };
  return ranges[priority as keyof typeof ranges] || "$0.02-0.08";
}

export function calculateExecutionProbability(
  settings: any,
  marketData: MarketContext | null
): number {
  // Base probability
  let probability = 85;

  // Adjust based on market data if available
  if (marketData) {
    if (marketData.market_volatility === "low") probability += 10;
    if (marketData.liquidity_depth === "excellent") probability += 5;
  }

  // Adjust based on settings
  if (settings.requires_tee) probability -= 10; // Fewer solvers
  if (settings.slippage_bps < 100) probability -= 5; // Tight slippage harder to fill
  if (settings.deadline_minutes > 30) probability += 5; // More time = better chance

  return Math.min(95, Math.max(60, probability));
}

export function estimateSolverCompetition(settings: any): string {
  const stake = BigInt(settings.min_solver_stake);
  const minStake = BigInt("1000000000000");

  if (stake > minStake * BigInt(3)) return "low - high barriers";
  if (stake > minStake) return "moderate";
  return "high - competitive";
}

export function generateTags(
  params: SmartDefaultsParams,
  priority: string,
  risk: string
): string[] {
  const { inputToken, outputToken } = params;
  return [
    "swap",
    `${inputToken.symbol}-${outputToken.symbol}`,
    priority,
    `risk-${risk}`,
    "ai-generated",
  ];
}

// ===== INTENT ANALYSIS =====

export function analyzeIGSIntent(intent: IGSIntent): IntentAnalysis {
  return {
    intent_summary: {
      type: intent.intent_type || "unknown",
      operation_mode: intent.operation.mode,
      input_assets: intent.operation.inputs.map(
        (i) => i.asset_info?.symbol || i.asset_id
      ),
      output_assets: intent.operation.outputs.map(
        (o) => o.asset_info?.symbol || o.asset_id
      ),
      has_constraints: !!intent.constraints,
      has_preferences: !!intent.preferences,
    },

    complexity: {
      level: calculateComplexity(intent),
      factors: identifyComplexityFactors(intent),
      estimated_gas_impact: estimateGasComplexity(intent),
    },

    solver_requirements: {
      min_stake_required:
        intent.object.policy.access_condition.min_solver_stake,
      requires_tee:
        intent.object.policy.access_condition.requires_tee_attestation,
      access_window_hours:
        (intent.object.policy.solver_access_window.end_ms -
          intent.object.policy.solver_access_window.start_ms) /
        (1000 * 60 * 60),
      estimated_solver_pool: estimateEligibleSolvers(intent),
    },

    market_factors: {
      slippage_sensitivity: intent.constraints?.max_slippage_bps || "unlimited",
      deadline_pressure: intent.constraints?.deadline_ms
        ? (intent.constraints.deadline_ms - Date.now()) / (1000 * 60)
        : "no_limit",
      routing_restrictions: analyzeRoutingConstraints(
        intent.constraints?.routing
      ),
    },

    execution_outlook: {
      probability_estimate: calculateExecutionProbability(
        {
          requires_tee:
            intent.object.policy.access_condition.requires_tee_attestation,
          slippage_bps: intent.constraints?.max_slippage_bps || 0,
          deadline_minutes: intent.constraints?.deadline_ms
            ? (intent.constraints.deadline_ms - Date.now()) / (1000 * 60)
            : 60,
        },
        null
      ),
      key_risks: identifyExecutionRisks(intent),
      optimization_opportunities: findOptimizationOpportunities(intent),
    },
  };
}

export function calculateComplexity(
  intent: IGSIntent
): "simple" | "moderate" | "complex" | "advanced" {
  let score = 0;

  // Multiple inputs/outputs
  if (intent.operation.inputs.length > 1) score += 2;
  if (intent.operation.outputs.length > 1) score += 2;

  // Complex routing
  if (
    intent.constraints?.routing?.max_hops &&
    intent.constraints.routing.max_hops > 2
  )
    score += 1;
  if (intent.constraints?.routing?.whitelist_protocols?.length) score += 1;

  // TEE requirements
  if (intent.object.policy.access_condition.requires_tee_attestation)
    score += 2;

  // Tight constraints
  if (
    intent.constraints?.max_slippage_bps &&
    intent.constraints.max_slippage_bps < 100
  )
    score += 1;

  if (score === 0) return "simple";
  if (score <= 3) return "moderate";
  if (score <= 6) return "complex";
  return "advanced";
}

export function identifyComplexityFactors(intent: IGSIntent): string[] {
  const factors: string[] = [];

  if (intent.operation.inputs.length > 1) factors.push("Multiple input assets");
  if (intent.operation.outputs.length > 1)
    factors.push("Multiple output assets");
  if (
    intent.constraints?.routing?.max_hops &&
    intent.constraints.routing.max_hops > 2
  )
    factors.push("Multi-hop routing");
  if (intent.object.policy.access_condition.requires_tee_attestation)
    factors.push("TEE attestation required");
  if (
    intent.constraints?.max_slippage_bps &&
    intent.constraints.max_slippage_bps < 100
  )
    factors.push("Tight slippage tolerance");
  if (intent.preferences?.privacy?.encrypt_intent)
    factors.push("Privacy encryption");

  return factors.length > 0 ? factors : ["Standard single-asset swap"];
}

export function estimateGasComplexity(
  intent: IGSIntent
): "low" | "medium" | "high" {
  const complexity = calculateComplexity(intent);
  const hops = intent.constraints?.routing?.max_hops || 2;

  if (complexity === "simple" && hops <= 2) return "low";
  if (complexity === "advanced" || hops > 3) return "high";
  return "medium";
}

export function estimateEligibleSolvers(intent: IGSIntent): number {
  let base = 50; // Base solver pool

  // Reduce based on requirements
  if (intent.object.policy.access_condition.requires_tee_attestation)
    base *= 0.3;

  const stake = BigInt(intent.object.policy.access_condition.min_solver_stake);
  if (stake > BigInt("2000000000000")) base *= 0.5;
  else if (stake > BigInt("5000000000000")) base *= 0.2;

  return Math.max(3, Math.round(base));
}

export function analyzeRoutingConstraints(routing?: RoutingConstraints): any {
  if (!routing) return { type: "unrestricted" };

  return {
    type: "constrained",
    max_hops: routing.max_hops || "unlimited",
    whitelisted_protocols: routing.whitelist_protocols?.length || 0,
    blacklisted_protocols: routing.blacklist_protocols?.length || 0,
  };
}

export function identifyExecutionRisks(intent: IGSIntent): string[] {
  const risks: string[] = [];

  // Deadline risk
  if (intent.constraints?.deadline_ms) {
    const timeLeft = intent.constraints.deadline_ms - Date.now();
    if (timeLeft < 5 * 60 * 1000) risks.push("Very tight deadline (<5 min)");
    else if (timeLeft < 15 * 60 * 1000) risks.push("Short deadline (<15 min)");
  }

  // Slippage risk
  if (intent.constraints?.max_slippage_bps) {
    if (intent.constraints.max_slippage_bps < 50)
      risks.push("Very tight slippage tolerance - may fail to execute");
    else if (intent.constraints.max_slippage_bps < 100)
      risks.push("Tight slippage - reduced execution probability");
  }

  // Solver pool risk
  const solverPool = estimateEligibleSolvers(intent);
  if (solverPool < 10)
    risks.push("Small eligible solver pool - limited competition");

  // TEE risk
  if (intent.object.policy.access_condition.requires_tee_attestation) {
    risks.push("TEE requirement significantly reduces solver pool");
  }

  return risks.length > 0
    ? risks
    : ["Low risk - standard execution parameters"];
}

export function findOptimizationOpportunities(intent: IGSIntent): string[] {
  const opportunities: string[] = [];

  // Slippage optimization
  if (
    intent.constraints?.max_slippage_bps &&
    intent.constraints.max_slippage_bps > 200
  ) {
    opportunities.push(
      "Consider tightening slippage tolerance for better price execution"
    );
  }

  // Routing optimization
  if (
    !intent.constraints?.routing?.max_hops ||
    intent.constraints.routing.max_hops > 3
  ) {
    opportunities.push("Limit max hops to reduce gas costs");
  }

  // Deadline optimization
  if (intent.constraints?.deadline_ms) {
    const timeLeft = intent.constraints.deadline_ms - Date.now();
    if (timeLeft > 60 * 60 * 1000) {
      opportunities.push("Long deadline allows for better solver competition");
    }
  }

  // Solver requirements optimization
  const stake = BigInt(intent.object.policy.access_condition.min_solver_stake);
  if (stake > BigInt("5000000000000")) {
    opportunities.push(
      "Consider lowering min solver stake to increase competition"
    );
  }

  return opportunities.length > 0
    ? opportunities
    : ["Intent is well-optimized for current parameters"];
}

// ===== VALIDATION HELPERS =====

export function calculateComplianceScore(intent: IGSIntent): number {
  let score = 100;

  // Required fields check
  if (!intent.igs_version) score -= 10;
  if (!intent.user_address) score -= 10;
  if (!intent.operation?.mode) score -= 10;

  // Best practices
  if (!intent.constraints) score -= 5;
  if (!intent.preferences) score -= 5;
  if (!intent.metadata) score -= 5;

  // Optimal configurations
  if (
    intent.constraints?.max_slippage_bps &&
    intent.constraints.max_slippage_bps > 500
  )
    score -= 10; // >5% slippage
  if (!intent.operation.inputs[0]?.asset_info) score -= 5; // Missing asset info

  return Math.max(0, score);
}

export function generateImprovementRecommendations(
  intent: IGSIntent
): string[] {
  const recommendations: string[] = [];

  if (!intent.metadata)
    recommendations.push("Add metadata for better intent tracking");
  if (!intent.constraints?.routing)
    recommendations.push(
      "Add routing constraints for more predictable execution"
    );
  if (!intent.preferences?.execution)
    recommendations.push(
      "Specify execution preferences for better solver selection"
    );

  const compliance = calculateComplianceScore(intent);
  if (compliance < 90)
    recommendations.push(
      "Review compliance score - some required fields may be missing"
    );

  return recommendations.length > 0
    ? recommendations
    : ["Intent is well-structured"];
}

export function generateFixSuggestions(intent: any): string[] {
  const suggestions: string[] = [];

  if (!intent.igs_version) suggestions.push('Add igs_version: "1.0.0"');
  if (!intent.user_address) suggestions.push("Add valid user_address");
  if (!intent.operation)
    suggestions.push("Add operation object with mode, inputs, and outputs");
  if (!intent.object?.policy)
    suggestions.push("Add object.policy with access conditions");

  return suggestions;
}

// ===== EXPLANATION GENERATION =====

export function generateIntentExplanation(
  intent: IGSIntent,
  smartDefaults: SmartDefaults,
  params: any
): IntentExplanation {
  const analysis = analyzeIGSIntent(intent);

  return {
    summary: `${params.intent_description} - optimized for ${params.priority} with ${smartDefaults.expected_slippage} expected slippage`,

    execution_plan: {
      steps: [
        `1. Solver discovers intent during ${(
          smartDefaults.access_window_ms / 60000
        ).toFixed(0)}-minute window`,
        `2. Solver routes through ${smartDefaults.max_hops} max hops on recommended protocols`,
        `3. Execution completes with ${smartDefaults.ranking_weights.surplus_weight}% focus on best price`,
        `4. Intent auto-revokes after ${smartDefaults.auto_revoke_hours} hours if unexecuted`,
      ],
      estimated_time: `${smartDefaults.deadline_minutes} minutes`,
      solver_selection: `${analysis.solver_requirements.estimated_solver_pool} eligible solvers with min stake ${smartDefaults.min_solver_stake}`,
    },

    cost_analysis: {
      gas_estimate: smartDefaults.estimated_gas_range,
      protocol_fees: "0.1-0.3%",
      total_cost_range: smartDefaults.estimated_gas_range,
    },

    risk_assessment: {
      risk_level:
        analysis.execution_outlook.key_risks.length > 2
          ? "high"
          : analysis.execution_outlook.key_risks.length > 0
          ? "medium"
          : "low",
      main_risks: analysis.execution_outlook.key_risks,
      mitigation_strategies: [
        "Intent includes slippage protection",
        "Multiple solvers compete for best execution",
        "Auto-revoke prevents stale intent execution",
      ],
    },

    optimization_notes: {
      current_optimization: params.priority,
      alternative_approaches: [
        "Could increase slippage tolerance for higher execution probability",
        "Could extend deadline for better solver competition",
        "Could reduce max hops to save gas costs",
      ],
      trade_offs: [
        `Gas cost vs. execution speed: ${smartDefaults.ranking_weights.gas_cost_weight}% vs ${smartDefaults.ranking_weights.execution_speed_weight}%`,
        `Price optimization: ${smartDefaults.ranking_weights.surplus_weight}% weight`,
      ],
    },

    technical_details: {
      igs_version: intent.igs_version,
      validation_status: "compliant",
      compliance_notes: generateImprovementRecommendations(intent),
    },
  };
}

// ===== COMPARISON =====

export function generateIntentComparison(
  intents: IGSIntent[],
  criteria: string[]
): IntentComparison {
  const items = intents.map((intent, index) => {
    const analysis = analyzeIGSIntent(intent);

    return {
      index,
      intent_type: intent.intent_type || "unknown",
      metrics: {
        expected_gas_cost: criteria.includes("expected_gas_cost")
          ? estimateGasRange({ priority: "balanced" } as any)
          : undefined,
        slippage_tolerance: criteria.includes("slippage_tolerance")
          ? `${intent.constraints?.max_slippage_bps || 0} bps`
          : undefined,
        execution_speed: criteria.includes("execution_speed")
          ? `${analysis.solver_requirements.access_window_hours.toFixed(
              1
            )} hours`
          : undefined,
        solver_requirements: criteria.includes("solver_requirements")
          ? `${analysis.solver_requirements.estimated_solver_pool} eligible solvers`
          : undefined,
        success_probability: criteria.includes("success_probability")
          ? `${analysis.execution_outlook.probability_estimate}%`
          : undefined,
        privacy_level: criteria.includes("privacy_level")
          ? intent.preferences?.privacy?.encrypt_intent
            ? "high"
            : "standard"
          : undefined,
      },
      pros: analysis.execution_outlook.optimization_opportunities.slice(0, 2),
      cons: analysis.execution_outlook.key_risks.slice(0, 2),
    };
  });

  // Determine best intent for each criteria
  let bestForGas = 0;
  const bestForSpeed = 0;
  const bestForPrice = 0;

  // Simple heuristics for recommendation
  items.forEach((item, idx) => {
    if (
      item.metrics.expected_gas_cost &&
      item.metrics.expected_gas_cost <
        items[bestForGas].metrics.expected_gas_cost!
    ) {
      bestForGas = idx;
    }
  });

  return {
    summary: `Comparing ${intents.length} intents across ${criteria.length} criteria`,
    intents: items,
    recommendation: {
      best_for_gas: bestForGas,
      best_for_speed: bestForSpeed,
      best_for_price: bestForPrice,
      overall_best: bestForGas, // Could be more sophisticated
      reasoning: `Intent #${bestForGas} offers the best balance based on selected criteria`,
    },
  };
}
