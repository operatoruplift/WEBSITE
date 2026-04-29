import { test, expect } from '@playwright/test';
import {
    newRequestId,
    withRequestMeta,
    statusFor,
    type RequestMeta,
} from '@/lib/apiHelpers';

/**
 * Unit tests for the pure helpers in lib/apiHelpers.
 *
 * These three are imported by every API route in the project. The
 * trust-gate grep guard (scripts/check.mjs) verifies they're called
 * 44/44 times; this spec verifies they actually do what their
 * callers expect:
 *
 * - newRequestId() produces a valid `req_<uuid>` shape
 * - withRequestMeta passes through any caller-supplied X-Request-Id
 *   header (the middleware mints one if absent, then forwards to
 *   each handler so end-to-end IDs match)
 * - statusFor maps each ErrorClass to the correct HTTP status, with
 *   httpHint winning over the default per the documented behavior
 *
 * A regression in any of these would silently break the X-Request-Id
 * propagation contract that 17 hermetic specs rely on.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/apiHelpers.spec.ts --reporter=list
 */

test.describe('newRequestId', () => {
    test('produces req_<uuid> shape', () => {
        const id = newRequestId();
        expect(id).toMatch(/^req_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    test('two consecutive calls produce different IDs', () => {
        const a = newRequestId();
        const b = newRequestId();
        expect(a).not.toBe(b);
    });
});

test.describe('withRequestMeta', () => {
    test('passes through caller-supplied X-Request-Id verbatim', () => {
        const inbound = 'req_caller-supplied-id-123';
        const req = new Request('https://example.test/api/foo', {
            headers: { 'x-request-id': inbound },
        });
        const meta = withRequestMeta(req, 'tools.gmail');
        expect(meta.requestId).toBe(inbound);
        expect(meta.headers['X-Request-Id']).toBe(inbound);
    });

    test('mints a fresh ID when no X-Request-Id is supplied', () => {
        const req = new Request('https://example.test/api/foo');
        const meta = withRequestMeta(req, 'tools.gmail');
        expect(meta.requestId).toMatch(/^req_[0-9a-f-]{36}$/);
        expect(meta.headers['X-Request-Id']).toBe(meta.requestId);
    });

    test('records the route name verbatim', () => {
        const req = new Request('https://example.test/api/foo');
        const meta = withRequestMeta(req, 'webhooks.photon');
        expect(meta.route).toBe('webhooks.photon');
    });

    test('records startedAt as an ISO 8601 timestamp', () => {
        const before = Date.now();
        const meta = withRequestMeta(new Request('https://example.test/'), 'test');
        const after = Date.now();
        const startedAt = new Date(meta.startedAt).getTime();
        expect(meta.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(startedAt).toBeGreaterThanOrEqual(before);
        expect(startedAt).toBeLessThanOrEqual(after);
    });

    test('returned headers object has only the X-Request-Id key', () => {
        const meta: RequestMeta = withRequestMeta(new Request('https://example.test/'), 'test');
        const keys = Object.keys(meta.headers);
        expect(keys).toEqual(['X-Request-Id']);
    });

    test('header lookup is case-insensitive (per Fetch spec)', () => {
        const inbound = 'req_uppercase-test';
        // Mixed case header key; Request API lowercases it
        const req = new Request('https://example.test/api/foo', {
            headers: { 'X-REQUEST-ID': inbound },
        });
        const meta = withRequestMeta(req, 'test');
        expect(meta.requestId).toBe(inbound);
    });
});

test.describe('statusFor', () => {
    test('token errors all map to 401', () => {
        expect(statusFor('malformed_token')).toBe(401);
        expect(statusFor('expired_token')).toBe(401);
        expect(statusFor('reauth_required')).toBe(401);
    });

    test('provider_unavailable maps to 503', () => {
        expect(statusFor('provider_unavailable')).toBe(503);
    });

    test('unknown maps to 500', () => {
        expect(statusFor('unknown')).toBe(500);
    });

    test('httpHint >= 400 wins over the taxonomy default', () => {
        expect(statusFor('unknown', 400)).toBe(400);
        expect(statusFor('unknown', 422)).toBe(422);
        expect(statusFor('reauth_required', 403)).toBe(403);
    });

    test('httpHint < 400 is ignored (taxonomy default wins)', () => {
        // 200/300 hints from a misconfigured caller should never
        // override the taxonomy. Errors must always be >=400.
        expect(statusFor('expired_token', 200)).toBe(401);
        expect(statusFor('provider_unavailable', 302)).toBe(503);
        expect(statusFor('unknown', 0)).toBe(500);
    });

    test('httpHint of undefined falls back to taxonomy default', () => {
        expect(statusFor('expired_token', undefined)).toBe(401);
        expect(statusFor('provider_unavailable', undefined)).toBe(503);
    });
});
