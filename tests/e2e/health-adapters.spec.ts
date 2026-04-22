import { test, expect } from '@playwright/test';

/**
 * W1B-adapters-status acceptance spec.
 *
 * Validates the /api/health/adapters route:
 *   - Unauth → 401 with the standard envelope (requestId, errorClass,
 *     message, nextAction)
 *   - X-Request-Id header propagates (Pattern 7)
 *
 * The authenticated-200 path requires a real Privy JWT to exercise
 * end-to-end. We skip that here and let the bypass e2e suite
 * (tests/e2e/bypass.spec.ts) cover the authenticated variant when a
 * test token is available. This spec stays hermetic — no Supabase,
 * no Privy, no env-var dependency.
 */

test('GET returns 401 + envelope when anonymous', async ({ request }) => {
    const res = await request.get('/api/health/adapters');
    expect(res.status()).toBe(401);

    const requestIdHeader = res.headers()['x-request-id'];
    expect(requestIdHeader).toMatch(/^req_/);

    const body = await res.json();
    expect(body.error).toBe('unauthorized');
    expect(body.errorClass).toBe('reauth_required');
    expect(body.reason).toBe('not_authenticated');
    expect(body.recovery).toBe('reauth');
    expect(body.requestId).toBe(requestIdHeader);
    expect(body.message).toContain('Sign in');
    expect(body.nextAction).toContain('retry');
});

test('GET never leaks secrets in the 401 body', async ({ request }) => {
    // Defensive: even error paths should never surface env var values or
    // tokens. A future regression that accidentally includes the payload
    // of a `Bearer` token fails this.
    const res = await request.get('/api/health/adapters');
    const body = await res.text();
    expect(body).not.toMatch(/Bearer\s+ey[A-Za-z0-9_-]+/);
    expect(body).not.toMatch(/PHOTON_API_KEY|PHOTON_TOKEN/);
    expect(body).not.toMatch(/MAGICBLOCK_PAYMENTS_TOKEN/);
    expect(body).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
});
