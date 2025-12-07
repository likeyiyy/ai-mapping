import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// 配置OpenRouter
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    'X-Title': 'AI 对话思维导图',
  }
});

// 支持的模型列表
const MODELS = {
  'google/gemini-2.5-pro': 'Google Gemini 2.5 Pro',
  'google/gemini-2.5-flash': 'Google Gemini 2.5 Flash',
  'google/gemini-3-pro-preview': 'Google Gemini 3 Pro Preview',
  'deepseek/deepseek-v3.2': 'DeepSeek V3.2',
  'anthropic/claude-sonnet-4.5': 'Claude Sonnet 4.5',
};

export async function POST(req: Request) {
  const { messages, model = 'google/gemini-2.5-pro' } = await req.json();

  const result = streamText({
    model: openrouter(model),
    messages,
    temperature: 0.7,
    maxTokens: 2000,
  });

  return result.toDataStreamResponse();
}