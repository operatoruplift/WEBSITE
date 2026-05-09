import { test, expect } from '@playwright/test';

// Cold-compile budget: first hit on the dev server compiles the route.
// 90s leaves room for compile + assertion polling.
test.describe.configure({ timeout: 90_000 });

/**
 * Hermetic spec for /api/health/imessage. Public-allowlisted via the
 * existing `/api/health` middleware prefix (no auth required), and
 * deliberately leaks no env-var names. Tests:
 *
 *   - 200 with the canonical envelope on a cold call
 *   - status is one of the three sanitized strings
 *   - X-Request-Id propagates through (matches the body's requestId)
 *   - The response body never carries env-var names that would leak
 *     posture (PHOTON_API_KEY, ANTHROPIC_API_KEY, etc.)
 *
 * The route reads `photonStatus()` + `process.env.ANTHROPIC_API_KEY`
 * synchronously on every request, so this spec is hermetic in the
 * "no DB, no Anthropic, no Photon network call" sense.
 */

test('GET /api/health/imessage returns 200 with the canonical envelope', async ({ request }) => {
    const res = await request.get('/api/health/imessage');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.requestId).toMatch(/^req_/);
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
});

test('GET /api/health/imessage status is one of the sanitized strings', async ({ request }) => {
    const res = await request.get('/api/health/imessage');
    const body = await res.json();
    // Three legal values. No fourth state, no missing field.
    expect(['operational', 'degraded', 'down']).toContain(body.status);
});

test('GET /api/health/imessage propagates X-Request-Id header', async ({ request }) => {
    const res = await request.get('/api/health/imessage');
    const headerId = res.headers()['x-request-id'];
    expect(headerId).toMatch(/^req_/);

    const body = await res.json();
    expect(body.requestId).toBe(headerId);
});

test('GET /api/health/imessage never leaks env-var names', async ({ request }) => {
    // Public route. Response body must not name PHOTON_*, ANTHROPIC_*,
    // GOOGLE_OAUTH_*, etc. so a scanner can't fingerprint missing
    // credentials. The detailed env-var view lives at
    // /api/health/adapters which is admin-gated.
    const res = await request.get('/api/health/imessage');
    const text = await res.text();
    expect(text).not.toMatch(/PHOTON_API_KEY/);
    expect(text).not.toMatch(/PHOTON_PROJECT_ID/);
    expect(text).not.toMatch(/ANTHROPIC_API_KEY/);
    expect(text).not.toMatch(/GOOGLE_OAUTH/);
    expect(text).not.toMatch(/SUPABASE_SERVICE_ROLE/);
});
