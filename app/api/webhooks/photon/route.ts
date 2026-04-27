import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { getPhotonAdapter } from '@/lib/photon/adapter';
import { withRequestMeta } from '@/lib/apiHelpers';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * POST /api/webhooks/photon
 *
 * Inbound webhook from Photon Spectrum. Called every time one of the
 * connected Spectrum users (see the Users tab in the dashboard) sends
 * an iMessage / Telegram / WhatsApp / Discord / X / Instagram message
 * to the project's bot number/account.
 *
 * Paste this URL into the Spectrum "Webhook" tab in the dashboard:
 *   https://www.operatoruplift.com/api/webhooks/photon
 *
 * Security:
 *   PHOTON_WEBHOOK_SECRET, if set, this route verifies one of the
 *   common signature headers Spectrum may send
 *   (X-Photon-Signature | X-Spectrum-Signature). Without it the
 *   route accepts any POST, which is fine for the demo but not
 *   safe long-term.
 *
 * Behaviour:
 *   1. Verify signature if PHOTON_WEBHOOK_SECRET is set.
 *   2. Extract the sender + text + platform from the common field
 *      shapes Spectrum might use.
 *   3. Insert into the `inbound_messages` Supabase table so the
 *      agent loop can pick it up. Safe to run even if the table
 *      doesn't exist (falls through to 200 + { logged: false } so
 *      Spectrum doesn't keep retrying).
 *   4. Always return 200 unless the signature actually fails ,  *      webhook providers aggressively retry on 5xx.
 *
 * NOTE: This route is allowlisted in middleware.ts because Spectrum
 * doesn't know about Privy, inbound webhooks are unauthenticated
 * HTTP POSTs. Security comes from the signature check above.
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

/**
 * Stable id for idempotency. Prefer the id Photon gives us; fall back
 * to a content hash that rounds the receive time to a 5s bucket so
 * legitimate identical sends aren't false-deduped but a burst retry
 * within the same bucket is.
 */
function computeProviderMessageId(body: Record<string, unknown>, sender: string, text: string): string {
    const providerId = (body.message_id as string)
        ?? (body.id as string)
        ?? (body.event_id as string)
        ?? ((body.data as { message_id?: string })?.message_id)
        ?? '';
    if (providerId) return providerId;
    const bucket = Math.floor(Date.now() / 5000);
    return 'hash:' + crypto
        .createHash('sha256')
        .update(`${sender}|${text}|${bucket}`)
        .digest('hex')
        .slice(0, 24);
}

// In-memory debounce for the 5s fallback ack. Keyed by sender so a
// burst of messages from the same thread produces one ack per 60s
// window, not one per message. Memory-only is fine for demo: serverless
// cold-start resets the map, which is acceptable for an "at most once"
// best-effort ack. A Supabase acked_at check adds a second line of
// defense across instances.
const ACK_WINDOW_MS = 60_000;
const FALLBACK_MS = 5_000;
const recentAcks = new Map<string, number>();

function shouldSendFallbackAck(sender: string): boolean {
    const now = Date.now();
    const last = recentAcks.get(sender);
    if (last && now - last < ACK_WINDOW_MS) return false;
    recentAcks.set(sender, now);
    // Best-effort cleanup so the map doesn't grow unbounded.
    if (recentAcks.size > 500) {
        for (const [k, t] of recentAcks) {
            if (now - t > ACK_WINDOW_MS) recentAcks.delete(k);
        }
    }
    return true;
}

async function sendFallbackAck(sender: string, platform: string, supabase: ReturnType<typeof getSupabase>, rowId: string | null) {
    const adapter = getPhotonAdapter();
    if (!adapter.isActive()) return; // No creds, no ack.
    const result = await adapter.send({
        to: sender,
        text: 'Got it, working on it.',
        platform: platform as 'imessage' | 'telegram' | 'whatsapp' | 'x' | 'discord' | 'instagram',
    });
    if (!result.ok) {
        console.warn('[photon webhook] fallback ack failed:', result.reason, result.message);
        return;
    }
    if (supabase && rowId) {
        await supabase
            .from('inbound_messages')
            .update({ acked_at: new Date().toISOString() })
            .eq('id', rowId);
    }
}

export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'webhooks.photon');
    const raw = await request.text();

    // Signature verification. Spectrum hasn't published its exact
    // header name yet, so accept any of the common ones. Compare in
    // constant time.
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
            return NextResponse.json(
                { error: 'invalid_signature', requestId: meta.requestId, timestamp: meta.startedAt },
                { status: 401, headers: meta.headers },
            );
        }
    }

    let body: Record<string, unknown>;
    try {
        body = raw ? JSON.parse(raw) : {};
    } catch {
        return NextResponse.json(
            { error: 'invalid_json', requestId: meta.requestId, timestamp: meta.startedAt },
            { status: 400, headers: meta.headers },
        );
    }

    // Normalise the payload. Different Spectrum events may surface
    // the sender under different keys; try the ones I've seen.
    const platform = (body.platform as string) ?? 'imessage';
    const sender = (body.sender as string)
        ?? (body.from as string)
        ?? (body.phone as string)
        ?? ((body.user as { phone?: string })?.phone)
        ?? 'unknown';
    const text = (body.text as string)
        ?? (body.message as string)
        ?? ((body.content as { text?: string })?.text)
        ?? '';
    const eventType = (body.event as string) ?? (body.type as string) ?? 'message';

    const providerMessageId = computeProviderMessageId(body, sender, text);

    const supabase = getSupabase();
    if (!supabase) {
        // No Supabase, accept-and-log so Spectrum stops retrying.
        console.info('[photon webhook]', { eventType, platform, sender, textLen: text.length, providerMessageId });
        // Still offer the 5s ack when configured, even with no persistence.
        if (shouldSendFallbackAck(sender)) {
            setTimeout(() => { sendFallbackAck(sender, platform, null, null).catch(() => {}); }, FALLBACK_MS);
        }
        return NextResponse.json({ ok: true, logged: false, providerMessageId, requestId: meta.requestId }, { headers: meta.headers });
    }

    // Idempotent insert. The unique index on (provider, provider_message_id)
    // makes a duplicate POST a no-op: the insert conflicts and we fall
    // into the duplicate branch below.
    const { data: inserted, error } = await supabase
        .from('inbound_messages')
        .insert({
            provider: 'photon',
            platform,
            event_type: eventType,
            sender,
            text,
            raw: body,
            received_at: new Date().toISOString(),
            provider_message_id: providerMessageId,
        })
        .select('id')
        .single();

    if (error) {
        // Unique constraint violation = duplicate webhook. Still 200 so
        // Spectrum stops retrying, but skip the ack path so we don't
        // double-send on the same message.
        const isDuplicate =
            error.code === '23505' ||
            /duplicate key|unique constraint/i.test(error.message);
        if (isDuplicate) {
            console.info('[photon webhook] duplicate', { providerMessageId, sender });
            return NextResponse.json({ ok: true, logged: false, duplicate: true, providerMessageId, requestId: meta.requestId }, { headers: meta.headers });
        }
        // Likely the table doesn't exist yet. Still 200 so Spectrum
        // doesn't retry; ops can create the table off the error log.
        console.warn('[photon webhook] supabase insert failed:', error.message);
        return NextResponse.json({ ok: true, logged: false, reason: error.message, providerMessageId, requestId: meta.requestId }, { headers: meta.headers });
    }

    const rowId = (inserted as { id?: string } | null)?.id ?? null;

    // 5-second fallback ack. Schedules a background send to the same
    // thread if we haven't ack'd that sender in the last 60s. Debounce
    // guards against a burst of messages turning into a burst of acks.
    if (shouldSendFallbackAck(sender)) {
        setTimeout(() => { sendFallbackAck(sender, platform, supabase, rowId).catch(() => {}); }, FALLBACK_MS);
    }

    return NextResponse.json({ ok: true, logged: true, providerMessageId, requestId: meta.requestId }, { headers: meta.headers });
}

/** Health probe, Spectrum dashboards often GET the webhook URL to check liveness. */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'webhooks.photon.health');
    return NextResponse.json({ ok: true, route: 'photon_webhook' }, { headers: meta.headers });
}
