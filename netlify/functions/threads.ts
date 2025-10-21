import type { Context } from '@netlify/functions';
import { memory, initializeStorage } from '../lib/memory';

export default async function handler(req: Request, _context: Context) {
  // Ensure storage is initialized before any operations
  await initializeStorage();

  const url = new URL(req.url);
  const resourceId = url.searchParams.get('resourceId') || 'default-user';
  const threadId = url.searchParams.get('threadId');

  // GET: List all threads for user OR get messages for a specific thread
  if (req.method === 'GET') {
    try {
      // If threadId is provided, get messages for that thread
      if (threadId) {
        const thread = await memory.getThreadById({ threadId });
        const { messages } = await memory.query({
          threadId,
          resourceId
        });

        return new Response(
          JSON.stringify({
            thread,
            messages: messages.map((msg: any) => ({
              role: msg.role,
              content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
            }))
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Otherwise, list all threads for the user
      const threads = await memory.getThreadsByResourceId({
        resourceId,
        sortDirection: 'DESC',
        orderBy: 'updatedAt'
      });

      return new Response(
        JSON.stringify({
          threads: threads.map(thread => ({
            id: thread.id,
            resourceId: thread.resourceId,
            title: thread.title,
            metadata: thread.metadata,
            createdAt: thread.createdAt,
            updatedAt: thread.updatedAt
          }))
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('Error fetching threads:', error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Failed to fetch threads'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // POST: Create new thread
  if (req.method === 'POST') {
    try {
      const { title, metadata } = await req.json();

      const thread = await memory.createThread({
        resourceId,
        title,
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString()
        }
      });

      return new Response(
        JSON.stringify({
          thread: {
            id: thread.id,
            resourceId: thread.resourceId,
            title: thread.title,
            metadata: thread.metadata,
            createdAt: thread.createdAt
          }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('Error creating thread:', error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Failed to create thread'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // DELETE: Delete thread
  if (req.method === 'DELETE') {
    try {
      if (!threadId) {
        return new Response(
          JSON.stringify({ error: 'Thread ID required' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      await memory.deleteThread(threadId);

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('Error deleting thread:', error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Failed to delete thread'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
}
