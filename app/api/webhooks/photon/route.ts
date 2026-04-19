import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { newRequestId } from '@/lib/apiHelpers';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * POST /api/webhooks/photon
 *
 * Inbound webhook from Photon Spectrum. Extracts sender / recipient /
 * threadId / messageId / text, dedupes by (provider, message_id), and
 * writes to `inbound_messages` so the agent loop can pick it up.
 *
 * Transport-only. No LLM involvement — the sibling /api/photon/imessage/send
 * route does the outbound. A future PR wires the agent pipeline on top
 * of this loopback.
 *
 * Paste this URL into the Spectrum "Webhook" tab:
 *   https://www.operatoruplift.com/api/webhooks/photon
 *
 * Env:
 *   PHOTON_WEBHOOK_SECRET — if set, verifies HMAC-SHA256 over the raw
 *     body against one of x-photon-signature / x-spectrum-signature /
 *     x-signature, stripping optional `sha256=` prefix.
 *
 * Idempotency:
 *   A unique index on (provider, message_id) in Supabase rejects
 *   duplicates. On conflict we return 200 with status:"duplicate" so
 *   Spectrum stops retrying without treating it as a failure.
 *
 * Always returns 200 unless the signature actually fails — webhook
 * providers aggressively retry on 5xx.
 *
 * Allowlisted in middleware.ts because Spectrum does not know about
 * Privy. Security comes from the signature check.
 */

function hmacHex(secret: string, body: string): string {
    return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function constantTimeEq(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    try {
        return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
        return false;
    }
}

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}

function last4(s: string | null | undefined): string {
    if (!s) return '----';
    const digits = s.replace(/\D/g, '');
    return digits.length >= 4 ? digits.slice(-4) : s.slice(-4);
}

/**
 * Normalize an unknown-shape Spectrum payload into the fields we care
 * about. Returns every field as a string-or-undefined — never throws.
 */
interface Normalized {
    platform: string;
    eventType: string;
    sender?: string;
    recipient?: string;
    threadId?: string;
    messageId?: string;
    text?: string;
}

function normalize(body: Record<string, unknown>): Normalized {
    const asStr = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined);
    const nested = <T>(path: string[], obj: Record<string, unknown>): T | undefined => {
        let cur: unknown = obj;
        for (const k of path) {
            if (!cur || typeof cur !== 'object') return undefined;
            cur = (cur as Record<string, unknown>)[k];
        }
        return cur as T;
    };

    const platform = asStr(body.platform) ?? 'imessage';
    const eventType = asStr(body.event) ?? asStr(body.type) ?? 'message';

    const sender = asStr(body.sender)
        ?? asStr(body.from)
        ?? asStr(body.phone)
        ?? asStr(nested(['user', 'phone'], body))
        ?? asStr(nested(['sender', 'phone'], body));

    const recipient = asStr(body.recipient)
        ?? asStr(body.to)
        ?? asStr(body.bot)
        ?? asStr(nested(['project', 'phone'], body));

    const threadId = asStr(body.thread_id)
        ?? asStr(body.threadId)
        ?? asStr(body.conversation_id)
        ?? asStr(body.conversationId)
        ?? asStr(nested(['thread', 'id'], body))
        ?? asStr(nested(['conversation', 'id'], body));

    const messageId = asStr(body.message_id)
        ?? asStr(body.messageId)
        ?? asStr(body.id)
        ?? asStr(body.uuid)
        ?? asStr(nested(['message', 'id'], body));

    const text = asStr(body.text)
        ?? asStr(body.message)
        ?? asStr(nested(['content', 'text'], body))
        ?? asStr(nested(['message', 'text'], body));

    return { platform, eventType, sender, recipient, threadId, messageId, text };
}

export async function POST(request: Request) {
    const requestId = request.headers.get('x-request-id') || newRequestId();
    const startedAt = new Date().toISOString();
    const raw = await request.text();

    // Signature verification on the raw body. If PHOTON_WEBHOOK_SECRET
    // is not set the route accepts any POST — fine for local dev, not
    // safe for prod. Set the secret in Vercel env.
    const secret = process.env.PHOTON_WEBHOOK_SECRET;
    if (secret) {
        const provided = (
            request.headers.get('x-photon-signature')
            || request.headers.get('x-spectrum-signature')
            || request.headers.get('x-signature')
            || ''
        ).replace(/^sha256=/, '');
        const expected = hmacHex(secret, raw);
        if (!provided || !constantTimeEq(provided, expected)) {
            console.log(JSON.stringify({ at: 'photon.webhook', event: 'invalid-signature', requestId, ts: startedAt }));
            return NextResponse.json(
                { error: 'invalid_signature', requestId, timestamp: startedAt },
                { status: 401, headers: { 'X-Request-Id': requestId } },
            );
        }
    }

    let body: Record<string, unknown>;
    try {
        body = raw ? JSON.parse(raw) : {};
    } catch {
        return NextResponse.json(
            { error: 'invalid_json', requestId, timestamp: startedAt },
            { status: 400, headers: { 'X-Request-Id': requestId } },
        );
    }

    const n = normalize(body);

    console.log(JSON.stringify({
        at: 'photon.webhook', event: 'received', requestId, ts: startedAt,
        platform: n.platform, eventType: n.eventType,
        senderLast4: last4(n.sender), threadId: n.threadId, messageId: n.messageId,
        textLen: n.text?.length ?? 0,
    }));

    const supabase = getSupabase();
    if (!supabase) {
        // No Supabase configured — accept-and-log so Spectrum doesn't retry.
        return NextResponse.json(
            { ok: true, logged: false, reason: 'supabase_not_configured', requestId, timestamp: startedAt, status: 'new' },
            { headers: { 'X-Request-Id': requestId } },
        );
    }

    // Idempotency: if we've seen this message_id before, short-circuit.
    // The unique index on (provider, message_id) also guarantees this at
    // the DB layer; the select-first path keeps the reply fast and lets
    // us distinguish 'new' vs 'duplicate' in the response.
    if (n.messageId) {
        const { data: existing } = await supabase
            .from('inbound_messages')
            .select('id, request_id')
            .eq('provider', 'photon')
            .eq('message_id', n.messageId)
            .maybeSingle();
        if (existing) {
            console.log(JSON.stringify({
                at: 'photon.webhook', event: 'duplicate', requestId, ts: startedAt,
                messageId: n.messageId, original_request_id: existing.request_id,
            }));
            return NextResponse.json(
                { ok: true, logged: true, status: 'duplicate', requestId, timestamp: startedAt },
                { headers: { 'X-Request-Id': requestId } },
            );
        }
    }

    const { error } = await supabase
        .from('inbound_messages')
        .insert({
            provider: 'photon',
            platform: n.platform,
            event_type: n.eventType,
            sender: n.sender ?? null,
            recipient: n.recipient ?? null,
            thread_id: n.threadId ?? null,
            message_id: n.messageId ?? null,
            text: n.text ?? null,
            raw: body,
            received_at: startedAt,
            request_id: requestId,
            status: 'new',
        });

    if (error) {
        // Likely the table doesn't exist yet (see lib/photon/migration.sql).
        // Still 200 — Spectrum would spin on retries otherwise.
        console.warn(JSON.stringify({
            at: 'photon.webhook', event: 'insert-failed', requestId, ts: startedAt,
            reason: error.message.slice(0, 240),
        }));
        return NextResponse.json(
            { ok: true, logged: false, reason: error.message, requestId, timestamp: startedAt },
            { headers: { 'X-Request-Id': requestId } },
        );
    }

    return NextResponse.json(
        { ok: true, logged: true, status: 'new', requestId, timestamp: startedAt, threadId: n.threadId, messageId: n.messageId },
        { headers: { 'X-Request-Id': requestId } },
    );
}

/** Health probe — Spectrum dashboards often GET the webhook URL to check liveness. */
export async function GET() {
    return NextResponse.json({ ok: true, route: 'photon_webhook' });
}
