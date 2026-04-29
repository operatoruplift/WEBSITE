import { test, expect } from '@playwright/test';
import { getPhotonAdapter } from '@/lib/photon/adapter';

/**
 * Unit tests for the Photon Spectrum send() flow with a mocked
 * global fetch.
 *
 * Covers the active branch the existing photon-adapter spec doesn't:
 * - Headers shape (Authorization Bearer, X-Api-Key, X-Project-Id all
 *   sent so whichever Spectrum dashboard pattern is in use picks up)
 * - Body shape (project_id, platform, recipient/to, text/content,
 *   subject, attachments)
 * - 4xx Spectrum response -> ok:false reason:provider_rejected
 * - Network throw -> ok:false reason:network_error
 * - messageId resolution from multiple keys (message_id, messageId,
 *   id, uuid, nested data.message_id)
 * - Fallback messageId when the response has none
 *
 * Tests mutate process.env + global fetch so the describe block is
 * serial.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/photon-send.spec.ts --reporter=list
 */

test.describe.configure({ mode: 'serial' });

const ORIG_PROJECT = process.env.PHOTON_PROJECT_ID;
const ORIG_API_KEY = process.env.PHOTON_API_KEY;
const ORIG_FETCH = global.fetch;

interface FetchCall {
    url: string;
    method?: string;
    headers: Record<string, string>;
    body: unknown;
}

function setupActiveAdapter() {
    process.env.PHOTON_PROJECT_ID = 'test-project-id';
    process.env.PHOTON_API_KEY = 'sk-test-secret';
}

function restoreEnv() {
    if (ORIG_PROJECT === undefined) delete process.env.PHOTON_PROJECT_ID;
    else process.env.PHOTON_PROJECT_ID = ORIG_PROJECT;
    if (ORIG_API_KEY === undefined) delete process.env.PHOTON_API_KEY;
    else process.env.PHOTON_API_KEY = ORIG_API_KEY;
    global.fetch = ORIG_FETCH;
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
    setupActiveAdapter();
});

test.afterEach(() => {
    restoreEnv();
});

test.describe('Active send() — headers + body', () => {
    test('sends Authorization Bearer + X-Api-Key + X-Project-Id', async () => {
        const calls = mockFetch(() => new Response(JSON.stringify({ message_id: 'abc' }), { status: 200 }));
        await getPhotonAdapter().send({ to: '+15551234567', text: 'hello' });
        expect(calls).toHaveLength(1);
        const headers = calls[0].headers;
        // Whichever pattern Spectrum's dashboard uses, one of these
        // three must be present. Send all three for robustness.
        expect(headers['authorization']).toBe('Bearer sk-test-secret');
        expect(headers['x-api-key']).toBe('sk-test-secret');
        expect(headers['x-project-id']).toBe('test-project-id');
        expect(headers['content-type']).toBe('application/json');
    });

    test('sends body with project_id, platform, recipient/to, text/content', async () => {
        const calls = mockFetch(() => new Response(JSON.stringify({ message_id: 'xyz' }), { status: 200 }));
        await getPhotonAdapter().send({
            to: '+15551234567',
            text: 'hello world',
            platform: 'imessage',
        });
        const body = calls[0].body as Record<string, unknown>;
        expect(body.project_id).toBe('test-project-id');
        expect(body.platform).toBe('imessage');
        expect(body.recipient).toBe('+15551234567');
        expect(body.to).toBe('+15551234567');
        expect(body.text).toBe('hello world');
        expect(body.content).toBe('hello world');
    });

    test('default platform is imessage when not specified', async () => {
        const calls = mockFetch(() => new Response(JSON.stringify({ id: 'def' }), { status: 200 }));
        await getPhotonAdapter().send({ to: '+15551234567', text: 'hi' });
        const body = calls[0].body as Record<string, unknown>;
        expect(body.platform).toBe('imessage');
    });

    test('platform override flows through to the body', async () => {
        const calls = mockFetch(() => new Response(JSON.stringify({ id: 'ghi' }), { status: 200 }));
        await getPhotonAdapter().send({ to: '@user', text: 'hi', platform: 'telegram' });
        const body = calls[0].body as Record<string, unknown>;
        expect(body.platform).toBe('telegram');
    });

    test('subject and attachments pass through when provided', async () => {
        const calls = mockFetch(() => new Response(JSON.stringify({ id: 'jkl' }), { status: 200 }));
        await getPhotonAdapter().send({
            to: '+1',
            text: 'body',
            subject: 'Hello',
            attachments: ['url1', 'url2'],
        });
        const body = calls[0].body as Record<string, unknown>;
        expect(body.subject).toBe('Hello');
        expect(body.attachments).toEqual(['url1', 'url2']);
    });
});

test.describe('messageId resolution', () => {
    const variants: Array<[string, Record<string, unknown>, string]> = [
        ['data.message_id', { message_id: 'msg-1' }, 'msg-1'],
        ['data.messageId', { messageId: 'msg-2' }, 'msg-2'],
        ['data.id', { id: 'msg-3' }, 'msg-3'],
        ['data.uuid', { uuid: 'msg-4' }, 'msg-4'],
        ['data.data.message_id', { data: { message_id: 'msg-5' } }, 'msg-5'],
    ];
    for (const [label, payload, expectedId] of variants) {
        test(`extracts messageId from ${label}`, async () => {
            mockFetch(() => new Response(JSON.stringify(payload), { status: 200 }));
            const result = await getPhotonAdapter().send({ to: '+1', text: 'hi' });
            expect(result.ok).toBe(true);
            if (result.ok) expect(result.messageId).toBe(expectedId);
        });
    }

    test('falls back to "photon-<timestamp>" when no id key is present', async () => {
        mockFetch(() => new Response(JSON.stringify({ status: 'sent' }), { status: 200 }));
        const result = await getPhotonAdapter().send({ to: '+1', text: 'hi' });
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.messageId).toMatch(/^photon-\d+$/);
        }
    });
});

test.describe('Error paths', () => {
    test('Spectrum 4xx -> ok:false reason:provider_rejected with status', async () => {
        mockFetch(() => new Response('rate limited', { status: 429 }));
        const result = await getPhotonAdapter().send({ to: '+1', text: 'hi' });
        expect(result.ok).toBe(false);
        if (result.ok === false) {
            expect(result.reason).toBe('provider_rejected');
            expect(result.providerStatus).toBe(429);
            expect(result.message).toContain('429');
        }
    });

    test('Spectrum 5xx -> ok:false reason:provider_rejected', async () => {
        mockFetch(() => new Response('internal error', { status: 500 }));
        const result = await getPhotonAdapter().send({ to: '+1', text: 'hi' });
        expect(result.ok).toBe(false);
        if (result.ok === false) {
            expect(result.reason).toBe('provider_rejected');
            expect(result.providerStatus).toBe(500);
        }
    });

    test('fetch throws -> ok:false reason:network_error', async () => {
        global.fetch = (async () => {
            throw new Error('connection refused');
        }) as typeof fetch;
        const result = await getPhotonAdapter().send({ to: '+1', text: 'hi' });
        expect(result.ok).toBe(false);
        if (result.ok === false) {
            expect(result.reason).toBe('network_error');
            expect(result.message).toContain('connection refused');
        }
    });

    test('Spectrum 200 with non-JSON body still resolves to a fallback messageId', async () => {
        // Some providers return text/html on success. The catch in the
        // module's res.json() falls through to {}, then the messageId
        // resolver hits the photon-<ts> fallback.
        mockFetch(() => new Response('OK', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
        }));
        const result = await getPhotonAdapter().send({ to: '+1', text: 'hi' });
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.messageId).toMatch(/^photon-\d+$/);
    });
});
