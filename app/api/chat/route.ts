import { NextResponse } from 'next/server';
import { callLLM, ProviderError, type LLMMessage } from '@/lib/llm';
import { checkRateLimit } from '@/lib/rateLimit';
import { getCapabilities } from '@/lib/capabilities';
import { getCannedReply, cannedReplyToStream } from '@/lib/cannedReplies';

export const runtime = 'nodejs';
export const maxDuration = 60;

function getClientIp(request: Request): string {
    const xff = request.headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0]?.trim() || 'unknown';
    const real = request.headers.get('x-real-ip');
    return real?.trim() || 'unknown';
}

function newRequestId(): string {
    // crypto.randomUUID() is available in the Node 18+ runtime used here.
    return `req_${crypto.randomUUID()}`;
}

export async function POST(request: Request) {
    const requestId = request.headers.get('x-request-id') || newRequestId();
    const startedAt = new Date().toISOString();
    try {
        const caps = await getCapabilities(request);

        // Demo branch — capability_real is false. Canned replies only,
        // zero API spend, 10/hr/IP. Never writes to Supabase.
        if (!caps.capability_real) {
            const ip = getClientIp(request);
            const rl = await checkRateLimit(ip, 'demo');
            if (!rl.allowed) {
                const res = NextResponse.json({
                    error: `Demo rate limit reached. Sign in with Google or add an API key to continue.`,
                    fallback: true,
                    demoMode: true,
                    retryAfterSeconds: rl.retryAfterSeconds,
                }, { status: 429 });
                res.headers.set('Retry-After', String(rl.retryAfterSeconds));
                return res;
            }

            const { message } = await request.json();
            if (!message) {
                return NextResponse.json({ error: 'Message required' }, { status: 400 });
            }
            const reply = getCannedReply(String(message));
            const stream = cannedReplyToStream(reply.text);
            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Transfer-Encoding': 'chunked',
                    'Cache-Control': 'no-cache',
                    'X-Demo-Mode': '1',
                    'X-Demo-Beat': reply.beat,
                },
            });
        }

        // Real branch — authenticated + capability_real true.
        // Rate limit by verified user ID.
        const rl = await checkRateLimit(caps.userId!, 'free'); // TODO: check user tier for 'pro'
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

        const stream = await callLLM(modelKey, messages, { requestId });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'Cache-Control': 'no-cache',
                'X-Request-Id': requestId,
            },
        });
    } catch (err) {
        if (err instanceof ProviderError) {
            console.log(JSON.stringify({ at: 'chat', event: 'provider-missing', requestId, startedAt, envVar: err.envVar }));
            return NextResponse.json({
                error: err.message,
                envVar: err.envVar,
                fallback: true,
                connectPrompt: `Connect ${err.envVar.replace('_API_KEY', '').replace('_', ' ')} in Settings → API Keys`,
                requestId,
                timestamp: startedAt,
            }, { status: 503, headers: { 'X-Request-Id': requestId } });
        }
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.log(JSON.stringify({ at: 'chat', event: 'unhandled', requestId, startedAt, error: errorMessage.slice(0, 240) }));
        return NextResponse.json({
            error: 'The model is temporarily unavailable. Try again in a moment, or switch to another model from the selector.',
            detail: errorMessage,
            fallback: true,
            requestId,
            timestamp: startedAt,
            retryable: true,
        }, { status: 503, headers: { 'X-Request-Id': requestId } });
    }
}
