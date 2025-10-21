# Quick Start Guide

## What We Built

A ChatGPT-style multi-model chat application with:
- ✅ 10+ AI models (OpenAI, Anthropic, Google)
- ✅ Mastra AI SDK for agent orchestration
- ✅ Persistent conversation history with LibSQL
- ✅ Real-time streaming responses
- ✅ Thread/conversation management
- ✅ Model switching on the fly

## Setup Steps

### 1. Install Dependencies

Already done! But if you need to reinstall:
```bash
npm install
```

### 2. Environment Variables

The `.env` file is already configured for local development with a file-based database.

```bash
# Already in .env
DATABASE_URL="file:./chat-memory.db"
```

For local testing with real AI models, you need to push to production one time before the variables are available for your site:

```bash
# For OpenAI
OPENAI_API_KEY="sk-your-key-here"

# For Anthropic (Claude)
ANTHROPIC_API_KEY="sk-ant-your-key-here"

# For Google (Gemini)
GEMINI_API_KEY="your-key-here"
```

**Note**: When deployed to Netlify, these keys are automatically provided by Netlify AI Gateway!

### 3. Run Development Server

**Important**: Use Netlify Dev to properly serve Functions:

```bash
npm run dev:netlify
```

Visit: http://localhost:8888

**Note**: `npm run dev` runs Astro only (no Functions). Use `npm run dev:netlify` for the full stack.

### 4. Test the Application

1. **Start a New Chat**: Click "New Chat" button
2. **Select a Model**: Click the model dropdown to choose from 10+ models
3. **Send a Message**: Type and send - watch it stream!
4. **View Conversations**: Click the menu icon (☰) to see all your chats
5. **Switch Models**: Change models mid-conversation
6. **Load Previous Chats**: Click any conversation in the sidebar

## Project Structure

```
netlify-chat/
├── netlify/
│   ├── functions/
│   │   ├── chat.ts          # Main chat endpoint with streaming
│   │   └── threads.ts        # Thread management API
│   └── lib/
│       ├── memory.ts         # Memory system configuration
│       ├── models.ts         # Model definitions (10+ models)
│       └── agents.ts         # Mastra agent factory
├── src/
│   ├── components/
│   │   ├── Chat.tsx          # Main chat UI component
│   │   └── ModelSelector.tsx # Model dropdown component
│   └── pages/
│       └── index.astro       # Landing page
├── .env                      # Local environment variables
├── .env.example              # Example environment variables
└── chat-memory.db            # Local SQLite database (auto-created)
```

## Features Overview

### Multi-Model Support

**OpenAI Models**:
- GPT-4 Omni (most capable)
- GPT-4 Omni Mini (fast & affordable)
- O3 Mini (reasoning model)
- GPT-4 Audio Preview (multimodal)

**Anthropic Models**:
- Claude Sonnet 4.5 (latest & greatest)
- Claude Opus 4.1 (most powerful)
- Claude 3.5 Haiku (fast & efficient)

**Google Models**:
- Gemini 2.5 Pro (advanced multimodal)
- Gemini 2.5 Flash (fast)
- Gemini Flash (lightweight)

### Memory & Persistence

- **Thread-based conversations**: Each chat is a separate thread
- **Persistent history**: All messages saved to database
- **Semantic search**: Find relevant past conversations (configured but not yet exposed in UI)
- **Auto-generated titles**: Conversations get descriptive titles automatically

### Streaming

- Real-time token-by-token streaming
- Mastra's native streaming protocol
- Handles errors gracefully
- Shows typing indicators

## Development Tips

### Local Development

The app uses a local SQLite database (`chat-memory.db`) which is automatically created on first run.

To reset your local database:
```bash
rm chat-memory.db chat-memory.db-shm chat-memory.db-wal
```

### Testing Different Models

1. Start a conversation with GPT-4 Omni Mini (default)
2. Ask a question
3. Click "New Chat" and switch to Claude Sonnet 4.5
4. Ask the same question
5. Compare responses!

### Debugging

Check the console for detailed logs:
- Browser DevTools Console: Frontend errors and stream data
- Terminal: Backend/Function logs

## Deploying to Netlify

### Prerequisites

1. Push code to GitHub
2. Sign up for Netlify (free)
3. Ensure you're on a Credit-based plan (Free, Personal, or Pro) for AI Gateway

### Deploy Steps

1. **Connect Repository**:
   ```bash
   netlify init
   ```

2. **Set Environment Variables** (Netlify Dashboard):
   - Go to Site Settings → Environment Variables
   - Add `DATABASE_URL` for production (Turso recommended)
   - AI Gateway keys are automatic - no setup needed!

3. **Deploy**:
   ```bash
   npm run build
   netlify deploy --prod
   ```

### Using Turso (Production Database)

For production, use Turso instead of local SQLite:

1. Install Turso CLI:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

2. Create database:
   ```bash
   turso auth signup
   turso db create netlify-chat-memory
   ```

3. Get credentials:
   ```bash
   turso db show netlify-chat-memory --url
   turso db tokens create netlify-chat-memory
   ```

4. Add to Netlify environment variables:
   ```
   DATABASE_URL=libsql://your-db.turso.io
   DATABASE_AUTH_TOKEN=your-token
   ```

## Troubleshooting

### "Agent stream failed"

- Make sure you have API keys set in `.env` for local dev
- Check console for detailed error messages
- Verify the model ID is correct

### "Thread ID is required"

- Click "New Chat" to create a thread first
- The app should create one automatically, but this is a fallback

### Database errors

- Delete local database files and restart: `rm *.db*`
- Check `DATABASE_URL` is correctly set

### Build errors

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run build`

## Next Steps

1. **Add Authentication**: Replace `default-user` with real user IDs
2. **Add Tools**: Enable web search, calculator, code execution
3. **Implement RAG**: Add document upload and semantic search
4. **Custom System Prompts**: Add UI for custom agent instructions
5. **Export Conversations**: Add download as Markdown/PDF
6. **Voice Input**: Add speech-to-text
7. **Image Generation**: Integrate DALL-E or Stable Diffusion

## Resources

- **Mastra Docs**: https://mastra.ai/docs
- **Netlify AI Gateway**: https://docs.netlify.com/ai-gateway
- **Turso Docs**: https://docs.turso.tech

## Support

- **Issues**: Open an issue on GitHub
- **Mastra Discord**: https://discord.gg/mastra
- **Netlify Forums**: https://answers.netlify.com

---

**Happy Building! 🚀**
