import { NextResponse } from 'next/server';
import { getConsentUrl } from '@/lib/google/oauth';
import { signOAuthState } from '@/lib/google/oauth-state';
import { verifySession } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * GET /api/integrations/google/connect
 *
 * Starts the Google OAuth flow. Two accepted auth paths:
 *
 *   1. Authorization: Bearer <privy-jwt>
 *      (when the client uses `fetch()` with the token header)
 *
 *   2. privy-token cookie
 *      (when the browser does a top-level navigation — localStorage
 *      tokens aren't sent, but cookies are. We set this cookie on
 *      the client BEFORE redirecting here via the startGoogleOAuth
 *      helper, so the middleware + this route can read it.)
 *
 * The derived Privy userId is baked into an HMAC-signed `state`
 * parameter sent to Google. The callback verifies the signature
 * before trusting the userId.
 *
 * Query param `user_id` is IGNORED — we never trust a client-supplied
 * userId for this flow. Forgery prevention.
 */
export async function GET(request: Request) {
    try {
        if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
            return NextResponse.json(
                { error: 'Google OAuth not configured — set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET' },
                { status: 503 },
            );
        }

        // Verify the Privy session server-side. This reads from:
        //   - x-privy-token header (set by middleware from Authorization / cookie)
        //   - Authorization: Bearer header
        //   - privy-token cookie
        let verified;
        try {
            verified = await verifySession(request);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'auth_failed';
            // Redirect back to integrations with a friendly error so the
            // user doesn't see a bare JSON 401 — they're in a browser
            // navigation, not a fetch.
            const redirect = new URL('/integrations', request.url);
            redirect.searchParams.set('error', 'not_authenticated');
            redirect.searchParams.set('reason', msg);
            return NextResponse.redirect(redirect);
        }

        const userId = verified.userId;
        const signedState = signOAuthState(userId);
        const consentUrl = getConsentUrl(signedState);
        return NextResponse.redirect(consentUrl);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[google-connect]', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
