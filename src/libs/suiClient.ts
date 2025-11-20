/**
 * Minimal Sui Client - Wrapper around @mysten/sui SDK
 * IMPORTANT: Use native SDK methods when possible, avoid reimplementing
 */

import { SuiClient } from '@mysten/sui/client';
import { normalizeSuiAddress, isValidSuiAddress } from '@mysten/sui/utils';

// Initialize Sui client
const RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443';

export const sui = new SuiClient({ url: RPC_URL });

// Re-export utils from SDK
export { normalizeSuiAddress, isValidSuiAddress };

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
    symbol: 'WALRUS',
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

/**
 * Parse token amount to smallest unit
 */
export function parseTokenAmount(amount: string, decimals: number): string {
  const value = parseFloat(amount);
  if (isNaN(value) || value < 0) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  return BigInt(Math.floor(value * Math.pow(10, decimals))).toString();
}

/**
 * Format token amount from smallest unit
 */
export function formatTokenAmount(amount: string | bigint, decimals: number): string {
  const value = typeof amount === 'string' ? BigInt(amount) : amount;
  const divisor = BigInt(Math.pow(10, decimals));
  const whole = value / divisor;
  const fraction = value % divisor;

  if (fraction === BigInt(0)) {
    return whole.toString();
  }

  const fractionStr = fraction.toString().padStart(decimals, '0');
  return `${whole}.${fractionStr}`.replace(/\.?0+$/, '');
}

/**
 * Get user balance for a specific coin type
 */
export async function getBalance(address: string, coinType: string): Promise<{
  balance: string;
  balanceFormatted: string;
  coinType: string;
}> {
  if (!isValidSuiAddress(address)) {
    throw new Error('Invalid Sui address');
  }

  const normalized = normalizeSuiAddress(address);
  const balance = await sui.getBalance({
    owner: normalized,
    coinType,
  });

  const token = Object.values(POPULAR_TOKENS).find(t => t.coinType === coinType);
  const decimals = token?.decimals || 9;

  return {
    balance: balance.totalBalance,
    balanceFormatted: formatTokenAmount(balance.totalBalance, decimals),
    coinType,
  };
}

/**
 * Get all balances for user (only popular tokens)
 */
export async function getAllBalances(address: string): Promise<Array<{
  symbol: string;
  balance: string;
  balanceFormatted: string;
  coinType: string;
  decimals: number;
}>> {
  if (!isValidSuiAddress(address)) {
    throw new Error('Invalid Sui address');
  }

  const normalized = normalizeSuiAddress(address);
  const tokens = getPopularTokens();

  const balances = await Promise.all(
    tokens.map(async (token) => {
      try {
        const balance = await sui.getBalance({
          owner: normalized,
          coinType: token.coinType,
        });

        return {
          symbol: token.symbol,
          balance: balance.totalBalance,
          balanceFormatted: formatTokenAmount(balance.totalBalance, token.decimals),
          coinType: token.coinType,
          decimals: token.decimals,
        };
      } catch (error) {
        // Return 0 balance on error
        return {
          symbol: token.symbol,
          balance: '0',
          balanceFormatted: '0',
          coinType: token.coinType,
          decimals: token.decimals,
        };
      }
    })
  );

  return balances.filter(b => parseFloat(b.balanceFormatted) > 0);
}

/**
 * Check if user has sufficient balance
 */
export async function hasSufficientBalance(
  address: string,
  coinType: string,
  requiredAmount: string
): Promise<boolean> {
  const { balance } = await getBalance(address, coinType);
  return BigInt(balance) >= BigInt(requiredAmount);
}
