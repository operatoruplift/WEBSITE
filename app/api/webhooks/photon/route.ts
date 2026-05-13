import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPhotonAdapter } from '@/lib/photon/adapter';
import { runAgentReply } from '@/lib/photon/agent';
import { matchKeyword } from '@/lib/photon/keyword-replies';
import { isOptedOut, recordOptOut, clearOptOut } from '@/lib/photon/opt-outs';
import { loadHistory } from '@/lib/photon/history';
import { getUserBySender, updateUserPrefs, type ImessageUser } from '@/lib/photon/users';
import { classifyIntent } from '@/lib/photon/intents';
import { getWeather } from '@/lib/photon/weather';
import { tryPendingResponse } from '@/lib/photon/pending-replies';
import { createPending } from '@/lib/photon/pending-actions';
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
 *   4. Always return 200 unless the signature actually fails;
 *      webhook providers aggressively retry on 5xx.
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

/**
 * Marks the inbound row as processed + saves reply_text. Falls back
 * to the legacy schema (no reply_text column) if the migration hasn't
 * been applied yet, so an old database keeps working through the
 * upgrade window.
 */
async function markReplied(
    supabase: ReturnType<typeof getSupabase>,
    rowId: string | null,
    replyMessageId: string,
    replyText: string,
) {
    if (!supabase || !rowId) return;
    const now = new Date().toISOString();
    const truncated = replyText.length > 1000 ? replyText.slice(0, 1000) : replyText;

    const full = await supabase
        .from('inbound_messages')
        .update({
            processed_at: now,
            reply_message_id: replyMessageId,
            acked_at: now,
            reply_text: truncated,
        })
        .eq('id', rowId);

    if (full.error && /column .*reply_text.* does not exist|Could not find the column .*reply_text/i.test(full.error.message || '')) {
        await supabase
            .from('inbound_messages')
            .update({
                processed_at: now,
                reply_message_id: replyMessageId,
                acked_at: now,
            })
            .eq('id', rowId);
    }
}

/**
 * Wrapper around tryKeywordReply + tryIntentReply + processWithAgent
 * that honors the persisted opt-out list. An opted-out sender's
 * messages still get logged for audit, but no reply (keyword,
 * intent, or LLM) goes out, EXCEPT a START keyword which is allowed
 * through so the sender can re-enable replies without help.
 *
 * Dispatch order:
 *   1. Opt-out gate
 *   2. Pending YES/NO (only fires if a pending row exists)
 *   3. Keyword short-circuit (STOP/START/HELP/PING/STATUS)
 *   4. Intent classifier (set_zodiac, set_location, set_model, weather)
 *   5. Agent fallback (Claude Haiku)
 */
async function dispatchReply(
    sender: string,
    text: string,
    platform: string,
    user: ImessageUser | null,
    supabase: ReturnType<typeof getSupabase>,
    rowId: string | null,
    requestId: string,
) {
    const optOut = await isOptedOut(supabase, sender, requestId);
    const startKeyword = matchKeyword(text)?.keyword === 'start';
    if (optOut.optedOut && !startKeyword) {
        safeLog({
            at: 'webhooks.photon',
            event: 'opted_out_skip',
            requestId,
            sender,
            optedOutAt: optOut.optedOutAt,
        });
        return;
    }
    if (await tryPendingReply(sender, text, platform, supabase, rowId, requestId)) return;
    if (await tryKeywordReply(sender, text, platform, supabase, rowId, requestId)) return;
    if (await tryIntentReply(sender, text, platform, user, supabase, rowId, requestId)) return;
    await processWithAgent(sender, text, platform, user, supabase, rowId, requestId);
}

/**
 * If the inbound text is a YES/NO and a pending tool-call row exists
 * for this sender, consume it and reply. Otherwise return false so
 * the dispatch chain continues. Pending lives BEFORE keyword because
 * "stop" inside a confirm/cancel exchange is most likely cancelling
 * the staged action, not opting out of all messages.
 */
async function tryPendingReply(
    sender: string,
    text: string,
    platform: string,
    supabase: ReturnType<typeof getSupabase>,
    rowId: string | null,
    requestId: string,
): Promise<boolean> {
    const r = await tryPendingResponse(supabase, sender, text, requestId);
    if (!r.replyText) return false;

    const adapter = getPhotonAdapter();
    if (!adapter.isActive()) {
        safeWarn({ at: 'webhooks.photon', event: 'pending_no_adapter', requestId, matched: r.matched });
        return false;
    }
    const send = await adapter.send({ to: sender, text: r.replyText, platform: platform as Platform });
    if (!send.ok) {
        safeWarn({
            at: 'webhooks.photon',
            event: 'pending_send_failed',
            requestId,
            matched: r.matched,
            reason: send.reason,
        });
        return false;
    }
    safeLog({
        at: 'webhooks.photon',
        event: 'pending_replied',
        requestId,
        matched: r.matched,
        consumed: r.consumed,
        replyLen: r.replyText.length,
    });
    await markReplied(supabase, rowId, send.messageId, r.replyText);
    return true;
}

type Platform = 'imessage' | 'telegram' | 'whatsapp' | 'x' | 'discord' | 'instagram';

/**
 * Short-circuit reply for one-word triggers like STOP / HELP / PING.
 * Skips the LLM entirely; canned text goes straight to the Photon
 * adapter. Returns true if it handled the message.
 */
async function tryKeywordReply(
    sender: string,
    text: string,
    platform: string,
    supabase: ReturnType<typeof getSupabase>,
    rowId: string | null,
    requestId: string,
): Promise<boolean> {
    const match = matchKeyword(text);
    if (!match) return false;

    const adapter = getPhotonAdapter();
    if (!adapter.isActive()) {
        safeWarn({
            at: 'webhooks.photon',
            event: 'keyword_no_adapter',
            requestId,
            keyword: match.keyword,
        });
        return false;
    }

    const send = await adapter.send({
        to: sender,
        text: match.reply,
        platform: platform as Platform,
    });
    if (!send.ok) {
        safeWarn({
            at: 'webhooks.photon',
            event: 'keyword_send_failed',
            requestId,
            keyword: match.keyword,
            reason: send.reason,
        });
        return false;
    }
    safeLog({
        at: 'webhooks.photon',
        event: 'keyword_replied',
        requestId,
        keyword: match.keyword,
        optOut: match.optOut,
        replyLen: match.reply.length,
    });
    await markReplied(supabase, rowId, send.messageId, match.reply);
    // Persist the opt-out flag so subsequent texts from this sender
    // get skipped instead of paying for another round trip. START
    // clears the flag so users can re-enable replies any time.
    if (supabase) {
        if (match.optOut) {
            await recordOptOut(supabase, sender, match.keyword, requestId);
        } else if (match.keyword === 'start') {
            await clearOptOut(supabase, sender, requestId);
        }
    }
    return true;
}

/**
 * Cheap intent dispatch: classifyIntent → typed handler. Returns
 * true when an intent was matched (and a reply was sent), false to
 * fall through to the LLM agent path. Verified-only intents (the
 * three set_* commands) bounce the user to /integrations when
 * their phone isn't linked yet so the call site stays simple.
 */
async function tryIntentReply(
    sender: string,
    text: string,
    platform: string,
    user: ImessageUser | null,
    supabase: ReturnType<typeof getSupabase>,
    rowId: string | null,
    requestId: string,
): Promise<boolean> {
    const intent = classifyIntent(text);
    if (intent.intent === 'chat') return false;

    const adapter = getPhotonAdapter();
    if (!adapter.isActive()) {
        safeWarn({ at: 'webhooks.photon', event: 'intent_no_adapter', requestId, intent: intent.intent });
        return false;
    }

    const verifyHint = 'To set preferences, verify your phone first at operatoruplift.com/integrations.';
    let reply: string;

    switch (intent.intent) {
        case 'set_zodiac':
            if (!user?.verified_at) { reply = verifyHint; break; }
            await updateUserPrefs(supabase, sender, { zodiac: intent.sign }, requestId);
            reply = `Got it, you're a ${intent.sign}.`;
            break;
        case 'set_location':
            if (!user?.verified_at) { reply = verifyHint; break; }
            await updateUserPrefs(supabase, sender, { location: intent.location }, requestId);
            reply = `Got it, location set to ${intent.location}.`;
            break;
        case 'set_model':
            if (!user?.verified_at) { reply = verifyHint; break; }
            await updateUserPrefs(supabase, sender, { model_pref: intent.model }, requestId);
            reply = `Got it, switched to ${intent.model}.`;
            break;
        case 'weather': {
            const loc = intent.location ?? user?.location ?? null;
            if (!loc) {
                reply = 'Tell me a city, like "weather in San Francisco". You can also set a default with "I\u2019m in [city]" once your phone is verified.';
                break;
            }
            const weather = await getWeather(loc, requestId);
            if (weather.ok) {
                reply = weather.summary;
            } else if (weather.reason === 'not_configured') {
                reply = 'Weather lookup is not configured yet. Ask me something else?';
            } else if (weather.reason === 'geocode_failed') {
                reply = `Couldn\u2019t find "${loc}" on a map. Try a different city or include the country.`;
            } else {
                reply = `Couldn\u2019t fetch weather for "${loc}" right now. Try again in a minute.`;
            }
            break;
        }
        case 'email_draft': {
            if (!user?.verified_at) {
                reply = intent.mode === 'send'
                    ? 'To send email from iMessage, verify your phone first at operatoruplift.com/integrations.'
                    : 'To draft email from iMessage, verify your phone first at operatoruplift.com/integrations.';
                break;
            }
            // "send" verb -> gmail.send (delivered immediately on YES).
            // "draft" / "email" verb -> gmail.draft (saved to Drafts).
            // The YES/NO handler from PR #428 dispatches to the right
            // executor based on action_type.
            const previewBody = intent.body.length > 120
                ? `${intent.body.slice(0, 117)}...`
                : intent.body;
            const verb = intent.mode === 'send' ? 'Send' : 'Draft';
            const action_type = intent.mode === 'send' ? 'gmail.send' : 'gmail.draft';
            const previewText = `${verb} to ${intent.to}: ${previewBody}\nReply YES to confirm or NO to cancel.`;
            const created = await createPending(
                supabase,
                sender,
                action_type,
                { to: intent.to, body: intent.body },
                previewText,
                requestId,
            );
            if (!created.ok) {
                reply = created.tableMissing
                    ? 'Email staging is not enabled yet (run the pending_actions migration).'
                    : 'Could not stage the email. Try again in a minute.';
            } else {
                reply = previewText;
            }
            break;
        }
        case 'calendar_create': {
            if (!user?.verified_at) {
                reply = 'To create calendar events from iMessage, verify your phone first at operatoruplift.com/integrations.';
                break;
            }
            // Stage as a pending action. The connector layer at YES
            // confirm time will resolve the raw `when` substring to a
            // concrete ISO datetime via Claude or chrono-node before
            // calling the Calendar API.
            const previewTitle = intent.title.length > 80
                ? `${intent.title.slice(0, 77)}...`
                : intent.title;
            const previewText = `New event "${previewTitle}" ${intent.when}.\nReply YES to stage this event or NO to cancel.`;
            const created = await createPending(
                supabase,
                sender,
                'calendar.create',
                { title: intent.title, when: intent.when },
                previewText,
                requestId,
            );
            if (!created.ok) {
                reply = created.tableMissing
                    ? 'Event staging is not enabled yet (run the pending_actions migration).'
                    : 'Could not stage the event. Try again in a minute.';
            } else {
                reply = previewText;
            }
            break;
        }
        default:
            return false;
    }

    const send = await adapter.send({
        to: sender,
        text: reply,
        platform: platform as Platform,
    });
    if (!send.ok) {
        safeWarn({
            at: 'webhooks.photon',
            event: 'intent_send_failed',
            requestId,
            intent: intent.intent,
            reason: send.reason,
        });
        return false;
    }
    safeLog({
        at: 'webhooks.photon',
        event: 'intent_replied',
        requestId,
        intent: intent.intent,
        verified: Boolean(user?.verified_at),
        replyLen: reply.length,
    });
    await markReplied(supabase, rowId, send.messageId, reply);
    return true;
}

async function processWithAgent(
    sender: string,
    text: string,
    platform: string,
    user: ImessageUser | null,
    supabase: ReturnType<typeof getSupabase>,
    rowId: string | null,
    requestId: string,
) {
    const adapter = getPhotonAdapter();
    // Load up to 5 prior completed turns so Claude Haiku gets multi-
    // turn context. Best-effort: if Supabase is unset, the table is
    // missing, or reply_text predates the migration, history is
    // empty and the agent runs one-shot.
    const history = await loadHistory(supabase, sender, 5, requestId);
    const result = await runAgentReply(
        { sender, text, platform: platform as Platform, history, user },
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
    await markReplied(supabase, rowId, result.messageId, result.replyText);
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
    // Reject malformed inbound payloads where the sender alias chain
    // ran out and `normalizeWebhookPayload` defaulted to 'unknown'.
    // Without this gate the dispatch chain runs against 'unknown',
    // accumulates audit rows under a non-routable sender, and (if
    // Photon is configured to a default destination) the bot can
    // reply to itself. Spectrum-friendly 200 so retries stop.
    if (!sender || sender === 'unknown') {
        safeWarn({
            at: meta.route,
            event: 'rejected_no_sender',
            requestId: meta.requestId,
            eventType,
            platform,
        });
        return NextResponse.json(
            { ok: true, ignored: 'no_sender', requestId: meta.requestId },
            { headers: meta.headers },
        );
    }
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
        // dispatchReply checks the persisted opt-out flag, then runs
        // keyword short-circuits (STOP / HELP / PING) and intent
        // classifiers (set_zodiac, weather, etc.) before paying for
        // an LLM call. user is null without supabase, so verified-
        // only intents bounce to /integrations.
        if (shouldRunAgent(sender)) {
            await dispatchReply(sender, text, platform, null, null, null, meta.requestId);
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
            const user = await getUserBySender(supabase, sender, meta.requestId);
            await dispatchReply(sender, text, platform, user, null, null, meta.requestId);
        }
        return NextResponse.json({ ok: true, logged: false, reason: error.message, providerMessageId, requestId: meta.requestId }, { headers: meta.headers });
    }

    const rowId = (inserted as { id?: string } | null)?.id ?? null;

    // Synchronous reply. We await the typed-handler chain (keyword
    // short-circuit, intent classifier, agent fallback) + Photon send
    // before returning 200 so the user sees a real iMessage response
    // within the same webhook lifetime. The 60s sender gate guards
    // against a burst turning into a flood of LLM calls.
    if (shouldRunAgent(sender)) {
        const user = await getUserBySender(supabase, sender, meta.requestId);
        await dispatchReply(sender, text, platform, user, supabase, rowId, meta.requestId);
    }

    return NextResponse.json({ ok: true, logged: true, providerMessageId, requestId: meta.requestId }, { headers: meta.headers });
}

/** Health probe, Spectrum dashboards often GET the webhook URL to check liveness. */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'webhooks.photon.health');
    return NextResponse.json({ ok: true, route: 'photon_webhook' }, { headers: meta.headers });
}
