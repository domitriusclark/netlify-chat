import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';

const storageConfig: any = {
  url: process.env.DATABASE_URL || import.meta.env.DATABASE_URL || 'file:./chat-memory.db',
};

const authToken = process.env.DATABASE_AUTH_TOKEN || import.meta.env.DATABASE_AUTH_TOKEN;
if (authToken) {
  storageConfig.authToken = authToken;
}

const storage = new LibSQLStore(storageConfig);

let initPromise: Promise<void> | null = null;

async function initializeStorage() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await storage.init();
      } catch (error) {
        console.error('Failed to initialize storage:', error);
        throw error;
      }
    })();
  }
  return initPromise;
}

export const memory = new Memory({
  storage,
  options: {
    lastMessages: 10,
    threads: {
      generateTitle: true
    }
  }
});

export { initializeStorage };
