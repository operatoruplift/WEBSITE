/**
 * iMessage -> Google bridge.
 *
 * The iMessage agent and the Google OAuth flow live in two places
 * that don't know about each other:
 *
 *   - imessage_users links E.164 sender -> privy_user_id at verify time
 *     (lib/photon/users.ts).
 *   - user_integrations links privy_user_id -> Google refresh token at
 *     OAuth-callback time (lib/google/oauth.ts).
 *
 * This module bridges them: given a sender, return an authenticated
 * Google API client (or a typed failure reason). The pending-action
 * confirm path uses this to actually fire Gmail/Calendar tool calls
 * after a YES, instead of replying "open /integrations to authorize".
 *
 * Failure reasons are explicit so the caller can render a targeted
 * iMessage reply (e.g., "I see your phone but Google isn't connected"
 * vs "I don't recognize this phone").
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { OAuth2Client } from 'google-auth-library';
import { getAuthenticatedClient, isGoogleConnected } from '@/lib/google/oauth';
import { getUserBySender } from './users';
import { safeWarn } from '@/lib/safeLog';

export type BridgeFailureReason =
    | 'no_supabase'
    | 'sender_not_verified'
    | 'google_not_connected'
    | 'auth_refresh_failed';

export interface BridgeSuccess {
    ok: true;
    client: OAuth2Client;
    privyUserId: string;
}

export interface BridgeFailure {
    ok: false;
    reason: BridgeFailureReason;
    message: string;
    /** What to tell the user via iMessage (action-oriented). */
    iMessageHint: string;
}

export type BridgeResult = BridgeSuccess | BridgeFailure;

const HINTS: Record<BridgeFailureReason, string> = {
    no_supabase: 'Server connectivity issue, try again in a minute.',
    sender_not_verified:
        'I don\u2019t see this phone linked to an account. Open operatoruplift.com/integrations and verify your phone first.',
    google_not_connected:
        'Google isn\u2019t connected for your account. Open operatoruplift.com/integrations and click Connect on Gmail or Calendar.',
    auth_refresh_failed:
        'Your Google login expired. Open operatoruplift.com/integrations and reconnect Google.',
};

/**
 * Try to get an authenticated Google API client for an iMessage sender.
 * Returns either a usable client + privyUserId, or a typed failure
 * reason with a ready-to-send iMessage hint.
 */
export async function getGoogleClientForSender(
    supabase: SupabaseClient | null,
    sender: string,
    requestId?: string,
): Promise<BridgeResult> {
    if (!supabase) {
        return failure('no_supabase', 'Supabase not configured for the bridge.');
    }

    const user = await getUserBySender(supabase, sender, requestId);
    if (!user || !user.verified_at || !user.privy_user_id) {
        return failure(
            'sender_not_verified',
            `Sender ${sender} has no verified imessage_users row.`,
        );
    }

    const connected = await isGoogleConnected(user.privy_user_id).catch(() => false);
    if (!connected) {
        return failure(
            'google_not_connected',
            `Privy user ${user.privy_user_id} has no Google refresh token.`,
        );
    }

    try {
        const client = await getAuthenticatedClient(user.privy_user_id);
        return { ok: true, client, privyUserId: user.privy_user_id };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        safeWarn({
            at: 'photon.google_bridge',
            event: 'auth_refresh_failed',
            requestId,
            sender,
            error: msg.slice(0, 240),
        });
        return failure('auth_refresh_failed', msg);
    }
}

function failure(reason: BridgeFailureReason, message: string): BridgeFailure {
    return { ok: false, reason, message, iMessageHint: HINTS[reason] };
}
