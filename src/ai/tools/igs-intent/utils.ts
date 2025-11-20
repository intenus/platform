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