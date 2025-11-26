/**
 * Server Integration Tools (Stubs)
 * These will be implemented later to connect with actual Intenus Protocol backend
 */

import { IGSIntentSchema, InputIntentClassificationSchema } from '@intenus/common';
import { tool } from 'ai';
import { z } from 'zod';

/**
 * Intent Classification Strategy Output Schema
 */
export const IntentClassificationOutputSchema = z.object({
  strategy: z.enum(['surplus-first', 'cost-minimization', 'surplus-maximization']).describe('Recommended strategy based on intent classification'),
  confidence: z.number().min(0).max(1).describe('Confidence score of the prediction'),
  metrics: z.object({
    surplus_score: z.number().optional().describe('Surplus optimization score'),
    cost_score: z.number().optional().describe('Cost minimization score'),
    execution_score: z.number().optional().describe('Execution speed score'),
  }).optional().describe('Detailed metric scores'),
  explanation: z.string().optional().describe('Human-readable explanation of the strategy choice'),
});

/**
 * Predict intent classification strategy
 * Analyzes intent parameters to recommend optimal solver strategy
 */
export const predictIntentClassificationTool = tool({
  description: 'Predict optimal solver strategy (surplus-first, cost-minimization, or surplus-maximization) based on intent parameters. Call this before submitting intent to help user understand the recommended approach.',
  inputSchema: InputIntentClassificationSchema,
  outputSchema: IntentClassificationOutputSchema,
  execute: async (params) => {
    const result = await fetch('http://3.26.14.143:8000/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    return result.json();
  },
});

/**
 * Submit intent to Intenus Protocol solvers network (STUB)
 * TODO: Implement actual backend integration
 */
export const submitIntentTool = tool({
  description: 'Submit IGS Intent to Intenus Protocol solvers network for execution. Solvers will compete to provide the best execution path.',
  inputSchema: IGSIntentSchema,
  outputSchema: z.any().describe('Submission result with status and details'),
});
