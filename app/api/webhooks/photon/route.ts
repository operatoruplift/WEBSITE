import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPhotonAdapter } from '@/lib/photon/adapter';
import { runAgentReply } from '@/lib/photon/agent';
import {
    verifyWebhookSignature,
    computeProviderMessageId,
    normalizeWebhookPayload,
    makeFallbackAckGate,
} from '@/lib/photon/webhook-helpers';
import { withRequestMeta } from '@/lib/apiHelpers';
import { safeLog, safeWarn } from '@/lib/safeLog';

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

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}

// In-memory debounce for agent replies. Keyed by sender so a burst
// of messages from the same thread doesn't produce a flood of LLM
// calls. Memory-only is fine: serverless cold-start resets the map,
// which is acceptable for a "best effort" debounce. A Supabase
// processed_at check adds a second line of defense across instances.
const agentGate = makeFallbackAckGate();

function shouldRunAgent(sender: string): boolean {
    return agentGate.shouldSend(sender);
}

type Platform = 'imessage' | 'telegram' | 'whatsapp' | 'x' | 'discord' | 'instagram';

async function processWithAgent(
    sender: string,
    text: string,
    platform: string,
    supabase: ReturnType<typeof getSupabase>,
    rowId: string | null,
    requestId: string,
) {
    const adapter = getPhotonAdapter();
    const result = await runAgentReply(
        { sender, text, platform: platform as Platform },
        adapter,
        requestId,
    );
    if (!result.ok) {
        safeWarn({
            at: 'webhooks.photon',
            event: 'agent_failed',
            requestId,
            reason: result.reason,
            message: result.message?.slice(0, 240),
            elapsedMs: result.elapsedMs,
        });
        return;
    }
    safeLog({
        at: 'webhooks.photon',
        event: 'agent_replied',
        requestId,
        source: result.source,
        replyLen: result.replyText.length,
        elapsedMs: result.elapsedMs,
    });
    if (supabase && rowId) {
        await supabase
            .from('inbound_messages')
            .update({
                processed_at: new Date().toISOString(),
                reply_message_id: result.messageId,
                acked_at: new Date().toISOString(),
            })
            .eq('id', rowId);
    }
}

export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'webhooks.photon');
    const raw = await request.text();

    // Signature verification. Spectrum hasn't published its exact
    // header name yet, so accept any of the common ones. Compare in
    // constant time.
    const provided =
        request.headers.get('x-photon-signature')
        || request.headers.get('x-spectrum-signature')
        || request.headers.get('x-signature');
    const sigCheck = verifyWebhookSignature({
        secret: process.env.PHOTON_WEBHOOK_SECRET,
        body: raw,
        provided,
    });
    if (!sigCheck.ok) {
        return NextResponse.json(
            { error: 'invalid_signature', requestId: meta.requestId, timestamp: meta.startedAt },
            { status: 401, headers: meta.headers },
        );
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

    const { platform, sender, text, eventType } = normalizeWebhookPayload(body);
    const providerMessageId = computeProviderMessageId(body, sender, text);

    const supabase = getSupabase();
    if (!supabase) {
        // No Supabase, accept-and-log so Spectrum stops retrying.
        safeLog({
            at: meta.route,
            event: 'no_supabase_log_only',
            requestId: meta.requestId,
            eventType,
            platform,
            sender,
            textLen: text.length,
            providerMessageId,
        });
        // Still run the agent when configured, even with no persistence,
        // so the user gets a real reply on iMessage. Awaiting keeps us
        // inside the maxDuration budget (15s) so Spectrum doesn't see a
        // 5xx and retry; the typical Haiku + Photon round trip is ~2-4s.
        if (shouldRunAgent(sender)) {
            await processWithAgent(sender, text, platform, null, null, meta.requestId);
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
            safeLog({
                at: meta.route,
                event: 'duplicate_message',
                requestId: meta.requestId,
                providerMessageId,
                sender,
            });
            return NextResponse.json({ ok: true, logged: false, duplicate: true, providerMessageId, requestId: meta.requestId }, { headers: meta.headers });
        }
        // Likely the table doesn't exist yet (run the migration in
        // lib/photon-webhook-migration.sql). Still 200 so Spectrum
        // doesn't retry, and still run the agent so the user gets an
        // iMessage reply even before the audit table is provisioned.
        safeWarn({
            at: meta.route,
            event: 'supabase_insert_failed',
            requestId: meta.requestId,
            error: error.message,
        });
        if (shouldRunAgent(sender)) {
            await processWithAgent(sender, text, platform, null, null, meta.requestId);
        }
        return NextResponse.json({ ok: true, logged: false, reason: error.message, providerMessageId, requestId: meta.requestId }, { headers: meta.headers });
    }

    const rowId = (inserted as { id?: string } | null)?.id ?? null;

    // Synchronous agent reply. We await Claude Haiku + Photon send
    // before returning 200 so the user sees a real iMessage response
    // within the same webhook lifetime. The setTimeout-based fallback
    // we used before relied on the function instance staying warm
    // after returning, which Vercel doesn't guarantee. The 60s sender
    // gate guards against a burst turning into a flood of LLM calls.
    if (shouldRunAgent(sender)) {
        await processWithAgent(sender, text, platform, supabase, rowId, meta.requestId);
    }

    return NextResponse.json({ ok: true, logged: true, providerMessageId, requestId: meta.requestId }, { headers: meta.headers });
}

/** Health probe, Spectrum dashboards often GET the webhook URL to check liveness. */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'webhooks.photon.health');
    return NextResponse.json({ ok: true, route: 'photon_webhook' }, { headers: meta.headers });
}
