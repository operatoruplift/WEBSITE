/**
 * Pending tool-call confirmation buffer for the iMessage agent.
 *
 * iMessage has no inline buttons, so the agent stages tool calls
 * (Gmail draft, Calendar create) as "pending" rows here, then sends
 * a confirmation prompt as the reply. The next inbound message from
 * the same sender can match a YES/CONFIRM keyword to execute the
 * pending action, or anything else to abandon it.
 *
 * One row per sender (latest wins). 5-minute TTL so a stale YES
 * two days later doesn't accidentally fire a dropped draft.
 *
 * All helpers tolerate a null Supabase or a missing
 * imessage_pending_actions table (returns no-op so the bot keeps
 * working through the migration window).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { safeWarn } from '@/lib/safeLog';

export type PendingActionType =
    | 'gmail.draft'
    | 'gmail.send'
    | 'calendar.create'
    | 'calendar.update';

export interface PendingAction {
    sender: string;
    action_type: PendingActionType;
    params: Record<string, unknown>;
    preview_text: string | null;
    expires_at: string;
    created_at: string;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const TABLE_MISSING_RE = /relation .* does not exist|Could not find the table/i;

export interface CreatePendingResult {
    ok: boolean;
    tableMissing: boolean;
    error?: string;
}

/**
 * Upsert a pending action for `sender`. Overwrites any prior row so
 * "draft another email" replaces the previous draft instead of
 * stacking — keeps the YES/NO handler unambiguous.
 */
export async function createPending(
    supabase: SupabaseClient | null,
    sender: string,
    action_type: PendingActionType,
    params: Record<string, unknown>,
    preview_text: string | null,
    requestId?: string,
    ttlMs: number = DEFAULT_TTL_MS,
): Promise<CreatePendingResult> {
    if (!supabase) return { ok: false, tableMissing: false, error: 'no_supabase' };
    const trimmed = sender.trim();
    if (!trimmed) return { ok: false, tableMissing: false, error: 'empty_sender' };

    const expires_at = new Date(Date.now() + ttlMs).toISOString();

    const { error } = await supabase
        .from('imessage_pending_actions')
        .upsert(
            {
                sender: trimmed,
                action_type,
                params,
                preview_text,
                expires_at,
            },
            { onConflict: 'sender' },
        );

    if (error) {
        const tableMissing = TABLE_MISSING_RE.test(error.message || '');
        if (!tableMissing) {
            safeWarn({
                at: 'photon.pending',
                event: 'createPending_failed',
                requestId,
                error: error.message?.slice(0, 240),
            });
        }
        return { ok: false, tableMissing, error: error.message };
    }
    return { ok: true, tableMissing: false };
}

export interface GetPendingResult {
    /** The row when present and not expired; null otherwise. */
    pending: PendingAction | null;
    /** True if the table doesn't exist (no-op fallback). */
    tableMissing: boolean;
}

/**
 * Returns the active pending action for `sender`, or null if there
 * is no row, the row has expired, or the table is missing. Expired
 * rows are deleted as a side effect.
 */
export async function getPending(
    supabase: SupabaseClient | null,
    sender: string,
    requestId?: string,
): Promise<GetPendingResult> {
    if (!supabase) return { pending: null, tableMissing: false };
    const trimmed = sender.trim();
    if (!trimmed) return { pending: null, tableMissing: false };

    const { data, error } = await supabase
        .from('imessage_pending_actions')
        .select('sender, action_type, params, preview_text, expires_at, created_at')
        .eq('sender', trimmed)
        .maybeSingle();

    if (error) {
        const tableMissing = TABLE_MISSING_RE.test(error.message || '');
        if (!tableMissing) {
            safeWarn({
                at: 'photon.pending',
                event: 'getPending_failed',
                requestId,
                error: error.message?.slice(0, 240),
            });
        }
        return { pending: null, tableMissing };
    }
    if (!data) return { pending: null, tableMissing: false };

    const row = data as PendingAction;
    if (new Date(row.expires_at).getTime() < Date.now()) {
        await supabase.from('imessage_pending_actions').delete().eq('sender', trimmed);
        return { pending: null, tableMissing: false };
    }
    return { pending: row, tableMissing: false };
}

export interface DeletePendingResult {
    ok: boolean;
    tableMissing: boolean;
}

/** Drops the pending row for `sender`, e.g. after a YES executes it
 *  successfully or after a NO/CANCEL keyword arrives. */
export async function deletePending(
    supabase: SupabaseClient | null,
    sender: string,
    requestId?: string,
): Promise<DeletePendingResult> {
    if (!supabase) return { ok: false, tableMissing: false };
    const trimmed = sender.trim();
    if (!trimmed) return { ok: false, tableMissing: false };

    const { error } = await supabase
        .from('imessage_pending_actions')
        .delete()
        .eq('sender', trimmed);

    if (error) {
        const tableMissing = TABLE_MISSING_RE.test(error.message || '');
        if (!tableMissing) {
            safeWarn({
                at: 'photon.pending',
                event: 'deletePending_failed',
                requestId,
                error: error.message?.slice(0, 240),
            });
        }
        return { ok: false, tableMissing };
    }
    return { ok: true, tableMissing: false };
}

/**
 * Detects a confirm/abort keyword for a pending action. Conservative
 * match: full-text only (no substring), so "yes please send it" maps
 * to confirm but "well yes I think so" stays a normal message.
 */
export type PendingDecision = 'confirm' | 'cancel' | null;

export function classifyPendingResponse(text: string | null | undefined): PendingDecision {
    if (!text) return null;
    const trimmed = text.trim().toLowerCase().replace(/[!.?]+$/, '');
    if (!trimmed || trimmed.length > 32) return null;
    const confirmTriggers = new Set([
        'yes', 'y', 'send it', 'send', 'confirm', 'confirmed', 'ok', 'okay',
        'go', 'go ahead', 'do it', 'sure', 'yes please', 'yep', 'yeah',
    ]);
    const cancelTriggers = new Set([
        'no', 'n', 'cancel', 'stop', 'wait', 'nope', 'nah', 'never mind', 'nevermind',
    ]);
    if (confirmTriggers.has(trimmed)) return 'confirm';
    if (cancelTriggers.has(trimmed)) return 'cancel';
    return null;
}
