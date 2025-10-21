// Netlify AI Gateway automatically provides these environment variables:
// - OPENAI_API_KEY & OPENAI_BASE_URL
// - ANTHROPIC_API_KEY & ANTHROPIC_BASE_URL
// - GEMINI_API_KEY & GOOGLE_GEMINI_BASE_URL

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  model: string; // Mastra model string in "provider/model-name" format
  description: string;
  contextWindow: number;
}

// Available models from Netlify AI Gateway
// Using Mastra's "provider/model-name" format for AI SDK v5 compatibility
export const AVAILABLE_MODELS: ModelConfig[] = [
  // OpenAI Models
  {
    id: 'gpt-4o',
    name: 'GPT-4 Omni',
    provider: 'openai',
    model: 'openai/gpt-4o',
    description: 'Most capable multimodal model',
    contextWindow: 128000,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4 Omni Mini',
    provider: 'openai',
    model: 'openai/gpt-4o-mini',
    description: 'Faster, more affordable GPT-4 variant',
    contextWindow: 128000,
  },
  {
    id: 'o3-mini',
    name: 'O3 Mini',
    provider: 'openai',
    model: 'openai/o3-mini',
    description: 'Reasoning model for complex tasks',
    contextWindow: 200000,
  },
  {
    id: 'gpt-4o-audio-preview',
    name: 'GPT-4 Omni Audio Preview',
    provider: 'openai',
    model: 'openai/gpt-4o-audio-preview',
    description: 'Multimodal with audio capabilities',
    contextWindow: 128000,
  },

  // Anthropic Models
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    model: 'anthropic/claude-sonnet-4-5-20250929',
    description: 'Latest Claude with improved reasoning',
    contextWindow: 200000,
  },
  {
    id: 'claude-opus-4-1',
    name: 'Claude Opus 4.1',
    provider: 'anthropic',
    model: 'anthropic/claude-opus-4-1-20250805',
    description: 'Most powerful Claude model',
    contextWindow: 200000,
  },
  {
    id: 'claude-haiku-3-5',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    model: 'anthropic/claude-3-5-haiku-20241022',
    description: 'Fast, efficient Claude variant',
    contextWindow: 200000,
  },

  // Google Models
  {
    id: 'gemini-2-5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    model: 'google/gemini-2.5-pro-latest',
    description: 'Advanced multimodal understanding',
    contextWindow: 1000000,
  },
  {
    id: 'gemini-2-5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    model: 'google/gemini-2.5-flash-latest',
    description: 'Fast, efficient Gemini variant',
    contextWindow: 1000000,
  },
  {
    id: 'gemini-flash',
    name: 'Gemini Flash',
    provider: 'google',
    model: 'google/gemini-flash-latest',
    description: 'Lightweight Gemini model',
    contextWindow: 1000000,
  },
];

// Helper to get model by ID
export function getModelById(modelId: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find(m => m.id === modelId);
}

// Default model for new conversations
export const DEFAULT_MODEL = 'gpt-4o-mini';
