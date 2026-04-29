import { test, expect } from '@playwright/test';
import { probeProviderForModel } from '@/lib/llmHealth';

/**
 * Unit tests for the model→provider prefix mapping inside
 * probeProviderForModel.
 *
 * The /api/health/llm endpoint maps a model id (e.g.
 * 'claude-haiku-4-5') to the corresponding provider probe
 * ('anthropic'). The mapping is `Object.keys(map).find(p => model.startsWith(p))`,
 * so a regression that re-orders the keys or adds a more-specific
 * prefix could route the wrong probe (e.g. 'gemini-pro-llama' to
 * 'ollama' instead of 'google').
 *
 * We disable all provider keys so probeAllProviders short-circuits
 * to {ok:false, reason:'no key'} for every entry. This keeps the
 * test hermetic (no network) while still exercising the routing.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/llmHealth-prefix.spec.ts --reporter=list
 */

test.describe.configure({ mode: 'serial' });

const KEYS = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GOOGLE_AI_API_KEY', 'XAI_API_KEY', 'DEEPSEEK_API_KEY', 'OLLAMA_HOST'] as const;
const SAVED: Record<string, string | undefined> = {};

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
});

test.describe('probeProviderForModel — prefix → provider routing', () => {
    test('claude-* → anthropic', async () => {
        const probe = await probeProviderForModel('claude-haiku-4-5');
        expect(probe?.provider).toBe('anthropic');
        expect(probe?.configured).toBe(false);
    });

    test('claude-opus-4-7 → anthropic (newer model still routes)', async () => {
        const probe = await probeProviderForModel('claude-opus-4-7');
        expect(probe?.provider).toBe('anthropic');
    });

    test('gpt-* → openai', async () => {
        const probe = await probeProviderForModel('gpt-4o');
        expect(probe?.provider).toBe('openai');
        expect(probe?.configured).toBe(false);
    });

    test('gemini-* → google', async () => {
        const probe = await probeProviderForModel('gemini-2.5-flash');
        expect(probe?.provider).toBe('google');
        expect(probe?.configured).toBe(false);
    });

    test('grok-* → xai', async () => {
        const probe = await probeProviderForModel('grok-3');
        expect(probe?.provider).toBe('xai');
    });

    test('deepseek-* → deepseek', async () => {
        const probe = await probeProviderForModel('deepseek-reasoner');
        expect(probe?.provider).toBe('deepseek');
    });

    test('llama-* → ollama', async () => {
        const probe = await probeProviderForModel('llama-3.2');
        expect(probe?.provider).toBe('ollama');
        expect(probe?.configured).toBe(false);
    });

    test('mistral-* → ollama (Ollama hosts Mistral models too)', async () => {
        const probe = await probeProviderForModel('mistral-7b-instruct');
        expect(probe?.provider).toBe('ollama');
    });

    test('ollama-* → ollama', async () => {
        const probe = await probeProviderForModel('ollama:llama3');
        expect(probe?.provider).toBe('ollama');
    });

    test('unknown prefix returns null', async () => {
        const probe = await probeProviderForModel('cohere-command-r');
        expect(probe).toBeNull();
    });

    test('empty model name returns null', async () => {
        const probe = await probeProviderForModel('');
        expect(probe).toBeNull();
    });

    test('exact prefix match (no suffix) still routes', async () => {
        const probe = await probeProviderForModel('gpt');
        expect(probe?.provider).toBe('openai');
    });

    test('case-sensitive matching: GPT-4o (uppercase) returns null', async () => {
        // `model.startsWith('gpt')` is case-sensitive. Documents that
        // a regression normalizing case could change routing.
        const probe = await probeProviderForModel('GPT-4o');
        expect(probe).toBeNull();
    });

    test('reports configured=true when the matched provider has a key set', async () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
        const probe = await probeProviderForModel('claude-haiku-4-5');
        expect(probe?.provider).toBe('anthropic');
        expect(probe?.configured).toBe(true);
        // Without a key, ok is false. With a key, the probe attempts
        // a network call which we don't mock here; the result depends
        // on environment, so we only assert configured=true.
    });

    test('returns ok:false reason:"no key" when matched provider has no key', async () => {
        const probe = await probeProviderForModel('claude-haiku-4-5');
        expect(probe?.ok).toBe(false);
        expect(probe?.reason).toBe('no key');
    });
});
