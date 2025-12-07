import { NextRequest } from 'next/server';
import { callOpenRouterAPI, prepareMessages } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const { message, model, stream = false } = await request.json();

    if (!message || !model) {
      return new Response(
        JSON.stringify({ error: 'Message and model are required' }),
        { status: 400 }
      );
    }

    // Prepare messages for OpenRouter
    const messages = prepareMessages(message);

    if (stream) {
      // Streaming response
      const response = await callOpenRouterAPI(messages, model, true);

      if (typeof response === 'string') {
        // Shouldn't happen with stream=true, but handle it
        return new Response(
          JSON.stringify({ response }),
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Convert the stream to Server-Sent Events format
      const reader = response.getReader();
      const encoder = new TextEncoder();

      const readable = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }
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

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const response = await callOpenRouterAPI(messages, model, false);
      return new Response(
        JSON.stringify({ response }),
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Chat API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}