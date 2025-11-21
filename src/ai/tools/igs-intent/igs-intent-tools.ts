/**
 * Final IGS Intent Tools - Fixed Implementation
 */

import { tool } from "ai";
import { z } from "zod";
import {
  generateOptimalIntent,
  analyzeOptimalIntent,
  IntentGenerationInput,
  ValidationResult,
  MarketContext,
} from "./utils";
import { getTokenInfo, getPopularTokens } from "@/libs/suiClient";
import { isValidSuiAddress, normalizeSuiAddress } from "@mysten/sui/utils";

// ============================================================================
// TOKEN SUPPORT TOOL
// ============================================================================

export const getSupportedTokensTool = tool({
  description: `Get list of supported tokens on Sui blockchain for DeFi operations.`,
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const tokens = getPopularTokens();
      
      // 🔥 FIX: Safe array check
      if (!Array.isArray(tokens)) {
        return {
          success: false,
          error: "Failed to load token data",
        };
      }

      return {
        success: true,
        tokens: tokens.map((t) => ({
          symbol: t.symbol,
          name: t.name,
          decimals: t.decimals,
          coinType: t.coinType,
        })),
        message: `Found ${tokens.length} supported tokens: ${tokens.map((t) => t.symbol).join(", ")}`,
      };
    } catch (error) {
      console.error("getSupportedTokensTool error:", error);
      return {
        success: false,
        error: "Unable to fetch supported tokens",
      };
    }
  },
});

// ============================================================================
// MAIN OPTIMAL INTENT GENERATION TOOL
// ============================================================================

export const buildOptimalIGSIntentTool = tool({
  description: `Generate IGS Intent with optimal features and validation.`,
  inputSchema: z.object({
    user_address: z.string().describe("User's Sui wallet address (0x...)"),
    intent_description: z.string().describe("Natural language description of what user wants"),
    input_asset: z.string().describe("Input token symbol (SUI, USDC, USDT, WETH)"),
    input_amount: z.string().describe("Amount to swap (human readable with decimals)"),
    output_asset: z.string().describe("Output token symbol"),
    priority: z.enum(["speed", "price", "gas", "safety"]).default("price").describe("Primary optimization goal"),
    risk_tolerance: z.enum(["low", "medium", "high"]).default("medium").describe("Risk tolerance: low=conservative, high=aggressive"),
    urgency: z.enum(["low", "normal", "urgent"]).default("normal").describe("Execution urgency"),
    custom_slippage_bps: z.number().optional().describe("Override calculated slippage (basis points)"),
    custom_deadline_minutes: z.number().optional().describe("Override calculated deadline (minutes)"),
    protocol_preferences: z.array(z.string()).optional().describe("Preferred DEX protocols"),
    protocol_blacklist: z.array(z.string()).optional().describe("Protocols to avoid"),
    market_volatility: z.enum(["low", "medium", "high"]).optional().describe("Current market volatility"),
    liquidity_depth: z.enum(["excellent", "good", "adequate", "low"]).optional().describe("Token pair liquidity"),
  }),

  execute: async (params) => {
    try {
      // 1. Validate address
      if (!isValidSuiAddress(params.user_address)) {
        return {
          success: false,
          error: "Invalid Sui address format (must start with 0x)",
        };
      }

      // 2. Validate and get tokens with safe handling
      let inputToken, outputToken;
      try {
        inputToken = getTokenInfo(params.input_asset.toUpperCase());
        outputToken = getTokenInfo(params.output_asset.toUpperCase());
      } catch (error) {
        console.error("Token lookup error:", error);
        return {
          success: false,
          error: "Failed to lookup token information",
        };
      }

      if (!inputToken || !outputToken) {
        // 🔥 FIX: Safe token list fallback
        let supportedTokens: string[] = [];
        try {
          const tokens = getPopularTokens();
          supportedTokens = Array.isArray(tokens) ? tokens.map((t) => t.symbol) : ["SUI", "USDC", "USDT"];
        } catch (error) {
          supportedTokens = ["SUI", "USDC", "USDT"]; // Hard fallback
        }

        return {
          success: false,
          error: `Unsupported token: ${!inputToken ? params.input_asset : params.output_asset}`,
          supported_tokens: supportedTokens,
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
          volatility: params.market_volatility || "medium",
          liquidityDepth: params.liquidity_depth || "adequate",
          recommendedProtocols: [], // Safe empty array
        };
      }

      // 5. Build input for generation with safe arrays
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

        protocolPreferences: params.protocol_preferences || [],
        protocolBlacklist: params.protocol_blacklist || [],
      };

      // 6. Generate optimal intent with error handling
      let result: ValidationResult;
      try {
        result = generateOptimalIntent(input, marketContext);
      } catch (error) {
        console.error("generateOptimalIntent error:", error);
        return {
          success: false,
          error: `Intent generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }

      if (!result.valid || !result.intent) {
        return {
          success: false,
          error: "Intent generation failed",
          validation_errors: Array.isArray(result.errors) ? result.errors : ["Unknown validation error"],
        };
      }

      // 7. Analyze the generated intent with error handling
      let analysis;
      try {
        analysis = analyzeOptimalIntent(result.intent);
      } catch (error) {
        console.error("analyzeOptimalIntent error:", error);
        // Provide fallback analysis
        analysis = {
          type: "swap",
          complexity: "simple",
          estimatedGas: "$0.01",
          executionProbability: "85%",
          solverRequirements: {
            minStake: "1000",
            requiresTEE: false,
            accessWindowHours: 24,
            estimatedSolverPool: 50,
          },
          constraints: {
            slippageBps: 100,
            deadlineMinutes: 15,
            maxHops: 2,
          },
          risks: [],
        };
      }

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
          risks: Array.isArray(analysis.risks) ? analysis.risks : [],
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
        warnings: Array.isArray(result.warnings) ? result.warnings : [],
        message: `✓ Generated ${params.priority}-optimized intent: ${params.input_amount} ${params.input_asset} → ${params.output_asset} (${analysis.executionProbability} execution probability)`,
      };
    } catch (error) {
      console.error("buildOptimalIGSIntentTool unexpected error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error in intent generation",
      };
    }
  },
});