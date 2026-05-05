import { test, expect } from '@playwright/test';

/**
 * Acceptance spec for the admin observability route shipped in PR #401.
 *
 * Validates the 403 hermetic path:
 *   - Unauth + no X-Debug-Key → 403 envelope
 *   - X-Request-Id header propagates (Pattern 7)
 *   - The 403 body never leaks the env-var names this route reads
 *     (DEBUG_ADMIN_KEY, SUPABASE_SERVICE_ROLE_KEY)
 *
 * The 200 happy path requires either a Supabase test DB or a real
 * admin Privy session. Both belong in a separate authenticated suite;
 * this spec stays hermetic so it runs on every CI build without
 * external dependencies.
 */

test('GET returns 403 envelope when no admin key + no session', async ({ request }) => {
    const res = await request.get('/api/admin/photon/recent');
    expect(res.status()).toBe(403);

    const requestIdHeader = res.headers()['x-request-id'];
    expect(requestIdHeader).toMatch(/^req_/);

    const body = await res.json();
    expect(body.error).toBe('forbidden');
    expect(body.requestId).toBe(requestIdHeader);
    expect(body.hint).toContain('Admin');
    expect(body.timestamp).toBeTruthy();
});

test('GET 403 body never leaks env var names or table internals', async ({ request }) => {
    const res = await request.get('/api/admin/photon/recent');
    const body = await res.text();
    expect(body).not.toMatch(/DEBUG_ADMIN_KEY/);
    expect(body).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(body).not.toMatch(/inbound_messages/);
    expect(body).not.toMatch(/Bearer\s+ey[A-Za-z0-9_-]+/);
});

test('GET with a wrong X-Debug-Key still returns 403', async ({ request }) => {
    const res = await request.get('/api/admin/photon/recent', {
        headers: { 'x-debug-key': 'definitely-not-the-real-key' },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('forbidden');
});
