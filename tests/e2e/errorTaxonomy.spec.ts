import { test, expect } from '@playwright/test';
import {
    classifyError,
    envelope,
    ERROR_COPY,
    type ErrorClass,
} from '@/lib/errorTaxonomy';

/**
 * Unit tests for lib/errorTaxonomy. The /api/subscription route + the
 * paywall + the chat error toast all rely on this taxonomy to translate
 * raw thrown errors into user-facing copy.
 *
 * The classify function is the source of truth for which class each
 * underlying error rolls up to. Adding a new class without updating
 * ERROR_COPY would crash the envelope() builder, so we lock the shape
 * here.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/errorTaxonomy.spec.ts --reporter=list
 */

test.describe('classifyError', () => {
    test('expired_token branch on Privy / jose expiry messages', () => {
        expect(classifyError(new Error('token_expired'))).toBe('expired_token');
        expect(classifyError(new Error('JWT has expired'))).toBe('expired_token');
        expect(classifyError(new Error('Token EXPIRED at 2026-01-01'))).toBe('expired_token');
    });

    test('malformed_token branch on jose Compact JWS errors', () => {
        expect(classifyError(new Error('Invalid Compact JWS'))).toBe('malformed_token');
        expect(classifyError(new Error('malformed_token:not_a_jws'))).toBe('malformed_token');
        expect(classifyError(new Error('not_a_jws'))).toBe('malformed_token');
    });

    test('reauth_required branch on no-session / unauth messages', () => {
        expect(classifyError(new Error('unauthenticated'))).toBe('reauth_required');
        expect(classifyError(new Error('Auth required'))).toBe('reauth_required');
        expect(classifyError(new Error('no_session_token'))).toBe('reauth_required');
    });

    test('provider_unavailable branch on upstream/timeout/5xx', () => {
        expect(classifyError(new Error('supabase connection refused'))).toBe('provider_unavailable');
        expect(classifyError(new Error('privy returned 503'))).toBe('provider_unavailable');
        expect(classifyError(new Error('upstream LLM error'))).toBe('provider_unavailable');
        expect(classifyError(new Error('502 Bad Gateway'))).toBe('provider_unavailable');
        expect(classifyError(new Error('503 Service Unavailable'))).toBe('provider_unavailable');
        expect(classifyError(new Error('504 Gateway Timeout'))).toBe('provider_unavailable');
        expect(classifyError(new Error('fetch failed'))).toBe('provider_unavailable');
        expect(classifyError(new Error('Request timeout'))).toBe('provider_unavailable');
    });

    test('unknown branch covers anything not matched above', () => {
        expect(classifyError(new Error('something completely random'))).toBe('unknown');
        expect(classifyError(new Error('TypeError: cannot read property foo of undefined'))).toBe('unknown');
    });

    test('empty / null / undefined input returns unknown', () => {
        expect(classifyError(null)).toBe('unknown');
        expect(classifyError(undefined)).toBe('unknown');
        expect(classifyError(new Error(''))).toBe('unknown');
        expect(classifyError('')).toBe('unknown');
    });

    test('non-Error inputs are stringified before classification', () => {
        expect(classifyError('token_expired')).toBe('expired_token');
        expect(classifyError({ toString: () => 'not_a_jws' })).toBe('malformed_token');
    });

    test('classification is case-insensitive', () => {
        expect(classifyError(new Error('TOKEN_EXPIRED'))).toBe('expired_token');
        expect(classifyError(new Error('Invalid COMPACT JWS'))).toBe('malformed_token');
        expect(classifyError(new Error('UNAUTHENTICATED'))).toBe('reauth_required');
    });
});

test.describe('envelope', () => {
    const FAKE_ID = 'req_abc-123';
    const FAKE_TS = '2026-04-29T01:23:45.000Z';

    test('expired_token envelope says reauth + uses ERROR_COPY copy', () => {
        const env = envelope('expired_token', 'token expired at 1700000000', FAKE_ID, FAKE_TS);
        expect(env.errorClass).toBe('expired_token');
        expect(env.recovery).toBe('reauth');
        expect(env.requestId).toBe(FAKE_ID);
        expect(env.timestamp).toBe(FAKE_TS);
        expect(env.message).toBe(ERROR_COPY.expired_token.title);
        expect(env.nextAction).toBe(ERROR_COPY.expired_token.nextAction);
    });

    test('provider_unavailable envelope says retry, never reauth', () => {
        const env = envelope('provider_unavailable', 'supabase 503', FAKE_ID, FAKE_TS);
        expect(env.recovery).toBe('retry');
        expect(env.errorClass).toBe('provider_unavailable');
        expect(env.message).toBe(ERROR_COPY.provider_unavailable.title);
    });

    test('unknown envelope says retry', () => {
        const env = envelope('unknown', 'mystery error', FAKE_ID, FAKE_TS);
        expect(env.recovery).toBe('retry');
        expect(env.errorClass).toBe('unknown');
    });

    test('detail message gets sliced to 240 chars to prevent log spam', () => {
        const longDetail = 'x'.repeat(500);
        const env = envelope('unknown', longDetail, FAKE_ID, FAKE_TS);
        expect(env.error.length).toBe(240);
    });

    test('reauth recovery is set for every shouldReauth: true class', () => {
        const reauthClasses: ErrorClass[] = ['malformed_token', 'expired_token', 'reauth_required'];
        for (const cls of reauthClasses) {
            const env = envelope(cls, 'detail', FAKE_ID, FAKE_TS);
            expect(env.recovery, `${cls} should reauth`).toBe('reauth');
        }
    });

    test('retry recovery is set for every shouldReauth: false class', () => {
        const retryClasses: ErrorClass[] = ['provider_unavailable', 'unknown'];
        for (const cls of retryClasses) {
            const env = envelope(cls, 'detail', FAKE_ID, FAKE_TS);
            expect(env.recovery, `${cls} should retry`).toBe('retry');
        }
    });
});

test.describe('ERROR_COPY shape contract', () => {
    test('every ErrorClass has copy with title + nextAction + shouldReauth', () => {
        const classes: ErrorClass[] = [
            'malformed_token',
            'expired_token',
            'reauth_required',
            'provider_unavailable',
            'unknown',
        ];
        for (const cls of classes) {
            const copy = ERROR_COPY[cls];
            expect(copy, `${cls} has copy`).toBeDefined();
            expect(copy.title.length, `${cls} title`).toBeGreaterThan(0);
            expect(copy.nextAction.length, `${cls} nextAction`).toBeGreaterThan(0);
            expect(typeof copy.shouldReauth, `${cls} shouldReauth`).toBe('boolean');
        }
    });

    test('only token-related classes have shouldReauth: true', () => {
        expect(ERROR_COPY.malformed_token.shouldReauth).toBe(true);
        expect(ERROR_COPY.expired_token.shouldReauth).toBe(true);
        expect(ERROR_COPY.reauth_required.shouldReauth).toBe(true);
        expect(ERROR_COPY.provider_unavailable.shouldReauth).toBe(false);
        expect(ERROR_COPY.unknown.shouldReauth).toBe(false);
    });
});
