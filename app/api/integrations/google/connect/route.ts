import { NextResponse } from 'next/server';
import { getConsentUrl } from '@/lib/google/oauth';

export async function GET(request: Request) {
    try {
        if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
            return NextResponse.json(
                { error: 'Google OAuth not configured — set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in .env.local' },
                { status: 503 },
            );
        }

        // Get user ID from query param — this is the Privy DID from the client's
        // localStorage.user.id, passed by the integrations page. We use this
        // directly (not Supabase auth.uid()) because Privy manages auth sessions
        // separately from Supabase. The same ID is used by the tool executor
        // when looking up tokens, so they must match.
        const url = new URL(request.url);
        const userId = url.searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json(
                { error: 'Not authenticated — sign in first, then connect Google.' },
                { status: 401 },
            );
        }

        const consentUrl = getConsentUrl(userId);
        return NextResponse.redirect(consentUrl);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
