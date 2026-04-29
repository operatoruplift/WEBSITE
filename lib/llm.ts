import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { safeLog } from './safeLog';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CallLLMOptions {
  /** Opaque identifier for tracing, passed through to structured logs. */
  requestId?: string;
  /** Internal: current retry attempt (1-based). Callers should not set this. */
  attempt?: number;
}

const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [0, 500, 1500];

export function isRetryableError(err: unknown): boolean {
  // Missing-key errors are terminal, no amount of retrying fixes config.
  if (err instanceof ProviderError) return false;
  if (!(err instanceof Error)) return true;
  const name = err.name;
  if (name === 'AbortError' || name === 'TimeoutError') return true;
  const msg = err.message || '';
  // SDK-reported status codes ride on the message.
  if (/\b(429|500|502|503|504|522|524)\b/.test(msg)) return true;
  if (/ECONN|ETIMEDOUT|EAI_AGAIN|fetch failed|network/i.test(msg)) return true;
  return false;
}

function logCall(event: 'attempt' | 'success' | 'failed' | 'giveup', payload: Record<string, unknown>) {
  // safeLog preserves the existing `at: 'llm'`, `event`, and `ts` shape
  // and adds default redaction so any sensitive payload field (api keys,
  // bearer tokens leaking via SDK error stacks, etc.) gets scrubbed.
  safeLog({ at: 'llm', event, ...payload });
}

/**
 * Public entry, retries transient failures with exponential backoff.
 * On terminal errors (missing key, malformed request) the error is
 * surfaced immediately so the caller can show a specific fix message.
 */
export async function callLLM(model: string, messages: LLMMessage[], opts?: CallLLMOptions): Promise<ReadableStream> {
  const attempt = opts?.attempt ?? 1;
  const requestId = opts?.requestId;
  const started = Date.now();
  logCall('attempt', { requestId, model, attempt });
  try {
    const stream = await callLLMOnce(model, messages);
    logCall('success', { requestId, model, attempt, elapsedMs: Date.now() - started });
    return stream;
  } catch (err) {
    const elapsedMs = Date.now() - started;
    const errSummary = err instanceof Error ? `${err.name}: ${err.message}`.slice(0, 240) : String(err).slice(0, 240);
    logCall('failed', { requestId, model, attempt, elapsedMs, error: errSummary });
    if (!isRetryableError(err) || attempt >= MAX_ATTEMPTS) {
      logCall('giveup', { requestId, model, attempts: attempt, error: errSummary });
      throw err;
    }
    await new Promise(resolve => setTimeout(resolve, BACKOFF_MS[attempt]));
    return callLLM(model, messages, { ...opts, attempt: attempt + 1 });
  }
}

/** Single-shot provider dispatch. Kept private so retry logic can wrap it. */
async function callLLMOnce(model: string, messages: LLMMessage[]): Promise<ReadableStream> {
  const systemMessage = messages.find(m => m.role === 'system')?.content;
  const chatMessages = messages.filter(m => m.role !== 'system');

  // Claude models → Anthropic
  if (model.startsWith('claude')) {
    if (!process.env.ANTHROPIC_API_KEY) throw new ProviderError('ANTHROPIC_API_KEY');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const stream = anthropic.messages.stream({
      model: mapModelId(model),
      max_tokens: 4096,
      system: systemMessage || 'You are a helpful AI assistant on the Operator Uplift platform.',
      messages: chatMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    });
    return new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      },
    });
  }

  // GPT models → OpenAI
  if (model.startsWith('gpt')) {
    if (!process.env.OPENAI_API_KEY) throw new ProviderError('OPENAI_API_KEY');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const stream = await openai.chat.completions.create({
      model: mapModelId(model),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    });
    return new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });
  }

  // Gemini models → Google AI (OpenAI-compatible endpoint)
  if (model.startsWith('gemini')) {
    if (!process.env.GOOGLE_AI_API_KEY) throw new ProviderError('GOOGLE_AI_API_KEY');
    const openai = new OpenAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    });
    const stream = await openai.chat.completions.create({
      model: mapModelId(model),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    });
    return new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });
  }

  // Grok models → xAI (OpenAI-compatible endpoint)
  if (model.startsWith('grok')) {
    if (!process.env.XAI_API_KEY) throw new ProviderError('XAI_API_KEY');
    const openai = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });
    const stream = await openai.chat.completions.create({
      model: mapModelId(model),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    });
    return new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });
  }

  // DeepSeek models → DeepSeek (OpenAI-compatible endpoint)
  if (model.startsWith('deepseek')) {
    if (!process.env.DEEPSEEK_API_KEY) throw new ProviderError('DEEPSEEK_API_KEY');
    const openai = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com/v1',
    });
    const stream = await openai.chat.completions.create({
      model: mapModelId(model),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    });
    return new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });
  }

  // Llama / local models → Ollama (OpenAI-compatible endpoint at localhost)
  if (model.startsWith('llama') || model.startsWith('mistral') || model.startsWith('ollama')) {
    const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    // Test connectivity before attempting
    try {
      const health = await fetch(`${ollamaHost}/api/tags`, { signal: AbortSignal.timeout(3000) });
      if (!health.ok) throw new Error('Ollama not responding');
    } catch {
      throw new ProviderError('OLLAMA_HOST', `Ollama not running at ${ollamaHost}. Start Ollama or set OLLAMA_HOST.`);
    }
    const openai = new OpenAI({
      apiKey: 'ollama', // Ollama doesn't need a real key
      baseURL: `${ollamaHost}/v1`,
    });
    const stream = await openai.chat.completions.create({
      model: mapModelId(model),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    });
    return new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });
  }

  // Fallback: use Claude Sonnet. Dispatch via callLLMOnce so the retry
  // wrapper that called us doesn't nest a second retry budget.
  return callLLMOnce('claude-sonnet-4-6', messages);
}

/** Map friendly model names to actual API model IDs */
function mapModelId(model: string): string {
  const map: Record<string, string> = {
    // Anthropic
    'claude-opus-4-6': 'claude-opus-4-6',
    'claude-sonnet-4-6': 'claude-sonnet-4-6',
    'claude-haiku-4-5': 'claude-haiku-4-5-20251001',
    // OpenAI
    'gpt-4.1': 'gpt-4.1',
    'gpt-4.1-mini': 'gpt-4.1-mini',
    'gpt-4o': 'gpt-4o',
    // Google Gemini
    'gemini-2.5-pro': 'gemini-2.5-pro-preview-06-05',
    'gemini-2.5-flash': 'gemini-2.5-flash-preview-05-20',
    // xAI Grok
    'grok-3': 'grok-3',
    'grok-3-mini': 'grok-3-mini',
    // DeepSeek
    'deepseek-r1': 'deepseek-reasoner',
    'deepseek-v3': 'deepseek-chat',
    // Ollama / Local
    'llama-4-maverick': 'llama3.2:3b',
    'llama-3.2': 'llama3.2:3b',
    'mistral': 'mistral:latest',
    'ollama': 'llama3.2:3b',
  };
  return map[model] || model;
}

/** Generate embedding vector for text (for memory search) */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}

/** Collect a ReadableStream into a string */
export async function streamToString(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result;
}

/** Check which providers are configured */
export function getProviderStatus(): Record<string, { configured: boolean; envVar: string }> {
  return {
    anthropic: { configured: !!process.env.ANTHROPIC_API_KEY, envVar: 'ANTHROPIC_API_KEY' },
    openai: { configured: !!process.env.OPENAI_API_KEY, envVar: 'OPENAI_API_KEY' },
    google: { configured: !!process.env.GOOGLE_AI_API_KEY, envVar: 'GOOGLE_AI_API_KEY' },
    xai: { configured: !!process.env.XAI_API_KEY, envVar: 'XAI_API_KEY' },
    deepseek: { configured: !!process.env.DEEPSEEK_API_KEY, envVar: 'DEEPSEEK_API_KEY' },
    ollama: { configured: true, envVar: 'OLLAMA_HOST' }, // Always "configured", may not be running
  };
}

/** Error thrown when a provider API key is missing */
export class ProviderError extends Error {
  public envVar: string;
  constructor(envVar: string, message?: string) {
    super(message || `${envVar} not configured. Add it in Settings → API Keys.`);
    this.envVar = envVar;
    this.name = 'ProviderError';
  }
}
