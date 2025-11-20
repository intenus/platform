export interface MarketOverviewSummary {
  market_health: string;
  volume_trend: string;
  top_protocols: Array<{
    name: string;
    volume_24h: number;
    market_share: number;
  }>;
  liquidity_assessment: string;
  key_metrics: {
    total_volume_24h: number;
    volume_change_24h: number;
    volume_change_7d: number;
    active_protocols: number;
  };
}
