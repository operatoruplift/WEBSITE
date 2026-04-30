import { test, expect } from '@playwright/test';
import {
    getClientIp,
    resolveModelDisplayName,
    buildSystemPrompt,
    normalizeModelKey,
    listKnownModelIds,
    DEFAULT_MODEL_KEY,
} from '@/lib/chat-helpers';

/**
 * Unit tests for the pure helpers extracted from the /api/chat route.
 *
 * A regression in:
 *   getClientIp           — Demo-mode rate limiting collapses to a single
 *                           bucket (every IP becomes "unknown")
 *   resolveModelDisplayName — chat replies say "claude-sonnet-4-6" instead
 *                           of "Claude Sonnet 4.6"
 *   buildSystemPrompt     — model identifies as the wrong model when the
 *                           user asks "what model are you?"
 *   normalizeModelKey     — model selector falls back to the wrong default
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/chat-helpers.spec.ts --reporter=list
 */

function reqWithHeaders(headers: Record<string, string>): Request {
    return new Request('https://x.test/api/chat', { headers });
}

test.describe('getClientIp', () => {
    test('returns the first hop from x-forwarded-for', () => {
        const req = reqWithHeaders({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1, 192.168.1.1' });
        expect(getClientIp(req)).toBe('1.2.3.4');
    });

    test('trims whitespace around x-forwarded-for entries', () => {
        const req = reqWithHeaders({ 'x-forwarded-for': '  5.6.7.8 , 10.0.0.1' });
        expect(getClientIp(req)).toBe('5.6.7.8');
    });

    test('falls back to x-real-ip when x-forwarded-for is absent', () => {
        const req = reqWithHeaders({ 'x-real-ip': '9.10.11.12' });
        expect(getClientIp(req)).toBe('9.10.11.12');
    });

    test('trims x-real-ip', () => {
        const req = reqWithHeaders({ 'x-real-ip': '   13.14.15.16   ' });
        expect(getClientIp(req)).toBe('13.14.15.16');
    });

    test('prefers x-forwarded-for over x-real-ip when both are present', () => {
        const req = reqWithHeaders({
            'x-forwarded-for': '1.1.1.1',
            'x-real-ip': '2.2.2.2',
        });
        expect(getClientIp(req)).toBe('1.1.1.1');
    });

    test('returns "unknown" when neither header is set', () => {
        expect(getClientIp(reqWithHeaders({}))).toBe('unknown');
    });

    test('returns "unknown" when x-forwarded-for is set but empty (single comma)', () => {
        // ', 10.0.0.1' splits to ['', '10.0.0.1']. The first hop is
        // empty, so the fallback "unknown" should kick in via the
        // `|| 'unknown'` guard.
        const req = reqWithHeaders({ 'x-forwarded-for': ', 10.0.0.1' });
        expect(getClientIp(req)).toBe('unknown');
    });

    test('returns "unknown" when only whitespace is in x-real-ip', () => {
        const req = reqWithHeaders({ 'x-real-ip': '   ' });
        expect(getClientIp(req)).toBe('unknown');
    });
});

test.describe('resolveModelDisplayName', () => {
    test('maps every documented model id to a non-empty display name', () => {
        for (const id of listKnownModelIds()) {
            const name = resolveModelDisplayName(id);
            expect(name).toBeTruthy();
            expect(name.length).toBeGreaterThan(0);
            expect(name).not.toBe(id);
        }
    });

    test('display names embed the provider in parentheses', () => {
        expect(resolveModelDisplayName('claude-sonnet-4-6')).toContain('(Anthropic)');
        expect(resolveModelDisplayName('gpt-4o')).toContain('(OpenAI)');
        expect(resolveModelDisplayName('gemini-2.5-pro')).toContain('(Google)');
        expect(resolveModelDisplayName('grok-3')).toContain('(xAI)');
        expect(resolveModelDisplayName('deepseek-r1')).toContain('(DeepSeek)');
    });

    test('falls through unknown ids unchanged (not empty string)', () => {
        // The system prompt embeds the display name. An empty fallback
        // would say "You are , running on..."; the raw id is the safer
        // default.
        expect(resolveModelDisplayName('cohere-command-r')).toBe('cohere-command-r');
        expect(resolveModelDisplayName('mistral-7b')).toBe('mistral-7b');
    });

    test('case-sensitive: uppercase id is treated as unknown', () => {
        // Documents the contract — callers must lowercase before
        // looking up. Routes use normalizeModelKey() to enforce.
        expect(resolveModelDisplayName('Claude-Sonnet-4-6')).toBe('Claude-Sonnet-4-6');
    });

    test('empty input returns empty string (degenerate)', () => {
        expect(resolveModelDisplayName('')).toBe('');
    });
});

test.describe('buildSystemPrompt', () => {
    test('default prompt names the model and the platform', () => {
        const prompt = buildSystemPrompt('Claude Sonnet 4.6 (Anthropic)');
        expect(prompt).toContain('Claude Sonnet 4.6 (Anthropic)');
        expect(prompt).toContain('Operator Uplift');
        expect(prompt).toContain('Never claim to be a different model');
    });

    test('default prompt includes the concise/accurate/helpful framing', () => {
        const prompt = buildSystemPrompt('GPT-4o (OpenAI)');
        expect(prompt).toContain('concise, accurate, and helpful');
    });

    test('default prompt mentions markdown code blocks', () => {
        const prompt = buildSystemPrompt('GPT-4o (OpenAI)');
        expect(prompt).toContain('markdown code blocks');
    });

    test('custom systemPrompt is preserved and the model-pinning line is appended', () => {
        const custom = 'You are a helpful pirate. Speak in pirate.';
        const prompt = buildSystemPrompt('Grok 3 (xAI)', custom);
        expect(prompt).toContain('helpful pirate');
        expect(prompt).toContain('You are Grok 3 (xAI). Never identify as a different model.');
    });

    test('empty custom prompt falls back to the default', () => {
        // '' is falsy, so we get the default — preventing an "empty
        // system message" footgun where the LLM is unanchored.
        const prompt = buildSystemPrompt('GPT-4o (OpenAI)', '');
        expect(prompt).toContain('Operator Uplift');
    });
});

test.describe('normalizeModelKey', () => {
    test('lowercases the model id', () => {
        expect(normalizeModelKey('CLAUDE-SONNET-4-6')).toBe('claude-sonnet-4-6');
        expect(normalizeModelKey('GPT-4o')).toBe('gpt-4o');
    });

    test('returns the default when input is undefined', () => {
        expect(normalizeModelKey(undefined)).toBe(DEFAULT_MODEL_KEY);
    });

    test('returns the default when input is null', () => {
        expect(normalizeModelKey(null)).toBe(DEFAULT_MODEL_KEY);
    });

    test('returns the default when input is empty string', () => {
        expect(normalizeModelKey('')).toBe(DEFAULT_MODEL_KEY);
    });

    test('returns the default when input is non-string (number, object)', () => {
        expect(normalizeModelKey(42)).toBe(DEFAULT_MODEL_KEY);
        expect(normalizeModelKey({})).toBe(DEFAULT_MODEL_KEY);
    });

    test('default model is claude-sonnet-4-6', () => {
        // Documented as the project default — change deliberately.
        expect(DEFAULT_MODEL_KEY).toBe('claude-sonnet-4-6');
    });
});

test.describe('listKnownModelIds (snapshot)', () => {
    test('returns all 13 documented model ids', () => {
        const ids = listKnownModelIds();
        expect(ids).toHaveLength(13);
    });

    test('every entry in the table maps round-trip', () => {
        // Verify there are no orphan keys with undefined values.
        for (const id of listKnownModelIds()) {
            expect(resolveModelDisplayName(id)).not.toBe('');
        }
    });
});
