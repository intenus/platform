/**
 * Chat API Route - Intenus Protocol IGS Intent Chatbot
 * Uses AI SDK streamText with OpenAI
 */

import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { SYSTEM_PROMPT } from '@/ai/context/system-prompt';
import { LLAMA_API_CONTEXT } from '@/ai/context/llama-context';

// Market tools
import { getMarketPriceTool, getProtocolInfoTool, getMarketOverviewTool } from '@/ai/tools/market-tools';

// IGS Intent tools
import {
  getUserBalanceTool,
  createSwapIntentTool,
  buildIGSIntentTool,
  getSupportedTokensTool
} from '@/ai/tools/igs-intent-tools';

// Server tools (stub)
import { submitIntentTool } from '@/ai/tools/server-tools';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
      messages: convertToModelMessages(messages),
      system: `${SYSTEM_PROMPT}

---
## API References (for your information)

${LLAMA_API_CONTEXT}
`,
      tools: {
        // Market data tools
        getMarketPrice: getMarketPriceTool,
        getProtocolInfo: getProtocolInfoTool,
        getMarketOverview: getMarketOverviewTool,

        // User data
        getUserBalance: getUserBalanceTool,
        getSupportedTokens: getSupportedTokensTool,

        // Intent building (simplified → complete flow)
        createSwapIntent: createSwapIntentTool, // Simplified, user-friendly
        buildIGSIntent: buildIGSIntentTool,     // Advanced, complete validation

        // Server integration (stub)
        submitIntent: submitIntentTool,
      },
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
