// ============================================
// Coins
// ============================================
export interface TokenPrice {
  symbol: string;
  price: number;
  timestamp: number;
  confidence?: number;
}

// ============================================
// Category Enum
// ============================================

export enum Category {
  Services = "Services",
  TreasuryManager = "Treasury Manager",
  DCATools = "DCA Tools",
  BugBounty = "Bug Bounty",
  LiquidityAutomation = "Liquidity Automation",
  VeIncentiveAutomator = "ve-Incentive Automator",
  Ponzi = "Ponzi",
  CharityFundraising = "Charity Fundraising",
  ExoticOptions = "Exotic Options",
  PhysicalTCG = "Physical TCG",
  NftFi = "NftFi",
  TelegramBot = "Telegram Bot",
  Interface = "Interface",
  TradingApp = "Trading App",
  DeveloperTools = "Developer Tools",
  Oracle = "Oracle",
  Wallets = "Wallets",
  SecurityExtension = "Security Extension",
  Domains = "Domains",
  PortfolioTracker = "Portfolio Tracker",
  Meme = "Meme",
  // Common DeFi categories
  Dexs = "Dexs",
  Lending = "Lending",
  Derivatives = "Derivatives",
  Staking = "Staking",
  CDP = "CDP",
  Yield = "Yield",
  Aggregator = "Aggregator",
  CrossChainBridge = "Cross Chain Bridge",
  Unlisted = "Unlisted",
}

// ============================================
// Chains Enum
// ============================================

export enum Chain {
  // Top 20 most popular chains by TVL
  Ethereum = "Ethereum",
  Solana = "Solana",
  BSC = "BSC",
  Bitcoin = "Bitcoin",
  Tron = "Tron",
  Base = "Base",
  Arbitrum = "Arbitrum",
  Plasma = "Plasma",
  HyperliquidL1 = "Hyperliquid L1",
  Avalanche = "Avalanche",
  Polygon = "Polygon",
  Sui = "Sui",
  Aptos = "Aptos",
  Katana = "Katana",
  Cronos = "Cronos",
  Linea = "Linea",
  Vaulta = "Vaulta",
  Mantle = "Mantle",
  Berachain = "Berachain",
  OPMainnet = "OP Mainnet",
}

// Protocol Methodology
export interface ProtocolMethodology {
  UserFees?: string;
  Fees?: string;
  Revenue?: string;
  ProtocolRevenue?: string;
  HoldersRevenue?: string;
  SupplySideRevenue?: string;
  dailyVolume?: string;
}

// Individual Protocol
export interface Protocol {
  total24h: number;
  total48hto24h: number;
  total7d: number;
  total14dto7d: number;
  total60dto30d: number;
  total30d: number;
  total1y: number;
  totalAllTime: number;
  average1y: number;
  monthlyAverage1y: number;
  change_1d: number;
  change_7d: number;
  change_1m: number;
  change_7dover7d: number;
  change_30dover30d: number;
  total7DaysAgo: number;
  total30DaysAgo: number;
  defillamaId: string;
  name: string;
  displayName: string;
  module: string;
  category: string;
  logo: string;
  chains: string[];
  protocolType: string;
  methodologyURL: string;
  methodology: ProtocolMethodology;
  parentProtocol?: string;
  slug: string;
  linkedProtocols?: string[];
  id: string;
}

// Chart Data Entry
export interface ChartDataEntry {
  // Add properties as needed based on actual data structure
  [key: string]: string | number | boolean | null | undefined;
}

// Breakdown Data Entry
export interface BreakdownData {
  // Add properties as needed based on actual data structure
  [key: string]: string | number | boolean | null | undefined;
}

// Main API Response
export interface LlamaChainDataResponse {
  totalDataChart: ChartDataEntry[];
  totalDataChartBreakdown: ChartDataEntry[];
  breakdown24h: BreakdownData | null;
  breakdown30d: BreakdownData | null;
  chain: string;
  allChains: string[];
  total24h: number;
  total48hto24h: number;
  total7d: number;
  total14dto7d: number;
  total60dto30d: number;
  total30d: number;
  total1y: number;
  change_1d: number;
  change_7d: number;
  change_1m: number;
  change_7dover7d: number;
  change_30dover30d: number;
  total7DaysAgo: number;
  total30DaysAgo: number;
  totalAllTime: number;
  protocols: Protocol[];
}

// Summary Stats
export interface ChainStats {
  total24h: number;
  total48hto24h: number;
  total7d: number;
  total14dto7d: number;
  total60dto30d: number;
  total30d: number;
  total1y: number;
  totalAllTime: number;
  change_1d: number;
  change_7d: number;
  change_1m: number;
  change_7dover7d: number;
  change_30dover30d: number;
  total7DaysAgo: number;
  total30DaysAgo: number;
}

// Period Change Metrics
export interface PeriodChanges {
  change_1d: number;
  change_7d: number;
  change_1m: number;
  change_7dover7d: number;
  change_30dover30d: number;
}

// Time Period Totals
export interface TimePeriodTotals {
  total24h: number;
  total48hto24h: number;
  total7d: number;
  total14dto7d: number;
  total60dto30d: number;
  total30d: number;
  total1y: number;
  totalAllTime: number;
  average1y: number;
  monthlyAverage1y: number;
}

// Protocol Info (excluding stats)
export interface ProtocolInfo {
  defillamaId: string;
  name: string;
  displayName: string;
  module: string;
  category: string;
  logo: string;
  chains: string[];
  protocolType: string;
  methodologyURL: string;
  slug: string;
  parentProtocol?: string;
  linkedProtocols?: string[];
  id: string;
}

// ============================================
// DefiLlama /protocols endpoint types
// ============================================

// Chain TVL breakdown
export interface ChainTvls {
  [chainName: string]: number;
}

// Protocol with TVL (from /protocols endpoint)
export interface ProtocolWithTvl {
  id: string;
  name: string;
  symbol: string;
  category: string;
  chains: string[];
  tvl: number;
  chainTvls: ChainTvls;
  change_1d: number;
  change_7d: number;
}

// Response from /protocols endpoint
export type ProtocolsListResponse = ProtocolWithTvl[];

// ============================================
// DEX Overview API types (/overview/dexs/{chain})
// ============================================

// Methodology for DEX protocols
export interface DexMethodology {
  UserFees?: string;
  Fees?: string;
  Revenue?: string;
  ProtocolRevenue?: string;
  HoldersRevenue?: string;
  SupplySideRevenue?: string;
  dailyVolume?: string;
  Volume?: string;
}

// DEX Protocol (simplified for overview endpoint)
export interface DexProtocol {
  total24h: number;
  total48hto24h: number;
  total7d?: number;
  total14dto7d?: number;
  total60dto30d?: number;
  total30d?: number;
  total1y: number;
  totalAllTime: number;
  average1y?: number;
  monthlyAverage1y?: number;
  change_1d?: number;
  change_7d?: number;
  change_1m?: number;
  change_7dover7d?: number;
  change_30dover30d?: number;
  total7DaysAgo?: number;
  total30DaysAgo?: number;
  defillamaId: string;
  name: string;
  displayName: string;
  module: string;
  category: string;
  logo: string;
  chains: string[];
  protocolType: string;
  methodologyURL: string;
  methodology: DexMethodology;
  parentProtocol?: string;
  slug: string;
  linkedProtocols?: string[];
  id: string;
}

// Chart data array - [timestamp, volume] tuples
export type ChartData = Array<[number, number]>;

// DEX Overview Response
export interface DexOverviewResponse {
  totalDataChart: ChartData;
  totalDataChartBreakdown: ChartData;
  breakdown24h: BreakdownData | null;
  breakdown30d: BreakdownData | null;
  chain: string;
  allChains: string[];
  total24h: number;
  total48hto24h: number;
  total7d: number;
  total14dto7d: number;
  total60dto30d: number;
  total30d: number;
  total1y: number;
  change_1d: number;
  change_7d: number;
  change_1m: number;
  change_7dover7d: number;
  change_30dover30d: number;
  total7DaysAgo: number;
  total30DaysAgo: number;
  totalAllTime: number;
  protocols: DexProtocol[];
}
