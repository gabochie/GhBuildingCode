export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOpts {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
}

export interface ProviderResult {
  content: string;
  model: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

interface ProviderEndpoint {
  baseUrl: string;
  apiKey: string;
  model: string;
}

function getProviders(): ProviderEndpoint[] {
  const providers: ProviderEndpoint[] = [];

  // Primary: free-tier provider (Gemini, Groq, etc.)
  if (process.env.AI_API_KEY) {
    providers.push({
      baseUrl: (process.env.AI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai").replace(/\/$/, ""),
      apiKey: process.env.AI_API_KEY,
      model: process.env.AI_MODEL || "gemini-2.0-flash"
    });
  }

  // Fallback: paid provider (OpenRouter, OpenAI, etc.)
  if (process.env.AI_FALLBACK_API_KEY) {
    providers.push({
      baseUrl: (process.env.AI_FALLBACK_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/$/, ""),
      apiKey: process.env.AI_FALLBACK_API_KEY,
      model: process.env.AI_FALLBACK_MODEL || "openai/gpt-4o-mini"
    });
  }

  return providers;
}

export function aiConfigured(): boolean {
  return getProviders().length > 0;
}

async function callProvider(
  provider: ProviderEndpoint,
  messages: ChatMessage[],
  opts: ChatCompletionOpts
): Promise<ProviderResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  try {
    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: opts.model || provider.model,
        messages,
        temperature: opts.temperature ?? 0.3,
        max_tokens: opts.maxTokens ?? 1200,
        ...(opts.json ? { response_format: { type: "json_object" } } : {})
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AI provider error ${res.status}: ${text.slice(0, 300)}`);
    }

    const data = await res.json();
    const content: string =
      data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? "";
    return {
      content,
      model: data?.model || opts.model || provider.model,
      usage: data?.usage
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Chat completion with automatic fallback.
 * Tries primary (free-tier) first, falls back to paid provider on failure.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  opts: ChatCompletionOpts = {}
): Promise<ProviderResult> {
  const providers = getProviders();
  if (providers.length === 0) {
    throw new Error("AI provider not configured. Set AI_API_KEY in your .env file.");
  }

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      return await callProvider(provider, messages, opts);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // If this was the only provider, throw immediately
      if (providers.length === 1) throw lastError;
      // Otherwise log and try next provider
      console.warn(`[ai] ${provider.model} failed, trying fallback...`, lastError.message);
    }
  }

  throw lastError || new Error("All AI providers failed.");
}
