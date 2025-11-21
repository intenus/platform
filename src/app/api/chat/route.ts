import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, UIMessage } from "ai";
import { SYSTEM_PROMPT } from "@/ai/context/system-prompt";
import { LLAMA_API_CONTEXT } from "@/ai/context/llama-context";

// Market tools
import {
  getMarketPriceTool,
  getDEXProtocolInfoTool,
  getMarketOverviewTool,
} from "@/ai/tools/market/market-tools";

// IGS Intent tools
import {
  buildOptimalIGSIntentTool,
  analyzeOptimalIGSIntentTool,
  compareOptimalIntentsTool,
  getSupportedTokensTool,
  quickOptimalTemplateTool
} from "@/ai/tools/igs-intent/igs-intent-tools";

// Server tools (stub)
import { submitIntentTool } from "@/ai/tools/server-tools";
import { checkWalletConnection, getUserBalancesTool,getBalanceTool } from "@/ai/tools/user/user-tool";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: openai(process.env.OPENAI_MODEL || "gpt-4o-mini"),
      messages: convertToModelMessages(messages),
      system: `${SYSTEM_PROMPT}

---
## API References (for your information)

${LLAMA_API_CONTEXT}
`,
      tools: {
        // Market data tools
        getMarketPriceTool,
        getDEXProtocolInfoTool,
        getMarketOverviewTool,

        // User data
        checkWalletConnection,
        getUserBalancesTool,
        getBalanceTool,


        // Intent building
        buildOptimalIGSIntentTool,
        analyzeOptimalIGSIntentTool,
        compareOptimalIntentsTool,
        getSupportedTokensTool,
        quickOptimalTemplateTool,

        // Server integration (stub)
        submitIntentTool,
      },
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
