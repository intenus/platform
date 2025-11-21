/**
 * AI Tools Registry
 * All tools available to the AI for generating and managing IGS Intents
 */

import { ToolSet } from "ai";
import { submitIntentTool } from "./server-tools";

// IGS Intent Tools
import {
  getSupportedTokensTool,
  analyzeOptimalIGSIntentTool,
  buildOptimalIGSIntentTool,
  compareOptimalIntentsTool,
  quickOptimalTemplateTool
} from "./igs-intent/igs-intent-tools";

// Market Data Tools
import {
  getMarketOverviewTool,
  getMarketPriceTool,
  getDEXProtocolInfoTool,
} from "./market/market-tools";
import {
    checkWalletConnectionTool,
    getBalanceTool,
    getUserBalancesTool,
} from "./user/user-tool";

/**
 * Complete toolset for AI-powered IGS Intent generation
 *
 * Tool Categories:
 * 1. User: checkWalletConnection, getUserBalancesTool, getBalanceTool
 * 2. Intent Creation: buildOptimalIGSIntentTool, analyzeOptimalIGSIntentTool, compareOptimalIntentsTool, quickOptimalTemplateTool
 * 3. Token: getSupportedTokensTool
 * 4. Market Data: getMarketPriceTool, getDEXProtocolInfoTool, getMarketOverviewTool
 * 5. Intent Submission: submitIntentTool
 */
export const tools = {
  // === User ===
  checkWalletConnectionTool,
  getUserBalancesTool,
  getBalanceTool,

  // === Intent Creation (Primary) ===
  buildOptimalIGSIntentTool,
  analyzeOptimalIGSIntentTool,
  compareOptimalIntentsTool,
  quickOptimalTemplateTool,

  // === Token ===
  getSupportedTokensTool,
  
  // === Market Data ===
  getMarketPriceTool,
  getDEXProtocolInfoTool,
  getMarketOverviewTool,

  // === Intent Submission ===
  submitIntentTool,
} satisfies ToolSet;
