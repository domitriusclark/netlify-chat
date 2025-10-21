import { useState, useRef, useEffect } from "react";
import ModelSelector from "./ModelSelector";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Thread {
  id: string;
  resourceId: string;
  title?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

const DEFAULT_MODEL = 'gpt-4o-mini';
const RESOURCE_ID = 'default-user'; // In production, get from auth

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [showThreads, setShowThreads] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when not loading
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  // Load threads on mount
  useEffect(() => {
    loadThreads();
  }, []);

  async function loadThreads() {
    try {
      const response = await fetch(`/.netlify/functions/threads?resourceId=${RESOURCE_ID}`);
      const data = await response.json();
      setThreads(data.threads || []);
    } catch (error) {
      console.error("Error loading threads:", error);
    }
  }

  async function startNewConversation() {
    try {
      const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newConversation: true,
          modelId: selectedModel,
          resourceId: RESOURCE_ID
        }),
      });

      const data = await response.json();
      setCurrentThreadId(data.threadId);
      setMessages([]);
      await loadThreads();
      return data.threadId; // Return the threadId for immediate use
    } catch (error) {
      console.error("Error starting new conversation:", error);
      return null;
    }
  }

  async function loadThread(threadId: string) {
    try {
      const response = await fetch(
        `/.netlify/functions/threads?threadId=${threadId}`
      );
      const data = await response.json();

      // Load messages from thread
      setMessages(data.messages || []);
      setCurrentThreadId(threadId);
      setShowThreads(false);
    } catch (error) {
      console.error("Error loading thread:", error);
    }
  }

  async function deleteThread(threadId: string) {
    try {
      await fetch(`/.netlify/functions/threads?threadId=${threadId}`, {
        method: "DELETE"
      });

      // If we deleted the current thread, clear messages
      if (threadId === currentThreadId) {
        setCurrentThreadId(null);
        setMessages([]);
      }

      await loadThreads();
    } catch (error) {
      console.error("Error deleting thread:", error);
    }
  }

  async function processStreamedResponse(reader: ReadableStreamDefaultReader<Uint8Array>) {
    let assistantMessage = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Parse streamed JSON chunks
      const text = decoder.decode(value);
      const lines = text.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);

          if (data.type === 'chunk') {
            assistantMessage += data.content;
            setMessages((prev) => [
              ...prev.slice(0, -1),
              { role: "assistant", content: assistantMessage },
            ]);
          } else if (data.type === 'done') {
            // Reload threads to get updated title (if auto-generated)
            await loadThreads();
          } else if (data.type === 'error') {
            console.error('Stream error:', data.error);
            setMessages((prev) => [
              ...prev.slice(0, -1),
              {
                role: "assistant",
                content: `Error: ${data.error}`,
              },
            ]);
          }
        } catch (e) {
          console.error('Error parsing stream chunk:', e);
        }
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // If no thread exists, create one first
    let threadId = currentThreadId;
    if (!threadId) {
      threadId = await startNewConversation();

      // If still no threadId, something went wrong
      if (!threadId) {
        console.error("Failed to create thread");
        return;
      }
    }

    const userMessage = { role: "user" as const, content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          threadId: threadId,
          resourceId: RESOURCE_ID,
          modelId: selectedModel,
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      await processStreamedResponse(reader);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function renderMessage(message: Message, index: number) {
    return (
      <div
        key={index}
        className={`mb-4 p-3 rounded-lg max-w-[80%] ${
          message.role === "user"
            ? "ml-auto bg-blue-600 text-white"
            : "mr-auto bg-gray-100 text-gray-800"
        }`}>
        <strong>{message.role === "user" ? "You: " : "AI: "}</strong>
        <span className="whitespace-pre-wrap">{message.content}</span>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] border border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Threads Sidebar */}
      {showThreads && (
        <div className="w-64 border-r border-gray-200 overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <h3 className="font-semibold">Conversations</h3>
          </div>
          <div className="p-2 flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="text-center text-gray-500 text-sm p-4">
                No conversations yet
              </div>
            ) : (
              threads.map(thread => (
                <div
                  key={thread.id}
                  className={`mb-1 rounded hover:bg-gray-50 ${
                    thread.id === currentThreadId ? 'bg-blue-50' : ''
                  }`}>
                  <button
                    onClick={() => loadThread(thread.id)}
                    className="w-full text-left p-2">
                    <div className="text-sm truncate">
                      {thread.title || 'Untitled Conversation'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(thread.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteThread(thread.id);
                    }}
                    className="text-xs text-red-600 hover:text-red-800 px-2 pb-2">
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowThreads(!showThreads)}
              className="p-2 hover:bg-gray-100 rounded"
              title={showThreads ? "Hide conversations" : "Show conversations"}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              disabled={isLoading}
            />
          </div>
          <button
            type="button"
            onClick={startNewConversation}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
            disabled={isLoading}>
            New Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-lg font-medium mb-2">Welcome to Multi-Model Chat!</p>
              <p className="text-sm mb-4">Choose from 10+ AI models and start a conversation.</p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>✨ OpenAI: GPT-4 Omni, O3 Mini</p>
                <p>✨ Anthropic: Claude Sonnet, Opus, Haiku</p>
                <p>✨ Google: Gemini 2.5 Pro, Flash</p>
              </div>
            </div>
          )}
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex p-4 border-t border-gray-200 gap-2 flex-shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border border-gray-200 rounded text-base disabled:bg-gray-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer text-base disabled:bg-blue-400 disabled:cursor-not-allowed">
            {isLoading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
