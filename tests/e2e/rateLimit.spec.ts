import { test, expect } from '@playwright/test';
import { checkRateLimit } from '@/lib/rateLimit';

/**
 * Unit tests for the in-memory fallback path in lib/rateLimit.
 *
 * The module prefers Upstash Redis when UPSTASH_REDIS_REST_URL/TOKEN
 * are set; otherwise it falls back to an in-process Map. The fallback
 * is what runs in dev / staging / Demo Day when Upstash isn't wired,
 * and it's what currently runs in CI (no Upstash creds in the test
 * env). These tests pin the fallback behavior so a future PR can't
 * silently break demo-mode rate limiting.
 *
 * Each test uses a unique key (`${name}-${Date.now()}`) so there's no
 * cross-test bucket collision, even though all tests share the
 * module-private memoryBuckets Map.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/rateLimit.spec.ts --reporter=list
 */

// Skip the whole file if Upstash IS configured, in which case these
// tests would be hitting real Redis and the assertions about the
// memory buckets wouldn't apply. CI runs without these env vars.
test.beforeEach(({}, testInfo) => {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        testInfo.skip(true, 'Upstash configured, skip in-memory fallback tests');
    }
});

test.describe('checkRateLimit (in-memory fallback)', () => {
    test('free tier first request: allowed, remaining=59', async () => {
        const key = `test-free-1-${Date.now()}`;
        const result = await checkRateLimit(key, 'free');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(59);
        expect(result.retryAfterSeconds).toBe(0);
    });

    test('free tier counter increments across calls', async () => {
        const key = `test-free-incr-${Date.now()}`;
        const r1 = await checkRateLimit(key, 'free');
        const r2 = await checkRateLimit(key, 'free');
        const r3 = await checkRateLimit(key, 'free');
        expect(r1.remaining).toBe(59);
        expect(r2.remaining).toBe(58);
        expect(r3.remaining).toBe(57);
    });

    test('pro tier first request: allowed, remaining=599', async () => {
        const key = `test-pro-1-${Date.now()}`;
        const result = await checkRateLimit(key, 'pro');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(599);
    });

    test('demo tier first request: allowed, remaining=9', async () => {
        const key = `test-demo-1-${Date.now()}`;
        const result = await checkRateLimit(key, 'demo');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9);
    });

    test('default tier is free when omitted', async () => {
        const key = `test-default-${Date.now()}`;
        const result = await checkRateLimit(key); // no tier arg
        expect(result.remaining).toBe(59);
    });

    test('demo tier hits its 10-request cap', async () => {
        const key = `test-demo-cap-${Date.now()}`;
        // First 10 calls should all be allowed
        for (let i = 0; i < 10; i++) {
            const r = await checkRateLimit(key, 'demo');
            expect(r.allowed, `call ${i + 1} should be allowed`).toBe(true);
            expect(r.remaining, `remaining after call ${i + 1}`).toBe(9 - i);
        }
        // 11th call should be blocked
        const blocked = await checkRateLimit(key, 'demo');
        expect(blocked.allowed).toBe(false);
        expect(blocked.remaining).toBe(0);
        expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
        expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(3600);
    });

    test('different keys have independent buckets', async () => {
        const k1 = `test-iso-a-${Date.now()}`;
        const k2 = `test-iso-b-${Date.now()}`;
        const r1a = await checkRateLimit(k1, 'demo');
        const r1b = await checkRateLimit(k1, 'demo');
        const r2a = await checkRateLimit(k2, 'demo');
        expect(r1a.remaining).toBe(9);
        expect(r1b.remaining).toBe(8);
        expect(r2a.remaining).toBe(9); // k2 not affected by k1
    });

    test('same key under different tiers has independent buckets', async () => {
        const key = `test-same-key-tier-${Date.now()}`;
        const free = await checkRateLimit(key, 'free');
        const demo = await checkRateLimit(key, 'demo');
        const pro = await checkRateLimit(key, 'pro');
        // Fresh bucket per tier prefix
        expect(free.remaining).toBe(59);
        expect(demo.remaining).toBe(9);
        expect(pro.remaining).toBe(599);
    });

    test('retryAfterSeconds is a positive integer when blocked', async () => {
        const key = `test-retry-${Date.now()}`;
        // Burn through the demo cap
        for (let i = 0; i < 10; i++) await checkRateLimit(key, 'demo');
        const blocked = await checkRateLimit(key, 'demo');
        expect(Number.isInteger(blocked.retryAfterSeconds)).toBe(true);
        expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });
});
