import { NextResponse } from 'next/server';
import { callLLM, ProviderError, type LLMMessage } from '@/lib/llm';
import { checkRateLimit } from '@/lib/rateLimit';
import { getCapabilities } from '@/lib/capabilities';
import { getCannedReply, cannedReplyToStream } from '@/lib/cannedReplies';
import { withRequestMeta, validationError } from '@/lib/apiHelpers';
import { checkSubscription } from '@/lib/subscription';

export const runtime = 'nodejs';
export const maxDuration = 60;

function getClientIp(request: Request): string {
    const xff = request.headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0]?.trim() || 'unknown';
    const real = request.headers.get('x-real-ip');
    return real?.trim() || 'unknown';
}

export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'chat');
    try {
        const caps = await getCapabilities(request);

        // Demo branch, capability_real is false. Canned replies only,
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
                    requestId: meta.requestId,
                }, { status: 429, headers: meta.headers });
                res.headers.set('Retry-After', String(rl.retryAfterSeconds));
                return res;
            }

            const { message } = await request.json();
            if (!message) {
                return validationError('Message required', 'Send a message in the JSON body.', meta, { missing: ['message'] });
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
                    ...meta.headers,
                },
            });
        }

        // Real branch, authenticated + capability_real true.
        // Rate limit by verified user ID, respecting subscription tier.
        // Pro users get 600 req/hr; free users get 60 req/hr. The
        // subscription lookup also honors the bypass-email and
        // bypass-userId env vars (used in dev / staging) so an admin
        // doesn't get capped at the free limit during testing.
        const sub = await checkSubscription(caps.userId!);
        const rateLimitTier: 'free' | 'pro' = (sub.tier === 'pro' || sub.tier === 'enterprise') && sub.active
            ? 'pro'
            : 'free';
        const rl = await checkRateLimit(caps.userId!, rateLimitTier);
        if (!rl.allowed) {
            const res = NextResponse.json({
                error: `Rate limit exceeded (${rl.remaining} remaining). Try again in ${rl.retryAfterSeconds}s.`,
                fallback: true,
                retryAfterSeconds: rl.retryAfterSeconds,
                requestId: meta.requestId,
            }, { status: 429, headers: meta.headers });
            res.headers.set('Retry-After', String(rl.retryAfterSeconds));
            return res;
        }

        const { message, model, history, systemPrompt } = await request.json();

        if (!message) {
            return validationError('Message required', 'Send a message in the JSON body.', meta, { missing: ['message'] });
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

        const stream = await callLLM(modelKey, messages, { requestId: meta.requestId });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'Cache-Control': 'no-cache',
                ...meta.headers,
            },
        });
    } catch (err) {
        if (err instanceof ProviderError) {
            console.log(JSON.stringify({ at: meta.route, event: 'provider-missing', requestId: meta.requestId, startedAt: meta.startedAt, envVar: err.envVar }));
            return NextResponse.json({
                error: err.message,
                envVar: err.envVar,
                fallback: true,
                connectPrompt: `Connect ${err.envVar.replace('_API_KEY', '').replace('_', ' ')} in Settings → API Keys`,
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            }, { status: 503, headers: meta.headers });
        }
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.log(JSON.stringify({ at: meta.route, event: 'unhandled', requestId: meta.requestId, startedAt: meta.startedAt, error: errorMessage.slice(0, 240) }));
        return NextResponse.json({
            error: 'The model is temporarily unavailable. Try again in a moment, or switch to another model from the selector.',
            detail: errorMessage,
            fallback: true,
            requestId: meta.requestId,
            timestamp: meta.startedAt,
            retryable: true,
        }, { status: 503, headers: meta.headers });
    }
}
