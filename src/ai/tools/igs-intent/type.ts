/**
 * Type Definitions for IGS Intent AI Tools
 * These types extend @intenus/common types for AI-specific functionality
 *
 * Core IGS types are imported from @intenus/common:
 * - IGSIntent, IGSIntentType, IGSAmount
 *
 * These types are AI tool-specific helpers for:
 * - Analysis and optimization
 * - Smart defaults calculation
 * - Intent comparison and explanation
 */

import { IGSAmount, IGSIntent, IGSIntentType } from "@intenus/common";

// ===== ANALYSIS TYPES =====

/**
 * AI-generated analysis of an IGS Intent
 * Provides insights for users about intent complexity, requirements, and execution
 */
export interface IntentAnalysis {
  intent_summary: {
    type: string;
    operation_mode: string;
    input_assets: string[];
    output_assets: string[];
    has_constraints: boolean;
    has_preferences: boolean;
  };
  complexity: {
    level: 'simple' | 'moderate' | 'complex' | 'advanced';
    factors: string[];
    estimated_gas_impact: 'low' | 'medium' | 'high';
  };
  solver_requirements: {
    min_stake_required: string;
    requires_tee: boolean;
    access_window_hours: number;
    estimated_solver_pool: number;
  };
  market_factors: {
    slippage_sensitivity: number | 'unlimited';
    deadline_pressure: number | 'no_limit';
    routing_restrictions?: RoutingConstraints;
  };
  execution_outlook: {
    probability_estimate: number; // 0-100
    key_risks: string[];
    optimization_opportunities: string[];
  };
}

// ===== SMART DEFAULTS =====

/**
 * Smart defaults calculated by AI based on user preferences and market conditions
 * Used to auto-populate IGSIntent parameters optimally
 */
export interface SmartDefaults {
  intent_type: IGSIntentType;
  operation_mode: string;
  slippage_bps: number;
  deadline_minutes: number;
  max_hops: number;
  min_solver_stake: string;
  requires_tee: boolean;
  ranking_weights: RankingWeights;
  access_window_ms: number;
  auto_revoke_hours: number;
  should_encrypt: boolean;
  output_amount: IGSAmount;
  expected_outcome?: string;
  max_gas_cost?: string;
  estimated_gas_range: string;
  expected_slippage: string;
  execution_probability: number;
  solver_competition: string;
  tags: string[];
}

/**
 * Ranking weights for solver selection
 * Used in IGSIntent.preferences.ranking_weights
 */
export interface RankingWeights {
  surplus_weight: number;
  gas_cost_weight: number;
  execution_speed_weight: number;
  reputation_weight: number;
}

// ===== EXPLANATION & COMPARISON =====

/**
 * Human-readable explanation of an IGS Intent for users
 * Helps users understand what the intent will do and associated costs/risks
 */
export interface IntentExplanation {
  summary: string;
  execution_plan?: {
    steps: string[];
    estimated_time: string;
    solver_selection: string;
  };
  cost_analysis?: {
    gas_estimate: string;
    protocol_fees: string;
    total_cost_range: string;
  };
  risk_assessment?: {
    risk_level: 'low' | 'medium' | 'high';
    main_risks: string[];
    mitigation_strategies: string[];
  };
  optimization_notes?: {
    current_optimization: string;
    alternative_approaches: string[];
    trade_offs: string[];
  };
  technical_details?: {
    igs_version: string;
    validation_status: string;
    compliance_notes: string[];
  };
}

/**
 * Side-by-side comparison of multiple IGS Intents
 * Helps users understand trade-offs between different optimization strategies
 */
export interface IntentComparison {
  summary: string;
  intents: IntentComparisonItem[];
  recommendation: {
    best_for_gas: number; // index
    best_for_speed: number;
    best_for_price: number;
    overall_best: number;
    reasoning: string;
  };
}

/**
 * Individual intent item in a comparison
 */
export interface IntentComparisonItem {
  index: number;
  intent_type: string;
  metrics: {
    expected_gas_cost?: string;
    slippage_tolerance?: string;
    execution_speed?: string;
    solver_requirements?: string;
    success_probability?: string;
    privacy_level?: string;
  };
  pros: string[];
  cons: string[];
}

// ===== ROUTING & CONSTRAINTS =====

/**
 * Routing constraints for intent execution
 * Matches IGSConstraints.routing structure from @intenus/common
 */
export interface RoutingConstraints {
  max_hops?: number;
  whitelist_protocols?: string[];
  blacklist_protocols?: string[];
}

// ===== MARKET CONTEXT =====

/**
 * Market data context for a token pair
 * Fetched from DeFiLlama and used for smart defaults calculation
 */
export interface MarketContext {
  input_token: string;
  output_token: string;
  current_price?: number;
  liquidity_depth?: string;
  typical_slippage?: string;
  recommended_protocols?: string[];
  market_volatility?: 'low' | 'medium' | 'high';
}

// ===== CALCULATION PARAMS =====

/**
 * Input parameters for smart defaults calculation
 */
export interface SmartDefaultsParams {
  priority: string;
  risk_tolerance: string;
  urgency: string;
  inputToken: TokenInfo;
  outputToken: TokenInfo;
  amount: string;
  marketData: MarketContext;
}

/**
 * Token information from suiClient
 */
export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  coinType: string;
}

// ===== VALIDATION RESULTS =====

/**
 * Result from intent validation
 */
export interface ValidationResult {
  success: boolean;
  valid: boolean;
  intent?: IGSIntent;
  analysis?: IntentAnalysis;
  compliance_score?: number;
  recommendations?: string[];
  error?: string;
  suggestions?: string[];
}

// ===== INTENT BUILDER RESULT =====

/**
 * Result from buildSmartIGSIntentTool execution
 */
export interface IntentBuilderResult {
  success: boolean;
  intent?: IGSIntent;
  smart_choices?: SmartDefaults;
  explanation?: IntentExplanation;
  estimated_performance?: {
    gas_cost_range: string;
    slippage_expected: string;
    execution_probability: number;
    solver_competition_level: string;
  };
  error?: string;
  supported_tokens?: string[];
}