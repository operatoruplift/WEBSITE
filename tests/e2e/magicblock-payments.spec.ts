import { test, expect } from '@playwright/test';
import {
    MagicBlockPaymentsClient,
    paymentsEnabled,
    isNotConfiguredError,
    notConfiguredEnvelope,
    type MagicBlockResult,
} from '@/lib/magicblock/payments';

/**
 * Unit tests for lib/magicblock/payments.ts — the MagicBlock Private
 * Payments API client + the honest-status helpers that route handlers
 * use to fork into the "not configured" 503 branch.
 *
 * A regression in:
 *   paymentsEnabled         — routes serve "real" responses while the
 *                            adapter is unconfigured (or vice versa)
 *   isNotConfiguredError    — fails to detect the signal, routes return
 *                            the wrong 503 envelope
 *   notConfiguredEnvelope   — error envelope drifts from the documented
 *                            shape, breaking the chat-UI's calm copy
 *   MagicBlockPaymentsClient — fetch path constructs wrong URL or
 *                            misses Authorization header
 *
 * Tests with mocked fetch + env mutation so the describe block is serial.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/magicblock-payments.spec.ts --reporter=list
 */

test.describe.configure({ mode: 'serial' });

const KEYS = ['MAGICBLOCK_PAYMENTS_BASE', 'MAGICBLOCK_PAYMENTS_TOKEN', 'MAGICBLOCK_PAYMENTS_ENABLED'] as const;
const SAVED: Record<string, string | undefined> = {};
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
        let body: unknown = init?.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch { /* keep raw */ }
        }
        const call: FetchCall = { url, method: init?.method, headers, body };
        calls.push(call);
        return handler(call);
    }) as typeof fetch;
    return calls;
}

test.beforeEach(() => {
    for (const k of KEYS) {
        SAVED[k] = process.env[k];
        delete process.env[k];
    }
});

test.afterEach(() => {
    for (const k of KEYS) {
        if (SAVED[k] === undefined) delete process.env[k];
        else process.env[k] = SAVED[k];
    }
    global.fetch = ORIG_FETCH;
});

test.describe('paymentsEnabled', () => {
    test('returns false when neither flag nor token is set', () => {
        expect(paymentsEnabled()).toBe(false);
    });

    test('returns false when only the flag is set (no token)', () => {
        process.env.MAGICBLOCK_PAYMENTS_ENABLED = '1';
        expect(paymentsEnabled()).toBe(false);
    });

    test('returns false when only the token is set (no flag)', () => {
        process.env.MAGICBLOCK_PAYMENTS_TOKEN = 'tok';
        expect(paymentsEnabled()).toBe(false);
    });

    test('returns true only when both flag=1 AND token are set', () => {
        process.env.MAGICBLOCK_PAYMENTS_ENABLED = '1';
        process.env.MAGICBLOCK_PAYMENTS_TOKEN = 'tok';
        expect(paymentsEnabled()).toBe(true);
    });

    test('returns false when flag is "true" (must be exact "1")', () => {
        // Documents the exact-match semantics so a refactor that
        // accepted any truthy value would surface here.
        process.env.MAGICBLOCK_PAYMENTS_ENABLED = 'true';
        process.env.MAGICBLOCK_PAYMENTS_TOKEN = 'tok';
        expect(paymentsEnabled()).toBe(false);
    });
});

test.describe('isNotConfiguredError', () => {
    test('returns false on ok:true', () => {
        expect(isNotConfiguredError({ ok: true })).toBe(false);
    });

    test('returns true when body.error contains "not configured" (case-insensitive)', () => {
        expect(isNotConfiguredError({
            ok: false,
            body: { error: 'MAGICBLOCK_PAYMENTS_TOKEN not configured' },
        })).toBe(true);
        expect(isNotConfiguredError({
            ok: false,
            body: { error: 'Token Not Configured' },
        })).toBe(true);
    });

    test('returns false when body.error is some other message', () => {
        expect(isNotConfiguredError({
            ok: false,
            body: { error: 'rate limited' },
        })).toBe(false);
    });

    test('returns false when body is null or undefined', () => {
        expect(isNotConfiguredError({ ok: false, body: null })).toBe(false);
        expect(isNotConfiguredError({ ok: false } as MagicBlockResult)).toBe(false);
    });

    test('returns false when body.error is non-string (defensive)', () => {
        expect(isNotConfiguredError({
            ok: false,
            body: { error: 42 },
        })).toBe(false);
    });
});

test.describe('notConfiguredEnvelope', () => {
    test('returns the documented honest-status shape', () => {
        const env = notConfiguredEnvelope({ requestId: 'req-1', startedAt: '2026-04-30T00:00:00Z' });
        expect(env).toMatchObject({
            error: 'magicblock_not_configured',
            errorClass: 'provider_unavailable',
            reason: 'magicblock_not_configured',
            recovery: 'retry',
            requestId: 'req-1',
            timestamp: '2026-04-30T00:00:00Z',
        });
        expect(env.message).toBeTruthy();
        expect(env.nextAction).toBeTruthy();
        expect(env.action_required).toContain('MAGICBLOCK_PAYMENTS_TOKEN');
    });

    test('uses a right-single-quote in "aren\'t" (consumer-copy contract)', () => {
        const env = notConfiguredEnvelope({ requestId: 'r', startedAt: 't' });
        expect(env.message).toContain('\u2019'); // smart quote
    });
});

test.describe('MagicBlockPaymentsClient — config', () => {
    test('isReady returns false when no token configured', () => {
        const client = new MagicBlockPaymentsClient();
        expect(client.isReady()).toBe(false);
    });

    test('isReady returns true when token is in env', () => {
        process.env.MAGICBLOCK_PAYMENTS_TOKEN = 'tok-123';
        const client = new MagicBlockPaymentsClient();
        expect(client.isReady()).toBe(true);
    });

    test('isReady returns true when token is passed in opts', () => {
        const client = new MagicBlockPaymentsClient({ token: 'opts-tok' });
        expect(client.isReady()).toBe(true);
    });

    test('opts.token wins over env', () => {
        process.env.MAGICBLOCK_PAYMENTS_TOKEN = 'env-tok';
        const client = new MagicBlockPaymentsClient({ token: 'opts-tok' });
        // Verify by calling and inspecting the Authorization header
        const calls = mockFetch(() => new Response('{}', { status: 200 }));
        return client.health().then(() => {
            expect(calls[0].headers['authorization']).toBe('Bearer opts-tok');
        });
    });

    test('strips trailing slash from baseUrl', () => {
        const client = new MagicBlockPaymentsClient({
            baseUrl: 'https://api.example.com/',
            token: 't',
        });
        const calls = mockFetch(() => new Response('{}', { status: 200 }));
        return client.health().then(() => {
            expect(calls[0].url).toBe('https://api.example.com/health');
        });
    });

    test('uses default base URL when none given', () => {
        const client = new MagicBlockPaymentsClient({ token: 't' });
        const calls = mockFetch(() => new Response('{}', { status: 200 }));
        return client.health().then(() => {
            expect(calls[0].url).toBe('https://payments.magicblock.app/health');
        });
    });
});

test.describe('MagicBlockPaymentsClient — call()', () => {
    test('returns ok:false when no token (without firing fetch)', async () => {
        const client = new MagicBlockPaymentsClient();
        const calls = mockFetch(() => new Response('should not be called'));
        const result = await client.health();
        expect(result.ok).toBe(false);
        expect(calls).toHaveLength(0);
        const errBody = result.body as { error?: string };
        expect(errBody?.error).toBe('MAGICBLOCK_PAYMENTS_TOKEN not configured');
    });

    test('attaches Authorization Bearer header', async () => {
        const client = new MagicBlockPaymentsClient({ token: 'tok' });
        const calls = mockFetch(() => new Response('{}', { status: 200 }));
        await client.health();
        expect(calls[0].headers['authorization']).toBe('Bearer tok');
    });

    test('attaches Content-Type and Accept headers', async () => {
        const client = new MagicBlockPaymentsClient({ token: 'tok' });
        const calls = mockFetch(() => new Response('{}', { status: 200 }));
        await client.health();
        expect(calls[0].headers['content-type']).toBe('application/json');
        expect(calls[0].headers['accept']).toBe('application/json');
    });

    test('GET /health → no body sent', async () => {
        const client = new MagicBlockPaymentsClient({ token: 'tok' });
        const calls = mockFetch(() => new Response('{}', { status: 200 }));
        await client.health();
        expect(calls[0].method).toBe('GET');
        expect(calls[0].body).toBeUndefined();
    });

    test('POST /transfer serializes body to JSON', async () => {
        const client = new MagicBlockPaymentsClient({ token: 'tok' });
        const calls = mockFetch(() => new Response('{}', { status: 200 }));
        await client.transferSpl({ from: 'A', to: 'B', mint: 'M', amount: 100 });
        expect(calls[0].method).toBe('POST');
        expect(calls[0].body).toEqual({ from: 'A', to: 'B', mint: 'M', amount: 100 });
    });

    test('GET /balance encodes query string from params', async () => {
        const client = new MagicBlockPaymentsClient({ token: 'tok' });
        const calls = mockFetch(() => new Response('{}', { status: 200 }));
        await client.getBalance({ owner: 'pubkey1', mint: 'mint1' });
        expect(calls[0].url).toContain('owner=pubkey1');
        expect(calls[0].url).toContain('mint=mint1');
    });

    test('returns ok:true status:200 body:json on 200 response', async () => {
        const client = new MagicBlockPaymentsClient({ token: 'tok' });
        mockFetch(() => new Response('{"signature":"sig-1"}', { status: 200 }));
        const result = await client.health();
        expect(result.ok).toBe(true);
        expect(result.status).toBe(200);
        expect(result.body).toEqual({ signature: 'sig-1' });
    });

    test('returns ok:false status:4xx body:error on 4xx', async () => {
        const client = new MagicBlockPaymentsClient({ token: 'tok' });
        mockFetch(() => new Response('{"error":"bad request"}', { status: 400 }));
        const result = await client.health();
        expect(result.ok).toBe(false);
        expect(result.status).toBe(400);
        expect(result.body).toEqual({ error: 'bad request' });
    });

    test('fetch throw → ok:false body.error has the thrown message', async () => {
        const client = new MagicBlockPaymentsClient({ token: 'tok' });
        global.fetch = (async () => {
            throw new Error('connection refused');
        }) as typeof fetch;
        const result = await client.health();
        expect(result.ok).toBe(false);
        expect((result.body as { error: string }).error).toBe('connection refused');
    });

    test('non-JSON 200 body → ok:true body:{} (graceful)', async () => {
        // Server returns 200 with text body. The .json().catch(()=>{}) in
        // the client's fetch wrapper falls through to {}, so callers
        // see ok:true with an empty body instead of a crash.
        const client = new MagicBlockPaymentsClient({ token: 'tok' });
        mockFetch(() => new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } }));
        const result = await client.health();
        expect(result.ok).toBe(true);
        expect(result.body).toEqual({});
    });
});
