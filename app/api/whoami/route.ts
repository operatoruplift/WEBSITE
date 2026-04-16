import { NextResponse } from 'next/server';
import { verifySession, getUserEmail, diagnoseJws } from '@/lib/auth';
import {
    isBypassAllEnabled,
    isEmailBypassed,
    isUserIdBypassed,
    checkSubscription,
} from '@/lib/subscription';

export const runtime = 'nodejs';

/**
 * GET /api/whoami
 *
 * Admin-gated debug endpoint. Returns everything we know about the
 * current session so you can see why the paywall is (or isn't)
 * bypassing. Gated by:
 *   - X-Debug-Key header matching DEBUG_ADMIN_KEY env, OR
 *   - the caller's session email is on PAYWALL_BYPASS_EMAILS, OR
 *   - the caller's userId is on PAYWALL_BYPASS_USER_IDS
 *
 * Returns structured JWT diagnostic (never the full token).
 */
export async function GET(request: Request) {
    try {
        const debugKey = request.headers.get('x-debug-key');
        const adminKey = process.env.DEBUG_ADMIN_KEY;

        // Extract token for diagnostic only — we never log or return the token itself
        const rawToken =
            request.headers.get('x-privy-token') ||
            request.headers.get('authorization')?.replace('Bearer ', '') ||
            getCookieValue(request.headers.get('cookie'), 'privy-token');

        const jwsDiag = diagnoseJws(rawToken);

        let privyUserId: string | null = null;
        let authError: string | null = null;
        let sessionEmail: string | null = null;

        try {
            const verified = await verifySession(request);
            privyUserId = verified.userId;
            sessionEmail = await getUserEmail(verified.userId);
        } catch (err) {
            authError = err instanceof Error ? err.message : 'auth failed';
        }

        // appUserEmail — what the client put in localStorage.user (if passed
        // via a custom header for debugging). We don't trust it for auth but
        // surfacing it helps debug "why doesn't bypass work for my Google email".
        const appUserEmail = request.headers.get('x-app-user-email');

        const isAdmin =
            (!!adminKey && debugKey === adminKey) ||
            (sessionEmail && isEmailBypassed(sessionEmail)) ||
            (privyUserId && isUserIdBypassed(privyUserId));

        if (!isAdmin) {
            return NextResponse.json(
                {
                    error: 'unauthorized',
                    hint: 'Must be authenticated as a bypass-listed user (by email or userId), OR provide X-Debug-Key matching DEBUG_ADMIN_KEY.',
                    // Tell the caller what was tried (but not why it failed in
                    // full detail — no token leakage)
                    token_shape_ok: jwsDiag.shape_ok,
                    auth_error: authError,
                },
                { status: 403 },
            );
        }

        const subscription = privyUserId
            ? await checkSubscription(privyUserId, sessionEmail || undefined)
            : null;

        // Which identifier did the subscription check USE for its bypass decision?
        let usedIdentifier: 'global_flag' | 'user_id' | 'email' | 'supabase_row' | 'none' = 'none';
        if (isBypassAllEnabled()) usedIdentifier = 'global_flag';
        else if (privyUserId && isUserIdBypassed(privyUserId)) usedIdentifier = 'user_id';
        else if (sessionEmail && isEmailBypassed(sessionEmail)) usedIdentifier = 'email';
        else if (subscription?.source === 'supabase_active') usedIdentifier = 'supabase_row';

        return NextResponse.json({
            privy_user_id: privyUserId,
            session_email: sessionEmail,       // from Privy linkedAccounts (source of truth)
            app_user_email: appUserEmail,       // from x-app-user-email header (debug only)
            auth_error: authError,
            jws_diagnostic: {
                shape_ok: jwsDiag.shape_ok,
                length: jwsDiag.length,
                segments: jwsDiag.segments,
                header_alg: jwsDiag.header_alg,
                header_kid: jwsDiag.header_kid,
                payload_aud: jwsDiag.payload_aud,
                payload_iss: jwsDiag.payload_iss,
                payload_exp: jwsDiag.payload_exp,
                payload_exp_readable: jwsDiag.payload_exp
                    ? new Date(jwsDiag.payload_exp * 1000).toISOString()
                    : null,
                error: jwsDiag.error,
            },
            bypass: {
                global_flag_enabled: isBypassAllEnabled(),
                session_email_on_allowlist: sessionEmail ? isEmailBypassed(sessionEmail) : false,
                user_id_on_allowlist: privyUserId ? isUserIdBypassed(privyUserId) : false,
                bypass_emails: (process.env.PAYWALL_BYPASS_EMAILS || '')
                    .split(',').map(s => s.trim()).filter(Boolean),
                bypass_user_ids: (process.env.PAYWALL_BYPASS_USER_IDS || '')
                    .split(',').map(s => s.trim()).filter(Boolean),
            },
            subscription,
            used_identifier: usedIdentifier,
            environment: {
                node_env: process.env.NODE_ENV,
                has_supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
                has_privy: !!process.env.PRIVY_APP_SECRET,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

function getCookieValue(cookieHeader: string | null, name: string): string | null {
    if (!cookieHeader) return null;
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}
