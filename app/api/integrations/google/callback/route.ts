import { NextResponse } from 'next/server';
import { exchangeCode } from '@/lib/google/oauth';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state'); // user ID passed through OAuth state
        const error = url.searchParams.get('error');

        if (error) {
            // User denied consent or something went wrong at Google's end
            return NextResponse.redirect(
                new URL(`/integrations?error=${encodeURIComponent(error)}`, request.url),
            );
        }

        if (!code || !state) {
            return NextResponse.json(
                { error: 'Missing code or state parameter' },
                { status: 400 },
            );
        }

        await exchangeCode(code, state);

        // Redirect back to integrations page with success indicator
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
