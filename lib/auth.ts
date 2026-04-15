/**
 * Server-side auth verification using Privy.
 *
 * Call verifySession(request) at the top of any API route that needs auth.
 * Returns the verified user ID (Privy DID) or throws.
 *
 * The middleware.ts already checks that a token exists — this does the
 * full cryptographic verification via Privy's server SDK.
 */
import { PrivyClient } from '@privy-io/server-auth';

let privyClient: PrivyClient | null = null;

function getPrivyClient(): PrivyClient {
    if (privyClient) return privyClient;
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;
    if (!appId || !appSecret) {
        throw new AuthError('Privy not configured — set NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET');
    }
    privyClient = new PrivyClient(appId, appSecret);
    return privyClient;
}

export interface VerifiedUser {
    userId: string;   // Privy DID (did:privy:...)
    walletAddress?: string;
}

/**
 * Verify the Privy session from the request.
 * Returns the verified user ID or throws AuthError.
 *
 * Reads the token from:
 * 1. x-privy-token header (set by middleware)
 * 2. Authorization: Bearer header
 * 3. privy-token cookie
 */
export async function verifySession(request: Request): Promise<VerifiedUser> {
    const headers = request.headers;
    const token = headers.get('x-privy-token')
        || headers.get('authorization')?.replace('Bearer ', '')
        || getCookieValue(headers.get('cookie'), 'privy-token');

    if (!token) {
        throw new AuthError('No session token found');
    }

    // If Privy server SDK is not configured, fall back to accepting the token as-is
    // (for local development without PRIVY_APP_SECRET)
    if (!process.env.PRIVY_APP_SECRET) {
        // Dev mode: trust the token, extract user_id from the request body or a default
        return { userId: 'dev-user' };
    }

    try {
        const client = getPrivyClient();
        const verifiedClaims = await client.verifyAuthToken(token);
        return {
            userId: verifiedClaims.userId,
        };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Token verification failed';
        throw new AuthError(msg);
    }
}

/**
 * Quick check — does the request have auth? Returns userId or null (no throw).
 * Use this for routes that should work with or without auth (degraded mode).
 */
export async function getOptionalUser(request: Request): Promise<VerifiedUser | null> {
    try {
        return await verifySession(request);
    } catch {
        return null;
    }
}

export class AuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthError';
    }
}

function getCookieValue(cookieHeader: string | null, name: string): string | null {
    if (!cookieHeader) return null;
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}
