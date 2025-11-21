/**
 * Market Data Tools for LLM
 * Fetch prices, protocols, and market information using tool() helper
 * Uses DeFiLlama API with proper chain:address or coingecko:id format
 */

import { tool } from "ai";
import { z } from "zod";
import { llama } from "@/libs/llamaClient";
import { getTokenPriceId } from "@/libs/suiClient";
import { calculateExpectedPerformance, generateOptimizationTips, getRecommendedProtocols, identifyRiskFactors, summarizeMarketData } from "./utils";
import { Category, Chain } from "@/libs/llama.type";

/**
 * Get current market prices for tokens
 * Supports DeFiLlama format: coingecko:{id} or sui:{address}
 */
export const getMarketPriceTool = tool({
  description:
    "Get current market prices for Sui tokens (SUI, USDC, USDT, WETH, WALRUS). Returns real-time prices from DeFiLlama.",
  inputSchema: z.object({
    tokens: z
      .array(z.string())
      .describe('Token symbols to get prices for, e.g. ["SUI", "USDC"]'),
  }),
  execute: async (params) => {
    const { tokens } = params;

    try {
      // Build price IDs in DeFiLlama format: coingecko:{id} or sui:{address}
      const priceIds: string[] = [];
      const symbolToPriceId: Record<string, string> = {};

      for (const token of tokens) {
        const upperToken = token.toUpperCase();
        const priceId = getTokenPriceId(upperToken);

        if (priceId) {
          priceIds.push(priceId);
          symbolToPriceId[upperToken] = priceId;
        }
      }

      if (priceIds.length === 0) {
        return {
          success: false,
          error:
            "No valid tokens provided. Supported: SUI, USDC, USDT, WETH, WALRUS",
        };
      }

      // Fetch prices using comma-separated format
      const prices = await llama.getTokenPricesByIds(priceIds);

      const result: Record<
        string,
        { price: number; symbol: string; confidence?: number }
      > = {};

      // Map back to symbols
      Object.entries(symbolToPriceId).forEach(([symbol, priceId]) => {
        const priceData = prices[priceId];
        if (priceData) {
          result[symbol] = {
            symbol: priceData.symbol || symbol,
            price: priceData.price,
            confidence: priceData.confidence,
          };
        }
      });

      return {
        success: true,
        prices: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch prices",
      };
    }
  },
});

/**
 * Get DEX protocol information
 */
export const getDEXProtocolInfoTool = tool({
  description:
    "Get information about Sui DEX protocols for swap routing (e.g., Cetus, Turbos, FlowX)",
  inputSchema: z.object({
    search: z.string().optional().describe("Protocol name to search for"),
    limit: z
      .number()
      .optional()
      .default(3)
      .describe("Max number of protocols to return"),
  }),
  execute: async (params) => {
    const { search, limit = 3 } = params;

    try {
      const protocols = await llama.getProtocolsByCategory(Category.Dexs);

      const topProtocols = protocols
        .filter((p) =>
          p.chains.map((c) => c.toLowerCase()).includes(Chain.Sui.toLowerCase())
        )
        .filter((p) =>
          search
            ? p.name.toLowerCase().includes(search.toLowerCase())
            : true
        )
        .slice(0, limit);

      return {
        success: true,
        protocols: topProtocols,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch protocols",
      };
    }
  },
});

/**
 * Get overall market overview for Sui DEXs
 */
export const getMarketOverviewTool = tool({
  description: `
    Get Sui DeFi ecosystem overview focused on intent execution opportunities.
    Analyzes DEX liquidity, lending rates, and optimal routing for DeFi intents.
    Use when user asks about Sui market conditions, protocol recommendations, 
    or needs context for DeFi intent execution (swap, lend, yield farming).
  `,
  inputSchema: z.object({
    // ===== INTENT CONTEXT =====
    intent_category: z.enum([
      'swap',           // DEX trading focus
      'lending',        // Lending/borrowing focus  
      'liquidity',      // LP/yield farming focus
      'general'         // Overall market overview
    ]).optional().describe("DeFi intent type to focus analysis on"),
    
    // ===== TRADE SIZE CONTEXT =====
    trade_size_category: z.enum([
      'small',          // <$1,000 - focus on gas efficiency
      'medium',         // $1,000-$10,000 - balance price/gas
      'large',          // >$10,000 - focus on liquidity depth
      'any'
    ]).optional().describe("Trade size for liquidity and slippage analysis"),
    
    // ===== ASSET CONTEXT =====
    asset_focus: z.enum([
      'sui_native',     // SUI, major Sui tokens
      'stablecoins',    // USDC, USDT focus
      'major_pairs',    // SUI/USDC, SUI/USDT
      'all_assets'
    ]).optional().describe("Asset category to emphasize in analysis"),
    
    // ===== OPTIMIZATION GOAL =====
    optimization_priority: z.enum([
      'best_rate',      // Minimize slippage, best execution price
      'lowest_gas',     // Most gas-efficient protocols
      'fastest_execution', // Fastest settlement
      'highest_liquidity', // Most liquid protocols
      'balanced'        // Balance all factors
    ]).optional().describe("Primary optimization goal for recommendations")
  }),

  execute: async ({
    intent_category = 'general',
    trade_size_category = 'any',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    asset_focus = 'all_assets',
    optimization_priority = 'balanced'
  }) => {
    try {
      // Fetch base market data from DeFiLlama
      const marketData = await llama.getDexOverview(Chain.Sui);
      
      // Build focused summary
      const overview = summarizeMarketData(marketData);

      return {
        success: true,
        overview,
        // ===== INTENT-SPECIFIC INSIGHTS =====
        intent_insights: {
          recommended_protocols: getRecommendedProtocols(
            intent_category, 
            trade_size_category,
            optimization_priority
          ),
          expected_performance: calculateExpectedPerformance(
            intent_category,
            trade_size_category, 
            marketData
          ),
          risk_factors: identifyRiskFactors(marketData, intent_category),
          optimization_tips: generateOptimizationTips(
            optimization_priority,
            marketData
          )
        },
        // ===== RAW DATA (for debugging) =====
        raw_data: {
          total_protocols: marketData.protocols.length,
          chain: marketData.chain,
          data_timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error 
          ? error.message 
          : "Failed to fetch Sui market overview",
      };
    }
  },
});