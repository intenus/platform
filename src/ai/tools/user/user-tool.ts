import { tool } from "ai";
import z from "zod";
import { normalizeSuiAddress, isValidSuiAddress } from "@mysten/sui/utils";

export const checkWalletConnectionTool = tool({
  description:
    "Check if the user has connected their wallet and retrieve the wallet address.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    connected: z
      .boolean()
      .describe("Whether the user is connected with a wallet"),
    address: z
      .string()
      .nullable()
      .describe("The user's wallet address, or null if not connected")
  }),
});

/**
 * Check user's token balances
 * Use before creating swap intent to verify user has sufficient funds
 */
export const getUserBalancesTool = tool({
  description: `
    Check user's token balances on Sui blockchain for all supported tokens.
    ALWAYS use this tool before creating a swap intent to:
    - Verify user has sufficient balance for the swap
    - Suggest appropriate swap amounts based on available balance
    - Avoid creating intents that will fail due to insufficient funds

    - Still create intents even if balance is low, but warn the user.
  `,
  inputSchema: z.object({
    owner: z
      .string()
      .describe("User Sui wallet address with length 64")
      .refine((address) => isValidSuiAddress(address), {
        message: "Invalid Sui address format",
      })
  }),
  outputSchema: z.any().describe("The user's balance for the specified token"),
});

export const getBalanceTool = tool({
  description: `
    Check user's token balance for a specific token on Sui blockchain.
    Use this tool to:
    - Verify user has sufficient balance for the swap
    - Suggest appropriate swap amounts based on available balance
    - Avoid creating intents that will fail due to insufficient funds

    - Still create intents even if balance is low, but warn the user.
  `,
  inputSchema: z.object({
    owner: z
      .string()
      .describe("User Sui wallet address with length 64")
      .refine((address) => isValidSuiAddress(address), {
        message: "Invalid Sui address format",
      }),
    coinType: z
      .string()
      .describe(
        "The coin type of the token to check balance for ex: '0x2::sui::SUI'"
      ),
  }),
  outputSchema: z.any().describe("The user's balance for the specified token"),
});
