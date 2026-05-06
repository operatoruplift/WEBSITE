/**
 * Pending-action YES/NO handler for the iMessage agent.
 *
 * Wraps the pending_actions buffer with the dispatch-time logic the
 * webhook needs:
 *
 *   - Look at inbound text first to see if it's a confirm/cancel.
 *   - Only check the DB when the text actually looks like a decision
 *     (so a normal chat message never pays for a Supabase round-trip).
 *   - On confirm/cancel, delete the pending row and return reply text.
 *   - On no-match, return null so the webhook falls through to the
 *     normal pipeline (intents -> agent).
 *
 * Honest-status: today, when a user confirms a pending Gmail/Calendar
 * action, we don't have OAuth tokens for them yet, so the reply
 * points them at /integrations instead of fabricating a sent receipt.
 * When the connector PR lands this is the seam where the real tool
 * call hooks in.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import {
    getPending,
    deletePending,
    classifyPendingResponse,
    type PendingAction,
} from './pending-actions';

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
        return {
            replyText: confirmReply(pending),
            matched: 'confirm',
            consumed: true,
        };
    }
    return {
        replyText: 'Cancelled. Anything else?',
        matched: 'cancel',
        consumed: true,
    };
}

function describePending(p: PendingAction): string {
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

function confirmReply(pending: PendingAction): string {
    // Honest-status: tool execution isn't wired yet for the iMessage
    // surface. Tell the user what's blocking and where to fix it,
    // rather than claim we sent it.
    const what = describePending(pending);
    return [
        `Got it. To actually ${what}, I need access to your Google account.`,
        'Open operatoruplift.com/integrations to authorize Gmail and Calendar, then text me again.',
    ].join(' ');
}
