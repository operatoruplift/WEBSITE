import { test, expect } from '@playwright/test';

/**
 * Hermetic spec for the /api/health route. The route is auth-free
 * by design (uptime probes hit it without a Privy session) and
 * deliberately doesn't reach out to Supabase, Anthropic, or Photon,
 * so this spec doesn't need any env vars or fixtures.
 *
 * Why this spec exists: the middleware allowlist at middleware.ts:42
 * has had `/api/health` listed since before the route file existed.
 * Wave 1 inventory caught the gap; PR #458 added the route. This
 * spec locks in the contract so a future cleanup that "removes the
 * empty route" doesn't accidentally re-open Wave 1 risk #6 (404 on
 * the documented uptime path).
 */

test('GET /api/health returns 200 with the canonical envelope', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe('operatoruplift-web');
    expect(body.requestId).toMatch(/^req_/);
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
});

test('GET /api/health propagates X-Request-Id header', async ({ request }) => {
    const res = await request.get('/api/health');
    const requestIdHeader = res.headers()['x-request-id'];
    expect(requestIdHeader).toMatch(/^req_/);

    const body = await res.json();
    expect(body.requestId).toBe(requestIdHeader);
});

test('GET /api/health honors a caller-supplied X-Request-Id', async ({ request }) => {
    const supplied = 'req_test-correlation-id';
    const res = await request.get('/api/health', { headers: { 'x-request-id': supplied } });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.requestId).toBe(supplied);
    expect(res.headers()['x-request-id']).toBe(supplied);
});

test('GET /api/health never reaches downstream services', async ({ request }) => {
    // The whole point of /api/health is to be a cheap probe that
    // returns 200 even when Supabase / Anthropic / Photon are down.
    // We can't easily simulate those outages from a test, but we
    // CAN assert the response shape is fixed and never includes
    // a downstream-error field.
    const res = await request.get('/api/health');
    const body = await res.json();
    expect(body.error).toBeUndefined();
    expect(body.errorClass).toBeUndefined();
    expect(body.detail).toBeUndefined();
});
