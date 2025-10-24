import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';

// Initialize storage with LibSQL
// For local dev: uses file-based SQLite
// For production: connects to Turso (serverless LibSQL)
//
// Use process.env for server-side environment variables
// Netlify injects these at runtime in Functions/SSR context
const storageConfig: any = {
  url: process.env.DATABASE_URL || import.meta.env.DATABASE_URL || 'file:./chat-memory.db',
};

// Only add authToken if it's defined (for remote Turso databases)
const authToken = process.env.DATABASE_AUTH_TOKEN || import.meta.env.DATABASE_AUTH_TOKEN;
if (authToken) {
  storageConfig.authToken = authToken;
}

const storage = new LibSQLStore(storageConfig);

// Track initialization state
let initPromise: Promise<void> | null = null;

/**
 * Initialize the database storage
 * This ensures tables are created and storage is ready
 */
async function initializeStorage() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        // Initialize the storage (creates tables if needed)
        await storage.init();
        console.log('LibSQL storage initialized successfully');
      } catch (error) {
        console.error('Failed to initialize storage:', error);
        throw error;
      }
    })();
  }
  return initPromise;
}

// Create memory instance with configuration
export const memory = new Memory({
  storage,
  options: {
    // Keep last 10 messages in working memory for context
    lastMessages: 10,

    // Semantic search disabled for now (requires vector store)
    // To enable: add LibSQLVector and embedder
    // semanticRecall: {
    //   topK: 3,
    //   messageRange: 2
    // },

    // Auto-generate conversation titles from content
    threads: {
      generateTitle: true
    }
  }
});

// Export the initialization function
export { initializeStorage };

// Export memory instance for use in agents and functions
