import { test, expect } from '@playwright/test';
import { hasServerLLMKey } from '@/lib/capabilities';

/**
 * Unit tests for hasServerLLMKey — the env-var probe that decides
 * whether /api/chat can route to a real LLM provider, or has to
 * fall back to Demo / canned replies.
 *
 * It returns true if ANY of these env vars are set:
 *   ANTHROPIC_API_KEY
 *   OPENAI_API_KEY
 *   GOOGLE_AI_API_KEY
 *   GROQ_API_KEY
 *
 * A false return moves the user into Demo mode for the entire
 * request. A regression that defaulted to true (e.g. coerced an
 * undefined env var to 'undefined' string) would silently route
 * Demo users to the real-call path and surface "missing API key"
 * errors instead of canned-reply fallbacks.
 *
 * Tests mutate process.env so the describe block is serial.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/capabilities-hasServerLLMKey.spec.ts --reporter=list
 */

test.describe.configure({ mode: 'serial' });

const RELEVANT_KEYS = [
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'GOOGLE_AI_API_KEY',
    'GROQ_API_KEY',
] as const;

const SAVED: Record<string, string | undefined> = {};

function clearAll() {
    for (const k of RELEVANT_KEYS) {
        SAVED[k] = process.env[k];
        delete process.env[k];
    }
}

function restoreAll() {
    for (const k of RELEVANT_KEYS) {
        if (SAVED[k] === undefined) delete process.env[k];
        else process.env[k] = SAVED[k];
    }
}

test.beforeEach(() => {
    clearAll();
});

test.afterEach(() => {
    restoreAll();
});

test.describe('hasServerLLMKey', () => {
    test('returns false when no provider keys are set', () => {
        expect(hasServerLLMKey()).toBe(false);
    });

    test('returns true when ANTHROPIC_API_KEY is set', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
        expect(hasServerLLMKey()).toBe(true);
    });

    test('returns true when OPENAI_API_KEY is set', () => {
        process.env.OPENAI_API_KEY = 'sk-test';
        expect(hasServerLLMKey()).toBe(true);
    });

    test('returns true when GOOGLE_AI_API_KEY is set', () => {
        process.env.GOOGLE_AI_API_KEY = 'AIza-test';
        expect(hasServerLLMKey()).toBe(true);
    });

    test('returns true when GROQ_API_KEY is set', () => {
        process.env.GROQ_API_KEY = 'gsk_test';
        expect(hasServerLLMKey()).toBe(true);
    });

    test('returns true when multiple provider keys are set', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
        process.env.OPENAI_API_KEY = 'sk-test';
        process.env.GOOGLE_AI_API_KEY = 'AIza-test';
        expect(hasServerLLMKey()).toBe(true);
    });

    test('returns false when an unrelated env var is set', () => {
        process.env.SOME_OTHER_KEY = 'value';
        expect(hasServerLLMKey()).toBe(false);
        delete process.env.SOME_OTHER_KEY;
    });

    test('returns false when key is set to empty string', () => {
        // process.env coerces, the truthiness check should treat ''
        // as "unset" so we don't try to call a provider with an empty
        // bearer token.
        process.env.ANTHROPIC_API_KEY = '';
        expect(hasServerLLMKey()).toBe(false);
    });

    test('returns true even with a one-character key (no length check by design)', () => {
        // The contract is "is anything set" — provider auth failures
        // surface downstream as ProviderError. This documents that
        // hasServerLLMKey is not a key-validity check.
        process.env.ANTHROPIC_API_KEY = 'x';
        expect(hasServerLLMKey()).toBe(true);
    });

    test('XAI_API_KEY does NOT trigger true (not in the bagged set)', () => {
        // hasServerLLMKey explicitly only checks the four keys above.
        // XAI/DeepSeek/Ollama are configured but routed differently.
        // This documents the boundary.
        process.env.XAI_API_KEY = 'xai-test';
        expect(hasServerLLMKey()).toBe(false);
        delete process.env.XAI_API_KEY;
    });

    test('DEEPSEEK_API_KEY does NOT trigger true', () => {
        process.env.DEEPSEEK_API_KEY = 'dsk-test';
        expect(hasServerLLMKey()).toBe(false);
        delete process.env.DEEPSEEK_API_KEY;
    });

    test('toggle: returns true → set + check, then false after delete', () => {
        expect(hasServerLLMKey()).toBe(false);
        process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
        expect(hasServerLLMKey()).toBe(true);
        delete process.env.ANTHROPIC_API_KEY;
        expect(hasServerLLMKey()).toBe(false);
    });
});
