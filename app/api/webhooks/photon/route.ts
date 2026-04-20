import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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
 *   4. Always return 200 unless the signature actually fails,
 *      webhook providers aggressively retry on 5xx.
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

export async function POST(request: Request) {
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
            return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
        }
    }

    let body: Record<string, unknown>;
    try {
        body = raw ? JSON.parse(raw) : {};
    } catch {
        return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
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

    const supabase = getSupabase();
    if (!supabase) {
        // No Supabase, accept-and-log so Spectrum stops retrying.
        console.info('[photon webhook]', { eventType, platform, sender, textLen: text.length });
        return NextResponse.json({ ok: true, logged: false });
    }

    const { error } = await supabase
        .from('inbound_messages')
        .insert({
            provider: 'photon',
            platform,
            event_type: eventType,
            sender,
            text,
            raw: body,
            received_at: new Date().toISOString(),
        });

    if (error) {
        // Likely the table doesn't exist yet. Still 200 so Spectrum
        // doesn't retry; ops can create the table off the error log.
        console.warn('[photon webhook] supabase insert failed:', error.message);
        return NextResponse.json({ ok: true, logged: false, reason: error.message });
    }

    return NextResponse.json({ ok: true, logged: true });
}

/** Health probe, Spectrum dashboards often GET the webhook URL to check liveness. */
export async function GET() {
    return NextResponse.json({ ok: true, route: 'photon_webhook' });
}
