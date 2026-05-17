import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 90_000 });

/**
 * Hermetic unauth-contract bundle for the cron routes that don't yet
 * have dedicated specs.
 *
 * filecoin-anchor-cron.spec.ts and og-anchor-cron.spec.ts each cover
 * one cron in depth (envelope shape + leak guard). This bundle covers
 * the remaining three:
 *
 *   - /api/cron/morning-briefing (Vercel-scheduled, 8AM MYT daily)
 *   - /api/cron/photon-cleanup (manual; scrubs expired iMessage state)
 *   - /api/cron/photon-summary (manual; writes per-thread summaries)
 *
 * The contract is the same across all three: CRON_SECRET-gated, 401
 * (or 503 if env unconfigured) without the Authorization header, no
 * env-var values in the error envelope.
 *
 * Why bundle: each cron's unauth surface is tiny. One file with three
 * matched tests stays maintainable and avoids three sibling files
 * that all share the same shape.
 */

const CRON_PATHS = [
    '/api/cron/morning-briefing',
    '/api/cron/photon-cleanup',
    '/api/cron/photon-summary',
] as const;

for (const path of CRON_PATHS) {
    test(`GET ${path} blocks anonymous callers with 401 or 503`, async ({ request }) => {
        const res = await request.get(path);
        // 401 when CRON_SECRET is configured, 503 when it's not.
        // Both are valid honest-status paths.
        expect([401, 503]).toContain(res.status());

        const requestId = res.headers()['x-request-id'];
        expect(requestId).toMatch(/^req_/);
    });

    test(`GET ${path} never leaks CRON_SECRET or Supabase JWT in error body`, async ({ request }) => {
        const res = await request.get(path);
        const text = await res.text();
        // JWT shape (Supabase service-role tokens, Google OAuth bearer tokens).
        expect(text).not.toMatch(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
        // CRON_SECRET is typically a long random string; the only
        // bound we can assert without knowing its actual length is
        // that the error body should not echo back the Authorization
        // header verbatim. Reject any "Bearer <token>" pattern in the
        // envelope.
        expect(text).not.toMatch(/Bearer\s+[A-Za-z0-9_-]{16,}/);
    });
}
