/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  // Database Configuration (LibSQL/Turso)
  readonly DATABASE_URL?: string;
  readonly DATABASE_AUTH_TOKEN?: string;

  // Netlify AI Gateway Configuration
  // AI_GATEWAY contains JSON config with provider settings and env var names
  readonly AI_GATEWAY?: string;
  readonly NETLIFY_AI_GATEWAY_KEY?: string;
  readonly NETLIFY_AI_GATEWAY_BASE_URL?: string;

  // Provider API Keys (automatically injected by Netlify AI Gateway)
  // These are the standard variable names, but AI_GATEWAY config may override
  readonly OPENAI_API_KEY?: string;
  readonly OPENAI_BASE_URL?: string;
  readonly ANTHROPIC_API_KEY?: string;
  readonly ANTHROPIC_BASE_URL?: string;
  readonly GEMINI_API_KEY?: string;
  readonly GOOGLE_GEMINI_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
