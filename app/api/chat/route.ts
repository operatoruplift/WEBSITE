import { NextResponse } from 'next/server';
import { callLLM, ProviderError, type LLMMessage } from '@/lib/llm';
import { checkRateLimit } from '@/lib/rateLimit';
import { getOptionalUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // Rate limit by verified user ID (falls back to IP if no session)
    const user = await getOptionalUser(request);
    const rateLimitKey = user?.userId || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rl = await checkRateLimit(rateLimitKey, 'free'); // TODO: check user tier from Supabase for 'pro'
    if (!rl.allowed) {
      const res = NextResponse.json({
        error: `Rate limit exceeded (${rl.remaining} remaining). Try again in ${rl.retryAfterSeconds}s.`,
        fallback: true,
        retryAfterSeconds: rl.retryAfterSeconds,
      }, { status: 429 });
      res.headers.set('Retry-After', String(rl.retryAfterSeconds));
      return res;
    }

    const { message, model, history, systemPrompt } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const modelKey = (model || 'claude-sonnet-4-6').toLowerCase();

    // Map model key to display name so each model identifies itself correctly
    const MODEL_DISPLAY_NAMES: Record<string, string> = {
      'claude-opus-4-6': 'Claude Opus 4.6 (Anthropic)',
      'claude-sonnet-4-6': 'Claude Sonnet 4.6 (Anthropic)',
      'claude-haiku-4-5': 'Claude Haiku 4.5 (Anthropic)',
      'gpt-4.1': 'GPT-4.1 (OpenAI)',
      'gpt-4.1-mini': 'GPT-4.1 Mini (OpenAI)',
      'gpt-4o': 'GPT-4o (OpenAI)',
      'gemini-2.5-pro': 'Gemini 2.5 Pro (Google)',
      'gemini-2.5-flash': 'Gemini 2.5 Flash (Google)',
      'grok-3': 'Grok 3 (xAI)',
      'grok-3-mini': 'Grok 3 Mini (xAI)',
      'deepseek-r1': 'DeepSeek R1 (DeepSeek)',
      'deepseek-v3': 'DeepSeek V3 (DeepSeek)',
    };
    const modelDisplayName = MODEL_DISPLAY_NAMES[modelKey] || modelKey;

    // Build message array
    const messages: LLMMessage[] = [];

    const defaultPrompt = `You are ${modelDisplayName}, running on the Operator Uplift platform. You are concise, accurate, and helpful. You can assist with coding, research, writing, analysis, and general questions. When showing code, use markdown code blocks with language tags. Never claim to be a different model than ${modelDisplayName}.`;

    messages.push({
      role: 'system',
      content: systemPrompt ? `${systemPrompt}\n\nYou are ${modelDisplayName}. Never identify as a different model.` : defaultPrompt,
    });

    if (history && Array.isArray(history)) {
      const recent = history.slice(-20);
      for (const msg of recent) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: 'user', content: message });

    const stream = await callLLM(modelKey, messages);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    if (err instanceof ProviderError) {
      return NextResponse.json({
        error: err.message,
        envVar: err.envVar,
        fallback: true,
        connectPrompt: `Connect ${err.envVar.replace('_API_KEY', '').replace('_', ' ')} in Settings → API Keys`,
      }, { status: 503 });
    }
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage, fallback: true }, { status: 500 });
  }
}
