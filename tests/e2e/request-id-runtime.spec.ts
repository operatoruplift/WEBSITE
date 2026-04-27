import { test, expect } from '@playwright/test';

/**
 * Runtime trust-gate enforcement.
 *
 * The `scripts/check.mjs::trust-gate` rule audits the SOURCE: every
 * `/api/*` route file must `import @/lib/apiHelpers` and call
 * `withRequestMeta`. After PRs #167-#174 trust-gate is at 44/44.
 *
 * This spec audits the RUNTIME: hits a representative set of
 * endpoints anonymously (no Privy JWT, no Supabase, no side effects)
 * and asserts that EVERY response carries the `X-Request-Id` header.
 *
 * Routes are picked to cover all four response shapes the contract
 * promises:
 *   - 200 success (capabilities, providers)
 *   - 401 / 403 unauthorized (whoami, dashboard/stats, profile/briefing)
 *   - 503 provider unavailable (health/llm without key, health/adapters)
 *   - 410 gone (subscription POST fall-through, x402 charge)
 */

interface Probe {
    name: string;
    method: 'GET' | 'POST';
    path: string;
    body?: unknown;
    /** Status codes that count as "ran the route handler" */
    expectStatus: number[];
}

// Anonymous probes: many routes are auth-gated by middleware, so we
// often see 401 from the middleware before the route handler runs.
// Both paths should carry X-Request-Id (middleware fix shipped in this
// PR), so 401 is a perfectly valid status to assert for the trust-gate
// runtime contract. The point is that *every* response shape carries
// the header.
const PROBES: Probe[] = [
    // Public routes (middleware skips, handler runs)
    { name: 'capabilities', method: 'GET', path: '/api/capabilities', expectStatus: [200] },
    { name: 'providers', method: 'GET', path: '/api/providers', expectStatus: [200] },
    { name: 'sns.resolve', method: 'GET', path: '/api/sns/resolve?name=operatoruplift.sol', expectStatus: [200, 400, 503] },
    { name: 'health.adapters', method: 'GET', path: '/api/health/adapters', expectStatus: [200, 401, 503] },
    { name: 'health.llm', method: 'GET', path: '/api/health/llm', expectStatus: [200, 503] },
    { name: 'waitlist validation', method: 'POST', path: '/api/waitlist', body: {}, expectStatus: [400] },
    { name: 'auth.login validation', method: 'POST', path: '/api/auth/login', body: {}, expectStatus: [400] },

    // Auth-gated routes: middleware returns 401 with X-Request-Id (the
    // fix this PR ships). Either we hit the middleware 401 OR the route
    // handler envelope, both must carry the header.
    { name: 'whoami', method: 'GET', path: '/api/whoami', expectStatus: [401, 403] },
    { name: 'dashboard.stats', method: 'GET', path: '/api/dashboard/stats', expectStatus: [200, 401, 403] },
    { name: 'receipts.public-key', method: 'GET', path: '/api/receipts/public-key', expectStatus: [200, 401, 500] },
    { name: 'subscription.post fall-through', method: 'POST', path: '/api/subscription', body: { action: 'unknown_action' }, expectStatus: [401, 410] },
    { name: 'x402 charge (410 gone)', method: 'POST', path: '/api/tools/x402', body: { action: 'charge', params: { amount: 1 } }, expectStatus: [401, 410] },
    { name: 'tools.web', method: 'POST', path: '/api/tools/web', body: { action: 'search', params: { query: 'x' } }, expectStatus: [401, 403] },
    { name: 'tools.notes', method: 'POST', path: '/api/tools/notes', body: { action: 'list' }, expectStatus: [401, 403] },
    { name: 'access.check', method: 'GET', path: '/api/access/check', expectStatus: [200, 401] },
    { name: 'risk', method: 'POST', path: '/api/risk', body: {}, expectStatus: [400, 401] },
];

test.describe('Runtime trust-gate: every response carries X-Request-Id', () => {
    for (const probe of PROBES) {
        test(`${probe.name} (${probe.method} ${probe.path})`, async ({ request }) => {
            const res = probe.method === 'GET'
                ? await request.get(probe.path)
                : await request.post(probe.path, {
                    headers: { 'Content-Type': 'application/json' },
                    data: probe.body,
                });

            expect(probe.expectStatus, `unexpected status ${res.status()} for ${probe.name}`).toContain(res.status());

            const requestId = res.headers()['x-request-id'];
            expect(requestId, `${probe.name} did not emit X-Request-Id`).toBeTruthy();
            expect(requestId, `${probe.name} X-Request-Id format`).toMatch(/^req_[0-9a-f-]{8,}/);
        });
    }
});
