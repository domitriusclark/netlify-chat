import { useState } from 'react';

// Import model configuration from backend
// We'll create a shared models file that can be used in both frontend and backend
interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  description: string;
  contextWindow: number;
}

// Available models (matches netlify/lib/models.ts)
const AVAILABLE_MODELS: ModelConfig[] = [
  // OpenAI Models
  {
    id: 'gpt-4o',
    name: 'GPT-4 Omni',
    provider: 'openai',
    description: 'Most capable multimodal model',
    contextWindow: 128000,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4 Omni Mini',
    provider: 'openai',
    description: 'Faster, more affordable GPT-4 variant',
    contextWindow: 128000,
  },
  {
    id: 'o3-mini',
    name: 'O3 Mini',
    provider: 'openai',
    description: 'Reasoning model for complex tasks',
    contextWindow: 200000,
  },
  {
    id: 'gpt-4o-audio-preview',
    name: 'GPT-4 Omni Audio Preview',
    provider: 'openai',
    description: 'Multimodal with audio capabilities',
    contextWindow: 128000,
  },
  // Anthropic Models
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    description: 'Latest Claude with improved reasoning',
    contextWindow: 200000,
  },
  {
    id: 'claude-opus-4-1',
    name: 'Claude Opus 4.1',
    provider: 'anthropic',
    description: 'Most powerful Claude model',
    contextWindow: 200000,
  },
  {
    id: 'claude-haiku-3-5',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    description: 'Fast, efficient Claude variant',
    contextWindow: 200000,
  },
  // Google Models
  {
    id: 'gemini-2-5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    description: 'Advanced multimodal understanding',
    contextWindow: 1000000,
  },
  {
    id: 'gemini-2-5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    description: 'Fast, efficient Gemini variant',
    contextWindow: 1000000,
  },
  {
    id: 'gemini-flash',
    name: 'Gemini Flash',
    provider: 'google',
    description: 'Lightweight Gemini model',
    contextWindow: 1000000,
  },
];

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export default function ModelSelector({
  selectedModel,
  onModelChange,
  disabled = false
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel);

  // Group models by provider
  const modelsByProvider = AVAILABLE_MODELS.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, ModelConfig[]>);

  const providerLabels = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google'
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white">
        <span className="font-medium">{currentModel?.name || 'Select Model'}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            {Object.entries(modelsByProvider).map(([provider, models]) => (
              <div key={provider} className="p-2">
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                  {providerLabels[provider as keyof typeof providerLabels]}
                </div>
                {models.map(model => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onModelChange(model.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 ${
                      model.id === selectedModel ? 'bg-blue-50' : ''
                    }`}>
                    <div className="font-medium text-sm">{model.name}</div>
                    <div className="text-xs text-gray-500">{model.description}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Context: {(model.contextWindow / 1000).toFixed(0)}K tokens
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
