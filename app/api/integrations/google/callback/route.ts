import { NextResponse } from 'next/server';
import { exchangeCode } from '@/lib/google/oauth';
import { verifyOAuthState } from '@/lib/google/oauth-state';

export const runtime = 'nodejs';

/**
 * GET /api/integrations/google/callback
 *
 * Called by Google after the user consents. The `state` param carries
 * our HMAC-signed userId. We verify the signature (and expiry) before
 * exchanging the auth code — this prevents an attacker from tricking
 * someone into linking their Google account to a different Privy user.
 *
 * This route is public (Google itself calls it — no Privy token). The
 * state signature IS the auth.
 */
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        if (error) {
            // User denied consent or Google-side error
            return NextResponse.redirect(
                new URL(`/integrations?error=${encodeURIComponent(error)}`, request.url),
            );
        }

        if (!code || !state) {
            return NextResponse.redirect(
                new URL('/integrations?error=missing_code_or_state', request.url),
            );
        }

        // Verify signed state — returns userId or null
        const userId = verifyOAuthState(state);
        if (!userId) {
            console.warn('[google-callback] invalid or expired state');
            return NextResponse.redirect(
                new URL('/integrations?error=invalid_state', request.url),
            );
        }

        await exchangeCode(code, userId);

        return NextResponse.redirect(
            new URL('/integrations?google=connected', request.url),
        );
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[google-callback]', msg);
        return NextResponse.redirect(
            new URL(`/integrations?error=${encodeURIComponent(msg)}`, request.url),
        );
    }
}
