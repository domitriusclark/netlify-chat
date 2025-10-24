import type { APIRoute } from 'astro';

const NETLIFY_AI_GATEWAY_API = 'https://api.netlify.com/api/v1/ai-gateway/providers';

// Cache the models response for 5 minutes to avoid excessive API calls
let cachedModels: any = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface GatewayResponse {
  providers: {
    [key: string]: {
      token_env_var: string;
      url_env_var: string;
      models: string[];
    };
  };
}

/**
 * Fetch available models from Netlify AI Gateway
 */
async function fetchGatewayModels(): Promise<GatewayResponse | null> {
  try {
    const response = await fetch(NETLIFY_AI_GATEWAY_API);
    if (!response.ok) {
      console.error('Failed to fetch from AI Gateway:', response.status);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching AI Gateway models:', error);
    return null;
  }
}

/**
 * Transform Gateway API response into our model format
 */
function transformModels(gatewayData: GatewayResponse) {
  const models: any[] = [];

  // OpenAI models
  if (gatewayData.providers.openai) {
    gatewayData.providers.openai.models.forEach((modelId: string) => {
      models.push({
        id: modelId,
        provider: 'openai',
        displayName: formatModelName(modelId, 'openai'),
      });
    });
  }

  // Anthropic models
  if (gatewayData.providers.anthropic) {
    gatewayData.providers.anthropic.models.forEach((modelId: string) => {
      models.push({
        id: modelId,
        provider: 'anthropic',
        displayName: formatModelName(modelId, 'anthropic'),
      });
    });
  }

  // Google/Gemini models
  if (gatewayData.providers.gemini) {
    gatewayData.providers.gemini.models.forEach((modelId: string) => {
      models.push({
        id: modelId,
        provider: 'google',
        displayName: formatModelName(modelId, 'google'),
      });
    });
  }

  return models;
}

/**
 * Format model ID into a user-friendly display name
 */
function formatModelName(modelId: string, provider: string): string {
  // Remove common suffixes like dates and -latest
  let name = modelId
    .replace(/-\d{8}$/, '') // Remove dates like -20250929
    .replace(/-latest$/, '');

  // Capitalize and format
  switch (provider) {
    case 'openai':
      return name.toUpperCase().replace(/-/g, ' ');
    case 'anthropic':
      return name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    case 'google':
      return name
        .split('-')
        .map((word, i) => i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)
        .join(' ');
    default:
      return name;
  }
}

export const GET: APIRoute = async () => {
  try {
    // Check cache first
    const now = Date.now();
    if (cachedModels && (now - cacheTime) < CACHE_DURATION) {
      return new Response(JSON.stringify(cachedModels), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // 5 minutes
        }
      });
    }

    // Fetch fresh data from Gateway
    const gatewayData = await fetchGatewayModels();

    if (!gatewayData) {
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch models from AI Gateway',
          fallback: true
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Transform and cache the response
    const models = transformModels(gatewayData);
    cachedModels = {
      models,
      providers: Object.keys(gatewayData.providers),
      fetchedAt: new Date().toISOString()
    };
    cacheTime = now;

    return new Response(JSON.stringify(cachedModels), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5 minutes
      }
    });

  } catch (error) {
    console.error('Error in models endpoint:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal Server Error',
        fallback: true
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
