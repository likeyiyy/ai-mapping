import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

// 配置OpenRouter
const openrouter = openai({
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    'X-Title': 'AI 对话思维导图',
  }
});

export async function sendMessage(message: string, model: string) {
  const result = await streamText({
    model: openrouter(model),
    messages: [
      {
        role: 'user',
        content: message,
      },
    ],
    temperature: 0.7,
    maxTokens: 2000,
  });

  return result;
}

export async function sendMessageWithHistory(messages: any[], model: string) {
  const result = await streamText({
    model: openrouter(model),
    messages,
    temperature: 0.7,
    maxTokens: 2000,
  });

  return result;
}