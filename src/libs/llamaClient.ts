/**
 * Llama API Client for Sui DeFi Data (DefiLlama)
 * Fetches real-time TVL, protocol data, and market metrics
 */

interface LlamaResponse<T> {
  success: boolean;
  data: T;
  timestamp: number;
}

interface SuiProtocol {
  id: string;
  name: string;
  address?: string;
  symbol?: string;
  url?: string;
  description?: string;
  chain: 'Sui';
  logo?: string;
  audits?: number;
  audit_note?: string;
  governance_id?: string[];
  twitter?: string;
  category: 'Dexs' | 'Lending' | 'Yield' | 'Derivatives' | 'CDP' | 'Bridge' | 'Staking';
  chains: string[];
  module: string;
  chainTvls: {
    Sui: {
      tvl: Array<{ date: number; totalLiquidityUSD: number }>;
      tokensInUsd: Array<{ date: number; tokens: Record<string, number> }>;
    };
  };
  currentChainTvls: {
    Sui: number;
  };
  tvl: Array<{ date: number; totalLiquidityUSD: number }>;
}

interface SuiChainData {
  gecko_id: string;
  tvl: number;
  tokenSymbol: string;
  cmcId: string;
  name: string;
  chainId?: number;
}

interface SuiTokenPrice {
  symbol: string;
  price: number;
  timestamp: number;
  confidence: number;
}

interface SuiMarketData {
  chainData: SuiChainData;
  totalTvl: number;
  protocolCount: number;
  topProtocols: SuiProtocol[];
  tokenPrices: Record<string, SuiTokenPrice>;
  volumeData: {
    daily: number;
    weekly: number;
  };
  feesData: {
    daily: number;
    revenue: number;
  };
}

class LlamaClient {
  private baseUrl: string;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private rateLimitDelay: number;
  
  constructor() {
    this.baseUrl = process.env.LLAMA_API_BASE || 'https://api.llama.fi';
    this.rateLimitDelay = parseInt(process.env.LLAMA_RATE_LIMIT_MS || '1000');
  }

  private async fetchWithCache<T>(
    endpoint: string, 
    cacheTtl: number = 300000 // 5 minutes default
  ): Promise<T> {
    const cacheKey = endpoint;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }

    try {
      await this.rateLimit();
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SuiDeFiChatbot/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Llama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: cacheTtl
      });

      return data as T;
    } catch (error) {
      console.error(`Error fetching from Llama: ${endpoint}`, error);
      throw error;
    }
  }

  private async rateLimit(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
  }

  /**
   * Get Sui chain overview data
   */
  async getSuiChainData(): Promise<SuiChainData> {
    const chains = await this.fetchWithCache<SuiChainData[]>('/v2/chains');
    const suiChain = chains.find(chain => chain.name === 'Sui');
    
    if (!suiChain) {
      throw new Error('Sui chain data not found');
    }

    return suiChain;
  }

  /**
   * Get all protocols on Sui
   */
  async getSuiProtocols(): Promise<SuiProtocol[]> {
    const protocols = await this.fetchWithCache<SuiProtocol[]>('/protocols');
    return protocols.filter(protocol => 
      protocol.chains.includes('Sui') || protocol.chain === 'Sui'
    );
  }

  /**
   * Get top Sui protocols by TVL
   */
  async getTopSuiProtocols(limit: number = 10): Promise<SuiProtocol[]> {
    const protocols = await this.getSuiProtocols();
    
    return protocols
      .filter(p => p.currentChainTvls?.Sui > 0)
      .sort((a, b) => (b.currentChainTvls?.Sui || 0) - (a.currentChainTvls?.Sui || 0))
      .slice(0, limit);
  }

  /**
   * Get protocol data by category
   */
  async getProtocolsByCategory(category: SuiProtocol['category']): Promise<SuiProtocol[]> {
    const protocols = await this.getSuiProtocols();
    return protocols.filter(p => p.category === category);
  }

  /**
   * Get comprehensive Sui market data
   */
  async getSuiMarketData(): Promise<SuiMarketData> {
    const [chainData, protocols, volumeData, feesData] = await Promise.all([
      this.getSuiChainData(),
      this.getTopSuiProtocols(10),
      this.fetchWithCache('/overview/dexs/Sui'),
      this.fetchWithCache('/overview/fees/Sui')
    ]);

    const totalTvl = protocols.reduce((sum, p) => sum + (p.currentChainTvls?.Sui || 0), 0);

    return {
      chainData,
      totalTvl,
      protocolCount: protocols.length,
      topProtocols: protocols,
      tokenPrices: await this.getTokenPrices(['sui', 'usd-coin', 'tether']),
      volumeData: {
        daily: (volumeData as any)?.totalDataChart?.[(volumeData as any).totalDataChart?.length - 1]?.[1] || 0,
        weekly: (volumeData as any)?.totalDataChart?.slice(-7).reduce((sum: number, day: [number, number]) => sum + (day[1] || 0), 0) || 0
      },
      feesData: {
        daily: (feesData as any)?.totalDataChart?.[(feesData as any).totalDataChart?.length - 1]?.[1] || 0,
        revenue: ((feesData as any)?.totalDataChart?.[(feesData as any).totalDataChart?.length - 1]?.[1] || 0) * 0.3 // Estimate 30% revenue
      }
    };
  }

  /**
   * Get token prices from CoinGecko integration
   */
  async getTokenPrices(tokenIds: string[]): Promise<Record<string, SuiTokenPrice>> {
    try {
      const prices = await this.fetchWithCache(`/prices/current/${tokenIds.join(',')}`);
      
      const result: Record<string, SuiTokenPrice> = {};

      Object.entries((prices as any)?.coins || {}).forEach(([id, data]: [string, any]) => {
        result[id] = {
          symbol: data.symbol?.toUpperCase() || id,
          price: data.price || 0,
          timestamp: data.timestamp || Date.now(),
          confidence: data.confidence || 0.95
        };
      });

      return result;
    } catch (error) {
      console.warn('Failed to fetch token prices:', error);
      return {};
    }
  }

  /**
   * Get yield opportunities on Sui
   */
  async getSuiYieldPools(): Promise<any[]> {
    try {
      const yields = await this.fetchWithCache('/yields?chain=Sui');
      return (yields as any)?.data || [];
    } catch (error) {
      console.warn('Failed to fetch yield data:', error);
      return [];
    }
  }

  /**
   * Search protocols by name or symbol
   */
  async searchProtocols(query: string): Promise<SuiProtocol[]> {
    const protocols = await this.getSuiProtocols();
    const lowercaseQuery = query.toLowerCase();
    
    return protocols.filter(p => 
      p.name.toLowerCase().includes(lowercaseQuery) ||
      p.symbol?.toLowerCase().includes(lowercaseQuery) ||
      p.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get historical TVL data for Sui chain
   */
  async getSuiTvlHistory(days: number = 30): Promise<Array<{ date: string; tvl: number }>> {
    try {
      const data = await this.fetchWithCache(`/v2/historicalChainTvl/Sui`);
      return (data as any)?.slice(-days).map((item: any) => ({
        date: new Date(item.date * 1000).toISOString().split('T')[0],
        tvl: item.tvl
      })) || [];
    } catch (error) {
      console.warn('Failed to fetch TVL history:', error);
      return [];
    }
  }

  /**
   * Clear cache (useful for testing or force refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const llama = new LlamaClient();
export const llamaClient = llama; // Backward compatibility

export type {
  SuiProtocol,
  SuiChainData,
  SuiTokenPrice,
  SuiMarketData,
  LlamaResponse
};