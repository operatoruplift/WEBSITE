/**
 * HMAC-signed OAuth state.
 *
 * The Google OAuth start route binds the user's Privy DID into a
 * short-lived signed state token. The callback route verifies the
 * signature and expiry before exchanging the auth code.
 *
 * Why signed state: prevents userId forgery. Without a signature,
 * anyone could hit /callback with `state=did:privy:victim&code=...`
 * to link their own Google account to someone else's Privy user.
 *
 * Format: base64url(JSON).base64url(hmacSha256)
 */
import crypto from 'crypto';

const STATE_TTL_SECONDS = 10 * 60; // 10 minutes, covers OAuth flow

function getSecret(): string {
    const secret =
        process.env.GOOGLE_OAUTH_STATE_SECRET ||
        process.env.PRIVY_APP_SECRET ||
        '';
    if (!secret) {
        throw new Error(
            'OAuth state secret missing. Set GOOGLE_OAUTH_STATE_SECRET (or ensure PRIVY_APP_SECRET is set).',
        );
    }
    return secret;
}

interface StatePayload {
    uid: string;  // privy user id
    exp: number;  // unix seconds
    nonce: string; // random, for single-use flavour
}

function b64url(buf: Buffer): string {
    return buf.toString('base64url');
}

export function signOAuthState(userId: string): string {
    if (!userId) throw new Error('userId required to sign OAuth state');
    const payload: StatePayload = {
        uid: userId,
        exp: Math.floor(Date.now() / 1000) + STATE_TTL_SECONDS,
        nonce: crypto.randomBytes(8).toString('hex'),
    };
    const payloadB64 = b64url(Buffer.from(JSON.stringify(payload), 'utf8'));
    const sig = crypto.createHmac('sha256', getSecret()).update(payloadB64).digest();
    const sigB64 = b64url(sig);
    return `${payloadB64}.${sigB64}`;
}

/**
 * Verify a signed state. Returns the userId on success, null on any
 * failure (signature mismatch, expired, malformed). Never throws.
 */
export function verifyOAuthState(state: string | null | undefined): string | null {
    if (!state || typeof state !== 'string') return null;
    const parts = state.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, sigB64] = parts;
    let expected: Buffer;
    try {
        expected = crypto
            .createHmac('sha256', getSecret())
            .update(payloadB64)
            .digest();
    } catch {
        return null;
    }
    let provided: Buffer;
    try {
        provided = Buffer.from(sigB64, 'base64url');
    } catch {
        return null;
    }
    if (expected.length !== provided.length) return null;
    if (!crypto.timingSafeEqual(expected, provided)) return null;

    // Decode payload
    let payload: StatePayload;
    try {
        payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    } catch {
        return null;
    }
    if (!payload.uid || typeof payload.exp !== 'number') return null;
    if (Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload.uid;
}
