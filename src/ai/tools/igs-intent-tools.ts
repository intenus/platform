/**
 * General IGS Intent Tools
 * These tools help build ANY type of IGS Intent using Intenus Protocol standard
 */

import { tool } from 'ai';
import { z } from 'zod';
import { IGSIntentSchema, IntentBuilder } from '@intenus/common';
import { getTokenInfo, parseTokenAmount, getAllBalances, isValidSuiAddress, normalizeSuiAddress } from '@/libs/suiClient';

/**
 * Get user's token balances on Sui blockchain
 */
export const getUserBalanceTool = tool({
  description: 'Check user token balances on Sui blockchain for any supported token (SUI, USDC, USDT, WETH, WALRUS)',
  inputSchema: z.object({
    user_address: z.string().describe('User Sui wallet address (0x... format)'),
  }),
  execute: async ({ user_address }) => {

    try {
      if (!isValidSuiAddress(user_address)) {
        return {
          success: false,
          error: 'Invalid Sui address format. Must be 0x followed by hex characters.',
        };
      }

      const normalized = normalizeSuiAddress(user_address);
      const balances = await getAllBalances(normalized);

      return {
        success: true,
        address: normalized,
        balances: balances.map(b => ({
          symbol: b.symbol,
          balance: b.balanceFormatted,
          decimals: b.decimals,
          coinType: b.coinType,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balance',
      };
    }
  },
});

/**
 * Build a general IGS Intent
 * This tool constructs IGS Intents for any operation type using IntentBuilder from @intenus/common
 */
export const buildIGSIntentTool = tool({
  description: 'Build IGS (Intenus General Standard) Intent from user requirements. Works for swaps, limit orders, and more. Uses IntentBuilder from @intenus/common to ensure IGS v1.0 compliance.',
  inputSchema: IGSIntentSchema,
  execute: async (params) => {
    const {
      user_address,
      intent_type,
      object,
      ...rest
    } = params;

    try {
      // Validate address
      if (!isValidSuiAddress(user_address)) {
        return {
          success: false,
          error: 'Invalid Sui address format',
        };
      }

      const normalized = normalizeSuiAddress(user_address);
      const builder = new IntentBuilder(params);

      const intent = builder.build();
      
      return {
        success: true,
        intent,
        summary: {
          type: intent_type,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build IGS Intent',
      };
    }
  },
});
