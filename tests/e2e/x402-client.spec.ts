import { test, expect } from '@playwright/test';
import {
    isPaymentRequired,
    parsePaymentRequest,
    type X402PaymentRequest,
} from '@/lib/x402/client';

/**
 * Unit tests for the x402 client-side parser helpers.
 *
 * These two functions are the gate between "the server returned 402"
 * and "we have a structured payment request to show in the approval
 * modal." A regression in either could:
 *
 * - Treat a 402 without X-Payment-Required as a normal payment flow,
 *   asking the user to pay against a payment request that doesn't
 *   exist
 * - Throw on a malformed X-Payment-Required header instead of
 *   returning null, taking down the chat surface with an unhandled
 *   error
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/x402-client.spec.ts --reporter=list
 */

const SAMPLE_PAYMENT: X402PaymentRequest = {
    recipient: 'So11111111111111111111111111111111111111112',
    amount: 0.01,
    currency: 'USDC',
    chain: 'solana',
    memo: 'invoice_abc123',
};

function makeResponse(status: number, headers: Record<string, string> = {}): Response {
    return new Response(null, { status, headers });
}

test.describe('isPaymentRequired', () => {
    test('returns true for 402 + X-Payment-Required header', () => {
        const res = makeResponse(402, { 'X-Payment-Required': '{}' });
        expect(isPaymentRequired(res)).toBe(true);
    });

    test('returns false for 402 without X-Payment-Required header', () => {
        const res = makeResponse(402);
        expect(isPaymentRequired(res)).toBe(false);
    });

    test('returns false for 200 even with X-Payment-Required header', () => {
        // Defensive: a server should never send X-Payment-Required on
        // a 200, but if one does, don't trigger the payment flow.
        const res = makeResponse(200, { 'X-Payment-Required': '{}' });
        expect(isPaymentRequired(res)).toBe(false);
    });

    test('returns false for non-402 status codes', () => {
        for (const status of [400, 401, 403, 404, 500, 503]) {
            const res = makeResponse(status, { 'X-Payment-Required': '{}' });
            expect(isPaymentRequired(res), `status ${status}`).toBe(false);
        }
    });

    test('header lookup is case-insensitive (Headers API normalizes)', () => {
        const res = makeResponse(402, { 'x-payment-required': '{}' });
        expect(isPaymentRequired(res)).toBe(true);
    });
});

test.describe('parsePaymentRequest', () => {
    test('returns the parsed payment request for valid JSON', () => {
        const res = makeResponse(402, {
            'X-Payment-Required': JSON.stringify(SAMPLE_PAYMENT),
        });
        const parsed = parsePaymentRequest(res);
        expect(parsed).toEqual(SAMPLE_PAYMENT);
    });

    test('returns null when header is absent', () => {
        const res = makeResponse(402);
        expect(parsePaymentRequest(res)).toBeNull();
    });

    test('returns null when header is malformed JSON', () => {
        const res = makeResponse(402, { 'X-Payment-Required': 'not-valid-json{' });
        expect(parsePaymentRequest(res)).toBeNull();
    });

    test('returns null when header is empty string', () => {
        const res = makeResponse(402, { 'X-Payment-Required': '' });
        // Empty string is parsed by Headers as no header, but defensive:
        // even if it gets through as empty, JSON.parse('') throws and
        // the catch returns null.
        expect(parsePaymentRequest(res)).toBeNull();
    });

    test('returns the object even when status is not 402 (parser is status-agnostic)', () => {
        // parsePaymentRequest is a pure parser; isPaymentRequired is the
        // gate. Callers compose them. A regression that coupled the
        // parser to the status code would break when a future server
        // surfaced X-Payment-Required on a 200 (unlikely but possible).
        const res = makeResponse(200, {
            'X-Payment-Required': JSON.stringify(SAMPLE_PAYMENT),
        });
        expect(parsePaymentRequest(res)).toEqual(SAMPLE_PAYMENT);
    });

    test('preserves all required fields including optional memo', () => {
        const withMemo: X402PaymentRequest = {
            recipient: 'recipient-key',
            amount: 0.05,
            currency: 'SOL',
            chain: 'solana',
            memo: 'optional-memo',
        };
        const res = makeResponse(402, {
            'X-Payment-Required': JSON.stringify(withMemo),
        });
        expect(parsePaymentRequest(res)).toEqual(withMemo);
    });

    test('handles missing optional memo correctly', () => {
        const noMemo = {
            recipient: 'recipient-key',
            amount: 0.01,
            currency: 'USDC',
            chain: 'solana',
        };
        const res = makeResponse(402, {
            'X-Payment-Required': JSON.stringify(noMemo),
        });
        const parsed = parsePaymentRequest(res);
        expect(parsed).toEqual(noMemo);
        expect(parsed?.memo).toBeUndefined();
    });

    test('does not throw on adversarial input (deeply nested JSON)', () => {
        // A malicious server can't crash the chat surface by sending
        // pathological JSON. The catch swallows any throw.
        const adversarial = '{"a":{"b":{"c":{"d":{"e":1}}}}}';
        const res = makeResponse(402, { 'X-Payment-Required': adversarial });
        expect(() => parsePaymentRequest(res)).not.toThrow();
    });
});

test.describe('isPaymentRequired + parsePaymentRequest composition', () => {
    test('typical 402 flow: gate is true, parse returns the request', () => {
        const res = makeResponse(402, {
            'X-Payment-Required': JSON.stringify(SAMPLE_PAYMENT),
        });
        expect(isPaymentRequired(res)).toBe(true);
        expect(parsePaymentRequest(res)).toEqual(SAMPLE_PAYMENT);
    });

    test('402 with malformed header: gate is true (header present), parse is null', () => {
        // The gate trips on header presence, so a malformed payload
        // still triggers the payment flow but we have no payment
        // request to show. Caller must handle null. Documents this
        // edge case as expected.
        const res = makeResponse(402, { 'X-Payment-Required': 'malformed' });
        expect(isPaymentRequired(res)).toBe(true);
        expect(parsePaymentRequest(res)).toBeNull();
    });

    test('200 with payment header: gate is false, parse still works', () => {
        const res = makeResponse(200, {
            'X-Payment-Required': JSON.stringify(SAMPLE_PAYMENT),
        });
        expect(isPaymentRequired(res)).toBe(false);
        // Parser is decoupled from status; can still parse if asked
        expect(parsePaymentRequest(res)).toEqual(SAMPLE_PAYMENT);
    });
});
