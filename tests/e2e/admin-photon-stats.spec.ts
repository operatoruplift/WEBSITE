import { test, expect } from '@playwright/test';

/**
 * Acceptance spec for /api/admin/photon/stats.
 *
 * Validates the 403 hermetic path:
 *   - Unauth + no X-Debug-Key → 403 envelope, x-request-id propagates
 *   - Wrong X-Debug-Key still → 403
 *   - 403 body never leaks DEBUG_ADMIN_KEY, SUPABASE_SERVICE_ROLE_KEY,
 *     or the inbound_messages table name
 *
 * The 200 happy path requires Supabase + admin session, which we
 * cover in a separate authenticated suite when a test token exists.
 */

test('GET returns 403 envelope when no admin key + no session', async ({ request }) => {
    const res = await request.get('/api/admin/photon/stats');
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
    const res = await request.get('/api/admin/photon/stats');
    const body = await res.text();
    expect(body).not.toMatch(/DEBUG_ADMIN_KEY/);
    expect(body).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(body).not.toMatch(/inbound_messages/);
    expect(body).not.toMatch(/Bearer\s+ey[A-Za-z0-9_-]+/);
});

test('GET with a wrong X-Debug-Key still returns 403', async ({ request }) => {
    const res = await request.get('/api/admin/photon/stats', {
        headers: { 'x-debug-key': 'definitely-not-the-real-key' },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('forbidden');
});
