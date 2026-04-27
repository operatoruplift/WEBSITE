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
 *
 * Trust-gate runtime contract: every response — including the 401 from
 * this middleware — must carry an `X-Request-Id` header. If the
 * incoming request already has one, it propagates; otherwise we mint a
 * fresh `req_<uuid>`. Route handlers downstream may overwrite (their
 * `withRequestMeta` reads the header on entry, so the IDs match).
 */
function getOrMintRequestId(request: NextRequest): string {
    const incoming = request.headers.get('x-request-id');
    if (incoming) return incoming;
    return `req_${crypto.randomUUID()}`;
}

const PUBLIC_ROUTES = [
    '/api/waitlist',
    '/api/providers',
    '/api/cron/',
    '/api/auth/',
    // Google OAuth callback is called by Google itself — no Privy token
    // available. Security is enforced by the signed `state` param
    // (lib/google/oauth-state.ts).
    '/api/integrations/google/callback',
    // Demo-mode surfaces: anonymous /chat hits these three. Each route
    // MUST internally call getCapabilities() (lib/capabilities.ts) and
    // branch into a simulated response when capability_real is false —
    // no side effect, no receipt, no Supabase write. Do not whitelist
    // routes that can produce side effects.
    '/api/chat',
    '/api/capabilities',
    '/api/sns/resolve',
    // /api/health is expected to be probeable by uptime checks without auth
    '/api/health',
    // Inbound webhooks from external services (Photon Spectrum, etc.)
    // have their own signature-based auth. Privy tokens don't apply.
    '/api/webhooks/',
    // Admin diagnostic endpoints. Each handler enforces ADMIN_DEBUG_KEY
    // via X-Admin-Key header or ?admin_key=... — the middleware would
    // 401 before the handler got a chance, since curl calls don't have
    // a Privy session token.
    '/api/debug/',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const requestId = getOrMintRequestId(request);

    // Only gate /api/* routes
    if (!pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // Skip public routes — but still propagate the request ID so the
    // downstream handler's withRequestMeta reads the same value.
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
        const response = NextResponse.next();
        response.headers.set('x-request-id', requestId);
        // Forward to handler too: NextResponse.next() with rewritten
        // request headers ensures withRequestMeta reads our minted ID.
        return NextResponse.next({
            request: { headers: appendHeader(request.headers, 'x-request-id', requestId) },
        });
    }

    // Check for session token
    const authHeader = request.headers.get('authorization');
    const privyCookie = request.cookies.get('privy-token')?.value;
    const token = authHeader?.replace('Bearer ', '') || privyCookie;

    if (!token) {
        return NextResponse.json(
            {
                error: 'Authentication required. Sign in at /login.',
                code: 'UNAUTHORIZED',
                requestId,
                timestamp: new Date().toISOString(),
            },
            {
                status: 401,
                headers: { 'X-Request-Id': requestId },
            },
        );
    }

    // Token exists — pass through to the route handler.
    // The route handler calls verifySession() from lib/auth.ts for full verification.
    // We attach the token as a header so route handlers can read it without re-parsing cookies.
    return NextResponse.next({
        request: {
            headers: appendHeaders(request.headers, {
                'x-privy-token': token,
                'x-request-id': requestId,
            }),
        },
    });
}

/**
 * Edge-runtime-safe header builder: returns a new Headers carrying the
 * original entries plus one additional name/value. NextResponse.next's
 * `request.headers` field expects a Headers (or HeadersInit), so we
 * can't mutate the incoming one directly.
 */
function appendHeader(source: Headers, name: string, value: string): Headers {
    const out = new Headers(source);
    out.set(name, value);
    return out;
}

function appendHeaders(source: Headers, extras: Record<string, string>): Headers {
    const out = new Headers(source);
    for (const [k, v] of Object.entries(extras)) out.set(k, v);
    return out;
}

export const config = {
    matcher: '/api/:path*',
};
