import { test, expect } from '@playwright/test';

// Cold-compile budget: the dev server compiles the route on first hit.
test.describe.configure({ timeout: 90_000 });

/**
 * Hermetic spec for /api/arkiv/agents and /api/arkiv/memories.
 *
 * Companion to:
 *   - arkiv-core.spec.ts (file-existence + PROJECT_ATTRIBUTE pattern)
 *   - truth-table-honest.spec.ts (Real claim doc-code coherence)
 *   - localfirst-built-on-honest.spec.ts (homepage Built on pill)
 *
 * This spec covers the HTTP envelope contract a judge actually sees
 * when they curl the routes from the Arkiv challenge submission form:
 *
 *   - 200 on the GET path (no auth required, per middleware allowlist
 *     in PR #621)
 *   - JSON envelope shape: { agents | sessions | memories, count,
 *     requestId, timestamp }
 *   - X-Request-Id header propagates (same trust-gate contract every
 *     other public route honors)
 *   - Empty state is honest: when no entities are published yet, the
 *     envelope still returns 200 with count=0 rather than throwing
 *     a 500 or fabricating sample data
 *   - No secret VALUES leak in error paths (ARKIV_PRIVATE_KEY,
 *     Supabase JWT, etc.) - per the leak-guard pattern from PR #603
 *     (filecoin-anchor) + PR #605 (og-anchor)
 */

test('GET /api/arkiv/agents returns 200 with the honest envelope shape', async ({ request }) => {
    const res = await request.get('/api/arkiv/agents');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.agents)).toBe(true);
    expect(typeof body.count).toBe('number');
    expect(body.count).toBe(body.agents.length);
    expect(body.requestId).toMatch(/^req_/);
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(body.explorer).toContain('explorer.braga.hoodi.arkiv.network');
});

test('GET /api/arkiv/agents X-Request-Id matches the body requestId', async ({ request }) => {
    // The trust-gate contract: every public route propagates a stable
    // request-id in both the HTTP header and the JSON envelope so a
    // judge filing a bug report can quote one identifier and we can
    // find the run in our logs.
    const res = await request.get('/api/arkiv/agents');
    const headerRequestId = res.headers()['x-request-id'];
    const body = await res.json();
    expect(headerRequestId).toMatch(/^req_/);
    expect(body.requestId).toBe(headerRequestId);
});

test('GET /api/arkiv/agents is publicly accessible (middleware allowlist)', async ({ request }) => {
    // PR #621 added /api/arkiv/ to PUBLIC_ROUTES in middleware.ts so
    // judges can curl this without a Privy session. Same pattern as
    // /api/receipts/public-key and /api/og/storage/. If a future
    // middleware refactor drops the allowlist entry, this fires
    // before judges see a 401.
    const res = await request.get('/api/arkiv/agents');
    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(403);
});

test('GET /api/arkiv/memories without ?agent returns a documented 400', async ({ request }) => {
    // The route requires ?agent=<slug>; missing it should produce a
    // structured validation error envelope, not a 500. The error must
    // also tell the caller exactly what to do next.
    const res = await request.get('/api/arkiv/memories');
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(typeof body.error).toBe('string');
    expect(body.requestId).toMatch(/^req_/);
});

test('GET /api/arkiv/memories?agent=<slug> returns sessions index honestly', async ({ request }) => {
    // Index mode: list sessions for one agent. Honest empty state
    // when no sessions exist yet for the slug.
    const res = await request.get('/api/arkiv/memories?agent=calendar');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe('index');
    expect(body.agentSlug).toBe('calendar');
    expect(Array.isArray(body.sessions)).toBe(true);
    expect(typeof body.count).toBe('number');
});

test('GET /api/arkiv/agents never leaks ARKIV_PRIVATE_KEY or Supabase JWT', async ({ request }) => {
    // Defensive: any future regression that surfaces the Arkiv signing
    // key or a Supabase service-role JWT in the error envelope would
    // be a real leak. Same contract as PR #603 (filecoin-anchor) and
    // PR #605 (og-anchor): guard against secret VALUES, not env-var
    // NAMES (the latter are legitimate operator hints).
    const res = await request.get('/api/arkiv/agents');
    const text = await res.text();
    // JWT shape (Supabase, Privy)
    expect(text).not.toMatch(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    // 0x-prefixed 64-hex private key
    expect(text).not.toMatch(/\b0x[a-fA-F0-9]{64}\b/);
    // Standalone 64-hex (could be a raw private key or other secret)
    expect(text).not.toMatch(/\b[a-f0-9]{64}\b/);
});
