/**
 * AI Tools Registry
 * All tools available to the AI for generating and managing IGS Intents
 */

import { ToolSet } from "ai";
import { submitIntentTool } from "./server-tools";

// IGS Intent Tools
import {
  getSupportedTokensTool,
  buildSmartIGSIntentTool,
  validateIGSIntentTool,
  compareIGSIntentsTool,
} from "./igs-intent/igs-intent-tools";

// Market Data Tools
import {
  getMarketOverviewTool,
  getMarketPriceTool,
  getDEXProtocolInfoTool,
} from "./market/market-tools";
import {
    checkWalletConnection,
    getBalanceTool,
    getUserBalancesTool,
} from "./user/user-tool";

/**
 * Complete toolset for AI-powered IGS Intent generation
 *
 * Tool Categories:
 * 1. User: checkWalletConnection, getUserBalanceTool
 * 2. Intent Creation: buildSmartIGSIntentTool (RECOMMENDED)
 * 3. Token: getSupportedTokensTool
 * 4. Validation & Analysis: validateIGSIntentTool, compareIGSIntentsTool
 * 5. Market Data: getMarketPriceTool, getDEXProtocolInfoTool, getMarketOverviewTool
 * 6. Intent Submission: submitIntentTool
 */
export const tools = {
  // === User ===
  checkWalletConnection,
  getUserBalancesTool,
  getBalanceTool,

  // === Intent Creation (Primary) ===
  buildSmartIGSIntentTool,

  // === Token ===
  getSupportedTokensTool,
  

  // === Validation & Analysis ===
  validateIGSIntentTool,
  compareIGSIntentsTool,

  // === Market Data ===
  getMarketPriceTool,
  getDEXProtocolInfoTool,
  getMarketOverviewTool,

  // === Intent Submission ===
  submitIntentTool,
} satisfies ToolSet;
