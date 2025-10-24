import type { APIRoute } from 'astro';
import { createChatAgent } from '../../lib/agents';
import { memory, initializeStorage } from '../../lib/memory';

export interface ChatRequest {
  message: string;
  modelId?: string;
  threadId?: string;
  resourceId?: string;
  systemPrompt?: string;
  temperature?: number;
  newConversation?: boolean;
}

export const POST: APIRoute = async ({ request }) => {
  // Ensure storage is initialized before any operations
  await initializeStorage();

  try {
    const body: ChatRequest = await request.json();
    const {
      message,
      modelId = 'gpt-4o-mini',
      threadId,
      resourceId = 'default-user', // In production, get from auth
      systemPrompt,
      temperature,
      newConversation = false,
    } = body;

    // Handle new conversation creation
    if (newConversation) {
      const thread = await memory.createThread({
        resourceId,
        metadata: {
          modelId,
          createdAt: new Date().toISOString()
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          threadId: thread.id
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate required fields
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!threadId) {
      return new Response(
        JSON.stringify({ error: 'Thread ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create agent for this request
    const agent = createChatAgent({
      modelId,
      systemPrompt,
      temperature,
    });

    // Stream the response using Mastra's native streaming
    // The agent automatically handles memory when threadId and resourceId are provided
    const stream = await agent.stream(message, {
      threadId,
      resourceId,
    });

    // Use the Mastra's textStream and wrap it in our JSON format
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        // Get the text stream from Mastra - it's already a ReadableStream<string>
        const reader = stream.textStream.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // value is already a string
          await writer.write(
            encoder.encode(
              JSON.stringify({ type: 'chunk', content: value }) + '\n'
            )
          );
        }

        await writer.write(
          encoder.encode(
            JSON.stringify({ type: 'done', threadId, modelId }) + '\n'
          )
        );

        writer.close();
      } catch (error) {
        console.error('Stream error:', error);
        await writer.write(
          encoder.encode(
            JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Streaming error'
            }) + '\n'
          )
        );
        writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal Server Error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
