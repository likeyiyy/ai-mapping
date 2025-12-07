import OpenAI from 'openai';

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'AI Mind Map',
  }
});

export async function callOpenRouterAPI(
  messages: OpenRouterMessage[],
  model: string,
  stream: boolean = false
): Promise<string | ReadableStream<Uint8Array>> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key is not configured');
  }

  try {
    const completion = await openrouter.chat.completions.create({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 8000,
      stream: stream,
    });

    if (stream) {
      // Convert the stream to match the expected format
      const encoder = new TextEncoder();

      const readable = new ReadableStream({
        async start(controller) {
          try {
            // Type the completion as a stream
            const streamCompletion = completion as any;
            for await (const chunk of streamCompletion) {
              // Transform the chunk to match the expected SSE format
              const data = {
                choices: [{
                  delta: {
                    content: chunk.choices[0]?.delta?.content || ''
                  }
                }]
              };
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } catch (error) {
            controller.error(error);
          } finally {
            controller.close();
          }
        }
      });

      return readable;
    } else {
      // Non-streaming response
      const response = completion as any;
      return response.choices[0]?.message?.content || 'No response received';
    }
  } catch (error: any) {
    throw new Error(`OpenRouter API error: ${error.message || error}`);
  }
}

// Helper function to prepare messages for OpenRouter
export function prepareMessages(userMessage: string, conversationHistory?: OpenRouterMessage[]): OpenRouterMessage[] {
  const systemPrompt: OpenRouterMessage = {
    role: 'system',
    content: `你是一个有用的AI助手`
  };

  const messages: OpenRouterMessage[] = [systemPrompt];

  if (conversationHistory && conversationHistory.length > 0) {
    messages.push(...conversationHistory);
  }

  messages.push({
    role: 'user',
    content: userMessage
  });

  return messages;
}