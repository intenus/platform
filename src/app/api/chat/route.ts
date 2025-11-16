/**
 * Chat API Route - Swap Intent Chatbot
 * Uses AI SDK streamText with OpenAI
 */

import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages } from 'ai';
import { SYSTEM_PROMPT } from '@/lib/context/system-prompt';
import { LLAMA_API_CONTEXT } from '@/lib/context/llama-context';
import { COINGECKO_API_CONTEXT } from '@/lib/context/coingecko-context';

// Market tools
import { getMarketPriceTool, getProtocolInfoTool, getMarketOverviewTool } from '@/lib/tools/market-tools';

// Swap tools
import { getUserBalanceTool, validateSwapParamsTool, buildSwapIntentTool, buildLimitIntentTool } from '@/lib/tools/swap-tools';

// Server tools (stub)
import { submitIntentTool } from '@/lib/tools/server-tools';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Convert UIMessage[] to ModelMessage[]
  const modelMessages = convertToModelMessages(messages);

  // Combine system prompt with API context
  const systemPrompt = `${SYSTEM_PROMPT}

---
## API References (for your information)

${LLAMA_API_CONTEXT}

${COINGECKO_API_CONTEXT}
`;

  const result = streamText({
    model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
    messages: modelMessages,
    system: systemPrompt,
    tools: {
      // Market data tools
      getMarketPrice: getMarketPriceTool,
      getProtocolInfo: getProtocolInfoTool,
      getMarketOverview: getMarketOverviewTool,

      // User balance
      getUserBalance: getUserBalanceTool,

      // Swap validation and building
      validateSwapParams: validateSwapParamsTool,
      buildSwapIntent: buildSwapIntentTool,
      buildLimitIntent: buildLimitIntentTool,

      // Server integration (stub)
      submitIntent: submitIntentTool,
    },
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}
