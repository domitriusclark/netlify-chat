import type { APIRoute } from 'astro';

/**
 * Diagnostic endpoint for Netlify AI Gateway debugging
 * WARNING: Only enable this in development. Remove or secure before production deploy!
 */
export const GET: APIRoute = async () => {
  if (process.env.NODE_ENV === 'production') {
    return new Response(JSON.stringify({ error: 'Endpoint disabled in production' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    sources: {
      process_env: {},
      import_meta_env: {},
    },
    ai_gateway: {
      config_present: false,
      config_valid: false,
      providers: [],
    },
  };

  // List of env vars to check (without exposing actual values)
  const envVarsToCheck = [
    'AI_GATEWAY',
    'NETLIFY_AI_GATEWAY_KEY',
    'NETLIFY_AI_GATEWAY_BASE_URL',
    'OPENAI_API_KEY',
    'OPENAI_BASE_URL',
    'ANTHROPIC_API_KEY',
    'ANTHROPIC_BASE_URL',
    'GEMINI_API_KEY',
    'GOOGLE_GEMINI_BASE_URL',
    'DATABASE_URL',
    'DATABASE_AUTH_TOKEN',
  ];

  // Check process.env
  for (const key of envVarsToCheck) {
    const value = process.env[key];
    if (value) {
      // Only show first/last few chars for security
      diagnostics.sources.process_env[key] =
        key.includes('KEY') || key.includes('TOKEN') || key.includes('URL')
          ? maskValue(value)
          : value.length > 100
          ? `${value.substring(0, 50)}...${value.substring(value.length - 20)}`
          : value;
    }
  }

  // Check import.meta.env
  for (const key of envVarsToCheck) {
    const value = (import.meta.env as any)[key];
    if (value) {
      diagnostics.sources.import_meta_env[key] =
        key.includes('KEY') || key.includes('TOKEN') || key.includes('URL')
          ? maskValue(value)
          : value.length > 100
          ? `${value.substring(0, 50)}...${value.substring(value.length - 20)}`
          : value;
    }
  }

  // Check AI_GATEWAY config (base64 encoded)
  const aiGatewayConfig = process.env.AI_GATEWAY || (import.meta.env as any).AI_GATEWAY;
  if (aiGatewayConfig) {
    diagnostics.ai_gateway.config_present = true;
    try {
      // Decode base64 first
      const decoded = Buffer.from(aiGatewayConfig, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      diagnostics.ai_gateway.config_valid = true;

      // Add raw parsed structure for debugging
      (diagnostics.ai_gateway as any).raw_structure = {
        has_providers: 'providers' in parsed,
        providers_type: typeof parsed.providers,
        providers_is_array: Array.isArray(parsed.providers),
        providers_length: Array.isArray(parsed.providers) ? parsed.providers.length : 'N/A',
        sample_provider: Array.isArray(parsed.providers) && parsed.providers.length > 0 ? parsed.providers[0] : null,
      };

      // Providers is an array: [["openai", {...}], ["anthropic", {...}]]
      if (Array.isArray(parsed.providers)) {
        diagnostics.ai_gateway.providers = parsed.providers.map(([name]: [string, any]) => name);
        diagnostics.ai_gateway.provider_details = parsed.providers.reduce(
          (acc: Record<string, any>, [provider, config]: [string, any]) => {
            acc[provider] = {
              has_token_env_var: !!config.token_env_var,
              has_url_env_var: !!config.url_env_var,
              token_var_name: config.token_env_var,
              url_var_name: config.url_env_var,
              token_var_available: !!(process.env[config.token_env_var] || (import.meta.env as any)[config.token_env_var]),
              url_var_available: !!(process.env[config.url_env_var] || (import.meta.env as any)[config.url_env_var]),
            };
            return acc;
          },
          {} as Record<string, any>
        );
      }
    } catch (error) {
      diagnostics.ai_gateway.parse_error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  // Add summary
  diagnostics.summary = {
    total_vars_in_process_env: Object.keys(diagnostics.sources.process_env).length,
    total_vars_in_import_meta_env: Object.keys(diagnostics.sources.import_meta_env).length,
    ai_gateway_active: diagnostics.ai_gateway.config_present && diagnostics.ai_gateway.config_valid,
    recommendation: getRecommendation(diagnostics),
  };

  return new Response(JSON.stringify(diagnostics, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
};

function maskValue(value: string): string {
  if (!value) return '[not set]';
  if (value.length <= 8) return '***';
  return `${value.substring(0, 4)}...${value.substring(value.length - 4)} (${value.length} chars)`;
}

function getRecommendation(diagnostics: any): string {
  if (!diagnostics.ai_gateway.config_present) {
    return 'AI_GATEWAY config not found. Ensure you have deployed to production at least once and are running via "netlify dev".';
  }

  if (!diagnostics.ai_gateway.config_valid) {
    return 'AI_GATEWAY config is present but invalid JSON. Check Netlify dashboard.';
  }

  const missingVars: string[] = [];
  for (const [provider, details] of Object.entries(diagnostics.ai_gateway.provider_details || {})) {
    const providerDetails = details as any;
    if (!providerDetails.token_var_available) {
      missingVars.push(`${provider} API key (${providerDetails.token_var_name})`);
    }
  }

  if (missingVars.length > 0) {
    return `AI Gateway configured but missing: ${missingVars.join(', ')}. Verify production deployment and try restarting "netlify dev".`;
  }

  return 'All environment variables appear to be properly configured!';
}
