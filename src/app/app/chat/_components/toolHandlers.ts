/* eslint-disable @typescript-eslint/no-explicit-any */
import { IntenusWalrusClient } from "@intenus/walrus";
import { SuiClient } from "@mysten/sui/client";
import { IGSIntent } from "@intenus/common";
import { WriteBlobFlow } from "@mysten/walrus";
import {
  IntentEncryptionConfig,
  EncryptionResult,
  generatePolicyId,
  DEFAULT_CONFIG,
} from "@intenus/seal";
import { IntentPolicyParams } from "@intenus/client-sdk";
import { Transaction } from "@mysten/sui/transactions";

/**
 * Context provided to all tool handlers
 * Contains all dependencies needed for tool execution
 */
export interface ToolHandlerContext {
  addToolOutput: (output: any) => void;
  suiClient: SuiClient;
  currentAccount: { address: string } | null;
  walrusClient: IntenusWalrusClient;
  registry: {
    submitIntentTransaction: (blobId: string, policy: IntentPolicyParams) => any;
  };
  getPackageId: () => string;
  signAndExecuteTransaction: (params: { transaction: Transaction }) => Promise<{
    digest: string;
  }>;
}

/**
 * Generic tool handler type
 */
export type ToolHandler = (
  toolCall: { toolCallId: string; toolName: string; input: any },
  context: ToolHandlerContext
) => Promise<void>;

/**
 * Strategy pattern for storage flow creation
 * Follows Open/Closed Principle - can extend without modifying existing code
 */
interface StorageStrategy {
  createFlow(
    intent: IGSIntent
  ): Promise<{
    flow: WriteBlobFlow;
    encryption?: EncryptionResult;
  }>;
}

/**
 * Plain storage strategy - stores intent without encryption
 */
class PlainStorageStrategy implements StorageStrategy {
  constructor(private walrusClient: IntenusWalrusClient) {}

  async createFlow(intent: IGSIntent): Promise<{
    flow: WriteBlobFlow;
    encryption?: EncryptionResult;
  }> {
    const flow = await this.walrusClient.intents.storeReturnFlow(intent);
    return { flow };
  }
}

/**
 * Encrypted storage strategy - stores intent with encryption
 */
class EncryptedStorageStrategy implements StorageStrategy {
  constructor(
    private walrusClient: IntenusWalrusClient,
    private getPackageId: () => string
  ) {}

  async createFlow(intent: IGSIntent): Promise<{
    flow: WriteBlobFlow;
    encryption?: EncryptionResult;
  }> {
    // Generate policy ID based on user address and timestamp
    const policyId = generatePolicyId(
      "intent",
      intent.object.user_address,
      intent.object.created_ts
    );

    const config: IntentEncryptionConfig = {
      packageId: this.getPackageId(),
      policyId,
      threshold: DEFAULT_CONFIG.threshold,
      ttlMin: DEFAULT_CONFIG.ttlMin,
    };

    const result =
      await this.walrusClient.encrypted.storeEncryptedIntentReturnFlow(
        intent,
        config
      );

    return {
      flow: result.flow,
      encryption: result.encryption,
    };
  }
}

/**
 * Factory to create storage strategy based on intent preferences
 * Follows Factory Pattern and Strategy Pattern
 */
function createStorageStrategy(
  intent: IGSIntent,
  walrusClient: IntenusWalrusClient,
  getPackageId: () => string
): StorageStrategy {
  const isEncrypted = intent.preferences?.privacy?.encrypt_intent;

  if (isEncrypted) {
    return new EncryptedStorageStrategy(walrusClient, getPackageId);
  }

  return new PlainStorageStrategy(walrusClient);
}

/**
 * Handle wallet connection check
 * Single Responsibility: Only checks wallet connection status
 */
export const checkWalletConnectionHandler: ToolHandler = async (
  toolCall,
  context
) => {
  const { currentAccount, addToolOutput } = context;

  addToolOutput({
    toolCallId: toolCall.toolCallId,
    tool: "checkWalletConnectionTool",
    output: {
      connected: !!currentAccount,
      address: currentAccount?.address || null,
    },
  });
};

/**
 * Handle getting user balances
 * Single Responsibility: Only fetches all balances for a user
 */
export const getUserBalancesHandler: ToolHandler = async (
  toolCall,
  context
) => {
  const { suiClient, addToolOutput } = context;

  const balances = await suiClient.getAllBalances({
    owner: toolCall.input.owner,
  });

  addToolOutput({
    toolCallId: toolCall.toolCallId,
    tool: "getUserBalancesTool",
    output: balances,
  });
};

/**
 * Handle getting specific coin balance
 * Single Responsibility: Only fetches balance for a specific coin type
 */
export const getBalanceHandler: ToolHandler = async (toolCall, context) => {
  const { suiClient, addToolOutput } = context;

  const balance = await suiClient.getBalance({
    owner: toolCall.input.owner,
    coinType: toolCall.input.coinType,
  });

  addToolOutput({
    toolCallId: toolCall.toolCallId,
    tool: "getBalanceTool",
    output: balance,
  });
};

/**
 * Process storage flow - encapsulates common flow processing logic
 * Follows DRY principle by extracting common operations
 */
async function processStorageFlow(
  flow: WriteBlobFlow,
  account: { address: string },
  signAndExecuteTransaction: ToolHandlerContext["signAndExecuteTransaction"]
): Promise<string> {
  // Encode the flow
  await flow.encode();

  // Register storage
  const registerTx = flow.register({
    epochs: 1,
    owner: account.address,
    deletable: true,
  });

  const { digest } = await signAndExecuteTransaction({
    transaction: registerTx,
  });

  // Upload to Walrus
  await flow.upload({ digest });

  // Certify
  const certifyTx = flow.certify();
  await signAndExecuteTransaction({
    transaction: certifyTx,
  });

  // Get blob ID
  const { blobId } = await flow.getBlob();
  return blobId;
}

/**
 * Submit intent to registry
 * Follows DRY principle by extracting intent submission logic
 */
async function submitIntentToRegistry(
  blobId: string,
  intent: IGSIntent,
  registry: ToolHandlerContext["registry"],
  signAndExecuteTransaction: ToolHandlerContext["signAndExecuteTransaction"],
  suiClient: SuiClient
) {
  const intentObject = intent.object;
  const intentPolicy = intentObject.policy;

  // Build policy params with correct types
  const policyParams: IntentPolicyParams = {
    auto_revoke_ms: Number(intentPolicy.auto_revoke_time),
    solver_access_start_ms: Number(intentPolicy.solver_access_window.start_ms),
    solver_access_end_ms: Number(intentPolicy.solver_access_window.end_ms),
    requires_solver_registration:
      intentPolicy.access_condition.requires_solver_registration,
    min_solver_stake: String(intentPolicy.access_condition.min_solver_stake),
    requires_attestation:
      intentPolicy.access_condition.requires_tee_attestation,
    min_solver_reputation_score: (() => {
      const score = intentPolicy.access_condition.min_solver_reputation_score;
      const numScore = typeof score === 'number' ? score : Number(score || 50);
      return Math.max(0, Math.min(10000, Math.floor(numScore))); // Clamp between 0-10000
    })(),
  };
  console.log("Submitting intent with policy params:", policyParams);
  console.log("min_solver_reputation_score type:", typeof policyParams.min_solver_reputation_score);
  console.log("min_solver_reputation_score value:", policyParams.min_solver_reputation_score);
  
  const intentSubmitTx = registry.submitIntentTransaction(blobId, policyParams);

  const { digest: intentDigest } = await signAndExecuteTransaction({
    transaction: intentSubmitTx,
  });

  const result = await suiClient.waitForTransaction({
    digest: intentDigest,
    options: {
      showEffects: true,
      showEvents: true,
      showBalanceChanges: true,
    },
  });

  return result;
}

/**
 * Handle intent submission
 * Single Responsibility: Orchestrates intent submission workflow
 * Uses Strategy Pattern for encryption handling
 * Follows DRY by using helper functions
 */
export const submitIntentHandler: ToolHandler = async (toolCall, context) => {
  const {
    currentAccount,
    addToolOutput,
    walrusClient,
    getPackageId,
    signAndExecuteTransaction,
    registry,
    suiClient,
  } = context;

  // Validation
  if (!currentAccount) {
    addToolOutput({
      toolCallId: toolCall.toolCallId,
      tool: "submitIntentTool",
      output: {
        error: "No wallet connected. Please connect your wallet first.",
      },
    });
    return;
  }

  try {
    const intent: IGSIntent = toolCall.input;

    // Strategy Pattern: Select storage strategy based on intent preferences
    const storageStrategy = createStorageStrategy(
      intent,
      walrusClient,
      getPackageId
    );

    // Create storage flow (encrypted or plain)
    const { flow } = await storageStrategy.createFlow(intent);

    // Process storage flow (common operations)
    const blobId = await processStorageFlow(
      flow,
      currentAccount,
      signAndExecuteTransaction
    );

    // Submit to registry
    const result = await submitIntentToRegistry(
      blobId,
      intent,
      registry,
      signAndExecuteTransaction,
      suiClient
    );

    // Success output
    addToolOutput({
      toolCallId: toolCall.toolCallId,
      tool: "submitIntentTool",
      output: {
        intentSubmitResult: result,
        success: true,
      },
    });
  } catch (error) {
    console.error("Error submitting intent:", error);
    addToolOutput({
      toolCallId: toolCall.toolCallId,
      tool: "submitIntentTool",
      output: {
        error: `Failed to submit intent: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        success: false,
      },
    });
  }
};

/**
 * Registry of all tool handlers
 * Follows Open/Closed Principle - easy to add new handlers
 */
export const toolHandlers: Record<string, ToolHandler> = {
  checkWalletConnectionTool: checkWalletConnectionHandler,
  getUserBalancesTool: getUserBalancesHandler,
  getBalanceTool: getBalanceHandler,
  submitIntentTool: submitIntentHandler,
};

/**
 * Main dispatcher for tool calls
 * Follows Single Responsibility - only routes tool calls to handlers
 */
export async function dispatchToolCall(
  toolCall: { toolCallId: string; toolName: string; input: any; dynamic?: boolean },
  context: ToolHandlerContext
): Promise<void> {
  // Skip dynamic tool calls
  if (toolCall.dynamic) {
    return;
  }

  const handler = toolHandlers[toolCall.toolName];

  if (!handler) {
    console.warn(`No handler found for tool: ${toolCall.toolName}`);
    return;
  }

  await handler(toolCall, context);
}
