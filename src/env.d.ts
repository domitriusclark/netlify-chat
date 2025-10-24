/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly DATABASE_URL?: string;
  readonly DATABASE_AUTH_TOKEN?: string;
  readonly AI_GATEWAY?: string;
  readonly NETLIFY_AI_GATEWAY_KEY?: string;
  readonly NETLIFY_AI_GATEWAY_BASE_URL?: string;
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
