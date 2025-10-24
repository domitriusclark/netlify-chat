import { useState, useEffect } from 'react';

interface ModelInfo {
  id: string;
  provider: 'openai' | 'anthropic' | 'google';
  displayName: string;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

// Fallback models if API fetch fails
const FALLBACK_MODELS: ModelInfo[] = [
  { id: 'gpt-4o-mini', provider: 'openai', displayName: 'GPT-4 Omni Mini' },
  { id: 'gpt-4o', provider: 'openai', displayName: 'GPT-4 Omni' },
  { id: 'claude-sonnet-4-5-20250929', provider: 'anthropic', displayName: 'Claude Sonnet 4.5' },
  { id: 'claude-3-5-haiku-20241022', provider: 'anthropic', displayName: 'Claude 3.5 Haiku' },
  { id: 'gemini-2.5-flash', provider: 'google', displayName: 'Gemini 2.5 Flash' },
];

export default function ModelSelector({
  selectedModel,
  onModelChange,
  disabled = false
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>(FALLBACK_MODELS);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch available models on mount
  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch('/api/models');
        if (!response.ok) throw new Error('Failed to fetch models');

        const data = await response.json();

        if (data.models && Array.isArray(data.models)) {
          setModels(data.models);
        }
      } catch (error) {
        console.error('Error fetching models, using fallback:', error);
        // Keep fallback models on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchModels();
  }, []);

  const currentModel = models.find(m => m.id === selectedModel);

  // Group models by provider
  const modelsByProvider = models.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, ModelInfo[]>);

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
        disabled={disabled || isLoading}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white">
        <span className="font-medium">
          {isLoading ? 'Loading...' : (currentModel?.displayName || 'Select Model')}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !isLoading && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            {Object.entries(modelsByProvider).map(([provider, providerModels]) => (
              <div key={provider} className="p-2">
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                  {providerLabels[provider as keyof typeof providerLabels]}
                </div>
                {providerModels.map(model => (
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
                    <div className="font-medium text-sm">{model.displayName}</div>
                    <div className="text-xs text-gray-500 truncate">{model.id}</div>
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
