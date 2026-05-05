import { test, expect } from '@playwright/test';

/**
 * Hermetic acceptance spec for /api/admin/photon/optouts.
 *
 * Validates the 403 path for both GET and POST so a non-admin can't
 * read the opt-out list or flip a flag without going through the
 * documented gate.
 *
 *   - Anonymous GET → 403
 *   - Anonymous POST → 403
 *   - Wrong X-Debug-Key → 403
 *   - 403 body never leaks env vars or table internals
 *
 * The 200 happy path requires Supabase + admin session and is
 * exercised via /dev/photon's UI in an authenticated suite.
 */

test('GET returns 403 envelope when no admin key + no session', async ({ request }) => {
    const res = await request.get('/api/admin/photon/optouts');
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('forbidden');
    expect(body.requestId).toMatch(/^req_/);
});

test('POST returns 403 envelope when no admin key + no session', async ({ request }) => {
    const res = await request.post('/api/admin/photon/optouts', {
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ sender: '+15551234567', action: 'clear' }),
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('forbidden');
});

test('403 body never leaks env-var names or table internals', async ({ request }) => {
    const res = await request.get('/api/admin/photon/optouts');
    const body = await res.text();
    expect(body).not.toMatch(/DEBUG_ADMIN_KEY/);
    expect(body).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(body).not.toMatch(/imessage_opt_outs/);
    expect(body).not.toMatch(/Bearer\s+ey[A-Za-z0-9_-]+/);
});

test('GET with a wrong X-Debug-Key still returns 403', async ({ request }) => {
    const res = await request.get('/api/admin/photon/optouts', {
        headers: { 'x-debug-key': 'definitely-not-the-real-key' },
    });
    expect(res.status()).toBe(403);
});

test('POST with a wrong X-Debug-Key still returns 403', async ({ request }) => {
    const res = await request.post('/api/admin/photon/optouts', {
        headers: {
            'Content-Type': 'application/json',
            'x-debug-key': 'definitely-not-the-real-key',
        },
        data: JSON.stringify({ sender: '+15551234567', action: 'clear' }),
    });
    expect(res.status()).toBe(403);
});
