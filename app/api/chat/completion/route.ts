import { NextRequest } from 'next/server';
import { sendChatMessage, prepareMessages } from '@/lib/openrouter-sdk';

export async function POST(request: NextRequest) {
  try {
    const { message, model, stream = false } = await request.json();

    // Log the incoming request
    console.log(`\n=== Chat API Request ===`);
    console.log(`Model: ${model}`);
    console.log(`Message: ${message}`);
    console.log(`Stream: ${stream}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);

    if (!message || !model) {
      return new Response(
        JSON.stringify({ error: 'Message and model are required' }),
        { status: 400 }
      );
    }

    // Prepare messages for OpenRouter
    const messages = prepareMessages(message);

    if (stream) {
      // Streaming response using OpenRouter SDK
      console.log(`\n=== AI Streaming Response ===`);

      const readable = new ReadableStream({
        async start(controller) {
          try {
            await sendChatMessage(messages, model, true, (chunk) => {
              // Print the content as it streams in
              process.stdout.write(chunk);

              // Send to client in SSE format
              const data = JSON.stringify({
                choices: [{
                  delta: { content: chunk }
                }]
              });
              controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
            });

            // Send done signal
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          } catch (error) {
            console.error('Streaming error:', error);
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
      console.log(`\n=== AI Non-Streaming Response ===`);
      const response = await sendChatMessage(messages, model, false);

      // Log the complete response
      console.log('Response:', response);
      console.log('===============================\n');

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