import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getModelMetadata } from './model-metadata';

type MastraModelConfig = any;

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  model: MastraModelConfig;
  description: string;
  contextWindow: number;
}

let openAIProvider: ReturnType<typeof createOpenAI> | null = null;
let anthropicProvider: ReturnType<typeof createAnthropic> | null = null;
let googleProvider: ReturnType<typeof createGoogleGenerativeAI> | null = null;

function getOpenAIProvider() {
  if (!openAIProvider) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found. Ensure Netlify AI Gateway is enabled.');
    }
    openAIProvider = createOpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey,
    });
  }
  return openAIProvider;
}

function getAnthropicProvider() {
  if (!anthropicProvider) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not found. Ensure Netlify AI Gateway is enabled.');
    }
    anthropicProvider = createAnthropic({
      baseURL: process.env.ANTHROPIC_BASE_URL,
      apiKey,
    });
  }
  return anthropicProvider;
}

function getGoogleProvider() {
  if (!googleProvider) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found. Ensure Netlify AI Gateway is enabled.');
    }
    googleProvider = createGoogleGenerativeAI({
      baseURL: process.env.GOOGLE_GEMINI_BASE_URL,
      apiKey,
    });
  }
  return googleProvider;
}

function getProviderByName(provider: 'openai' | 'anthropic' | 'google') {
  switch (provider) {
    case 'openai':
      return getOpenAIProvider();
    case 'anthropic':
      return getAnthropicProvider();
    case 'google':
      return getGoogleProvider();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export function createModelConfig(
  modelId: string,
  provider: 'openai' | 'anthropic' | 'google',
  displayName?: string
): ModelConfig {
  const metadata = getModelMetadata(modelId);
  const providerInstance = getProviderByName(provider);

  return {
    id: modelId,
    name: displayName || modelId,
    provider,
    model: providerInstance(modelId),
    description: metadata.description,
    contextWindow: metadata.contextWindow,
  };
}

export function getModelById(
  modelId: string,
  provider?: 'openai' | 'anthropic' | 'google'
): ModelConfig | undefined {
  if (!provider) {
    if (modelId.startsWith('gpt-') || modelId.startsWith('o') || modelId.includes('codex')) {
      provider = 'openai';
    } else if (modelId.startsWith('claude-')) {
      provider = 'anthropic';
    } else if (modelId.startsWith('gemini-')) {
      provider = 'google';
    } else {
      console.error('Cannot infer provider from model ID:', modelId);
      return undefined;
    }
  }

  try {
    return createModelConfig(modelId, provider);
  } catch (error) {
    console.error('Error creating model config:', error);
    return undefined;
  }
}

export const DEFAULT_MODEL = 'gpt-4o-mini';

export const FALLBACK_MODELS = [
  { id: 'gpt-4o-mini', provider: 'openai' as const, displayName: 'GPT-4 Omni Mini' },
  { id: 'gpt-4o', provider: 'openai' as const, displayName: 'GPT-4 Omni' },
  { id: 'claude-sonnet-4-5-20250929', provider: 'anthropic' as const, displayName: 'Claude Sonnet 4.5' },
  { id: 'claude-3-5-haiku-20241022', provider: 'anthropic' as const, displayName: 'Claude 3.5 Haiku' },
  { id: 'gemini-2.5-flash', provider: 'google' as const, displayName: 'Gemini 2.5 Flash' },
];
