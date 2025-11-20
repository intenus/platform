/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DeFiLlama API Client - Minimal wrapper
 */

import { DEFILLAMA_API_BASE } from "@/utils/constants";
import {
  Category,
  Chain,
  DexOverviewResponse,
  ProtocolsListResponse,
  ProtocolWithTvl,
  TokenPrice,
} from "./llama.type";

interface ErrorResponse {
  success: false;
  error: string;
}

class LlamaClient {
  private baseUrl: string;
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();

  constructor() {
    this.baseUrl = DEFILLAMA_API_BASE;
  }

  private async fetchWithCache<T>(
    endpoint: string,
    cacheTtl: number = 300000
  ): Promise<T> {
    const cacheKey = endpoint;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now(), ttl: cacheTtl });
    return data as T;
  }

  async getProtocolsByCategory(
    category: Category
  ): Promise<ProtocolsListResponse> {
    const protocols = await this.fetchWithCache<ProtocolsListResponse>(
      "/protocols"
    );
    return protocols.filter((p) => p.category === category);
  }

  /**
   * Get token prices by full price IDs (e.g. "coingecko:sui", "sui:0x...")
   * Uses DeFiLlama format: {chain}:{address} or coingecko:{id}
   */
  async getTokenPricesByIds(
    priceIds: string[]
  ): Promise<Record<string, TokenPrice>> {
    try {
      const coinsEndpoint = `https://coins.llama.fi/prices/current/${priceIds.join(
        ","
      )}`;
      const response = await fetch(coinsEndpoint);
      const data = await response.json();

      const result: Record<string, TokenPrice> = {};
      Object.entries(data.coins || {}).forEach(
        ([fullId, coinData]: [string, any]) => {
          result[fullId] = {
            symbol:
              coinData.symbol?.toUpperCase() || fullId.split(":")[1] || fullId,
            price: coinData.price || 0,
            timestamp: coinData.timestamp || Date.now(),
            confidence: coinData.confidence,
          };
        }
      );

      return result;
    } catch {
      return {

      };
    }
  }

  /**
   * Legacy method - Get token prices by CoinGecko IDs only
   * @deprecated Use getTokenPricesByIds instead for full chain:address support
   */
  async getTokenPrices(
    tokenIds: string[]
  ): Promise<Record<string, TokenPrice>> {
    try {
      const coinsEndpoint = `https://coins.llama.fi/prices/current/${tokenIds
        .map((id) => `coingecko:${id}`)
        .join(",")}`;
      const response = await fetch(coinsEndpoint);
      const data = await response.json();

      const result: Record<string, TokenPrice> = {};
      Object.entries(data.coins || {}).forEach(
        ([id, coinData]: [string, any]) => {
          const tokenId = id.split(":")[1];
          result[tokenId] = {
            symbol: coinData.symbol?.toUpperCase() || tokenId,
            price: coinData.price || 0,
            timestamp: coinData.timestamp || Date.now(),
            confidence: coinData.confidence || 0.95,
          };
        }
      );

      return result;
    } catch {
      return {};
    }
  }

  /**
   * Get DEX overview data for a specific chain
   */
  async getDexOverview(chain: Chain | string): Promise<DexOverviewResponse> {
    return this.fetchWithCache<DexOverviewResponse>(`/overview/dexs/${chain}`);
  }

  /**
   * Get protocol information by DeFiLlama ID
   */
  async getProtocolInfo(protocol: string): Promise<ProtocolWithTvl | null> {
    const protocolWithTvl = await this.fetchWithCache<ProtocolWithTvl>(
      `/protocol/${protocol}`
    );

    return protocolWithTvl || null;
  }
}

export const llama = new LlamaClient();
