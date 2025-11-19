import { ToolSet } from "ai";
import { submitIntentTool } from "./server-tools";
import { buildIGSIntentTool, getUserBalanceTool } from "./igs-intent-tools";
import {
  getMarketOverviewTool,
  getMarketPriceTool,
  getProtocolInfoTool,
} from "./market-tools";

export const tools = {
  submitIntentTool,
  buildIGSIntentTool,
  getMarketPriceTool,
  getUserBalanceTool,
  getProtocolInfoTool,
  getMarketOverviewTool,
} satisfies ToolSet;
