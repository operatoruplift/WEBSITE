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

  // Claude models
  if (model.startsWith('claude')) {
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

  // OpenAI / GPT models
  if (model.startsWith('gpt')) {
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

  // Fallback: use Claude
  return callLLM('claude-sonnet-4-6', messages);
}

/** Map friendly model names to actual API model IDs */
function mapModelId(model: string): string {
  const map: Record<string, string> = {
    'claude-opus-4-6': 'claude-opus-4-6',
    'claude-sonnet-4-6': 'claude-sonnet-4-6',
    'claude-haiku-4-5': 'claude-haiku-4-5-20251001',
    'gpt-4.1': 'gpt-4.1',
    'gpt-4.1-mini': 'gpt-4.1-mini',
    'gpt-4o': 'gpt-4o',
  };
  return map[model] || model;
}

/** Generate embedding vector for text (for memory search) */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000), // limit input size
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
