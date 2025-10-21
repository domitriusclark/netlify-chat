import { Agent } from '@mastra/core/agent';
import { memory } from './memory';
import { getModelById, DEFAULT_MODEL } from './models';

export interface CreateAgentOptions {
  modelId?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Creates a Mastra agent configured for chat interactions
 *
 * @param options - Configuration options for the agent
 * @returns Configured Mastra agent instance
 */
export function createChatAgent(options: CreateAgentOptions = {}) {
  const {
    modelId = DEFAULT_MODEL,
    systemPrompt = 'You are a helpful AI assistant. Be concise, accurate, and friendly. Provide clear and informative responses.',
    temperature = 0.7,
    maxTokens = 4096,
  } = options;

  // Get model configuration
  const modelConfig = getModelById(modelId);
  if (!modelConfig) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  // Create and return Mastra agent with default stream options
  return new Agent({
    name: `chat-agent-${modelId}`,
    instructions: systemPrompt,
    model: modelConfig.model,
    memory,

    // Set default options for streaming
    defaultStreamOptions: {
      temperature,
      maxTokens,
    },
  });
}
