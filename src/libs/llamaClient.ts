/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DeFiLlama API Client - Minimal wrapper
 */

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
  twitter?: string;
  category: 'Dexs' | 'Lending' | 'Yield' | 'Derivatives' | 'CDP' | 'Bridge' | 'Staking';
  chains: string[];
  currentChainTvls: {
    Sui: number;
  };
  tvl: Array<{ date: number; totalLiquidityUSD: number }>;
}

interface TokenPrice {
  symbol: string;
  price: number;
  timestamp: number;
  confidence: number;
}

interface MarketData {
  totalTvl: number;
  protocolCount: number;
  topProtocols: SuiProtocol[];
  tokenPrices: Record<string, TokenPrice>;
  volumeData: {
    daily: number;
    weekly: number;
  };
}

class LlamaClient {
  private baseUrl: string;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  constructor() {
    this.baseUrl = 'https://api.llama.fi';
  }

  private async fetchWithCache<T>(endpoint: string, cacheTtl: number = 300000): Promise<T> {
    const cacheKey = endpoint;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now(), ttl: cacheTtl });
    return data as T;
  }

  async getSuiProtocols(): Promise<SuiProtocol[]> {
    const protocols = await this.fetchWithCache<SuiProtocol[]>('/protocols');
    return protocols.filter(p => p.chains.includes('Sui') || p.chain === 'Sui');
  }

  async getTopSuiProtocols(limit: number = 10): Promise<SuiProtocol[]> {
    const protocols = await this.getSuiProtocols();
    return protocols
      .filter(p => p.currentChainTvls?.Sui > 0)
      .sort((a, b) => (b.currentChainTvls?.Sui || 0) - (a.currentChainTvls?.Sui || 0))
      .slice(0, limit);
  }

  async getProtocolsByCategory(category: SuiProtocol['category']): Promise<SuiProtocol[]> {
    const protocols = await this.getSuiProtocols();
    return protocols.filter(p => p.category === category);
  }

  async getSuiMarketData(): Promise<MarketData> {
    const [protocols, volumeDataRaw] = await Promise.all([
      this.getTopSuiProtocols(10),
      this.fetchWithCache('/overview/dexs/Sui?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true')
    ]);

    const volumeData = volumeDataRaw as any;
    const totalTvl = protocols.reduce((sum, p) => sum + (p.currentChainTvls?.Sui || 0), 0);
    const tokenPrices = await this.getTokenPrices(['sui', 'usd-coin', 'tether']);

    return {
      totalTvl,
      protocolCount: protocols.length,
      topProtocols: protocols,
      tokenPrices,
      volumeData: {
        daily: volumeData?.totalDataChart?.[volumeData.totalDataChart.length - 1]?.[1] || 0,
        weekly: volumeData?.totalDataChart?.slice(-7).reduce((sum: number, day: [number, number]) => sum + (day[1] || 0), 0) || 0
      }
    };
  }

  async getTokenPrices(tokenIds: string[]): Promise<Record<string, TokenPrice>> {
    try {
      const coinsEndpoint = `https://coins.llama.fi/prices/current/${tokenIds.map(id => `coingecko:${id}`).join(',')}`;
      const response = await fetch(coinsEndpoint);
      const data = await response.json();

      const result: Record<string, TokenPrice> = {};
      Object.entries(data.coins || {}).forEach(([id, coinData]: [string, any]) => {
        const tokenId = id.split(':')[1];
        result[tokenId] = {
          symbol: coinData.symbol?.toUpperCase() || tokenId,
          price: coinData.price || 0,
          timestamp: coinData.timestamp || Date.now(),
          confidence: coinData.confidence || 0.95
        };
      });

      return result;
    } catch {
      return {};
    }
  }

  async searchProtocols(query: string): Promise<SuiProtocol[]> {
    const protocols = await this.getSuiProtocols();
    const lowercaseQuery = query.toLowerCase();
    return protocols.filter(p =>
      p.name.toLowerCase().includes(lowercaseQuery) ||
      p.symbol?.toLowerCase().includes(lowercaseQuery) ||
      p.category.toLowerCase().includes(lowercaseQuery)
    );
  }
}

export const llama = new LlamaClient();
