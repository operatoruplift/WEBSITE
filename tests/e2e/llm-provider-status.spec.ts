import { test, expect } from '@playwright/test';
import { getProviderStatus, ProviderError } from '@/lib/llm';

/**
 * Unit tests for the env-var sniffing in lib/llm.
 *
 * /api/health/llm and the Diagnostics surface use getProviderStatus()
 * to tell users which providers are configured. The contract is one
 * row per provider with `configured` reflecting whether the env var
 * is set, plus the env var's name so the user can fix a missing
 * config.
 *
 * A regression in:
 * - The env var name -> users follow stale instructions
 * - The configured boolean -> we show "configured" when no key is
 *   set, then chat 503s confusingly
 *
 * Tests mutate process.env so the describe block is serial.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/llm-provider-status.spec.ts --reporter=list
 */

test.describe.configure({ mode: 'serial' });

const ORIG = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
    XAI_API_KEY: process.env.XAI_API_KEY,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
};

function clearAll() {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GOOGLE_AI_API_KEY;
    delete process.env.XAI_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
}

function restoreEnv() {
    for (const [key, value] of Object.entries(ORIG)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
}

test.beforeEach(() => {
    clearAll();
});

test.afterEach(() => {
    restoreEnv();
});

test.describe('getProviderStatus', () => {
    test('returns one entry per documented provider', () => {
        const status = getProviderStatus();
        expect(Object.keys(status).sort()).toEqual([
            'anthropic',
            'deepseek',
            'google',
            'ollama',
            'openai',
            'xai',
        ]);
    });

    test('every entry has configured + envVar fields', () => {
        const status = getProviderStatus();
        for (const [provider, info] of Object.entries(status)) {
            expect(typeof info.configured, `${provider}.configured`).toBe('boolean');
            expect(typeof info.envVar, `${provider}.envVar`).toBe('string');
            expect(info.envVar.length, `${provider}.envVar non-empty`).toBeGreaterThan(0);
        }
    });

    test('envVar names match the documented provider keys', () => {
        const status = getProviderStatus();
        expect(status.anthropic.envVar).toBe('ANTHROPIC_API_KEY');
        expect(status.openai.envVar).toBe('OPENAI_API_KEY');
        expect(status.google.envVar).toBe('GOOGLE_AI_API_KEY');
        expect(status.xai.envVar).toBe('XAI_API_KEY');
        expect(status.deepseek.envVar).toBe('DEEPSEEK_API_KEY');
        expect(status.ollama.envVar).toBe('OLLAMA_HOST');
    });

    test('all cloud providers report configured:false when env unset', () => {
        const status = getProviderStatus();
        expect(status.anthropic.configured).toBe(false);
        expect(status.openai.configured).toBe(false);
        expect(status.google.configured).toBe(false);
        expect(status.xai.configured).toBe(false);
        expect(status.deepseek.configured).toBe(false);
    });

    test('Ollama always reports configured:true (the host check happens at call time)', () => {
        // Ollama is documented as always-"configured" because the
        // module's runtime check probes OLLAMA_HOST when the call
        // is made, not at status-time. A regression that flipped
        // this to false would surface "Ollama not configured" even
        // when the user has Ollama running.
        const status = getProviderStatus();
        expect(status.ollama.configured).toBe(true);
    });

    test('configured flips to true when env var is set', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
        process.env.OPENAI_API_KEY = 'sk-openai-test';
        const status = getProviderStatus();
        expect(status.anthropic.configured).toBe(true);
        expect(status.openai.configured).toBe(true);
        // The unset ones stay false
        expect(status.google.configured).toBe(false);
        expect(status.xai.configured).toBe(false);
        expect(status.deepseek.configured).toBe(false);
    });

    test('empty string env value is treated as unset', () => {
        process.env.ANTHROPIC_API_KEY = '';
        const status = getProviderStatus();
        expect(status.anthropic.configured).toBe(false);
    });

    test('re-evaluates env on every call (no caching)', () => {
        process.env.OPENAI_API_KEY = 'sk-openai-test';
        expect(getProviderStatus().openai.configured).toBe(true);
        delete process.env.OPENAI_API_KEY;
        expect(getProviderStatus().openai.configured).toBe(false);
        process.env.OPENAI_API_KEY = 'sk-openai-restored';
        expect(getProviderStatus().openai.configured).toBe(true);
    });
});

test.describe('ProviderError', () => {
    test('stores envVar on the error instance', () => {
        const err = new ProviderError('ANTHROPIC_API_KEY');
        expect(err.envVar).toBe('ANTHROPIC_API_KEY');
        expect(err.name).toBe('ProviderError');
    });

    test('default message points users at Settings -> API Keys', () => {
        const err = new ProviderError('OPENAI_API_KEY');
        expect(err.message).toContain('OPENAI_API_KEY');
        expect(err.message).toContain('Settings');
    });

    test('custom message overrides the default', () => {
        const err = new ProviderError('OLLAMA_HOST', 'Ollama not running at localhost:11434');
        expect(err.message).toBe('Ollama not running at localhost:11434');
        expect(err.envVar).toBe('OLLAMA_HOST');
    });

    test('extends Error so instanceof Error works (callers may catch as Error)', () => {
        const err = new ProviderError('XAI_API_KEY');
        expect(err instanceof Error).toBe(true);
        expect(err instanceof ProviderError).toBe(true);
    });
});
