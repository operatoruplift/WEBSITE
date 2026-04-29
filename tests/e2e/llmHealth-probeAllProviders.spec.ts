import { test, expect } from '@playwright/test';
import { probeAllProviders } from '@/lib/llmHealth';

/**
 * Unit tests for probeAllProviders — the /api/health/llm endpoint
 * fan-out that probes every configured provider and returns
 * {provider, configured, ok, latencyMs?, reason?}[].
 *
 * The function only fires network calls when a provider's env key is
 * set. Without a key it returns {configured:false, ok:false, reason:'no key'}
 * without ever hitting fetch — this keeps the test hermetic.
 *
 * A regression here means the health page shows a provider down when
 * it's actually up (incorrect URL or auth header), or shows a provider
 * up when no key is configured (configured:true short-circuit broken).
 *
 * Tests mutate process.env + global.fetch, so the describe block is
 * serial.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/llmHealth-probeAllProviders.spec.ts --reporter=list
 */

test.describe.configure({ mode: 'serial' });

const KEYS = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GOOGLE_AI_API_KEY', 'XAI_API_KEY', 'DEEPSEEK_API_KEY', 'OLLAMA_HOST'] as const;
const SAVED: Record<string, string | undefined> = {};
const ORIG_FETCH = global.fetch;

interface FetchCall {
    url: string;
    method?: string;
    headers: Record<string, string>;
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
        const call: FetchCall = { url, method: init?.method, headers };
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

test.describe('probeAllProviders — empty env', () => {
    test('returns one entry per provider', async () => {
        const probes = await probeAllProviders();
        expect(probes).toHaveLength(6);
        const names = probes.map(p => p.provider).sort();
        expect(names).toEqual(['anthropic', 'deepseek', 'google', 'ollama', 'openai', 'xai']);
    });

    test('every entry reports configured:false ok:false reason:"no key" when no env keys are set', async () => {
        // No fetch mock needed — the no-key branch never fires fetch.
        const probes = await probeAllProviders();
        for (const p of probes) {
            expect(p.configured).toBe(false);
            expect(p.ok).toBe(false);
            expect(p.reason).toMatch(/^(no key|no OLLAMA_HOST)$/);
        }
    });

    test('does not fire any fetch calls when no providers are configured', async () => {
        const calls = mockFetch(() => new Response('should not be called'));
        await probeAllProviders();
        expect(calls).toHaveLength(0);
    });
});

test.describe('probeAllProviders — Anthropic', () => {
    test('hits api.anthropic.com/v1/models with x-api-key + anthropic-version', async () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
        const calls = mockFetch(() => new Response('{}', { status: 200 }));
        await probeAllProviders();
        const anthropicCalls = calls.filter(c => c.url.includes('anthropic.com'));
        expect(anthropicCalls).toHaveLength(1);
        expect(anthropicCalls[0].url).toBe('https://api.anthropic.com/v1/models');
        expect(anthropicCalls[0].headers['x-api-key']).toBe('sk-ant-test');
        expect(anthropicCalls[0].headers['anthropic-version']).toBe('2023-06-01');
    });

    test('reports ok:true with latencyMs on 200 response', async () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
        mockFetch(() => new Response('{}', { status: 200 }));
        const probes = await probeAllProviders();
        const anthropic = probes.find(p => p.provider === 'anthropic');
        expect(anthropic?.configured).toBe(true);
        expect(anthropic?.ok).toBe(true);
        expect(anthropic?.latencyMs).toBeGreaterThanOrEqual(0);
    });

    test('reports ok:false with reason="<status> <statusText>" on non-2xx', async () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
        mockFetch(() => new Response('forbidden', { status: 403, statusText: 'Forbidden' }));
        const probes = await probeAllProviders();
        const anthropic = probes.find(p => p.provider === 'anthropic');
        expect(anthropic?.ok).toBe(false);
        expect(anthropic?.reason).toContain('403');
    });
});

test.describe('probeAllProviders — OpenAI / xAI / DeepSeek (Bearer auth)', () => {
    test('OpenAI uses Bearer auth on /v1/models', async () => {
        process.env.OPENAI_API_KEY = 'sk-openai-test';
        const calls = mockFetch(() => new Response('{}', { status: 200 }));
        await probeAllProviders();
        const openaiCalls = calls.filter(c => c.url.includes('openai.com'));
        expect(openaiCalls[0].url).toBe('https://api.openai.com/v1/models');
        expect(openaiCalls[0].headers['authorization']).toBe('Bearer sk-openai-test');
    });

    test('xAI uses Bearer auth on api.x.ai/v1/models', async () => {
        process.env.XAI_API_KEY = 'xai-test';
        const calls = mockFetch(() => new Response('{}', { status: 200 }));
        await probeAllProviders();
        const xaiCalls = calls.filter(c => c.url.includes('x.ai'));
        expect(xaiCalls[0].url).toBe('https://api.x.ai/v1/models');
        expect(xaiCalls[0].headers['authorization']).toBe('Bearer xai-test');
    });

    test('DeepSeek uses Bearer auth on api.deepseek.com/v1/models', async () => {
        process.env.DEEPSEEK_API_KEY = 'dsk-test';
        const calls = mockFetch(() => new Response('{}', { status: 200 }));
        await probeAllProviders();
        const dsCalls = calls.filter(c => c.url.includes('deepseek.com'));
        expect(dsCalls[0].url).toBe('https://api.deepseek.com/v1/models');
        expect(dsCalls[0].headers['authorization']).toBe('Bearer dsk-test');
    });
});

test.describe('probeAllProviders — Google', () => {
    test('embeds the API key in the URL query string (no Authorization header)', async () => {
        process.env.GOOGLE_AI_API_KEY = 'AIza-test';
        const calls = mockFetch(() => new Response('{}', { status: 200 }));
        await probeAllProviders();
        const googleCalls = calls.filter(c => c.url.includes('generativelanguage'));
        expect(googleCalls).toHaveLength(1);
        expect(googleCalls[0].url).toBe('https://generativelanguage.googleapis.com/v1beta/models?key=AIza-test');
        // Google's pattern is query-string auth, not headers
        expect(googleCalls[0].headers['authorization']).toBeUndefined();
    });
});

test.describe('probeAllProviders — Ollama', () => {
    test('uses OLLAMA_HOST and hits /api/tags', async () => {
        process.env.OLLAMA_HOST = 'http://localhost:11434';
        const calls = mockFetch(() => new Response('{}', { status: 200 }));
        await probeAllProviders();
        const ollamaCalls = calls.filter(c => c.url.includes('localhost'));
        expect(ollamaCalls).toHaveLength(1);
        expect(ollamaCalls[0].url).toBe('http://localhost:11434/api/tags');
    });

    test('reports configured:true ok:true when OLLAMA_HOST is set and reachable', async () => {
        process.env.OLLAMA_HOST = 'http://localhost:11434';
        mockFetch(() => new Response('{}', { status: 200 }));
        const probes = await probeAllProviders();
        const ollama = probes.find(p => p.provider === 'ollama');
        expect(ollama?.configured).toBe(true);
        expect(ollama?.ok).toBe(true);
    });

    test('without OLLAMA_HOST reports configured:false reason:"no OLLAMA_HOST"', async () => {
        // OLLAMA_HOST already deleted in beforeEach
        const probes = await probeAllProviders();
        const ollama = probes.find(p => p.provider === 'ollama');
        expect(ollama?.configured).toBe(false);
        expect(ollama?.reason).toBe('no OLLAMA_HOST');
    });
});

test.describe('probeAllProviders — error paths', () => {
    test('fetch throw surfaces as ok:false with reason being the error name', async () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
        global.fetch = (async () => {
            throw new TypeError('connection refused');
        }) as typeof fetch;
        const probes = await probeAllProviders();
        const anthropic = probes.find(p => p.provider === 'anthropic');
        expect(anthropic?.ok).toBe(false);
        // The reason is err.name, e.g. 'TypeError'
        expect(anthropic?.reason).toBe('TypeError');
    });

    test('multiple configured providers all run in parallel (Promise.all)', async () => {
        process.env.ANTHROPIC_API_KEY = 'a';
        process.env.OPENAI_API_KEY = 'b';
        process.env.GOOGLE_AI_API_KEY = 'c';
        const calls = mockFetch(() => new Response('{}', { status: 200 }));
        await probeAllProviders();
        // Three configured providers + others returning no-key still
        // produce 3 fetch calls.
        expect(calls).toHaveLength(3);
    });
});
