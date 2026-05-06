/**
 * imessage_users helpers, per-sender prefs + Privy account link.
 *
 * Read at the top of every webhook so the agent can tailor its
 * reply: pick the user's preferred model, override the system
 * prompt, mention their location/zodiac, etc. Written by:
 *
 *   - /api/integrations/imessage/confirm    upserts the verified row
 *   - future: /api/integrations/imessage/prefs (model_pref, etc.)
 *   - future: a daily summary cron (summary column)
 *
 * All helpers tolerate a null Supabase or a missing imessage_users
 * table (returns null/no-op so the bot keeps working through the
 * migration window).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { safeWarn } from '@/lib/safeLog';

export interface ImessageUser {
    sender: string;
    privy_user_id: string | null;
    verified_at: string | null;
    timezone: string | null;
    location: string | null;
    zodiac: string | null;
    model_pref: string | null;
    system_prompt_override: string | null;
    summary: string | null;
}

const TABLE_MISSING_RE = /relation .* does not exist|Could not find the table/i;

/**
 * Returns the user row for `sender`, or null if there's no row, the
 * table is missing, or Supabase is unset. Never throws.
 */
export async function getUserBySender(
    supabase: SupabaseClient | null,
    sender: string,
    requestId?: string,
): Promise<ImessageUser | null> {
    if (!supabase) return null;
    const trimmed = sender.trim();
    if (!trimmed) return null;

    const { data, error } = await supabase
        .from('imessage_users')
        .select('sender, privy_user_id, verified_at, timezone, location, zodiac, model_pref, system_prompt_override, summary')
        .eq('sender', trimmed)
        .maybeSingle();

    if (error) {
        if (!TABLE_MISSING_RE.test(error.message || '')) {
            safeWarn({
                at: 'photon.users',
                event: 'getUserBySender_failed',
                requestId,
                error: error.message?.slice(0, 240),
            });
        }
        return null;
    }
    return (data as ImessageUser | null) ?? null;
}

export interface UpsertResult {
    ok: boolean;
    tableMissing: boolean;
    error?: string;
}

/**
 * Upsert (sender, privy_user_id, verified_at) on a successful
 * verification. Preserves any prefs already on the row.
 */
export async function upsertVerifiedUser(
    supabase: SupabaseClient | null,
    sender: string,
    privyUserId: string,
    requestId?: string,
): Promise<UpsertResult> {
    if (!supabase) return { ok: false, tableMissing: false, error: 'no_supabase' };
    const trimmedSender = sender.trim();
    const trimmedPrivy = privyUserId.trim();
    if (!trimmedSender || !trimmedPrivy) {
        return { ok: false, tableMissing: false, error: 'empty_input' };
    }
    const now = new Date().toISOString();

    const { error } = await supabase
        .from('imessage_users')
        .upsert(
            {
                sender: trimmedSender,
                privy_user_id: trimmedPrivy,
                verified_at: now,
                updated_at: now,
            },
            { onConflict: 'sender' },
        );

    if (error) {
        const tableMissing = TABLE_MISSING_RE.test(error.message || '');
        if (!tableMissing) {
            safeWarn({
                at: 'photon.users',
                event: 'upsertVerifiedUser_failed',
                requestId,
                error: error.message?.slice(0, 240),
            });
        }
        return { ok: false, tableMissing, error: error.message };
    }
    return { ok: true, tableMissing: false };
}

/**
 * Patch one or more pref fields on an existing user row. No-op if
 * the row doesn't exist (caller is expected to verify first).
 */
export async function updateUserPrefs(
    supabase: SupabaseClient | null,
    sender: string,
    patch: Partial<Omit<ImessageUser, 'sender' | 'privy_user_id' | 'verified_at'>>,
    requestId?: string,
): Promise<UpsertResult> {
    if (!supabase) return { ok: false, tableMissing: false, error: 'no_supabase' };
    const trimmedSender = sender.trim();
    if (!trimmedSender) return { ok: false, tableMissing: false, error: 'empty_sender' };
    if (Object.keys(patch).length === 0) return { ok: true, tableMissing: false };

    const now = new Date().toISOString();
    const { error } = await supabase
        .from('imessage_users')
        .update({ ...patch, updated_at: now })
        .eq('sender', trimmedSender);

    if (error) {
        const tableMissing = TABLE_MISSING_RE.test(error.message || '');
        if (!tableMissing) {
            safeWarn({
                at: 'photon.users',
                event: 'updateUserPrefs_failed',
                requestId,
                error: error.message?.slice(0, 240),
            });
        }
        return { ok: false, tableMissing, error: error.message };
    }
    return { ok: true, tableMissing: false };
}
