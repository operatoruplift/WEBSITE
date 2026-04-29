import { NextResponse } from 'next/server';
import { callLLM, ProviderError, type LLMMessage } from '@/lib/llm';
import { checkRateLimit } from '@/lib/rateLimit';
import { getCapabilities } from '@/lib/capabilities';
import { getCannedReply, cannedReplyToStream } from '@/lib/cannedReplies';
import { withRequestMeta, validationError } from '@/lib/apiHelpers';
import { checkSubscription } from '@/lib/subscription';
import { safeLog } from '@/lib/safeLog';
import {
    getClientIp,
    resolveModelDisplayName,
    buildSystemPrompt,
    normalizeModelKey,
} from '@/lib/chat-helpers';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

        const modelKey = normalizeModelKey(model);
        const modelDisplayName = resolveModelDisplayName(modelKey);

        // Build message array
        const messages: LLMMessage[] = [];

        messages.push({
            role: 'system',
            content: buildSystemPrompt(modelDisplayName, systemPrompt),
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
            safeLog({ at: meta.route, event: 'provider-missing', requestId: meta.requestId, envVar: err.envVar });
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
        safeLog({ at: meta.route, event: 'unhandled', requestId: meta.requestId, error: errorMessage.slice(0, 240) });
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
