import { test, expect } from '@playwright/test';
import { callLLM, ProviderError, type LLMMessage } from '@/lib/llm';

/**
 * Unit tests for callLLM's provider routing — verifies that each
 * model prefix routes to the correct env-key check, and that a
 * missing env key surfaces as a ProviderError (terminal, not retried).
 *
 * The test never makes a real API call — it relies on the missing-key
 * branch in callLLMOnce to fail fast before any network IO.
 *
 * A regression that:
 *   - mis-routed claude-* to the OpenAI key check would surface here
 *   - made ProviderError retryable would multiply the missing-key
 *     errors instead of failing fast (visible in slow test time)
 *
 * Tests mutate process.env so the describe block is serial.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/llm-providerRouting.spec.ts --reporter=list
 */

test.describe.configure({ mode: 'serial' });

const KEYS = [
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'GOOGLE_AI_API_KEY',
    'XAI_API_KEY',
    'DEEPSEEK_API_KEY',
    'OLLAMA_HOST',
    'GROQ_API_KEY',
] as const;
const SAVED: Record<string, string | undefined> = {};

const userMsg: LLMMessage[] = [{ role: 'user', content: 'hi' }];

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

test.describe('callLLM provider routing — missing-key contract', () => {
    test('claude-sonnet-4-6 → ProviderError(ANTHROPIC_API_KEY)', async () => {
        try {
            await callLLM('claude-sonnet-4-6', userMsg);
            throw new Error('expected ProviderError');
        } catch (err) {
            expect(err).toBeInstanceOf(ProviderError);
            expect((err as ProviderError).envVar).toBe('ANTHROPIC_API_KEY');
        }
    });

    test('claude-opus-4-6 → ANTHROPIC_API_KEY', async () => {
        try {
            await callLLM('claude-opus-4-6', userMsg);
            throw new Error('expected ProviderError');
        } catch (err) {
            expect((err as ProviderError).envVar).toBe('ANTHROPIC_API_KEY');
        }
    });

    test('claude-haiku-4-5 → ANTHROPIC_API_KEY', async () => {
        try {
            await callLLM('claude-haiku-4-5', userMsg);
            throw new Error('expected ProviderError');
        } catch (err) {
            expect((err as ProviderError).envVar).toBe('ANTHROPIC_API_KEY');
        }
    });

    test('gpt-4o → ProviderError(OPENAI_API_KEY)', async () => {
        try {
            await callLLM('gpt-4o', userMsg);
            throw new Error('expected ProviderError');
        } catch (err) {
            expect(err).toBeInstanceOf(ProviderError);
            expect((err as ProviderError).envVar).toBe('OPENAI_API_KEY');
        }
    });

    test('gpt-4.1-mini → OPENAI_API_KEY', async () => {
        try {
            await callLLM('gpt-4.1-mini', userMsg);
            throw new Error('expected ProviderError');
        } catch (err) {
            expect((err as ProviderError).envVar).toBe('OPENAI_API_KEY');
        }
    });

    test('gemini-2.5-pro → ProviderError(GOOGLE_AI_API_KEY)', async () => {
        try {
            await callLLM('gemini-2.5-pro', userMsg);
            throw new Error('expected ProviderError');
        } catch (err) {
            expect(err).toBeInstanceOf(ProviderError);
            expect((err as ProviderError).envVar).toBe('GOOGLE_AI_API_KEY');
        }
    });

    test('gemini-2.5-flash → GOOGLE_AI_API_KEY', async () => {
        try {
            await callLLM('gemini-2.5-flash', userMsg);
            throw new Error('expected ProviderError');
        } catch (err) {
            expect((err as ProviderError).envVar).toBe('GOOGLE_AI_API_KEY');
        }
    });

    test('grok-3 → ProviderError(XAI_API_KEY)', async () => {
        try {
            await callLLM('grok-3', userMsg);
            throw new Error('expected ProviderError');
        } catch (err) {
            expect(err).toBeInstanceOf(ProviderError);
            expect((err as ProviderError).envVar).toBe('XAI_API_KEY');
        }
    });

    test('grok-3-mini → XAI_API_KEY', async () => {
        try {
            await callLLM('grok-3-mini', userMsg);
            throw new Error('expected ProviderError');
        } catch (err) {
            expect((err as ProviderError).envVar).toBe('XAI_API_KEY');
        }
    });

    test('deepseek-r1 → ProviderError(DEEPSEEK_API_KEY)', async () => {
        try {
            await callLLM('deepseek-r1', userMsg);
            throw new Error('expected ProviderError');
        } catch (err) {
            expect(err).toBeInstanceOf(ProviderError);
            expect((err as ProviderError).envVar).toBe('DEEPSEEK_API_KEY');
        }
    });

    test('deepseek-v3 → DEEPSEEK_API_KEY', async () => {
        try {
            await callLLM('deepseek-v3', userMsg);
            throw new Error('expected ProviderError');
        } catch (err) {
            expect((err as ProviderError).envVar).toBe('DEEPSEEK_API_KEY');
        }
    });

    // The llama / mistral / ollama branch is intentionally skipped here.
    // It defaults OLLAMA_HOST to http://localhost:11434 and tries a
    // real fetch; the result is environment-dependent (a developer
    // running Ollama locally would see a different error than a CI
    // runner with no Ollama). The integration spec at
    // tests/e2e/llm-isRetryable.spec.ts and llmHealth-prefix.spec.ts
    // already cover the prefix routing without firing fetch.

    test('ProviderError is terminal — does NOT retry up to MAX_ATTEMPTS', async () => {
        // If isRetryableError(ProviderError) returned true, callLLM
        // would retry 3 times with backoff (0ms + 500ms + 1500ms = 2s).
        // The terminal contract says it fails fast in <50ms.
        const start = Date.now();
        try {
            await callLLM('claude-sonnet-4-6', userMsg);
        } catch {
            // Expected
        }
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(500);
    });

    test('ProviderError.message points users at Settings → API Keys', async () => {
        try {
            await callLLM('claude-sonnet-4-6', userMsg);
        } catch (err) {
            expect((err as Error).message).toContain('Settings');
            expect((err as Error).message).toContain('API Keys');
        }
    });
});
