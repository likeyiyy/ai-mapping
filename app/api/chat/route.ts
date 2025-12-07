import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { DEFAULT_AI_MODEL } from '@/lib/constants';

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
  'google/gemini-2.0-flash-001': 'Google Gemini 2.0 Flash',
  'google/gemini-2.5-pro': 'Google Gemini 2.5 Pro',
  'google/gemini-2.5-flash': 'Google Gemini 2.5 Flash',
  'google/gemini-3-pro-preview': 'Google Gemini 3 Pro Preview',
  'deepseek/deepseek-v3.2': 'DeepSeek V3.2',
  'anthropic/claude-sonnet-4.5': 'Claude Sonnet 4.5',
};

export async function POST(req: Request) {
  const { messages, model = DEFAULT_AI_MODEL } = await req.json();

  // Log the incoming request
  console.log(`\n=== Chat API Request (AI SDK) ===`);
  console.log(`Model: ${model}`);
  console.log(`Messages:`, messages);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  let fullResponse = '';

  const result = await streamText({
    model: openrouter(model) as any,
    messages,
    temperature: 0.7,
    maxTokens: 2000,
    onFinish: (result) => {
      console.log(`\n=== Complete AI Response (AI SDK) ===`);
      console.log('Response:', result.text);
      console.log('Token usage:', result.usage);
      console.log('==================================\n');
    },
    onChunk: (chunk) => {
      // Print chunks as they come in
      if (chunk.text) {
        fullResponse += chunk.text;
        process.stdout.write(chunk.text);
      }
    },
  });

  return result.toDataStreamResponse();
}