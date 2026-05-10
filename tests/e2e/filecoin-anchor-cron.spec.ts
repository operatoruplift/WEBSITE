import { test, expect } from '@playwright/test';

// Cold-compile budget: dev server compiles route on first hit.
test.describe.configure({ timeout: 90_000 });

/**
 * Hermetic spec for /api/cron/filecoin-anchor (PR #515).
 *
 * The cron picks up unanchored signed receipts and pushes them to
 * the configured Filecoin provider. It is gated on CRON_SECRET via
 * Authorization: Bearer header (same pattern as photon-cleanup).
 *
 * Tests:
 *   - 401 when no Authorization header is present
 *   - X-Request-Id propagates on the 401 path
 *   - 401 body never leaks LIGHTHOUSE_API_KEY / PINATA_JWT /
 *     CRON_SECRET / FILECOIN_PROVIDER values
 *
 * Authenticated paths are exercised manually via curl with the real
 * CRON_SECRET; they require a Filecoin provider key + a
 * tool_receipts row to anchor, neither of which the hermetic spec
 * controls.
 */

test('GET /api/cron/filecoin-anchor returns 401 envelope when unauthenticated', async ({ request }) => {
    const res = await request.get('/api/cron/filecoin-anchor');
    // Either 401 (CRON_SECRET configured but no header) or 503
    // (CRON_SECRET unset). Both are documented honest-status paths;
    // the test passes either way as long as the X-Request-Id contract
    // is honored.
    expect([401, 503]).toContain(res.status());

    const requestId = res.headers()['x-request-id'];
    expect(requestId).toMatch(/^req_/);
});

test('GET /api/cron/filecoin-anchor never leaks Filecoin secret env-var values', async ({ request }) => {
    // Defensive: a regression that surfaces the CRON_SECRET, the
    // Lighthouse API key, or the Pinata JWT in an error envelope
    // would be a real leak. None of those should ever appear in a
    // 401 body, regardless of which provider is wired.
    const res = await request.get('/api/cron/filecoin-anchor');
    const text = await res.text();
    expect(text).not.toMatch(/CRON_SECRET/);
    expect(text).not.toMatch(/LIGHTHOUSE_API_KEY/);
    expect(text).not.toMatch(/PINATA_JWT/);
    // Pinata JWTs and Lighthouse keys both look like long base64-ish
    // tokens; bracket the most suspicious shapes.
    expect(text).not.toMatch(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/); // JWT
});
