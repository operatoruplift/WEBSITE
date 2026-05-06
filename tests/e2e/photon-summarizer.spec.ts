import { test, expect } from '@playwright/test';
import { summarizeChat } from '@/lib/photon/summarizer';

/**
 * Hermetic tests for the summarizer module. Only the gate paths
 * (no_api_key, too_few_turns) are testable without an Anthropic
 * round-trip. The happy path is covered by integration tests at
 * deploy time when ANTHROPIC_API_KEY is set.
 */

const ORIG_KEY = process.env.ANTHROPIC_API_KEY;

test.afterEach(() => {
    if (ORIG_KEY === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = ORIG_KEY;
});

test('returns no_api_key when ANTHROPIC_API_KEY is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const r = await summarizeChat([
        { user: 'I am a leo', assistant: 'Got it' },
        { user: 'I live in SF', assistant: 'Saved' },
        { user: 'Schedule a meeting', assistant: 'Reply YES' },
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('no_api_key');
});

test('returns too_few_turns when fewer than 3 usable turns', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-fake-key-no-network-call-expected';
    const r = await summarizeChat([
        { user: 'hi', assistant: 'hello' },
        { user: '', assistant: '' },
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('too_few_turns');
});

test('treats empty turns as filterable (skips them in the count)', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-fake-key-no-network-call-expected';
    // 4 turns total but 2 are empty -> 2 usable -> too_few_turns
    const r = await summarizeChat([
        { user: 'first', assistant: 'reply' },
        { user: '', assistant: '' },
        { user: '   ', assistant: '   ' },
        { user: 'second', assistant: 'reply2' },
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('too_few_turns');
});

test('returns no_api_key takes precedence over too_few_turns', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const r = await summarizeChat([{ user: 'hi', assistant: 'hello' }]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('no_api_key');
});
