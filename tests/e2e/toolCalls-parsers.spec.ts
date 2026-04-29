import { test, expect } from '@playwright/test';
import {
    parseToolCalls,
    stripToolBlocks,
    hasToolCalls,
    extractToolCallsFromText,
} from '@/lib/toolCalls';

/**
 * Unit tests for the LLM-output parsers in lib/toolCalls.ts.
 *
 * Every chat response from the model goes through these parsers
 * before the approval modal is offered. A regression here means:
 *   - Tool calls slip through as raw <tool_use> text in the chat
 *     bubble (parseToolCalls misses the block)
 *   - Tool calls fire silently because stripToolBlocks doesn't
 *     remove the JSON the user already saw
 *   - hasToolCalls reports false on a code-fenced block, so the
 *     approval flow never starts and the model's intent is lost
 *
 * All exports are pure — no fetch, no env, no Supabase. So this
 * runs as a normal unit test.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/toolCalls-parsers.spec.ts --reporter=list
 */

test.describe('parseToolCalls', () => {
    test('extracts a single <tool_use> block', () => {
        const text = `Sure, let me check.\n<tool_use>\n{"tool": "calendar", "action": "list", "params": {"days_ahead": 7}}\n</tool_use>`;
        const calls = parseToolCalls(text);
        expect(calls).toHaveLength(1);
        expect(calls[0].tool).toBe('calendar');
        expect(calls[0].action).toBe('list');
        expect(calls[0].params).toEqual({ days_ahead: 7 });
    });

    test('extracts multiple <tool_use> blocks in order', () => {
        const text = `<tool_use>{"tool":"calendar","action":"list","params":{}}</tool_use>
<tool_use>{"tool":"gmail","action":"list","params":{"max_results":5}}</tool_use>`;
        const calls = parseToolCalls(text);
        expect(calls).toHaveLength(2);
        expect(calls[0].tool).toBe('calendar');
        expect(calls[1].tool).toBe('gmail');
        expect(calls[1].params).toEqual({ max_results: 5 });
    });

    test('extracts a block wrapped in markdown code fence', () => {
        const text =
            '```json\n<tool_use>\n{"tool":"gmail","action":"draft","params":{"to":"x@y.com"}}\n</tool_use>\n```';
        const calls = parseToolCalls(text);
        expect(calls).toHaveLength(1);
        expect(calls[0].tool).toBe('gmail');
        expect(calls[0].action).toBe('draft');
    });

    test('skips a malformed JSON block but extracts well-formed siblings', () => {
        const text = `<tool_use>{not json}</tool_use>
<tool_use>{"tool":"gmail","action":"list","params":{}}</tool_use>`;
        const calls = parseToolCalls(text);
        expect(calls).toHaveLength(1);
        expect(calls[0].tool).toBe('gmail');
    });

    test('skips a block missing the action field', () => {
        // No `action` → skipped (the gate is parsed.tool && parsed.action).
        const text = `<tool_use>{"tool":"calendar","params":{}}</tool_use>`;
        const calls = parseToolCalls(text);
        expect(calls).toHaveLength(0);
    });

    test('returns empty array when no tool blocks exist', () => {
        const text = `Just a plain message about scheduling, no JSON.`;
        const calls = parseToolCalls(text);
        expect(calls).toEqual([]);
    });

    test('falls back to bare-JSON match when LLM drops the XML tags', () => {
        // Some models emit raw {"tool":"...","action":"..."} blocks
        // without <tool_use> wrappers. The fallback regex catches that.
        const text = `Here's the call: {"tool":"calendar","action":"list","params":{"days_ahead":3}}`;
        const calls = parseToolCalls(text);
        expect(calls).toHaveLength(1);
        expect(calls[0].tool).toBe('calendar');
        expect(calls[0].action).toBe('list');
    });

    test('default params is empty object when omitted', () => {
        const text = `<tool_use>{"tool":"gmail","action":"list"}</tool_use>`;
        const calls = parseToolCalls(text);
        expect(calls).toHaveLength(1);
        expect(calls[0].params).toEqual({});
    });

    test('every extracted call has a unique id and a rawBlock', () => {
        const text = `<tool_use>{"tool":"calendar","action":"list","params":{}}</tool_use>
<tool_use>{"tool":"gmail","action":"list","params":{}}</tool_use>`;
        const calls = parseToolCalls(text);
        expect(calls[0].id).not.toBe(calls[1].id);
        for (const c of calls) {
            expect(c.id).toMatch(/^tc-/);
            expect(c.rawBlock).toContain('<tool_use>');
            expect(c.rawBlock).toContain('</tool_use>');
        }
    });
});

test.describe('stripToolBlocks', () => {
    test('removes a single <tool_use> block from text', () => {
        const text = `Let me check.\n<tool_use>{"tool":"calendar","action":"list","params":{}}</tool_use>\nDone.`;
        expect(stripToolBlocks(text)).toBe('Let me check.\n\nDone.');
    });

    test('removes multiple blocks', () => {
        const text = `A <tool_use>{}</tool_use> B <tool_use>{}</tool_use> C`;
        expect(stripToolBlocks(text)).toBe('A  B  C');
    });

    test('removes blocks wrapped in markdown code fences', () => {
        const text = '```json\n<tool_use>{"tool":"calendar","action":"list","params":{}}</tool_use>\n```\nAfter.';
        const stripped = stripToolBlocks(text);
        expect(stripped).not.toContain('<tool_use>');
        expect(stripped).toContain('After.');
    });

    test('returns the original text trimmed when there are no blocks', () => {
        expect(stripToolBlocks('  hello  ')).toBe('hello');
    });

    test('returns empty string when the entire input is one tool block', () => {
        const text = `<tool_use>{"tool":"x","action":"y","params":{}}</tool_use>`;
        expect(stripToolBlocks(text)).toBe('');
    });
});

test.describe('hasToolCalls', () => {
    test('returns true on a <tool_use> block', () => {
        expect(hasToolCalls('<tool_use>{}</tool_use>')).toBe(true);
    });

    test('returns true on a bare JSON tool object for known tool', () => {
        // The fallback regex requires a known tool name. "calendar"
        // is on the allowlist.
        expect(hasToolCalls('{"tool":"calendar","action":"list"}')).toBe(true);
        expect(hasToolCalls('{"tool":"gmail","action":"list"}')).toBe(true);
        expect(hasToolCalls('{"tool":"x402","action":"pay"}')).toBe(true);
    });

    test('returns false on a JSON tool object for an unknown tool', () => {
        // "weather" is not on the allowlist — the bare-JSON branch
        // ignores it. (parseToolCalls's primary <tool_use> branch
        // is more permissive on tool names; hasToolCalls's fast
        // path is intentionally narrow.)
        expect(hasToolCalls('{"tool":"weather","action":"forecast"}')).toBe(false);
    });

    test('returns false on plain text', () => {
        expect(hasToolCalls('No tool call here, just prose.')).toBe(false);
    });

    test('returns false on empty string', () => {
        expect(hasToolCalls('')).toBe(false);
    });
});

test.describe('extractToolCallsFromText', () => {
    test('returns clean text + extracted call from a <tool_use> block', () => {
        const text = `Working on it.\n<tool_use>{"tool":"gmail","action":"list","params":{"max_results":5}}</tool_use>`;
        const { cleanText, toolCalls } = extractToolCallsFromText(text);
        expect(toolCalls).toHaveLength(1);
        expect(toolCalls[0]).toEqual({
            tool: 'gmail',
            action: 'list',
            params: { max_results: 5 },
        });
        expect(cleanText).toBe('Working on it.');
    });

    test('falls back to bare-JSON extraction when no XML tags are present', () => {
        // The Step-2 regex requires a flat object (no nested {}) so
        // it matches the common case where the LLM omits the params
        // wrapping. Nested params is the Step-3 fenced-code path.
        const text = `Here you go: {"tool":"calendar","action":"list"}`;
        const { cleanText, toolCalls } = extractToolCallsFromText(text);
        expect(toolCalls).toHaveLength(1);
        expect(toolCalls[0].tool).toBe('calendar');
        expect(toolCalls[0].action).toBe('list');
        expect(toolCalls[0].params).toEqual({});
        expect(cleanText).not.toContain('"tool":"calendar"');
    });

    test('falls back to fenced-code extraction when JSON is inside ``` blocks', () => {
        // Step-3 fallback: a fenced code block whose body parses as
        // a tool-call JSON object.
        const text = 'Output:\n```json\n{"tool":"calendar","action":"list","params":{}}\n```';
        const { cleanText, toolCalls } = extractToolCallsFromText(text);
        expect(toolCalls).toHaveLength(1);
        expect(toolCalls[0].tool).toBe('calendar');
        expect(cleanText).toBe('Output:');
    });

    test('returns empty toolCalls when input has only prose', () => {
        const { cleanText, toolCalls } = extractToolCallsFromText('hello world');
        expect(toolCalls).toEqual([]);
        expect(cleanText).toBe('hello world');
    });

    test('extracts multiple <tool_use> blocks and removes all of them', () => {
        const text = `<tool_use>{"tool":"calendar","action":"list","params":{}}</tool_use>
<tool_use>{"tool":"gmail","action":"list","params":{}}</tool_use>
After.`;
        const { cleanText, toolCalls } = extractToolCallsFromText(text);
        expect(toolCalls).toHaveLength(2);
        expect(cleanText).not.toContain('<tool_use>');
        expect(cleanText).toContain('After.');
    });

    test('collapses 3+ consecutive newlines in the cleaned text', () => {
        const text = `Pre


<tool_use>{"tool":"calendar","action":"list","params":{}}</tool_use>


Post`;
        const { cleanText } = extractToolCallsFromText(text);
        // The contract: \n{3,} → \n\n
        expect(cleanText).not.toMatch(/\n{3,}/);
    });

    test('default params is empty object when omitted', () => {
        const text = `<tool_use>{"tool":"gmail","action":"list"}</tool_use>`;
        const { toolCalls } = extractToolCallsFromText(text);
        expect(toolCalls[0].params).toEqual({});
    });

    test('skips malformed <tool_use> JSON without throwing', () => {
        const text = `<tool_use>{not valid}</tool_use>`;
        const { toolCalls, cleanText } = extractToolCallsFromText(text);
        expect(toolCalls).toEqual([]);
        // The raw block stays in cleanText since extraction failed.
        expect(cleanText).toContain('<tool_use>');
    });
});
