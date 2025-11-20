import { DexOverviewResponse } from "@/libs/llama.type";
import { MarketOverviewSummary } from "./type";

export function summarizeMarketData(marketData: DexOverviewResponse): MarketOverviewSummary{
  // Assess market health
  let market_health = 'healthy';
  if (marketData.total24h < 100000) market_health = 'low_activity';
  else if (Math.abs(marketData.change_1d) > 20) market_health = 'volatile';
  else if (marketData.change_7d < -30) market_health = 'declining';
  
  // Volume trend
  let volume_trend = 'stable';
  if (marketData.change_1d > 10) volume_trend = 'growing';
  else if (marketData.change_1d < -10) volume_trend = 'declining';
  
  // Top protocols by volume
  const top_protocols = marketData.protocols
    .sort((a, b) => b.total24h - a.total24h)
    .slice(0, 5)
    .map(protocol => ({
      name: protocol.displayName || protocol.name,
      volume_24h: protocol.total24h,
      market_share: (protocol.total24h / marketData.total24h) * 100
    }));
  
  // Liquidity assessment
  let liquidity_assessment = 'adequate';
  const topThreeVolume = top_protocols.slice(0, 3).reduce((sum, p) => sum + p.volume_24h, 0);
  const concentration = topThreeVolume / marketData.total24h;
  
  if (concentration > 0.9) liquidity_assessment = 'concentrated';
  else if (concentration < 0.5 && marketData.protocols.length > 5) liquidity_assessment = 'well_distributed';
  else if (marketData.total24h > 5000000) liquidity_assessment = 'excellent';
  
  return {
    market_health,
    volume_trend,
    top_protocols,
    liquidity_assessment,
    key_metrics: {
      total_volume_24h: marketData.total24h,
      volume_change_24h: marketData.change_1d,
      volume_change_7d: marketData.change_7d,
      active_protocols: marketData.protocols.length
    }
  };
}

export function getRecommendedProtocols(
  intent: string, 
  size: string, 
  priority: string
): string[] {
  // Map combinations to protocol recommendations
  const protocolMap: Record<string, string[]> = {
    // Swap recommendations
    'swap_small_best_rate': ['Cetus', 'FlowX Exchange'],
    'swap_small_lowest_gas': ['FlowX Exchange', 'Turbos'],
    'swap_medium_best_rate': ['Cetus', 'DeepBook'],
    'swap_medium_balanced': ['Cetus', 'FlowX Exchange', 'DeepBook'],
    'swap_large_highest_liquidity': ['DeepBook', 'Cetus'],
    'swap_large_best_rate': ['DeepBook', 'Cetus'],
    
    // Lending recommendations  
    'lending_any_best_rate': ['Scallop', 'Bucket Protocol'],
    'lending_any_lowest_gas': ['Scallop'],
    'lending_any_balanced': ['Scallop', 'Bucket Protocol'],
    
    // Liquidity recommendations
    'liquidity_any_best_rate': ['Cetus', 'Aftermath Finance'],
    'liquidity_any_balanced': ['Cetus', 'FlowX Exchange'],
    'liquidity_medium_best_rate': ['Cetus', 'Turbos'],
    
    // General recommendations
    'general_any_balanced': ['Cetus', 'Scallop', 'DeepBook'],
  };

  const key = `${intent}_${size}_${priority}`;
  return protocolMap[key] || protocolMap[`${intent}_any_${priority}`] || ['Cetus', 'Scallop'];
}

export function calculateExpectedPerformance(
  intent: string,
  size: string,
  marketData: DexOverviewResponse
): {
  expected_slippage?: string;
  expected_gas_usd?: string;
  expected_apy?: string;
  execution_time?: string;
  volume_impact?: string;
} {
  const totalVolume = marketData.total24h;
  const isHighVolume = totalVolume > 1000000; // $1M+
  
  switch(intent) {
    case 'swap':
      return {
        expected_slippage: size === 'large' ? '0.5-3%' : size === 'medium' ? '0.2-1%' : '0.05-0.3%',
        expected_gas_usd: '$0.02-0.08',
        execution_time: '2-8 seconds',
        volume_impact: size === 'large' && !isHighVolume ? 'High impact - consider splitting' : 'Normal'
      };
    case 'lending':
      return {
        expected_apy: isHighVolume ? '8-15%' : '5-12%',
        expected_gas_usd: '$0.03-0.12',
        execution_time: '3-10 seconds'
      };
    case 'liquidity':
      return {
        expected_apy: isHighVolume ? '12-25%' : '8-18%',
        expected_gas_usd: '$0.05-0.15',
        execution_time: '5-12 seconds'
      };
    default:
      return {
        execution_time: '2-10 seconds',
        expected_gas_usd: '$0.02-0.15'
      };
  }
}

export function identifyRiskFactors(
  marketData: DexOverviewResponse, 
  intent: string
): string[] {
  const risks: string[] = [];
  
  // Volume-based risks
  if (marketData.total24h < 500000) { // <$500k
    risks.push('Low 24h volume may cause higher slippage');
  }
  
  // Volatility risks
  if (Math.abs(marketData.change_1d) > 10) {
    risks.push('High daily volatility detected');
  }
  
  if (Math.abs(marketData.change_7d) > 25) {
    risks.push('High weekly volatility - consider smaller positions');
  }
  
  // Protocol concentration risk
  const topProtocolShare = marketData.protocols.length > 0 
    ? (marketData.protocols[0]?.total24h || 0) / marketData.total24h 
    : 0;
    
  if (topProtocolShare > 0.7) {
    risks.push('High protocol concentration - limited alternatives');
  }
  
  // Intent-specific risks
  if (intent === 'lending' && marketData.change_7d < -15) {
    risks.push('Recent market decline may affect lending rates');
  }
  
  if (intent === 'liquidity' && Math.abs(marketData.change_1d) > 5) {
    risks.push('High volatility increases impermanent loss risk');
  }
  
  return risks;
}

export function generateOptimizationTips(
  priority: string,
  marketData: DexOverviewResponse
): string[] {
  const tips: string[] = [];
  
  switch(priority) {
    case 'best_rate':
      tips.push('Compare rates across multiple DEXs before executing');
      tips.push('Consider splitting large orders to minimize slippage');
      if (marketData.total24h > 1000000) {
        tips.push('High volume day - good for large trades');
      }
      break;
      
    case 'lowest_gas':
      tips.push('Use native Sui protocols for lowest gas costs');
      tips.push('Batch multiple operations when possible');
      tips.push('Execute during low network congestion');
      break;
      
    case 'fastest_execution':
      tips.push('Use established protocols with proven uptime');
      tips.push('Avoid complex multi-hop routes');
      tips.push('Set higher gas limits for priority execution');
      break;
      
    case 'highest_liquidity':
      tips.push('Focus on major trading pairs (SUI/USDC, SUI/USDT)');
      tips.push('Use order book DEXs for large trades');
      if (marketData.protocols.length > 3) {
        tips.push('Multiple liquid protocols available - good market depth');
      }
      break;
      
    default: // balanced
      tips.push('Consider trade-offs between gas cost and execution quality');
      tips.push('Start with smaller test transactions');
      tips.push('Monitor slippage and adjust strategy accordingly');
  }
  
  return tips;
}
