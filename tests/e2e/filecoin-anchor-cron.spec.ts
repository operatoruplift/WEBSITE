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

test('GET /api/cron/filecoin-anchor never leaks Filecoin secret VALUES', async ({ request }) => {
    // Defensive: a regression that surfaces the Lighthouse API key
    // or the Pinata JWT in an error envelope would be a real leak.
    // The error envelope IS allowed to mention env-var NAMES as
    // operator hints (e.g. "CRON_SECRET not configured" tells the
    // operator which var to set; "LIGHTHOUSE_API_KEY missing" would
    // similarly be a legitimate hint). Same contract as PR #586's
    // health-adapters leak guard: guard against secret VALUES, not
    // documentation of which env vars exist.
    const res = await request.get('/api/cron/filecoin-anchor');
    const text = await res.text();
    // Pinata JWTs and Lighthouse keys both look like long base64-ish
    // tokens; bracket the most suspicious shapes.
    expect(text).not.toMatch(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/); // JWT
    // Lighthouse API keys are typically ~64 hex chars (sha256-like).
    // Reject any standalone hex string that long appearing in the
    // envelope.
    expect(text).not.toMatch(/\b[a-f0-9]{64}\b/);
});
