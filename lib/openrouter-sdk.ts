import { OpenRouter } from '@openrouter/sdk';

// Initialize OpenRouter client
const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

// Send chat message with optional streaming
export async function sendChatMessage(
  messages: Array<{ role: string; content: string }>,
  model: string,
  stream: boolean = false,
  onChunk?: (chunk: string) => void
): Promise<string> {
  try {
    const stream = await openrouter.chat.send({
      model: model,
      messages: messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 8000,
    });

    if (!stream) {
      throw new Error('Failed to create stream');
    }

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        // Call callback for streaming updates
        if (onChunk) {
          onChunk(content);
        }
      }
    }

    return fullResponse;
  } catch (error) {
    console.error('OpenRouter SDK error:', error);
    throw error;
  }
}

// Prepare messages for OpenRouter
export function prepareMessages(userMessage: string, conversationHistory?: Array<{ role: string; content: string }>): Array<{ role: string; content: string }> {
  const systemPrompt = {
    role: 'system',
    content: `你是一个有用的AI助手`,
  };

  const messages: Array<{ role: string; content: string }> = [systemPrompt];

  if (conversationHistory && conversationHistory.length > 0) {
    messages.push(...conversationHistory);
  }

  messages.push({
    role: 'user',
    content: userMessage
  });

  return messages;
}