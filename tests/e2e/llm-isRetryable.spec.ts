import { test, expect } from '@playwright/test';
import { isRetryableError, ProviderError } from '@/lib/llm';

/**
 * Unit tests for the retry classifier in lib/llm.
 *
 * callLLM retries up to 3 attempts (with 0/500/1500 ms backoff) on
 * transient failures, but bails immediately on terminal ones. The
 * classifier draws the line. A regression could:
 *
 * - Mark a missing-key ProviderError as retryable -> 3x burn of
 *   a no-op retry, hides the real "set the env var" message
 * - Mark a 4xx (non-retryable) as retryable -> 3x cost on a
 *   request that will never succeed
 * - Miss a 5xx -> single attempt where 3 might've worked
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/llm-isRetryable.spec.ts --reporter=list
 */

test.describe('isRetryableError', () => {
    test('false for ProviderError (config issues never retry)', () => {
        expect(isRetryableError(new ProviderError('ANTHROPIC_API_KEY'))).toBe(false);
        expect(isRetryableError(new ProviderError('OPENAI_API_KEY', 'Custom message'))).toBe(false);
    });

    test('true for AbortError (request was cancelled mid-flight)', () => {
        const err = new Error('aborted');
        err.name = 'AbortError';
        expect(isRetryableError(err)).toBe(true);
    });

    test('true for TimeoutError', () => {
        const err = new Error('timed out');
        err.name = 'TimeoutError';
        expect(isRetryableError(err)).toBe(true);
    });

    test('true for HTTP 429 (rate limited)', () => {
        expect(isRetryableError(new Error('Anthropic returned 429'))).toBe(true);
        expect(isRetryableError(new Error('429 Too Many Requests'))).toBe(true);
    });

    test('true for HTTP 500/502/503/504/522/524', () => {
        const codes = [500, 502, 503, 504, 522, 524];
        for (const code of codes) {
            expect(
                isRetryableError(new Error(`Provider returned ${code}`)),
                `code ${code}`,
            ).toBe(true);
        }
    });

    test('true for ECONN / ETIMEDOUT / EAI_AGAIN (Node net errors)', () => {
        expect(isRetryableError(new Error('ECONNRESET'))).toBe(true);
        expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
        expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true);
        expect(isRetryableError(new Error('getaddrinfo EAI_AGAIN api.anthropic.com'))).toBe(true);
    });

    test('true for "fetch failed" / "network" substrings', () => {
        expect(isRetryableError(new Error('fetch failed'))).toBe(true);
        expect(isRetryableError(new Error('Network request failed'))).toBe(true);
    });

    test('false for HTTP 400 / 401 / 403 / 404 (client errors are terminal)', () => {
        const codes = [400, 401, 403, 404, 422];
        for (const code of codes) {
            expect(
                isRetryableError(new Error(`Provider returned ${code}`)),
                `code ${code}`,
            ).toBe(false);
        }
    });

    test('false for "invalid api key" or "unauthenticated" (auth fixes don\'t retry)', () => {
        // These map to 401 in classifyError but the LLM-layer retry
        // only triggers off the status-code regex; clean prose msgs
        // without a status code fall through to false.
        expect(isRetryableError(new Error('Invalid API key'))).toBe(false);
        expect(isRetryableError(new Error('Unauthenticated request'))).toBe(false);
    });

    test('true for non-Error, non-ProviderError inputs (defensive default)', () => {
        // Anything we can't introspect (e.g., a thrown string or null
        // somehow) gets retried. The retry budget caps the worst case.
        expect(isRetryableError('something weird')).toBe(true);
        expect(isRetryableError(null)).toBe(true);
        expect(isRetryableError(undefined)).toBe(true);
        expect(isRetryableError({ status: 500 })).toBe(true);
    });

    test('case sensitivity: 429 in middle of word still matches via word boundary', () => {
        // The regex is `\b(429|500|...)\b`. A status code embedded as
        // "tx429ab" should NOT match because of the word boundary.
        expect(isRetryableError(new Error('tx429ab'))).toBe(false);
        expect(isRetryableError(new Error('429.5 something'))).toBe(true);
        expect(isRetryableError(new Error('error 429'))).toBe(true);
    });

    test('regression: ProviderError instance check beats message-pattern match', () => {
        // A ProviderError whose message happens to contain "503" still
        // returns false, because the instanceof check runs first. This
        // protects the "set the env var" UX from a 3x retry that
        // would just delay the error.
        const e = new ProviderError('SOME_KEY', 'service returned 503');
        expect(isRetryableError(e)).toBe(false);
    });
});
