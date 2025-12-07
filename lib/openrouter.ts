interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callOpenRouterAPI(
  messages: OpenRouterMessage[],
  model: string,
  stream: boolean = false
): Promise<string | ReadableStream> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured');
  }

  const requestBody = {
    model: model,
    messages: messages,
    temperature: 0.7,
    max_tokens: 4000,
    stream: stream,
  };

  if (stream) {
    // Handle streaming response
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json; charset=utf-8',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'AI Mind Map',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`OpenRouter API error: ${response.status} - ${error.error?.message || error.error}`);
    }

    // Return the response body as a stream
    return response.body!;
  } else {
    // Non-streaming response
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json; charset=utf-8',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'AI Mind Map',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`OpenRouter API error: ${response.status} - ${error.error?.message || error.error}`);
    }

    const data: OpenRouterResponse = await response.json();
    return data.choices[0]?.message?.content || 'No response received';
  }
}

// Helper function to prepare messages for OpenRouter
export function prepareMessages(userMessage: string, conversationHistory?: OpenRouterMessage[]): OpenRouterMessage[] {
  const systemPrompt: OpenRouterMessage = {
    role: 'system',
    content: `你是一个智能助手，专门帮助用户通过思维导图的形式探索和理解复杂的概念。
请用中文回答，并且：
1. 提供清晰、结构化的回答
2. 使用适当的格式（如列表、标题、加粗等）来增强可读性
3. 保持回答准确且有价值
4. 回复要简洁明了，适合在思维导图中展示`
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