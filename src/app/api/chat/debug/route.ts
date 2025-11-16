import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, UIMessage } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    console.log('DEBUG: Received messages:', JSON.stringify(messages, null, 2));
    console.log('DEBUG: OpenAI Model:', process.env.OPENAI_MODEL || 'gpt-4o-mini');
    console.log('DEBUG: OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);

    const result = streamText({
      model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
      messages: convertToModelMessages(messages),
      system: 'You are a helpful assistant. Always respond with a friendly greeting.',
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('DEBUG: Error in chat API:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}