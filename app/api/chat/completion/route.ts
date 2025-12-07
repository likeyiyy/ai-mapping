import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouterAPI, prepareMessages } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const { message, model } = await request.json();

    if (!message || !model) {
      return NextResponse.json(
        { error: 'Message and model are required' },
        { status: 400 }
      );
    }

    // Prepare messages for OpenRouter
    const messages = prepareMessages(message);

    // Call OpenRouter API
    const response = await callOpenRouterAPI(messages, model);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}