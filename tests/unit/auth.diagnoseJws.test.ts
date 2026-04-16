import { test, expect } from '@playwright/test';
import { diagnoseJws } from '@/lib/auth';

/**
 * Unit tests for diagnoseJws — the shape checker we run BEFORE handing
 * a token to Privy. Catching malformed tokens early gives us clean
 * error codes instead of "Invalid Compact JWS" from jose.
 *
 * Run: pnpm exec playwright test tests/unit/auth.diagnoseJws.test.ts
 */

// Fixture: a known-good JWT shape (header.payload.signature). The
// signature is bogus but the shape is correct, so diagnoseJws should
// parse header/payload claims. Actual verification is Privy's job.
const GOOD_JWT_FIXTURE = (() => {
    const header = Buffer.from(JSON.stringify({ alg: 'ES256', typ: 'JWT', kid: 'test-key-1' }))
        .toString('base64url');
    const payload = Buffer.from(JSON.stringify({
        sub: 'did:privy:test-user-123',
        aud: 'test-app-id',
        iss: 'privy.io',
        exp: Math.floor(Date.now() / 1000) + 3600,
    })).toString('base64url');
    const sig = Buffer.from('bogus-signature-just-for-shape-test').toString('base64url');
    return `${header}.${payload}.${sig}`;
})();

test('diagnoseJws: good token parses header + payload claims', () => {
    const d = diagnoseJws(GOOD_JWT_FIXTURE);
    expect(d.shape_ok).toBe(true);
    expect(d.segments).toBe(3);
    expect(d.header_alg).toBe('ES256');
    expect(d.header_kid).toBe('test-key-1');
    expect(d.payload_sub).toBe('did:privy:test-user-123');
    expect(d.payload_aud).toBe('test-app-id');
    expect(d.payload_iss).toBe('privy.io');
    expect(d.payload_exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(d.error).toBeUndefined();
});

test('diagnoseJws: empty/null token returns token_missing', () => {
    expect(diagnoseJws(null).error).toBe('token_missing');
    expect(diagnoseJws(undefined).error).toBe('token_missing');
    expect(diagnoseJws('').error).toBe('token_missing');
    expect(diagnoseJws(null).shape_ok).toBe(false);
});

test('diagnoseJws: placeholder string "privy-session" returns not_a_jws', () => {
    // This is the exact bug we just fixed — a placeholder instead of a JWT
    const d = diagnoseJws('privy-session');
    expect(d.shape_ok).toBe(false);
    expect(d.segments).toBe(1);
    expect(d.error).toBe('not_a_jws');
});

test('diagnoseJws: plain text returns not_a_jws', () => {
    const d = diagnoseJws('not a jwt at all');
    expect(d.shape_ok).toBe(false);
    expect(d.error).toBe('not_a_jws');
});

test('diagnoseJws: two-segment token returns not_a_jws', () => {
    const d = diagnoseJws('header.payload');
    expect(d.shape_ok).toBe(false);
    expect(d.segments).toBe(2);
    expect(d.error).toBe('not_a_jws');
});

test('diagnoseJws: four-segment token returns too_many_segments', () => {
    const d = diagnoseJws('a.b.c.d');
    expect(d.shape_ok).toBe(false);
    expect(d.segments).toBe(4);
    expect(d.error).toBe('too_many_segments');
});

test('diagnoseJws: three segments but malformed header', () => {
    // Valid shape but header isn't base64url-JSON
    const d = diagnoseJws('not-base64.also-not-base64.sig');
    expect(d.shape_ok).toBe(true);
    expect(d.error).toBe('malformed_header');
});

test('diagnoseJws: never leaks the full token in diagnostic output', () => {
    // The diagnostic object should have length + claims but never the raw string
    const d = diagnoseJws(GOOD_JWT_FIXTURE);
    const serialized = JSON.stringify(d);
    expect(serialized).not.toContain(GOOD_JWT_FIXTURE);
    expect(d.length).toBe(GOOD_JWT_FIXTURE.length);
});
