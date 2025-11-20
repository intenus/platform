/**
 * Market Data Tools for LLM
 * Fetch prices, protocols, and market information using tool() helper
 * Uses DeFiLlama API with proper chain:address or coingecko:id format
 */

import { tool } from 'ai';
import { z } from 'zod';
import { llama } from '@/libs/llamaClient';
import { getTokenInfo, getTokenPriceId } from '@/libs/suiClient';

/**
 * Get current market prices for tokens
 * Supports DeFiLlama format: coingecko:{id} or sui:{address}
 */
export const getMarketPriceTool = tool({
  description: 'Get current market prices for Sui tokens (SUI, USDC, USDT, WETH, WALRUS). Returns real-time prices from DeFiLlama.',
  inputSchema: z.object({
    tokens: z.array(z.string()).describe('Token symbols to get prices for, e.g. ["SUI", "USDC"]'),
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
          error: 'No valid tokens provided. Supported: SUI, USDC, USDT, WETH, WALRUS',
        };
      }

      // Fetch prices using comma-separated format
      const prices = await llama.getTokenPricesByIds(priceIds);

      const result: Record<string, { price: number; symbol: string; confidence?: number }> = {};

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
        error: error instanceof Error ? error.message : 'Failed to fetch prices',
      };
    }
  },
});

/**
 * Get DEX protocol information
 */
export const getProtocolInfoTool = tool({
  description: 'Get information about Sui DEX protocols for swap routing (e.g., Cetus, Turbos, FlowX)',
  inputSchema: z.object({
    search: z.string().optional().describe('Protocol name to search for'),
    limit: z.number().optional().default(3).describe('Max number of protocols to return'),
  }),
  execute: async (params) => {
    const { search, limit = 3 } = params;

    try {
      let protocols;

      if (search) {
        protocols = await llama.searchProtocols(search);
      } else {
        protocols = await llama.getProtocolsByCategory('Dexs');
      }

      const topProtocols = protocols
        .slice(0, limit)
        .map((p) => ({
          name: p.name,
          category: p.category,
          tvl: p.currentChainTvls?.Sui || 0,
          description: p.description,
          url: p.url,
        }));

      return {
        success: true,
        protocols: topProtocols,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch protocols',
      };
    }
  },
});

/**
 * Get market overview for context
 */
export const getMarketOverviewTool = tool({
  description: 'Get Sui blockchain market overview including TVL, volume, and top DEXs',
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const marketData = await llama.getSuiMarketData();

      return {
        success: true,
        overview: {
          total_tvl: marketData.totalTvl,
          sui_price: marketData.tokenPrices['sui']?.price || 0,
          daily_dex_volume: marketData.volumeData.daily,
          top_dexs: marketData.topProtocols
            .filter((p) => p.category === 'Dexs')
            .slice(0, 3)
            .map((p) => ({
              name: p.name,
              tvl: p.currentChainTvls?.Sui || 0,
            })),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch market overview',
      };
    }
  },
});
