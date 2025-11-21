/**
 * Minimal Sui Client - Wrapper around @mysten/sui SDK
 * IMPORTANT: Use native SDK methods when possible, avoid reimplementing
 */

import { NETWORK } from '@/utils/constants';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

// Initialize Sui client
const RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl(NETWORK as "mainnet" | "testnet" | "devnet" | "localnet");

export const sui = new SuiClient({ url: RPC_URL });

/**
 * Popular tokens on Sui (focus on swap pairs)
 * Includes both Sui chain addresses and CoinGecko IDs for price fetching
 */
export const POPULAR_TOKENS = {
  SUI: {
    symbol: 'SUI',
    coinType: '0x2::sui::SUI',
    decimals: 9,
    name: 'Sui',
    // For DeFiLlama price API
    coingeckoId: 'sui',
    priceId: 'coingecko:sui', // Primary price source
  },
  WALRUS: {
    symbol: 'WAL',
    coinType: '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL',
    decimals: 9,
    name: 'Walrus',
    coingeckoId: 'walrus-protocol',
    priceId: 'coingecko:walrus-protocol',
  },
  USDC: {
    symbol: 'USDC',
    coinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
    decimals: 6,
    name: 'USD Coin',
    coingeckoId: 'usd-coin',
    priceId: 'coingecko:usd-coin',
    // Alternative: sui:0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC
  },
  USDT: {
    symbol: 'USDT',
    coinType: '0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT',
    decimals: 6,
    name: 'Tether USD',
    coingeckoId: 'tether',
    priceId: 'coingecko:tether',
  },
  WETH: {
    symbol: 'WETH',
    coinType: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
    decimals: 8,
    name: 'Wrapped Ether',
    coingeckoId: 'weth',
    priceId: 'coingecko:weth',
  },
} as const;

export type TokenSymbol = keyof typeof POPULAR_TOKENS;
export type TokenInfo = typeof POPULAR_TOKENS[TokenSymbol];

/**
 * Get token info by symbol
 */
export function getTokenInfo(symbol: string): TokenInfo | undefined {
  return POPULAR_TOKENS[symbol.toUpperCase() as TokenSymbol];
}

/**
 * Get all popular tokens
 */
export function getPopularTokens(): TokenInfo[] {
  return Object.values(POPULAR_TOKENS);
}

/**
 * Get price ID for DeFiLlama API
 * Returns format: "coingecko:{id}" or "sui:{address}"
 */
export function getTokenPriceId(symbol: string): string | undefined {
  const token = getTokenInfo(symbol);
  return token?.priceId;
}
