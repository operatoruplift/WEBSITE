import { test, expect } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { loadHistory } from '@/lib/photon/history';

/**
 * Unit tests for loadHistory used by lib/photon/agent.ts to feed
 * multi-turn context to Claude Haiku. Hermetic: a fake Supabase
 * client lets us pin the exact query shape and the alternation
 * guarantee.
 */

interface FakeRow {
    text: string | null;
    reply_text: string | null;
    received_at: string;
    sender?: string;
}

function makeFake(rows: FakeRow[], failure?: { message: string }) {
    return {
        from() {
            return makeBuilder(rows, failure);
        },
    } as unknown as SupabaseClient;
}

function makeBuilder(rows: FakeRow[], failure?: { message: string }) {
    let filterSender: string | null = null;
    const builder = {
        select(_cols: string) { return builder; },
        eq(col: string, value: string) {
            if (col === 'sender') filterSender = value;
            return builder;
        },
        not(_col: string, _op: string, _val: string) { return builder; },
        order(_col: string, _opts: unknown) { return builder; },
        async limit(_n: number) {
            if (failure) return { data: null, error: failure };
            const matched = filterSender
                ? rows.filter(r => r.sender === filterSender || !r.sender)
                : rows;
            return { data: matched, error: null };
        },
    };
    return builder;
}

test('returns [] when supabase is null', async () => {
    expect(await loadHistory(null, '+15551234567', 5)).toEqual([]);
});

test('returns [] when sender is empty', async () => {
    const supabase = makeFake([]);
    expect(await loadHistory(supabase, '   ', 5)).toEqual([]);
});

test('returns [] when limit is non-positive', async () => {
    const supabase = makeFake([
        { text: 'hi', reply_text: 'hello', received_at: '2026-01-01T00:00:00Z' },
    ]);
    expect(await loadHistory(supabase, '+15551234567', 0)).toEqual([]);
});

test('returns turns chronologically (most recent last)', async () => {
    // Query orders descending; loadHistory reverses to chronological.
    const supabase = makeFake([
        { text: 'last', reply_text: 'reply3', received_at: '2026-01-03T00:00:00Z' },
        { text: 'middle', reply_text: 'reply2', received_at: '2026-01-02T00:00:00Z' },
        { text: 'first', reply_text: 'reply1', received_at: '2026-01-01T00:00:00Z' },
    ]);
    const history = await loadHistory(supabase, '+15551234567', 3);
    expect(history.map(t => t.user)).toEqual(['first', 'middle', 'last']);
    expect(history.map(t => t.assistant)).toEqual(['reply1', 'reply2', 'reply3']);
});

test('skips rows missing reply_text or text (preserves alternation)', async () => {
    const supabase = makeFake([
        { text: 'has both', reply_text: 'yes', received_at: '2026-01-03T00:00:00Z' },
        { text: 'no reply', reply_text: null, received_at: '2026-01-02T00:00:00Z' },
        { text: '', reply_text: 'orphan', received_at: '2026-01-01T00:00:00Z' },
    ]);
    const history = await loadHistory(supabase, '+15551234567', 5);
    expect(history).toHaveLength(1);
    expect(history[0].user).toBe('has both');
    expect(history[0].assistant).toBe('yes');
});

test('truncates very long messages to 2000 chars', async () => {
    const huge = 'x'.repeat(5000);
    const supabase = makeFake([
        { text: huge, reply_text: huge, received_at: '2026-01-01T00:00:00Z' },
    ]);
    const history = await loadHistory(supabase, '+15551234567', 1);
    expect(history[0].user.length).toBe(2000);
    expect(history[0].assistant.length).toBe(2000);
});

test('returns [] when Supabase reports table missing', async () => {
    const supabase = makeFake([], {
        message: 'relation "public.inbound_messages" does not exist',
    });
    expect(await loadHistory(supabase, '+15551234567', 5)).toEqual([]);
});

test('returns [] when reply_text column is missing (pre-migration)', async () => {
    const supabase = makeFake([], {
        message: 'Could not find the column "reply_text" in the schema cache',
    });
    expect(await loadHistory(supabase, '+15551234567', 5)).toEqual([]);
});
