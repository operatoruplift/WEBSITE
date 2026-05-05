import { test, expect } from '@playwright/test';

/**
 * Hermetic acceptance spec for /api/admin/photon/simulate.
 *
 * The 200 happy path generates a real webhook fan-out which we
 * cover in an authenticated suite when a test token is available.
 * This spec stays admin-gated-only so it runs on every CI build.
 *
 *   - Anonymous + no X-Debug-Key → 403 envelope
 *   - Wrong X-Debug-Key → 403
 *   - 403 body never leaks env-var names or table internals
 */

test('POST returns 403 envelope when no admin key + no session', async ({ request }) => {
    const res = await request.post('/api/admin/photon/simulate', {
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ sender: '+15551234567', text: 'hello' }),
    });
    expect(res.status()).toBe(403);

    const requestIdHeader = res.headers()['x-request-id'];
    expect(requestIdHeader).toMatch(/^req_/);

    const body = await res.json();
    expect(body.error).toBe('forbidden');
    expect(body.requestId).toBe(requestIdHeader);
    expect(body.hint).toContain('Admin');
});

test('POST 403 body never leaks env var names or table internals', async ({ request }) => {
    const res = await request.post('/api/admin/photon/simulate', {
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ sender: '+15551234567', text: 'hello' }),
    });
    const body = await res.text();
    expect(body).not.toMatch(/DEBUG_ADMIN_KEY/);
    expect(body).not.toMatch(/PHOTON_WEBHOOK_SECRET/);
    expect(body).not.toMatch(/PHOTON_API_KEY/);
    expect(body).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(body).not.toMatch(/inbound_messages/);
});

test('POST with a wrong X-Debug-Key still returns 403', async ({ request }) => {
    const res = await request.post('/api/admin/photon/simulate', {
        headers: {
            'Content-Type': 'application/json',
            'x-debug-key': 'definitely-not-the-real-key',
        },
        data: JSON.stringify({ sender: '+15551234567', text: 'hello' }),
    });
    expect(res.status()).toBe(403);
});
