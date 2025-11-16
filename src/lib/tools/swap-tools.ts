/**
 * Swap Intent Tools for LLM
 * Validate parameters and build IGS Intents using @intenus/common
 */

import { IntentBuilder } from '@intenus/common';
import { getTokenInfo, parseTokenAmount, getAllBalances, isValidSuiAddress, normalizeSuiAddress } from '@/libs/suiClient';
import { llama } from '@/libs/llamaClient';

/**
 * Get user balance
 */
export const getUserBalanceTool = {
  description: 'Check user token balances on Sui',
  parameters: {
    type: 'object' as const,
    properties: {
      user_address: {
        type: 'string' as const,
        description: 'User Sui wallet address',
      },
    },
    required: ['user_address'],
  },
  execute: async ({ user_address }: { user_address: string }) => {
    try {
      if (!isValidSuiAddress(user_address)) {
        return {
          success: false,
          error: 'Invalid Sui address format',
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
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balance',
      };
    }
  },
};

/**
 * Validate swap parameters before building intent
 */
export const validateSwapParamsTool = {
  description: 'Validate swap parameters including tokens, amounts, and user balance',
  parameters: {
    type: 'object' as const,
    properties: {
      user_address: {
        type: 'string' as const,
        description: 'User wallet address',
      },
      input_token: {
        type: 'string' as const,
        description: 'Input token symbol (e.g. SUI)',
      },
      input_amount: {
        type: 'string' as const,
        description: 'Input amount (human-readable, e.g. "100")',
      },
      output_token: {
        type: 'string' as const,
        description: 'Output token symbol (e.g. USDC)',
      },
      slippage_bps: {
        type: 'number' as const,
        description: 'Slippage tolerance in basis points (default 50 = 0.5%)',
        default: 50,
      },
    },
    required: ['user_address', 'input_token', 'input_amount', 'output_token'],
  },
  execute: async ({ user_address, input_token, input_amount, output_token, slippage_bps = 50 }: {
    user_address: string;
    input_token: string;
    input_amount: string;
    output_token: string;
    slippage_bps?: number;
  }) => {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate address
      if (!isValidSuiAddress(user_address)) {
        errors.push('Invalid Sui address format');
        return { valid: false, errors, warnings };
      }

      // Validate tokens
      const inputTokenInfo = getTokenInfo(input_token);
      const outputTokenInfo = getTokenInfo(output_token);

      if (!inputTokenInfo) {
        errors.push(`Input token ${input_token} not supported. Supported: SUI, USDC, USDT, WETH`);
      }
      if (!outputTokenInfo) {
        errors.push(`Output token ${output_token} not supported. Supported: SUI, USDC, USDT, WETH`);
      }

      if (input_token.toUpperCase() === output_token.toUpperCase()) {
        errors.push('Input and output tokens must be different');
      }

      // Validate amount
      const amount = parseFloat(input_amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push('Input amount must be a positive number');
      }

      if (errors.length > 0) {
        return { valid: false, errors, warnings };
      }

      // Check user balance
      const normalized = normalizeSuiAddress(user_address);
      const balances = await getAllBalances(normalized);
      const userBalance = balances.find(b => b.symbol.toUpperCase() === input_token.toUpperCase());

      if (!userBalance || parseFloat(userBalance.balanceFormatted) < amount) {
        errors.push(
          `Insufficient balance. Required: ${input_amount} ${input_token}, Available: ${userBalance?.balanceFormatted || '0'} ${input_token}`
        );
      }

      // Get estimated output
      const prices = await llama.getTokenPrices(['sui', 'usd-coin', 'tether']);
      const inputPrice = prices['sui']?.price || 1;
      const outputPrice = 1; // Assuming stable
      const estimatedOutput = (amount * inputPrice) / outputPrice;
      const minOutput = estimatedOutput * (1 - slippage_bps / 10000);

      // Warnings
      if (slippage_bps > 100) {
        warnings.push(`Slippage tolerance is high (${slippage_bps / 100}%)`);
      }

      if (amount * inputPrice < 1) {
        warnings.push('Trade value is very small (<$1 USD)');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        token_info: {
          input: inputTokenInfo,
          output: outputTokenInfo,
        },
        estimated_output: estimatedOutput.toFixed(outputTokenInfo?.decimals || 6),
        min_output: minOutput.toFixed(outputTokenInfo?.decimals || 6),
        price_impact: '~0.1%', // Placeholder
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
        warnings: [],
      };
    }
  },
};

/**
 * Build spot swap intent using IntentBuilder
 */
export const buildSwapIntentTool = {
  description: 'Generate IGS Intent for spot swap (exact input)',
  parameters: {
    type: 'object' as const,
    properties: {
      user_address: {
        type: 'string' as const,
        description: 'User wallet address',
      },
      input_token: {
        type: 'string' as const,
        description: 'Input token symbol',
      },
      input_amount: {
        type: 'string' as const,
        description: 'Input amount',
      },
      output_token: {
        type: 'string' as const,
        description: 'Output token symbol',
      },
      slippage_bps: {
        type: 'number' as const,
        description: 'Slippage in basis points',
        default: 50,
      },
      deadline_minutes: {
        type: 'number' as const,
        description: 'Deadline in minutes',
        default: 5,
      },
    },
    required: ['user_address', 'input_token', 'input_amount', 'output_token'],
  },
  execute: async ({ user_address, input_token, input_amount, output_token, slippage_bps = 50, deadline_minutes = 5 }: {
    user_address: string;
    input_token: string;
    input_amount: string;
    output_token: string;
    slippage_bps?: number;
    deadline_minutes?: number;
  }) => {
    try {
      // Validate address
      if (!isValidSuiAddress(user_address)) {
        throw new Error('Invalid Sui address');
      }

      const normalized = normalizeSuiAddress(user_address);

      // Get token info
      const inputTokenInfo = getTokenInfo(input_token);
      const outputTokenInfo = getTokenInfo(output_token);

      if (!inputTokenInfo || !outputTokenInfo) {
        throw new Error('Token not found');
      }

      // Parse amount
      const amountInSmallestUnit = parseTokenAmount(input_amount, inputTokenInfo.decimals);

      // Build intent using IntentBuilder from @intenus/common
      const intent = new IntentBuilder(normalized)
        .swap(inputTokenInfo.coinType, amountInSmallestUnit, outputTokenInfo.coinType)
        .withSlippage(slippage_bps)
        .withDeadline(deadline_minutes * 60 * 1000) // Convert to ms
        .withOptimization('balanced')
        .build();

      return {
        success: true,
        intent,
        summary: {
          type: 'swap.exact_input',
          from: `${input_amount} ${input_token}`,
          to: output_token,
          slippage: `${slippage_bps / 100}%`,
          deadline: `${deadline_minutes} minutes`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build intent',
      };
    }
  },
};

/**
 * Build limit order intent
 */
export const buildLimitIntentTool = {
  description: 'Generate IGS Intent for limit order (buy/sell at specific price)',
  parameters: {
    type: 'object' as const,
    properties: {
      user_address: {
        type: 'string' as const,
        description: 'User wallet address',
      },
      order_type: {
        type: 'string' as const,
        enum: ['sell', 'buy'],
        description: 'Order type: sell or buy',
      },
      input_token: {
        type: 'string' as const,
        description: 'Token to sell',
      },
      input_amount: {
        type: 'string' as const,
        description: 'Amount to sell',
      },
      output_token: {
        type: 'string' as const,
        description: 'Token to receive',
      },
      limit_price: {
        type: 'string' as const,
        description: 'Limit price (output per input)',
      },
    },
    required: ['user_address', 'order_type', 'input_token', 'input_amount', 'output_token', 'limit_price'],
  },
  execute: async ({ user_address, order_type, input_token, input_amount, output_token, limit_price }: {
    user_address: string;
    order_type: 'sell' | 'buy';
    input_token: string;
    input_amount: string;
    output_token: string;
    limit_price: string;
  }) => {
    try {
      if (!isValidSuiAddress(user_address)) {
        throw new Error('Invalid Sui address');
      }

      const normalized = normalizeSuiAddress(user_address);

      const inputTokenInfo = getTokenInfo(input_token);
      const outputTokenInfo = getTokenInfo(output_token);

      if (!inputTokenInfo || !outputTokenInfo) {
        throw new Error('Token not found');
      }

      const amountInSmallestUnit = parseTokenAmount(input_amount, inputTokenInfo.decimals);

      // Build limit order intent
      const intent = new IntentBuilder(normalized)
        .limitOrder(
          order_type,
          inputTokenInfo.coinType,
          amountInSmallestUnit,
          outputTokenInfo.coinType,
          limit_price
        )
        .withOptimization('balanced')
        .build();

      return {
        success: true,
        intent,
        summary: {
          type: `limit.${order_type}`,
          from: `${input_amount} ${input_token}`,
          to: output_token,
          limit_price: `${limit_price} ${output_token}/${input_token}`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build limit intent',
      };
    }
  },
};
