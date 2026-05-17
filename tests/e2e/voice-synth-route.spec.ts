import { test, expect } from '@playwright/test';

// Cold-compile budget: dev server compiles route on first hit.
test.describe.configure({ timeout: 90_000 });

/**
 * Hermetic spec for /api/voice/synth (PR #516).
 *
 * The route synthesizes speech via ElevenLabs for the demo
 * voiceover. It is auth-gated and env-gated. We test the contract
 * without ever calling ElevenLabs:
 *
 *   - 401 envelope when anonymous (middleware gate)
 *   - X-Request-Id propagates on the 401 path
 *   - 401 body never names ELEVENLABS_API_KEY (no env-var leak)
 *
 * Authenticated paths are exercised by the bypass suite separately
 * once ELEVENLABS_API_KEY is set on Vercel.
 */

test('POST /api/voice/synth returns 401 envelope when anonymous', async ({ request }) => {
    const res = await request.post('/api/voice/synth', {
        headers: { 'Content-Type': 'application/json' },
        data: { text: 'Hello world' },
    });
    expect(res.status()).toBe(401);

    // X-Request-Id propagation is the load-bearing contract — pages
    // that surface "report this with req_..." rely on it. The route's
    // own structured `{ error: "unauthorized", errorClass:
    // "reauth_required", requestId }` envelope is dead code today
    // because the auth middleware intercepts first and returns its own
    // shape. The middleware response is consistent across every
    // auth-required route, so the spec locks the middleware envelope
    // (request-id header + "Authentication required" message + login
    // pointer) rather than asserting an envelope the route never gets
    // a chance to emit.
    const requestId = res.headers()['x-request-id'];
    expect(requestId).toMatch(/^req_/);

    const body = await res.json();
    expect(body.error).toMatch(/Authentication required/i);
    expect(body.error).toMatch(/\/login/);
});

test('POST /api/voice/synth never leaks ELEVENLABS_API_KEY in 401 body', async ({ request }) => {
    // The route is env-gated. Even on the unauth 401 path, the
    // env-var name should never surface, so a scanner can't
    // fingerprint the missing key off this endpoint.
    const res = await request.post('/api/voice/synth', {
        headers: { 'Content-Type': 'application/json' },
        data: { text: 'probe' },
    });
    const text = await res.text();
    expect(text).not.toMatch(/ELEVENLABS_API_KEY/);
    expect(text).not.toMatch(/sk_[A-Za-z0-9_-]+/); // ElevenLabs key prefix
});
