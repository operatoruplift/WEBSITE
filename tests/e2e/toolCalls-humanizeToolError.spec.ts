import { test, expect } from '@playwright/test';
import { humanizeToolError } from '@/lib/toolCalls';

/**
 * Unit tests for humanizeToolError — the chat-UI fallback that
 * renders raw API error codes as a calm, actionable user-facing
 * message when the route hasn't returned an error envelope.
 *
 * The chat already prefers the envelope's `message` field. This
 * function only fires when the envelope's `message` is missing
 * (older deploys, or unhandled error paths).
 *
 * A regression here means users see raw codes like
 * "google_not_connected" or "ANTHROPIC_API_KEY not configured"
 * instead of guidance on how to fix.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/toolCalls-humanizeToolError.spec.ts --reporter=list
 */

test.describe('humanizeToolError', () => {
    test('google_not_connected -> Calendar guidance for calendar tool', () => {
        const out = humanizeToolError('google_not_connected', 'calendar', 401);
        expect(out).toContain('Google Calendar not connected');
        expect(out).toContain('Integrations');
    });

    test('google_not_connected -> Gmail guidance for gmail tool', () => {
        const out = humanizeToolError('google_not_connected', 'gmail', 401);
        expect(out).toContain('Google Gmail not connected');
        expect(out).toContain('Integrations');
    });

    test('status 403 (Forbidden) routes to "Google not connected" copy', () => {
        // The 403 branch hits the same copy as google_not_connected.
        // The 'gmail' tool path picks Gmail; anything else picks Calendar.
        const out = humanizeToolError(undefined, 'gmail', 403);
        expect(out).toContain('Google Gmail not connected');
    });

    test('ANTHROPIC_API_KEY not configured -> "API key missing" guidance', () => {
        const out = humanizeToolError('ANTHROPIC_API_KEY not configured', 'gmail', 500);
        expect(out).toContain('API key missing');
        expect(out).toContain('Settings');
    });

    test('OPENAI_API_KEY not configured -> same "API key missing" copy', () => {
        const out = humanizeToolError('OPENAI_API_KEY not configured', 'gmail', 500);
        expect(out).toContain('API key missing');
    });

    test('status 401 (Unauthorized) -> "Session expired" copy', () => {
        const out = humanizeToolError(undefined, 'calendar', 401);
        expect(out).toContain('Session expired');
        expect(out).toContain('sign in again');
    });

    test('status 429 (Rate limited) -> "wait a moment" copy', () => {
        const out = humanizeToolError(undefined, 'gmail', 429);
        expect(out).toContain('Rate limited');
        expect(out).toContain('wait a moment');
    });

    test('status 503 (Service unavailable) -> "temporarily unavailable" copy', () => {
        const out = humanizeToolError(undefined, 'gmail', 503);
        expect(out).toContain('Service temporarily unavailable');
    });

    test('refresh-token error -> "Google session expired" reconnect guidance', () => {
        const out = humanizeToolError('refresh token revoked', 'gmail', 500);
        expect(out).toContain('Google session expired');
        expect(out).toContain('Reconnect');
    });

    test('"token has been expired" error -> reconnect guidance', () => {
        const out = humanizeToolError('token has been expired or revoked.', 'calendar', 500);
        expect(out).toContain('Google session expired');
    });

    test('unknown error code with non-special status returns the raw code', () => {
        // The fallback branch echoes the raw code when it doesn't
        // match a known shape. Better than nothing — the user sees
        // something the team can grep for in logs.
        const out = humanizeToolError('weird_provider_specific_code', 'gmail', 500);
        expect(out).toBe('weird_provider_specific_code');
    });

    test('empty error code with non-special status -> generic HTTP message', () => {
        const out = humanizeToolError(undefined, 'gmail', 502);
        expect(out).toBe('Something went wrong (HTTP 502). Please try again.');
    });

    test('empty error with status 0 (network failure surfaced as 0)', () => {
        const out = humanizeToolError(undefined, 'gmail', 0);
        expect(out).toBe('Something went wrong (HTTP 0). Please try again.');
    });

    test('priority: google_not_connected wins over status 401', () => {
        // google_not_connected check happens before the 401 check.
        // This documents the ordering — a regression that re-ordered
        // the if-chain could surface "Session expired" when the real
        // problem is "Google not connected".
        const out = humanizeToolError('google_not_connected', 'gmail', 401);
        expect(out).toContain('Google Gmail not connected');
        expect(out).not.toContain('Session expired');
    });

    test('priority: status 429 wins over an empty rawError', () => {
        const out = humanizeToolError('', 'gmail', 429);
        expect(out).toContain('Rate limited');
    });

    test('priority: refresh-token detection still fires on a 500', () => {
        // Refresh-token text inside the rawError trumps the generic
        // "Something went wrong (HTTP 500)" fallback.
        const out = humanizeToolError('OAuth: refresh token revoked', 'gmail', 500);
        expect(out).toContain('Google session expired');
        expect(out).not.toContain('HTTP 500');
    });
});
