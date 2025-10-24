// Netlify AI Gateway automatically provides these environment variables:
// - OPENAI_API_KEY & OPENAI_BASE_URL
// - ANTHROPIC_API_KEY & ANTHROPIC_BASE_URL
// - GEMINI_API_KEY & GOOGLE_GEMINI_BASE_URL

import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { MastraModelConfig } from '@mastra/core/llm/model/shared.types';
import { getModelMetadata } from './model-metadata';

interface GatewayConfig {
  providers?: Record<
    string,
    {
      token_env_var?: string;
      url_env_var?: string;
    }
  >;
}

/**
 * Get environment variable from process.env (Netlify Functions runtime)
 * This is where Netlify AI Gateway injects all environment variables
 */
function getRawEnv(key: string | undefined): string | undefined {
  if (!key) return undefined;
  return process.env[key];
}

let gatewayConfigCache: GatewayConfig | null | undefined;

function getGatewayConfig(): GatewayConfig | null {
  if (gatewayConfigCache !== undefined) {
    return gatewayConfigCache;
  }

  const rawConfig = getRawEnv('AI_GATEWAY');
  if (!rawConfig) {
    gatewayConfigCache = null;
    return gatewayConfigCache;
  }

  try {
    gatewayConfigCache = JSON.parse(rawConfig) as GatewayConfig;
  } catch (error) {
    console.error('Failed to parse AI_GATEWAY config:', error);
    gatewayConfigCache = null;
  }

  return gatewayConfigCache;
}

/**
 * Get the environment variable key from AI Gateway config
 * Falls back to standard Netlify AI Gateway variable names
 */
function getGatewayEnvKey(provider: 'openai' | 'anthropic' | 'google', field: 'token' | 'url'): string {
  const gatewayConfig = getGatewayConfig();
  const providerConfig = gatewayConfig?.providers?.[provider];

  if (field === 'token') {
    return providerConfig?.token_env_var || getDefaultTokenKey(provider);
  } else {
    return providerConfig?.url_env_var || getDefaultUrlKey(provider);
  }
}

/**
 * Get default token environment variable key for a provider
 */
function getDefaultTokenKey(provider: 'openai' | 'anthropic' | 'google'): string {
  switch (provider) {
    case 'openai':
      return 'OPENAI_API_KEY';
    case 'anthropic':
      return 'ANTHROPIC_API_KEY';
    case 'google':
      return 'GEMINI_API_KEY';
  }
}

/**
 * Get default URL environment variable key for a provider
 */
function getDefaultUrlKey(provider: 'openai' | 'anthropic' | 'google'): string {
  switch (provider) {
    case 'openai':
      return 'OPENAI_BASE_URL';
    case 'anthropic':
      return 'ANTHROPIC_BASE_URL';
    case 'google':
      return 'GOOGLE_GEMINI_BASE_URL';
  }
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  model: MastraModelConfig;
  description: string;
  contextWindow: number;
}

// Lazy provider initialization - providers are created at request time when env vars are available
let openAIProvider: ReturnType<typeof createOpenAI> | null = null;
let anthropicProvider: ReturnType<typeof createAnthropic> | null = null;
let googleProvider: ReturnType<typeof createGoogleGenerativeAI> | null = null;

function getOpenAIProvider() {
  if (!openAIProvider) {
    const tokenKey = getGatewayEnvKey('openai', 'token');
    const apiKey = getRawEnv(tokenKey);

    if (!apiKey) {
      throw new Error(
        `OpenAI API key not found in Netlify AI Gateway. ` +
        `Expected ${tokenKey} to be set. ` +
        `Ensure you have deployed to production and are running via "netlify dev".`
      );
    }

    const urlKey = getGatewayEnvKey('openai', 'url');
    openAIProvider = createOpenAI({
      baseURL: getRawEnv(urlKey),
      apiKey,
    });
  }
  return openAIProvider;
}

function getAnthropicProvider() {
  if (!anthropicProvider) {
    const tokenKey = getGatewayEnvKey('anthropic', 'token');
    const apiKey = getRawEnv(tokenKey);

    if (!apiKey) {
      throw new Error(
        `Anthropic API key not found in Netlify AI Gateway. ` +
        `Expected ${tokenKey} to be set. ` +
        `Ensure you have deployed to production and are running via "netlify dev".`
      );
    }

    const urlKey = getGatewayEnvKey('anthropic', 'url');
    anthropicProvider = createAnthropic({
      baseURL: getRawEnv(urlKey),
      apiKey,
    });
  }
  return anthropicProvider;
}

function getGoogleProvider() {
  if (!googleProvider) {
    const tokenKey = getGatewayEnvKey('google', 'token');
    const apiKey = getRawEnv(tokenKey);

    if (!apiKey) {
      throw new Error(
        `Google/Gemini API key not found in Netlify AI Gateway. ` +
        `Expected ${tokenKey} to be set. ` +
        `Ensure you have deployed to production and are running via "netlify dev".`
      );
    }

    const urlKey = getGatewayEnvKey('google', 'url');
    googleProvider = createGoogleGenerativeAI({
      baseURL: getRawEnv(urlKey),
      apiKey,
    });
  }
  return googleProvider;
}

/**
 * Get provider function based on provider name
 */
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

/**
 * Create a model configuration dynamically from a model ID
 * This allows us to support any model from the Gateway API
 */
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

/**
 * Get model configuration by ID
 * Creates the model config on-demand if it doesn't exist
 */
export function getModelById(
  modelId: string,
  provider?: 'openai' | 'anthropic' | 'google'
): ModelConfig | undefined {
  // If no provider specified, try to infer from model ID
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

// Default model for new conversations
export const DEFAULT_MODEL = 'gpt-4o-mini';

// Fallback models list (used if Gateway API is unavailable)
export const FALLBACK_MODELS = [
  { id: 'gpt-4o-mini', provider: 'openai' as const, displayName: 'GPT-4 Omni Mini' },
  { id: 'gpt-4o', provider: 'openai' as const, displayName: 'GPT-4 Omni' },
  { id: 'claude-sonnet-4-5-20250929', provider: 'anthropic' as const, displayName: 'Claude Sonnet 4.5' },
  { id: 'claude-3-5-haiku-20241022', provider: 'anthropic' as const, displayName: 'Claude 3.5 Haiku' },
  { id: 'gemini-2.5-flash', provider: 'google' as const, displayName: 'Gemini 2.5 Flash' },
];
