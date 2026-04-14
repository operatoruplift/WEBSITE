import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getConsentUrl } from '@/lib/google/oauth';

export async function GET(request: Request) {
    try {
        if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
            return NextResponse.json(
                { error: 'Google OAuth not configured — set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in .env.local' },
                { status: 503 },
            );
        }

        // Try to get the real user ID from the Supabase session (cookie-based auth)
        let userId: string | null = null;

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseAnonKey) {
            const cookieHeader = request.headers.get('cookie') ?? '';
            const supabase = createClient(supabaseUrl, supabaseAnonKey, {
                global: { headers: { cookie: cookieHeader } },
                auth: { persistSession: false },
            });
            const { data: { user } } = await supabase.auth.getUser();
            userId = user?.id ?? null;
        }

        // Fallback to query param (for dev/testing only)
        if (!userId) {
            const url = new URL(request.url);
            userId = url.searchParams.get('user_id');
        }

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
