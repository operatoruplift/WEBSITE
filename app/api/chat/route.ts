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

    // Build message array
    const messages: LLMMessage[] = [];

    messages.push({
      role: 'system',
      content: systemPrompt || 'You are a helpful AI assistant on the Operator Uplift platform. You are concise, accurate, and helpful. You can assist with coding, research, writing, analysis, and general questions. When showing code, use markdown code blocks with language tags.',
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
