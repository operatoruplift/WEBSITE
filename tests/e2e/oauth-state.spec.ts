import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';
import { signOAuthState, verifyOAuthState } from '@/lib/google/oauth-state';

/**
 * Unit tests for the HMAC-signed OAuth state used by Google integration.
 *
 * Why this matters: the Google /callback route binds the user's Privy
 * DID into the OAuth state token. Without a signed state, an attacker
 * could craft `state=did:privy:victim&code=ATTACKER_CODE` and link
 * their own Google account to the victim's Privy user. signOAuthState
 * mints a signed token; verifyOAuthState validates the HMAC + expiry.
 *
 * A regression in any of these tests means the integration's primary
 * defense against state forgery is broken.
 *
 * Tests mutate process.env.GOOGLE_OAUTH_STATE_SECRET so the describe
 * block is serial.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/oauth-state.spec.ts --reporter=list
 */

test.describe.configure({ mode: 'serial' });

const ORIG_STATE_SECRET = process.env.GOOGLE_OAUTH_STATE_SECRET;
const ORIG_PRIVY_SECRET = process.env.PRIVY_APP_SECRET;
const TEST_SECRET = 'test-oauth-state-secret-1234567890';

function setSecret(value: string | null) {
    if (value === null) {
        delete process.env.GOOGLE_OAUTH_STATE_SECRET;
    } else {
        process.env.GOOGLE_OAUTH_STATE_SECRET = value;
    }
    // Also clear PRIVY_APP_SECRET fallback so tests are deterministic.
    delete process.env.PRIVY_APP_SECRET;
}

function restoreEnv() {
    if (ORIG_STATE_SECRET === undefined) {
        delete process.env.GOOGLE_OAUTH_STATE_SECRET;
    } else {
        process.env.GOOGLE_OAUTH_STATE_SECRET = ORIG_STATE_SECRET;
    }
    if (ORIG_PRIVY_SECRET === undefined) {
        delete process.env.PRIVY_APP_SECRET;
    } else {
        process.env.PRIVY_APP_SECRET = ORIG_PRIVY_SECRET;
    }
}

test.beforeEach(() => {
    setSecret(TEST_SECRET);
});

test.afterEach(() => {
    restoreEnv();
});

test.describe('signOAuthState', () => {
    test('produces a payload.signature shape', () => {
        const state = signOAuthState('did:privy:test-user-123');
        const parts = state.split('.');
        expect(parts).toHaveLength(2);
        expect(parts[0].length, 'payload portion').toBeGreaterThan(0);
        expect(parts[1].length, 'signature portion').toBeGreaterThan(0);
    });

    test('throws when userId is empty', () => {
        expect(() => signOAuthState('')).toThrow(/userId required/i);
    });

    test('throws when secret is unset', () => {
        setSecret(null);
        expect(() => signOAuthState('did:privy:abc')).toThrow(/state secret missing/i);
    });

    test('uses PRIVY_APP_SECRET fallback when GOOGLE_OAUTH_STATE_SECRET is unset', () => {
        delete process.env.GOOGLE_OAUTH_STATE_SECRET;
        process.env.PRIVY_APP_SECRET = 'privy-fallback-secret';
        const state = signOAuthState('did:privy:fallback');
        expect(state.split('.')).toHaveLength(2);
        const uid = verifyOAuthState(state);
        expect(uid).toBe('did:privy:fallback');
    });

    test('different calls for the same user produce different states (nonce)', () => {
        const a = signOAuthState('did:privy:abc');
        const b = signOAuthState('did:privy:abc');
        // Same uid + secret + close-in-time exp, but different nonce
        // means signature is different. Defends against replay attacks.
        expect(a).not.toBe(b);
    });
});

test.describe('verifyOAuthState', () => {
    test('round-trips a userId through sign + verify', () => {
        const uid = 'did:privy:roundtrip-1';
        const state = signOAuthState(uid);
        expect(verifyOAuthState(state)).toBe(uid);
    });

    test('returns null for null / undefined / empty input', () => {
        expect(verifyOAuthState(null)).toBeNull();
        expect(verifyOAuthState(undefined)).toBeNull();
        expect(verifyOAuthState('')).toBeNull();
    });

    test('returns null when state has wrong number of dot-separated parts', () => {
        expect(verifyOAuthState('justonepart')).toBeNull();
        expect(verifyOAuthState('one.two.three')).toBeNull();
        expect(verifyOAuthState('one.two.three.four')).toBeNull();
    });

    test('returns null when signature is wrong', () => {
        const state = signOAuthState('did:privy:original');
        const [payload] = state.split('.');
        const tampered = `${payload}.${'A'.repeat(43)}=`; // bogus base64url sig
        expect(verifyOAuthState(tampered)).toBeNull();
    });

    test('returns null when signature was minted with a different secret', () => {
        const stateA = signOAuthState('did:privy:victim');
        // Rotate to a different secret and try to verify the old token.
        setSecret('different-secret-cannot-verify-the-old-token');
        expect(verifyOAuthState(stateA)).toBeNull();
    });

    test('returns null when payload is malformed JSON', () => {
        // Mint a state with the right secret but a payload that isn't
        // valid JSON. Has to be HMAC-signed correctly so we get past
        // the signature check, then the JSON.parse path fails.
        const badPayload = Buffer.from('not-json{').toString('base64url');
        const sig = crypto
            .createHmac('sha256', TEST_SECRET)
            .update(badPayload)
            .digest()
            .toString('base64url');
        const state = `${badPayload}.${sig}`;
        expect(verifyOAuthState(state)).toBeNull();
    });

    test('returns null when payload is missing uid', () => {
        const goodJson = JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 600, nonce: 'x' });
        const payloadB64 = Buffer.from(goodJson).toString('base64url');
        const sig = crypto
            .createHmac('sha256', TEST_SECRET)
            .update(payloadB64)
            .digest()
            .toString('base64url');
        const state = `${payloadB64}.${sig}`;
        expect(verifyOAuthState(state)).toBeNull();
    });

    test('returns null when state has expired', () => {
        const expired = JSON.stringify({
            uid: 'did:privy:past',
            exp: Math.floor(Date.now() / 1000) - 60, // 60s in the past
            nonce: 'x',
        });
        const payloadB64 = Buffer.from(expired).toString('base64url');
        const sig = crypto
            .createHmac('sha256', TEST_SECRET)
            .update(payloadB64)
            .digest()
            .toString('base64url');
        const state = `${payloadB64}.${sig}`;
        expect(verifyOAuthState(state)).toBeNull();
    });

    test('uses constant-time signature comparison (no early-exit)', () => {
        // Timing attacks against == comparisons can leak signature bytes
        // one at a time. We can't directly assert "constant time" but we
        // can verify the wrong-signature path returns null even when only
        // one byte differs. The implementation uses crypto.timingSafeEqual.
        const state = signOAuthState('did:privy:timing-test');
        const [payload, sig] = state.split('.');
        // Flip one bit in the sig
        const flipped = Buffer.from(sig, 'base64url');
        flipped[0] = flipped[0] ^ 0x01;
        const tampered = `${payload}.${flipped.toString('base64url')}`;
        expect(verifyOAuthState(tampered)).toBeNull();
    });
});
