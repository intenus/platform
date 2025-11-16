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
 */
export const POPULAR_TOKENS = {
  SUI: {
    symbol: 'SUI',
    coinType: '0x2::sui::SUI',
    decimals: 9,
    name: 'Sui',
  },
  USDC: {
    symbol: 'USDC',
    coinType: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
    decimals: 6,
    name: 'USD Coin',
  },
  USDT: {
    symbol: 'USDT',
    coinType: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
    decimals: 6,
    name: 'Tether USD',
  },
  WETH: {
    symbol: 'WETH',
    coinType: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
    decimals: 8,
    name: 'Wrapped Ether',
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
