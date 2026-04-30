import { test, expect } from '@playwright/test';
import { getTokenFromRequest } from '@/lib/supabase-server';

/**
 * Unit tests for getTokenFromRequest in lib/supabase-server.ts.
 *
 * Used by the requireAuth guard to pull the access token from the
 * incoming Authorization header before passing it to
 * createUserSupabase. A regression here means the auth guard accepts
 * malformed headers and silently downgrades to anonymous, OR rejects
 * legitimate Bearer tokens.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/supabase-getTokenFromRequest.spec.ts --reporter=list
 */

function reqWith(headers: Record<string, string>): Request {
    return new Request('https://x.test/api/x', { headers });
}

test.describe('getTokenFromRequest', () => {
    test('extracts the token after "Bearer "', () => {
        const req = reqWith({ authorization: 'Bearer abc.def.ghi' });
        expect(getTokenFromRequest(req)).toBe('abc.def.ghi');
    });

    test('returns null when no Authorization header', () => {
        const req = reqWith({});
        expect(getTokenFromRequest(req)).toBeNull();
    });

    test('returns null when Authorization is empty string', () => {
        const req = reqWith({ authorization: '' });
        expect(getTokenFromRequest(req)).toBeNull();
    });

    test('returns null when Authorization is non-Bearer scheme (e.g. Basic)', () => {
        const req = reqWith({ authorization: 'Basic abc==' });
        expect(getTokenFromRequest(req)).toBeNull();
    });

    test('returns null when Authorization is missing the "Bearer " prefix', () => {
        const req = reqWith({ authorization: 'abc.def.ghi' });
        expect(getTokenFromRequest(req)).toBeNull();
    });

    test('case-sensitive prefix: "bearer " (lowercase) is not accepted', () => {
        // Documents the contract — Bearer must be capitalized. RFC 6750
        // says it should be case-insensitive but this implementation is
        // strict. A regression that loosened this would be a behavior
        // change worth noticing.
        const req = reqWith({ authorization: 'bearer abc' });
        expect(getTokenFromRequest(req)).toBeNull();
    });

    test('handles long JWT tokens unchanged', () => {
        const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature';
        const req = reqWith({ authorization: `Bearer ${jwt}` });
        expect(getTokenFromRequest(req)).toBe(jwt);
    });

    test('preserves token whitespace / special chars verbatim', () => {
        // Some providers embed dots, dashes, base64 padding. Verify
        // the slice doesn't trim or transform.
        const token = 'tok.with-dashes_and+pad/=';
        const req = reqWith({ authorization: `Bearer ${token}` });
        expect(getTokenFromRequest(req)).toBe(token);
    });

    test('Authorization header lookup is case-insensitive (Headers normalises)', () => {
        // The Headers API normalises header names. Setting Authorization
        // with any casing returns the same value.
        const req = reqWith({ Authorization: 'Bearer up-case-token' });
        expect(getTokenFromRequest(req)).toBe('up-case-token');
    });

    test('returns null when Authorization is exactly "Bearer " (Headers API trims trailing whitespace)', () => {
        // Subtle: the Headers API normalizes "Bearer " → "Bearer"
        // (strips trailing whitespace). Then `startsWith('Bearer ')`
        // (with trailing space) is false, so we return null. Document
        // this so a refactor that switched to a manual header parser
        // doesn't accidentally start returning empty string here.
        const req = reqWith({ authorization: 'Bearer ' });
        expect(getTokenFromRequest(req)).toBeNull();
    });
});
