/**
 * Pending-action YES/NO handler for the iMessage agent.
 *
 * Wraps the pending_actions buffer with the dispatch-time logic the
 * webhook needs:
 *
 *   - Look at inbound text first to see if it's a confirm/cancel.
 *   - Only check the DB when the text actually looks like a decision
 *     (so a normal chat message never pays for a Supabase round-trip).
 *   - On confirm: execute the staged tool call via the Google bridge
 *     (gmail.draft today, calendar.create soon) and return the result
 *     message. Falls back to the connector-pointer hint when the
 *     bridge can't complete (sender not verified, Google not connected,
 *     refresh failed).
 *   - On cancel: delete the pending row and return "Cancelled."
 *   - On no-match: return null so the webhook falls through to the
 *     normal pipeline (intents -> agent).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import {
    getPending,
    deletePending,
    classifyPendingResponse,
    type PendingAction,
} from './pending-actions';
import { getGoogleClientForSender, type BridgeResult } from './google-bridge';
import { createDraft } from '@/lib/google/gmail';
import { createEvent } from '@/lib/google/calendar';
import { parseEventTime } from './event-time';
import { safeWarn } from '@/lib/safeLog';

export interface PendingReplyResult {
    /** The text to send back, or null when nothing matched. */
    replyText: string | null;
    /** Which decision matched, if any. */
    matched: 'confirm' | 'cancel' | null;
    /** True if a row existed and we cleared it. */
    consumed: boolean;
}

const NULL: PendingReplyResult = { replyText: null, matched: null, consumed: false };

/**
 * Check if the inbound text is a YES/NO for a pending action and, if
 * so, return the reply text. Returns `{ replyText: null }` when there
 * is no pending row, the table is missing, or the text is not a
 * decision keyword (the normal case).
 */
export async function tryPendingResponse(
    supabase: SupabaseClient | null,
    sender: string,
    text: string,
    requestId?: string,
): Promise<PendingReplyResult> {
    if (!supabase) return NULL;

    // Cheap text check before paying for the DB round-trip. The bulk
    // of inbound messages aren't YES/NO and we don't want every
    // "hey what's up" to do a Supabase select.
    const decision = classifyPendingResponse(text);
    if (!decision) return NULL;

    const { pending } = await getPending(supabase, sender, requestId);
    if (!pending) return NULL;

    await deletePending(supabase, sender, requestId);

    if (decision === 'confirm') {
        const replyText = await executePending(supabase, sender, pending, requestId);
        return { replyText, matched: 'confirm', consumed: true };
    }
    return {
        replyText: 'Cancelled. Anything else?',
        matched: 'cancel',
        consumed: true,
    };
}

/**
 * Run the staged tool call. Today: gmail.draft + calendar.create via
 * the Google bridge. gmail.send + calendar.update fall back to the
 * connector hint until their handlers are wired in follow-ups.
 *
 * Returns the iMessage reply text. Never throws: any thrown error is
 * caught and reported as an iMessage-friendly string.
 */
async function executePending(
    supabase: SupabaseClient,
    sender: string,
    pending: PendingAction,
    requestId?: string,
): Promise<string> {
    if (pending.action_type === 'gmail.draft') {
        const bridge = await getGoogleClientForSender(supabase, sender, requestId);
        if (!bridge.ok) return bridge.iMessageHint;
        return executeGmailDraft(pending, bridge, requestId);
    }

    if (pending.action_type === 'calendar.create') {
        const bridge = await getGoogleClientForSender(supabase, sender, requestId);
        if (!bridge.ok) return bridge.iMessageHint;
        return executeCalendarCreate(pending, bridge, requestId);
    }

    // gmail.send / calendar.update aren't wired yet. Surface the same
    // connector-pointer hint as before so the user knows we recognized
    // their intent but can't act on it.
    return connectorHint(pending);
}

async function executeGmailDraft(
    pending: PendingAction,
    bridge: BridgeResult & { ok: true },
    requestId?: string,
): Promise<string> {
    const params = pending.params as { to?: unknown; body?: unknown };
    const to = typeof params.to === 'string' ? params.to.trim() : '';
    const body = typeof params.body === 'string' ? params.body.trim() : '';
    if (!to || !body) {
        return 'Could not parse the staged draft. Try drafting again with "draft an email to X@Y saying ...".';
    }

    try {
        const subject = deriveSubject(body);
        const result = await createDraft(bridge.privyUserId, { to, subject, body });
        return `Draft saved to your Gmail (id ${result.draftId.slice(0, 8)}). Open Gmail to review and send.`;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        safeWarn({
            at: 'photon.pending_replies',
            event: 'gmail_draft_failed',
            requestId,
            error: message.slice(0, 240),
        });
        return 'Saving the draft to Gmail failed. Try again from operatoruplift.com/chat.';
    }
}

async function executeCalendarCreate(
    pending: PendingAction,
    bridge: BridgeResult & { ok: true },
    requestId?: string,
): Promise<string> {
    const params = pending.params as { title?: unknown; when?: unknown };
    const title = typeof params.title === 'string' ? params.title.trim() : '';
    const when = typeof params.when === 'string' ? params.when.trim() : '';
    if (!title || !when) {
        return 'Could not parse the staged event. Try again with "schedule a meeting tomorrow at 3pm".';
    }

    const parsed = parseEventTime(when);
    if (!parsed) {
        return `Could not pin down "${when}" as a date and time. Try a clearer phrasing like "tomorrow at 3pm" or "next monday at 10am".`;
    }

    try {
        const event = await createEvent(bridge.privyUserId, {
            summary: title,
            start: parsed.startISO,
            end: parsed.endISO,
        });
        const startLabel = formatLocalTime(parsed.startISO);
        const idHint = event.id ? ` (id ${event.id.slice(0, 8)})` : '';
        return `Event "${title}" created${idHint} for ${startLabel}. Check Google Calendar.`;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        safeWarn({
            at: 'photon.pending_replies',
            event: 'calendar_create_failed',
            requestId,
            error: message.slice(0, 240),
        });
        return 'Creating the event in Google Calendar failed. Try again from operatoruplift.com/chat.';
    }
}

function formatLocalTime(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

/**
 * Derive a subject line from the body. Prefer the first sentence;
 * fall back to first 60 chars. Subject Caps for readability.
 */
function deriveSubject(body: string): string {
    const sentence = body.match(/^([^.!?\n]{1,80}[.!?]?)/);
    const raw = (sentence?.[1] ?? body.slice(0, 60)).trim();
    if (!raw) return 'Note from your iMessage agent';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function describeAction(p: PendingAction): string {
    switch (p.action_type) {
        case 'gmail.draft':
            return 'draft that email';
        case 'gmail.send':
            return 'send that email';
        case 'calendar.create':
            return 'create that calendar event';
        case 'calendar.update':
            return 'update that calendar event';
        default:
            return 'run that action';
    }
}

function connectorHint(pending: PendingAction): string {
    const what = describeAction(pending);
    return [
        `Got it. To actually ${what}, I need access to your Google account.`,
        'Open operatoruplift.com/integrations to authorize Gmail and Calendar, then text me again.',
    ].join(' ');
}
