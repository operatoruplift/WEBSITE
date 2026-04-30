import { test, expect } from '@playwright/test';
import { mapModelId } from '@/lib/llm';

/**
 * Unit tests for the friendly-to-API model name mapper.
 *
 * The /chat ModelSelector lets users pick a friendly name (e.g.
 * "claude-haiku-4-5"); the API call needs the real provider model
 * id ("claude-haiku-4-5-20251001"). mapModelId is the bridge.
 *
 * A regression here means:
 * - User picks "claude-haiku-4-5" -> Anthropic returns 404 because
 *   the friendly name isn't a valid model id
 * - User picks "gemini-2.5-pro" -> Google returns 400 unless mapped
 *   to the dated version
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/llm-mapModelId.spec.ts --reporter=list
 */

test.describe('mapModelId', () => {
    test('Anthropic friendly names round-trip correctly', () => {
        // Opus 4.7 is the current flagship; 4-6 is kept as an alias
        // that routes to 4-7 so old chat sessions keep working.
        expect(mapModelId('claude-opus-4-7')).toBe('claude-opus-4-7');
        expect(mapModelId('claude-opus-4-6')).toBe('claude-opus-4-7');
        expect(mapModelId('claude-sonnet-4-6')).toBe('claude-sonnet-4-6');
        // Haiku has a dated suffix
        expect(mapModelId('claude-haiku-4-5')).toBe('claude-haiku-4-5-20251001');
    });

    test('OpenAI friendly names round-trip', () => {
        expect(mapModelId('gpt-4.1')).toBe('gpt-4.1');
        expect(mapModelId('gpt-4.1-mini')).toBe('gpt-4.1-mini');
        expect(mapModelId('gpt-4o')).toBe('gpt-4o');
    });

    test('Gemini maps friendly name to dated preview id', () => {
        expect(mapModelId('gemini-2.5-pro')).toBe('gemini-2.5-pro-preview-06-05');
        expect(mapModelId('gemini-2.5-flash')).toBe('gemini-2.5-flash-preview-05-20');
    });

    test('xAI Grok ids round-trip', () => {
        expect(mapModelId('grok-3')).toBe('grok-3');
        expect(mapModelId('grok-3-mini')).toBe('grok-3-mini');
    });

    test('DeepSeek maps friendly name to API name', () => {
        expect(mapModelId('deepseek-r1')).toBe('deepseek-reasoner');
        expect(mapModelId('deepseek-v3')).toBe('deepseek-chat');
    });

    test('Ollama / Llama mapping picks llama3.2:3b', () => {
        expect(mapModelId('llama-4-maverick')).toBe('llama3.2:3b');
        expect(mapModelId('llama-3.2')).toBe('llama3.2:3b');
        expect(mapModelId('ollama')).toBe('llama3.2:3b');
        expect(mapModelId('mistral')).toBe('mistral:latest');
    });

    test('unknown model id passes through unchanged (caller decides)', () => {
        // The function is a best-effort mapper; unknown ids fall
        // through. Callers that throw on unknown should validate
        // separately. A regression that mapped unknown to a default
        // would silently route the user's request to a different
        // provider.
        expect(mapModelId('totally-unknown-model')).toBe('totally-unknown-model');
        expect(mapModelId('claude-opus-99')).toBe('claude-opus-99');
        expect(mapModelId('')).toBe('');
    });

    test('mapping is case-sensitive (exact match)', () => {
        // The Anthropic / OpenAI / etc id matching is case-sensitive.
        // Documenting the behavior so a future PR that "normalizes"
        // case sees it explicit.
        expect(mapModelId('CLAUDE-OPUS-4-6')).toBe('CLAUDE-OPUS-4-6');
        expect(mapModelId('Gpt-4.1')).toBe('Gpt-4.1');
    });

    test('every key in the table maps to a non-empty value', () => {
        // Document the contract: no entry is "" so a regression that
        // accidentally drops a value would surface here.
        const friendlyNames = [
            'claude-opus-4-7',
            'claude-opus-4-6',
            'claude-sonnet-4-6',
            'claude-haiku-4-5',
            'gpt-4.1',
            'gpt-4.1-mini',
            'gpt-4o',
            'gemini-2.5-pro',
            'gemini-2.5-flash',
            'grok-3',
            'grok-3-mini',
            'deepseek-r1',
            'deepseek-v3',
            'llama-4-maverick',
            'llama-3.2',
            'mistral',
            'ollama',
        ];
        for (const name of friendlyNames) {
            const mapped = mapModelId(name);
            expect(mapped, `${name} maps to non-empty`).not.toBe('');
            expect(mapped.length, `${name} maps to non-empty`).toBeGreaterThan(0);
        }
    });
});
