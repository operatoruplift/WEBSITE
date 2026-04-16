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
    email?: string;
}

/**
 * Fetch the user's primary email from Privy.
 *
 * Privy `linkedAccounts` can contain:
 *   - { type: 'email', address: '...' }
 *   - { type: 'google_oauth', email: '...' }    ← most common for Google login
 *   - { type: 'github_oauth', email: '...' }
 *   - { type: 'wallet', address: '...' }        ← no email
 *
 * Return the first usable email, lowercased.
 */
export async function getUserEmail(userId: string): Promise<string | null> {
    if (!process.env.PRIVY_APP_SECRET) return null;
    try {
        const client = getPrivyClient();
        const user = await client.getUser(userId);
        type LinkedAccount = { type?: string; address?: string; email?: string };
        const accounts = (user?.linkedAccounts || []) as LinkedAccount[];

        // Check every account type that might carry an email
        for (const acc of accounts) {
            if (acc.type === 'email' && acc.address) return acc.address.toLowerCase();
            if (acc.type === 'google_oauth' && acc.email) return acc.email.toLowerCase();
            if (acc.type === 'github_oauth' && acc.email) return acc.email.toLowerCase();
        }
        return null;
    } catch (err) {
        console.warn('[auth.getUserEmail] failed:', err instanceof Error ? err.message : err);
        return null;
    }
}

/**
 * Shape-check a compact JWS — must be three dot-separated base64url
 * segments. Anything else will throw "Invalid Compact JWS" when jose
 * tries to parse it. Catching this early lets us give a clean error.
 */
export interface JwsDiagnostic {
    shape_ok: boolean;
    length: number;
    segments: number;
    header_kid?: string;
    header_alg?: string;
    payload_aud?: string;
    payload_iss?: string;
    payload_exp?: number;
    payload_sub?: string;
    error?: string;
}

export function diagnoseJws(token: string | null | undefined): JwsDiagnostic {
    if (!token || typeof token !== 'string') {
        return { shape_ok: false, length: 0, segments: 0, error: 'token_missing' };
    }
    const segments = token.split('.');
    const base: JwsDiagnostic = {
        shape_ok: segments.length === 3,
        length: token.length,
        segments: segments.length,
    };
    if (!base.shape_ok) {
        base.error = segments.length < 3 ? 'not_a_jws' : 'too_many_segments';
        return base;
    }
    try {
        const headerJson = Buffer.from(segments[0], 'base64url').toString('utf8');
        const header = JSON.parse(headerJson);
        base.header_kid = header.kid;
        base.header_alg = header.alg;
    } catch {
        base.error = 'malformed_header';
        return base;
    }
    try {
        const payloadJson = Buffer.from(segments[1], 'base64url').toString('utf8');
        const payload = JSON.parse(payloadJson);
        base.payload_aud = payload.aud;
        base.payload_iss = payload.iss;
        base.payload_exp = payload.exp;
        base.payload_sub = payload.sub;
    } catch {
        base.error = 'malformed_payload';
    }
    return base;
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
        throw new AuthError('no_session_token');
    }

    // Dev fallback: no Privy configured, accept token as-is
    if (!process.env.PRIVY_APP_SECRET) {
        return { userId: 'dev-user' };
    }

    // Shape-check before handing to Privy — gives us cleaner error codes
    // and avoids "Invalid Compact JWS" surfacing to the client
    const diag = diagnoseJws(token);
    if (!diag.shape_ok) {
        // Never log the full token — only length + shape diagnostics
        console.warn('[auth.verifySession] malformed JWS:', {
            length: diag.length,
            segments: diag.segments,
            error: diag.error,
        });
        throw new AuthError(`malformed_token:${diag.error}`);
    }

    try {
        const client = getPrivyClient();
        const verifiedClaims = await client.verifyAuthToken(token);
        return {
            userId: verifiedClaims.userId,
        };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'token_verification_failed';
        // Log structured diagnostic info so we can debug without leaking the token
        console.warn('[auth.verifySession] verify failed:', {
            length: diag.length,
            header_alg: diag.header_alg,
            header_kid: diag.header_kid,
            payload_aud: diag.payload_aud,
            payload_iss: diag.payload_iss,
            payload_exp: diag.payload_exp,
            err: msg,
        });
        // Map jose errors to stable codes
        let code = 'token_invalid';
        if (/expired/i.test(msg)) code = 'token_expired';
        else if (/signature/i.test(msg)) code = 'signature_invalid';
        else if (/audience/i.test(msg)) code = 'audience_mismatch';
        else if (/issuer/i.test(msg)) code = 'issuer_mismatch';
        else if (/compact jws/i.test(msg)) code = 'malformed_token';
        throw new AuthError(code);
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
