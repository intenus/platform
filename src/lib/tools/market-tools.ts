/**
 * Market Data Tools for LLM
 * Fetch prices, protocols, and market information using tool() helper
 */

import { tool } from 'ai';
import { z } from 'zod';
import { llama } from '@/libs/llamaClient';

/**
 * Get current market prices for tokens
 */
export const getMarketPriceTool = tool({
  description: 'Get current market prices for Sui tokens (SUI, USDC, USDT, WETH)',
  inputSchema: z.object({
    tokens: z.array(z.string()).describe('Token symbols to get prices for, e.g. ["SUI", "USDC"]'),
  }),
  execute: async (params) => {
    const { tokens } = params;

    try {
      // Map symbols to CoinGecko IDs
      const tokenMap: Record<string, string> = {
        SUI: 'sui',
        USDC: 'usd-coin',
        USDT: 'tether',
        WETH: 'weth',
      };

      const tokenIds = tokens
        .map((t) => tokenMap[t.toUpperCase()])
        .filter(Boolean);

      if (tokenIds.length === 0) {
        return {
          success: false,
          error: 'No valid tokens provided',
        };
      }

      const prices = await llama.getTokenPrices(tokenIds);

      const result: Record<string, { price: number; symbol: string }> = {};

      Object.entries(prices).forEach(([id, data]) => {
        const symbol = Object.keys(tokenMap).find((k) => tokenMap[k] === id);
        if (symbol) {
          result[symbol] = {
            symbol: data.symbol,
            price: data.price,
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
  description: 'Get information about Sui DEX protocols for swap routing',
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
  description: 'Get Sui market overview including TVL, volume, and top DEXs',
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
