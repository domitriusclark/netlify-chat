/**
 * Model metadata for display purposes
 * This provides descriptions and context window information for UI display
 */

export interface ModelMetadata {
  description: string;
  contextWindow: number;
  category?: 'standard' | 'reasoning' | 'fast' | 'multimodal' | 'pro';
}

// Default metadata by model family patterns
const METADATA_PATTERNS: Record<string, ModelMetadata> = {
  // OpenAI patterns
  'gpt-5-pro': {
    description: 'Most advanced GPT-5 model with enhanced reasoning',
    contextWindow: 200000,
    category: 'pro'
  },
  'gpt-5': {
    description: 'Latest generation GPT-5 model',
    contextWindow: 200000,
    category: 'standard'
  },
  'gpt-4o': {
    description: 'Multimodal GPT-4 Omni model',
    contextWindow: 128000,
    category: 'multimodal'
  },
  'gpt-4o-mini': {
    description: 'Fast, cost-effective GPT-4 variant',
    contextWindow: 128000,
    category: 'fast'
  },
  'o3': {
    description: 'Advanced reasoning model for complex tasks',
    contextWindow: 200000,
    category: 'reasoning'
  },
  'o3-mini': {
    description: 'Efficient reasoning model',
    contextWindow: 200000,
    category: 'reasoning'
  },
  'o4-mini': {
    description: 'Next-gen reasoning model',
    contextWindow: 200000,
    category: 'reasoning'
  },

  // Anthropic patterns
  'claude-opus': {
    description: 'Most powerful Claude model for complex tasks',
    contextWindow: 200000,
    category: 'pro'
  },
  'claude-sonnet': {
    description: 'Balanced Claude model with strong reasoning',
    contextWindow: 200000,
    category: 'standard'
  },
  'claude-haiku': {
    description: 'Fast, efficient Claude model',
    contextWindow: 200000,
    category: 'fast'
  },

  // Google/Gemini patterns
  'gemini-2.5-pro': {
    description: 'Advanced multimodal understanding with massive context',
    contextWindow: 1000000,
    category: 'pro'
  },
  'gemini-2.5-flash': {
    description: 'Fast, efficient Gemini 2.5 variant',
    contextWindow: 1000000,
    category: 'fast'
  },
  'gemini-2.0-flash': {
    description: 'Fast Gemini 2.0 model',
    contextWindow: 1000000,
    category: 'fast'
  },
  'gemini-flash': {
    description: 'Lightweight, fast Gemini model',
    contextWindow: 1000000,
    category: 'fast'
  },
};

// Default fallback metadata
const DEFAULT_METADATA: ModelMetadata = {
  description: 'AI language model',
  contextWindow: 128000,
  category: 'standard'
};

/**
 * Get metadata for a model ID
 * Matches against known patterns and returns appropriate metadata
 */
export function getModelMetadata(modelId: string): ModelMetadata {
  // Try exact match first (for version-specific IDs)
  const exactMatch = METADATA_PATTERNS[modelId];
  if (exactMatch) return exactMatch;

  // Try pattern matching (remove version suffixes)
  const baseModelId = modelId
    .replace(/-\d{8}$/, '') // Remove dates
    .replace(/-latest$/, '') // Remove -latest
    .replace(/-preview$/, '') // Remove -preview
    .replace(/-\d+\.\d+$/, ''); // Remove version numbers

  // Check if any pattern key is contained in the model ID
  for (const [pattern, metadata] of Object.entries(METADATA_PATTERNS)) {
    if (baseModelId.includes(pattern) || modelId.includes(pattern)) {
      return metadata;
    }
  }

  // Return default if no match found
  return DEFAULT_METADATA;
}

/**
 * Get a human-friendly category badge for a model
 */
export function getCategoryBadge(category?: string): string {
  switch (category) {
    case 'pro':
      return '⭐ Pro';
    case 'reasoning':
      return '🧠 Reasoning';
    case 'fast':
      return '⚡ Fast';
    case 'multimodal':
      return '🎨 Multimodal';
    case 'standard':
    default:
      return '';
  }
}

/**
 * Format context window for display
 */
export function formatContextWindow(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M tokens`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}K tokens`;
  }
  return `${tokens} tokens`;
}
