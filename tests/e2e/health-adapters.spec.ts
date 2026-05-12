import { test, expect } from '@playwright/test';

/**
 * W1B-adapters-status acceptance spec.
 *
 * Validates the /api/health/adapters route:
 *   - Unauth → 401 with the standard envelope (requestId, errorClass,
 *     message, nextAction)
 *   - X-Request-Id header propagates (Pattern 7)
 *
 * The authenticated-200 path requires a real Privy JWT to exercise
 * end-to-end. We skip that here and let the bypass e2e suite
 * (tests/e2e/bypass.spec.ts) cover the authenticated variant when a
 * test token is available. This spec stays hermetic — no Supabase,
 * no Privy, no env-var dependency.
 */

test('GET returns 401 + envelope when anonymous', async ({ request }) => {
    const res = await request.get('/api/health/adapters');
    expect(res.status()).toBe(401);

    const requestIdHeader = res.headers()['x-request-id'];
    expect(requestIdHeader).toMatch(/^req_/);

    const body = await res.json();
    expect(body.error).toBe('unauthorized');
    expect(body.errorClass).toBe('reauth_required');
    expect(body.reason).toBe('not_authenticated');
    expect(body.recovery).toBe('reauth');
    expect(body.requestId).toBe(requestIdHeader);
    expect(body.message).toContain('Sign in');
    expect(body.nextAction).toContain('retry');
});

test('GET never leaks secrets in the 401 body', async ({ request }) => {
    // Defensive: even error paths should never surface env var values or
    // tokens. A future regression that accidentally includes the payload
    // of a `Bearer` token fails this.
    const res = await request.get('/api/health/adapters');
    const body = await res.text();
    expect(body).not.toMatch(/Bearer\s+ey[A-Za-z0-9_-]+/);
    expect(body).not.toMatch(/PHOTON_API_KEY|PHOTON_TOKEN/);
    expect(body).not.toMatch(/MAGICBLOCK_PAYMENTS_TOKEN/);
    expect(body).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    // PR #395 added anthropic + photon_inbox entries on the 200 path.
    // The 401 envelope must never carry the Anthropic key or any
    // Supabase service-role artifact, even by accident.
    expect(body).not.toMatch(/ANTHROPIC_API_KEY|sk-ant-[A-Za-z0-9_-]+/);
    expect(body).not.toMatch(/inbound_messages/);
    // PR #496 added a google_oauth adapter row. Its env-var names
    // (GOOGLE_OAUTH_CLIENT_ID/CLIENT_SECRET/STATE_SECRET/REDIRECT_URI)
    // and any embedded OAuth client secret must never surface in the
    // unauth envelope either, even by accident.
    expect(body).not.toMatch(/GOOGLE_OAUTH_(CLIENT_ID|CLIENT_SECRET|STATE_SECRET|REDIRECT_URI)/);
    expect(body).not.toMatch(/GOCSPX-[A-Za-z0-9_-]+/);
    // PR #515 added filecoin + elevenlabs adapter rows. Their secret
    // env vars must never surface in the unauth envelope: Lighthouse
    // tokens, Pinata JWTs, Storacha UCAN delegations, and the
    // ElevenLabs API key (which has the form `sk_<...>`).
    expect(body).not.toMatch(/LIGHTHOUSE_API_KEY/);
    expect(body).not.toMatch(/PINATA_JWT/);
    expect(body).not.toMatch(/FILECOIN_STORACHA_(KEY|PROOF)/);
    expect(body).not.toMatch(/ELEVENLABS_API_KEY/);
    expect(body).not.toMatch(/sk_[A-Za-z0-9]{20,}/); // ElevenLabs sk_ keys
});
