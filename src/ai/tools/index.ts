/**
 * AI Tools Registry
 * All tools available to the AI for generating and managing IGS Intents
 */

import { ToolSet } from "ai";
import { submitIntentTool } from "./server-tools";

// IGS Intent Tools
import {
  getSupportedTokensTool,
  getUserBalanceTool,
  createSwapIntentTool,
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

/**
 * Complete toolset for AI-powered IGS Intent generation
 *
 * Tool Categories:
 * 1. Token & Balance: getSupportedTokensTool, getUserBalanceTool
 * 2. Intent Creation: createSwapIntentTool, buildSmartIGSIntentTool (RECOMMENDED)
 * 3. Intent Validation: validateIGSIntentTool, compareIGSIntentsTool
 * 4. Market Data: getMarketPriceTool, getDEXProtocolInfoTool, getMarketOverviewTool
 * 5. Intent Submission: submitIntentTool
 */
export const tools = {
  // === Intent Creation (Primary) ===
  buildSmartIGSIntentTool,        // MAIN TOOL - AI-optimized intent builder
  createSwapIntentTool,            // Simple swap intent

  // === Token & Balance ===
  getSupportedTokensTool,
  getUserBalanceTool,

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
