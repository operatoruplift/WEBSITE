/**
 * 6-digit verification code helpers for the iMessage user flow.
 *
 * The user enters their phone in /integrations, the server texts a
 * 6-digit code via Photon, the user types it back, and the server
 * upserts an imessage_users row linking the phone to the Privy
 * account.
 *
 * Codes are stored as SHA-256 hashes in imessage_verifications,
 * never plaintext, with a 10-minute expiry and a per-row attempt
 * counter (defaults to 5 max attempts before forcing a re-issue).
 *
 * The pending_for column pins the in-flight verification to the
 * Privy user that issued it, so a different signed-in account can't
 * race-confirm someone else's code.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { createHash, randomInt } from 'node:crypto';
import { safeWarn } from '@/lib/safeLog';

export const CODE_TTL_MS = 10 * 60 * 1000;     // 10 minutes
export const MAX_ATTEMPTS = 5;
export const CODE_LENGTH = 6;

const TABLE_MISSING_RE = /relation .* does not exist|Could not find the table/i;

/** Cryptographically random 6-digit string with leading zeros preserved. */
export function generateCode(): string {
    const n = randomInt(0, 1_000_000);
    return n.toString().padStart(CODE_LENGTH, '0');
}

export function hashCode(code: string): string {
    return createHash('sha256').update(code, 'utf8').digest('hex');
}

export interface IssueResult {
    ok: boolean;
    tableMissing: boolean;
    /** Plaintext code to text to the user, or null on failure. */
    code: string | null;
    error?: string;
}

/**
 * Generates a fresh code, hashes it, upserts a verifications row.
 * Existing pending verification for the same sender is overwritten
 * (the old code becomes invalid). Caller is responsible for sending
 * the returned plaintext code via the Photon adapter.
 */
export async function issueCode(
    supabase: SupabaseClient | null,
    sender: string,
    pendingFor: string,
    requestId?: string,
): Promise<IssueResult> {
    if (!supabase) return { ok: false, tableMissing: false, code: null, error: 'no_supabase' };
    const trimmedSender = sender.trim();
    const trimmedPrivy = pendingFor.trim();
    if (!trimmedSender || !trimmedPrivy) {
        return { ok: false, tableMissing: false, code: null, error: 'empty_input' };
    }

    const code = generateCode();
    const expires_at = new Date(Date.now() + CODE_TTL_MS).toISOString();
    const code_hash = hashCode(code);

    const { error } = await supabase
        .from('imessage_verifications')
        .upsert(
            {
                sender: trimmedSender,
                code_hash,
                expires_at,
                pending_for: trimmedPrivy,
                attempts: 0,
            },
            { onConflict: 'sender' },
        );

    if (error) {
        const tableMissing = TABLE_MISSING_RE.test(error.message || '');
        if (!tableMissing) {
            safeWarn({
                at: 'photon.verify',
                event: 'issueCode_failed',
                requestId,
                error: error.message?.slice(0, 240),
            });
        }
        return { ok: false, tableMissing, code: null, error: error.message };
    }
    return { ok: true, tableMissing: false, code };
}

export type ConfirmReason =
    | 'no_pending'
    | 'expired'
    | 'wrong_user'
    | 'too_many_attempts'
    | 'mismatch'
    | 'table_missing';

export type ConfirmResult =
    | { ok: true }
    | { ok: false; reason: ConfirmReason };

/**
 * Validates a user-supplied code against the pending verification
 * for `sender`. On success, deletes the verifications row so the
 * code can't be reused. On any failure, returns a stable reason
 * code so the caller can surface a specific 4xx without leaking
 * which leg failed.
 */
export async function confirmCode(
    supabase: SupabaseClient | null,
    sender: string,
    code: string,
    privyUserId: string,
    requestId?: string,
): Promise<ConfirmResult> {
    if (!supabase) return { ok: false, reason: 'no_pending' };
    const trimmedSender = sender.trim();
    const trimmedCode = code.trim();
    const trimmedPrivy = privyUserId.trim();
    if (!trimmedSender || !trimmedCode || !trimmedPrivy) {
        return { ok: false, reason: 'no_pending' };
    }

    const { data, error } = await supabase
        .from('imessage_verifications')
        .select('code_hash, expires_at, pending_for, attempts')
        .eq('sender', trimmedSender)
        .maybeSingle();

    if (error) {
        const tableMissing = TABLE_MISSING_RE.test(error.message || '');
        if (!tableMissing) {
            safeWarn({
                at: 'photon.verify',
                event: 'confirmCode_select_failed',
                requestId,
                error: error.message?.slice(0, 240),
            });
        }
        return { ok: false, reason: tableMissing ? 'table_missing' : 'no_pending' };
    }

    if (!data) return { ok: false, reason: 'no_pending' };

    const row = data as { code_hash: string; expires_at: string; pending_for: string; attempts: number };
    if (row.pending_for !== trimmedPrivy) {
        return { ok: false, reason: 'wrong_user' };
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
        await supabase.from('imessage_verifications').delete().eq('sender', trimmedSender);
        return { ok: false, reason: 'expired' };
    }
    if (row.attempts >= MAX_ATTEMPTS) {
        return { ok: false, reason: 'too_many_attempts' };
    }

    const expected = row.code_hash;
    const provided = hashCode(trimmedCode);
    if (expected !== provided) {
        await supabase
            .from('imessage_verifications')
            .update({ attempts: row.attempts + 1 })
            .eq('sender', trimmedSender);
        return { ok: false, reason: 'mismatch' };
    }

    // Match. Delete the verifications row so the code can't be reused.
    await supabase.from('imessage_verifications').delete().eq('sender', trimmedSender);
    return { ok: true };
}
