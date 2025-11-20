// Types để AI hiểu rõ IGS Intent structure
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
    routing_restrictions?: any;
  };
  execution_outlook: {
    probability_estimate: number; // 0-100
    key_risks: string[];
    optimization_opportunities: string[];
  };
}

export interface SmartDefaults {
  intent_type: string;
  operation_mode: string;
  slippage_bps: number;
  deadline_minutes: number;
  max_hops: number;
  min_solver_stake: string;
  requires_tee: boolean;
  ranking_weights: Record<string, number>;
  // ... more fields
}

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