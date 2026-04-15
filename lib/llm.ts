import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Route to the correct LLM provider based on model name */
export async function callLLM(model: string, messages: LLMMessage[]): Promise<ReadableStream> {
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

  // Fallback: use Claude Sonnet
  return callLLM('claude-sonnet-4-6', messages);
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
