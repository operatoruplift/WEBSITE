import { test, expect } from '@playwright/test';
import { x402Fetch, retryWithProof } from '@/lib/x402';

/**
 * Unit tests for the two fetch-intercept helpers in lib/x402/client.ts.
 *
 * x402Fetch — wraps fetch() to detect a 402 + X-Payment-Required
 * response and short-circuits with the parsed payment request so
 * the UI can show the approval modal.
 *
 * retryWithProof — retries the same URL after the user signs the
 * Solana payment, attaching the tx signature as X-Payment-Proof.
 *
 * Both functions sit between every premium tool call and the user.
 * A regression here means:
 *   - x402Fetch swallows 402 silently → user never sees the approval
 *     modal and the call appears to hang
 *   - retryWithProof drops the proof header → server rejects with
 *     402 again, infinite loop
 *
 * Tests mutate global.fetch so the describe block is serial.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/x402Fetch-retryWithProof.spec.ts --reporter=list
 */

test.describe.configure({ mode: 'serial' });

const ORIG_FETCH = global.fetch;

interface FetchCall {
    url: string;
    method?: string;
    headers: Record<string, string>;
    body: unknown;
}

function mockFetch(handler: (call: FetchCall) => Response | Promise<Response>): FetchCall[] {
    const calls: FetchCall[] = [];
    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        const headers: Record<string, string> = {};
        if (init?.headers) {
            const h = init.headers;
            if (h instanceof Headers) {
                h.forEach((v, k) => { headers[k.toLowerCase()] = v; });
            } else if (Array.isArray(h)) {
                for (const [k, v] of h) headers[k.toLowerCase()] = v;
            } else {
                for (const [k, v] of Object.entries(h as Record<string, string>)) {
                    headers[k.toLowerCase()] = v;
                }
            }
        }
        const call: FetchCall = { url, method: init?.method, headers, body: init?.body };
        calls.push(call);
        return handler(call);
    }) as typeof fetch;
    return calls;
}

test.afterEach(() => {
    global.fetch = ORIG_FETCH;
});

test.describe('x402Fetch — happy path (no payment required)', () => {
    test('returns ok:true + response when server returns 200', async () => {
        mockFetch(() => new Response('hello', { status: 200 }));
        const result = await x402Fetch('https://api.example.com/data');
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.response.status).toBe(200);
    });

    test('passes through method, body, and custom headers', async () => {
        const calls = mockFetch(() => new Response('{}', { status: 200 }));
        await x402Fetch('https://api.example.com/data', {
            method: 'POST',
            headers: { 'X-Custom': 'value' },
            body: JSON.stringify({ a: 1 }),
        });
        expect(calls).toHaveLength(1);
        expect(calls[0].method).toBe('POST');
        expect(calls[0].headers['x-custom']).toBe('value');
    });

    test('returns ok:true for any non-402 status (including 4xx, 5xx)', async () => {
        mockFetch(() => new Response('not found', { status: 404 }));
        const result = await x402Fetch('https://api.example.com/missing');
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.response.status).toBe(404);
    });

    test('returns ok:true for 500 (server errors are not payment-required)', async () => {
        mockFetch(() => new Response('boom', { status: 500 }));
        const result = await x402Fetch('https://api.example.com/data');
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.response.status).toBe(500);
    });
});

test.describe('x402Fetch — payment-required path', () => {
    test('parses X-Payment-Required and returns ok:false with payment details', async () => {
        const paymentHeader = JSON.stringify({
            recipient: 'TreasuryAddr...',
            amount: 0.1,
            currency: 'SOL',
            chain: 'solana',
            memo: 'tool.action',
        });
        mockFetch(() => new Response('payment required', {
            status: 402,
            headers: { 'X-Payment-Required': paymentHeader },
        }));

        const result = await x402Fetch('https://api.example.com/premium');
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.paymentRequired).toEqual({
                recipient: 'TreasuryAddr...',
                amount: 0.1,
                currency: 'SOL',
                chain: 'solana',
                memo: 'tool.action',
            });
            expect(result.originalUrl).toBe('https://api.example.com/premium');
        }
    });

    test('throws when server returns 402 without X-Payment-Required header', async () => {
        mockFetch(() => new Response('payment required', { status: 402 }));
        await expect(x402Fetch('https://api.example.com/premium'))
            .rejects.toThrow('402 response missing X-Payment-Required header');
    });

    test('throws when X-Payment-Required header is malformed JSON', async () => {
        mockFetch(() => new Response('', {
            status: 402,
            headers: { 'X-Payment-Required': 'not json' },
        }));
        await expect(x402Fetch('https://api.example.com/premium'))
            .rejects.toThrow();
    });

    test('originalUrl preserves the full URL including query string', async () => {
        const paymentHeader = JSON.stringify({ recipient: 'X', amount: 1, currency: 'SOL', chain: 'solana' });
        mockFetch(() => new Response('', {
            status: 402,
            headers: { 'X-Payment-Required': paymentHeader },
        }));
        const result = await x402Fetch('https://api.example.com/premium?id=42&v=1');
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.originalUrl).toBe('https://api.example.com/premium?id=42&v=1');
    });
});

test.describe('retryWithProof', () => {
    test('attaches X-Payment-Proof: <txSignature> header', async () => {
        const calls = mockFetch(() => new Response('ok', { status: 200 }));
        await retryWithProof('https://api.example.com/premium', 'tx-sig-abc123');
        expect(calls).toHaveLength(1);
        expect(calls[0].headers['x-payment-proof']).toBe('tx-sig-abc123');
    });

    test('preserves existing init.headers alongside the proof', async () => {
        const calls = mockFetch(() => new Response('ok', { status: 200 }));
        await retryWithProof('https://api.example.com/premium', 'tx-1', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Custom': 'v1' },
            body: '{"a":1}',
        });
        expect(calls[0].headers['content-type']).toBe('application/json');
        expect(calls[0].headers['x-custom']).toBe('v1');
        expect(calls[0].headers['x-payment-proof']).toBe('tx-1');
        expect(calls[0].method).toBe('POST');
    });

    test('returns the raw Response so caller can inspect status', async () => {
        mockFetch(() => new Response('paid result', { status: 200 }));
        const res = await retryWithProof('https://api.example.com/premium', 'tx-1');
        expect(res.status).toBe(200);
        expect(await res.text()).toBe('paid result');
    });

    test('overrides any existing X-Payment-Proof header in init', async () => {
        // If the caller accidentally passed a stale proof, retryWithProof
        // overwrites with the new tx signature — defensively avoiding a
        // request with two payment proofs.
        const calls = mockFetch(() => new Response('', { status: 200 }));
        await retryWithProof('https://api.example.com/premium', 'fresh-tx', {
            headers: { 'X-Payment-Proof': 'stale-tx' },
        });
        expect(calls[0].headers['x-payment-proof']).toBe('fresh-tx');
    });

    test('handles Headers instance passed in init', async () => {
        const calls = mockFetch(() => new Response('', { status: 200 }));
        const headers = new Headers({ 'X-Custom': 'h' });
        await retryWithProof('https://api.example.com/premium', 'tx-1', { headers });
        expect(calls[0].headers['x-payment-proof']).toBe('tx-1');
        expect(calls[0].headers['x-custom']).toBe('h');
    });

    test('propagates non-2xx status from the retried request', async () => {
        // After payment, the server may still return 4xx/5xx for other
        // reasons (rate limit, validation error, etc.). The function
        // returns whatever the server sent.
        mockFetch(() => new Response('rate limited', { status: 429 }));
        const res = await retryWithProof('https://api.example.com/premium', 'tx-1');
        expect(res.status).toBe(429);
    });
});
