/**
 * Sui Blockchain Client
 * Handles wallet connections, token data, and balance queries
 */

import { SuiClient as MyStenSuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { isValidSuiAddress, normalizeStructTag, normalizeSuiAddress } from '@mysten/sui/utils';

// Common Sui token addresses
export const SUI_TOKENS = {
  SUI: '0x2::sui::SUI',
  USDC: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
  USDT: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
  WETH: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
  CETUS: '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
  SCA: '0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA',
} as const;

interface TokenInfo {
  symbol: string;
  coinType: string;
  decimals: number;
  name?: string;
}

interface UserBalance {
  symbol: string;
  coinType: string;
  balance: string; // raw balance in base units
  balanceFormatted: string;
  decimals: number;
  valueUsd?: number;
}

class SuiClientWrapper {
  private client: MyStenSuiClient;
  private network: 'mainnet' | 'testnet' | 'devnet';

  constructor(network: 'mainnet' | 'testnet' | 'devnet' = 'mainnet') {
    this.network = network;
    this.client = new MyStenSuiClient({ url: getFullnodeUrl(network) });
  }

  /**
   * Get Sui client instance
   */
  getClient(): MyStenSuiClient {
    return this.client;
  }

  /**
   * Validate Sui address format
   */
  isValidSuiAddress(address: string): boolean {
    return isValidSuiAddress(address);
  }

  /**
   * Normalize Sui address to standard format
   */
  normalizeSuiAddress(address: string): string {
    return normalizeSuiAddress(address);
  }

  /**
   * Get popular token list on Sui
   */
  async getPopularTokens(): Promise<TokenInfo[]> {
    return [
      {
        symbol: 'SUI',
        coinType: SUI_TOKENS.SUI,
        decimals: 9,
        name: 'Sui'
      },
      {
        symbol: 'USDC',
        coinType: SUI_TOKENS.USDC,
        decimals: 6,
        name: 'USD Coin'
      },
      {
        symbol: 'USDT',
        coinType: SUI_TOKENS.USDT,
        decimals: 6,
        name: 'Tether USD'
      },
      {
        symbol: 'WETH',
        coinType: SUI_TOKENS.WETH,
        decimals: 8,
        name: 'Wrapped Ether'
      },
      {
        symbol: 'CETUS',
        coinType: SUI_TOKENS.CETUS,
        decimals: 9,
        name: 'Cetus Protocol'
      },
      {
        symbol: 'SCA',
        coinType: SUI_TOKENS.SCA,
        decimals: 9,
        name: 'Scallop'
      }
    ];
  }

  /**
   * Get token info by coin type or symbol
   */
  async getTokenInfo(coinTypeOrSymbol: string): Promise<TokenInfo> {
    const popularTokens = await this.getPopularTokens();

    // Check if it's a symbol
    const bySymbol = popularTokens.find(
      t => t.symbol.toLowerCase() === coinTypeOrSymbol.toLowerCase()
    );
    if (bySymbol) return bySymbol;

    // Check if it's a coin type
    const byCoinType = popularTokens.find(
      t => t.coinType.toLowerCase() === coinTypeOrSymbol.toLowerCase()
    );
    if (byCoinType) return byCoinType;

    // Default to unknown token
    return {
      symbol: 'UNKNOWN',
      coinType: coinTypeOrSymbol,
      decimals: 9,
      name: 'Unknown Token'
    };
  }

  /**
   * Get user's token balances
   */
  async getUserBalances(address: string): Promise<UserBalance[]> {
    try {
      const normalizedAddress = this.normalizeSuiAddress(address);
      const balances = await this.client.getAllBalances({ owner: normalizedAddress });
      const popularTokens = await this.getPopularTokens();

      const results: UserBalance[] = [];

      for (const balance of balances) {
        const tokenInfo = popularTokens.find(t => t.coinType === balance.coinType) || {
          symbol: 'UNKNOWN',
          coinType: balance.coinType,
          decimals: 9
        };

        results.push({
          symbol: tokenInfo.symbol,
          coinType: balance.coinType,
          balance: balance.totalBalance,
          balanceFormatted: this.formatTokenAmount(balance.totalBalance, tokenInfo.decimals),
          decimals: tokenInfo.decimals
        });
      }

      return results;
    } catch (error) {
      console.error('Error fetching user balances:', error);
      throw new Error(`Failed to fetch balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if user has sufficient balance
   */
  async checkSufficientBalance(
    address: string,
    coinType: string,
    requiredAmount: string
  ): Promise<{ sufficient: boolean; available: string }> {
    try {
      const normalizedAddress = this.normalizeSuiAddress(address);
      const balance = await this.client.getBalance({
        owner: normalizedAddress,
        coinType
      });

      const available = BigInt(balance.totalBalance);
      const required = BigInt(requiredAmount);

      return {
        sufficient: available >= required,
        available: balance.totalBalance
      };
    } catch (error) {
      console.error('Error checking balance:', error);
      return {
        sufficient: false,
        available: '0'
      };
    }
  }

  /**
   * Format token amount from base units to human-readable
   */
  formatTokenAmount(amount: string, decimals: number): string {
    const value = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const integerPart = value / divisor;
    const fractionalPart = value % divisor;

    if (fractionalPart === 0n) {
      return integerPart.toString();
    }

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmed = fractionalStr.replace(/0+$/, '');

    return `${integerPart}.${trimmed}`;
  }

  /**
   * Parse token amount from human-readable to base units
   */
  parseTokenAmount(amount: string, decimals: number): string {
    const [integerPart, fractionalPart = ''] = amount.split('.');
    const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
    const fullAmount = integerPart + paddedFractional;
    return BigInt(fullAmount).toString();
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    try {
      const gasPrice = await this.client.getReferenceGasPrice();
      return gasPrice.toString();
    } catch (error) {
      console.error('Error fetching gas price:', error);
      return '1000'; // Default gas price
    }
  }

  /**
   * Get network info
   */
  getNetwork(): string {
    return this.network;
  }
}

// Export singleton instance
export const suiClient = new SuiClientWrapper('mainnet');

// Export types
export type { TokenInfo, UserBalance };
