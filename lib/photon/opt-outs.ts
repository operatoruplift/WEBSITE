/**
 * Per-sender opt-out persistence for the iMessage agent.
 *
 * The webhook calls isOptedOut(sender) before any reply (keyword or
 * LLM) and skips entirely when the sender previously sent STOP.
 * matchKeyword('start') reverses the flag.
 *
 * Backed by Supabase table public.imessage_opt_outs (see
 * lib/photon-optouts-migration.sql). All functions are best-effort
 * and safe to call without the table existing , a missing table
 * returns "not opted out" so the bot keeps working through the
 * migration window.
 *
 * Honest-status rule: never silently swallow real errors. Any
 * non-table-missing failure is logged via safeWarn so the operator
 * sees the problem in Vercel function logs.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { safeWarn } from '@/lib/safeLog';

export interface OptOutCheck {
    optedOut: boolean;
    /** True when the table doesn't exist yet; treat as "not opted out". */
    tableMissing: boolean;
    /** Most recent opt-out timestamp, if any. */
    optedOutAt: string | null;
}

const TABLE_MISSING_RE = /relation .* does not exist|Could not find the table/i;

export async function isOptedOut(
    supabase: SupabaseClient | null,
    sender: string,
    requestId?: string,
): Promise<OptOutCheck> {
    if (!supabase) return { optedOut: false, tableMissing: false, optedOutAt: null };
    const trimmed = sender.trim();
    if (!trimmed) return { optedOut: false, tableMissing: false, optedOutAt: null };

    const { data, error } = await supabase
        .from('imessage_opt_outs')
        .select('opted_out_at')
        .eq('sender', trimmed)
        .maybeSingle();

    if (error) {
        const tableMissing = TABLE_MISSING_RE.test(error.message || '');
        if (!tableMissing) {
            safeWarn({
                at: 'photon.optouts',
                event: 'isOptedOut_failed',
                requestId,
                error: error.message?.slice(0, 240),
            });
        }
        return { optedOut: false, tableMissing, optedOutAt: null };
    }

    if (!data || !data.opted_out_at) {
        return { optedOut: false, tableMissing: false, optedOutAt: null };
    }
    return { optedOut: true, tableMissing: false, optedOutAt: data.opted_out_at };
}

export interface OptOutWriteResult {
    ok: boolean;
    tableMissing: boolean;
    error?: string;
}

export async function recordOptOut(
    supabase: SupabaseClient | null,
    sender: string,
    reason: string | null,
    requestId?: string,
): Promise<OptOutWriteResult> {
    if (!supabase) return { ok: false, tableMissing: false, error: 'no_supabase' };
    const trimmed = sender.trim();
    if (!trimmed) return { ok: false, tableMissing: false, error: 'empty_sender' };

    const now = new Date().toISOString();
    const { error } = await supabase
        .from('imessage_opt_outs')
        .upsert(
            {
                sender: trimmed,
                opted_out_at: now,
                last_reason: reason ?? 'STOP',
                updated_at: now,
            },
            { onConflict: 'sender' },
        );

    if (error) {
        const tableMissing = TABLE_MISSING_RE.test(error.message || '');
        if (!tableMissing) {
            safeWarn({
                at: 'photon.optouts',
                event: 'recordOptOut_failed',
                requestId,
                error: error.message?.slice(0, 240),
            });
        }
        return { ok: false, tableMissing, error: error.message };
    }
    return { ok: true, tableMissing: false };
}

/**
 * Clears the opt-out flag for a sender (called when they text START).
 * Leaves the row in place so we keep the audit trail.
 */
export async function clearOptOut(
    supabase: SupabaseClient | null,
    sender: string,
    requestId?: string,
): Promise<OptOutWriteResult> {
    if (!supabase) return { ok: false, tableMissing: false, error: 'no_supabase' };
    const trimmed = sender.trim();
    if (!trimmed) return { ok: false, tableMissing: false, error: 'empty_sender' };

    const now = new Date().toISOString();
    const { error } = await supabase
        .from('imessage_opt_outs')
        .upsert(
            {
                sender: trimmed,
                opted_out_at: null,
                last_reason: 'START',
                updated_at: now,
            },
            { onConflict: 'sender' },
        );

    if (error) {
        const tableMissing = TABLE_MISSING_RE.test(error.message || '');
        if (!tableMissing) {
            safeWarn({
                at: 'photon.optouts',
                event: 'clearOptOut_failed',
                requestId,
                error: error.message?.slice(0, 240),
            });
        }
        return { ok: false, tableMissing, error: error.message };
    }
    return { ok: true, tableMissing: false };
}
