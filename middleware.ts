import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js middleware — lightweight auth gate for all /api/* routes.
 *
 * Checks that a session token exists (Authorization header or privy-token cookie).
 * Does NOT do full JWT verification here (Edge runtime can't run Privy server SDK).
 * Full verification happens in lib/auth.ts, called by each API route.
 *
 * Public routes (no auth required): /api/waitlist, /api/providers, /api/cron/*
 */

const PUBLIC_ROUTES = [
    '/api/waitlist',
    '/api/providers',
    '/api/cron/',
    '/api/auth/',
    // Google OAuth callback is called by Google itself — no Privy token
    // available. Security is enforced by the signed `state` param
    // (lib/google/oauth-state.ts).
    '/api/integrations/google/callback',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only gate /api/* routes
    if (!pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // Skip public routes
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Check for session token
    const authHeader = request.headers.get('authorization');
    const privyCookie = request.cookies.get('privy-token')?.value;
    const token = authHeader?.replace('Bearer ', '') || privyCookie;

    if (!token) {
        return NextResponse.json(
            { error: 'Authentication required. Sign in at /login.', code: 'UNAUTHORIZED' },
            { status: 401 },
        );
    }

    // Token exists — pass through to the route handler.
    // The route handler calls verifySession() from lib/auth.ts for full verification.
    // We attach the token as a header so route handlers can read it without re-parsing cookies.
    const response = NextResponse.next();
    response.headers.set('x-privy-token', token);
    return response;
}

export const config = {
    matcher: '/api/:path*',
};
