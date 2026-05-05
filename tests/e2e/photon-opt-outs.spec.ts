import { test, expect } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isOptedOut, recordOptOut, clearOptOut } from '@/lib/photon/opt-outs';

/**
 * Unit tests for lib/photon/opt-outs. The helpers wrap minimal
 * Supabase queries; we mock the client so tests are hermetic.
 */

interface FakeRow { sender: string; opted_out_at: string | null; last_reason?: string | null }

function makeFake(initial: FakeRow[] = [], failure?: { message: string }) {
    const store = new Map<string, FakeRow>();
    for (const r of initial) store.set(r.sender, r);
    return {
        store,
        client: {
            from(table: string) {
                if (table !== 'imessage_opt_outs') throw new Error(`unexpected table ${table}`);
                return makeQueryBuilder(store, failure);
            },
        } as unknown as SupabaseClient,
    };
}

function makeQueryBuilder(store: Map<string, FakeRow>, failure?: { message: string }) {
    let filterSender: string | null = null;
    const builder = {
        select(_cols: string) { return builder; },
        eq(col: string, value: string) {
            if (col === 'sender') filterSender = value;
            return builder;
        },
        async maybeSingle() {
            if (failure) return { data: null, error: failure };
            const row = filterSender ? store.get(filterSender) ?? null : null;
            return { data: row, error: null };
        },
        async upsert(payload: FakeRow) {
            if (failure) return { data: null, error: failure };
            store.set(payload.sender, payload);
            return { data: payload, error: null };
        },
    };
    return builder;
}

test('isOptedOut returns false when supabase is null', async () => {
    const r = await isOptedOut(null, '+15551234567');
    expect(r.optedOut).toBe(false);
    expect(r.tableMissing).toBe(false);
});

test('isOptedOut returns false when sender has no row', async () => {
    const { client } = makeFake([]);
    const r = await isOptedOut(client, '+15550000000');
    expect(r.optedOut).toBe(false);
});

test('isOptedOut returns true when sender row has opted_out_at', async () => {
    const { client } = makeFake([
        { sender: '+15551234567', opted_out_at: '2026-05-05T10:00:00Z' },
    ]);
    const r = await isOptedOut(client, '+15551234567');
    expect(r.optedOut).toBe(true);
    expect(r.optedOutAt).toBe('2026-05-05T10:00:00Z');
});

test('isOptedOut returns false when row exists with null opted_out_at (re-opted-in)', async () => {
    const { client } = makeFake([
        { sender: '+15551234567', opted_out_at: null },
    ]);
    const r = await isOptedOut(client, '+15551234567');
    expect(r.optedOut).toBe(false);
});

test('isOptedOut flags tableMissing on relation-does-not-exist error', async () => {
    const { client } = makeFake([], {
        message: 'relation "public.imessage_opt_outs" does not exist',
    });
    const r = await isOptedOut(client, '+15551234567');
    expect(r.optedOut).toBe(false);
    expect(r.tableMissing).toBe(true);
});

test('recordOptOut writes a row with current timestamp', async () => {
    const { client, store } = makeFake([]);
    const r = await recordOptOut(client, '+15551234567', 'STOP');
    expect(r.ok).toBe(true);
    expect(store.get('+15551234567')?.opted_out_at).toBeTruthy();
});

test('recordOptOut overwrites an existing row (upsert semantics)', async () => {
    const { client, store } = makeFake([
        { sender: '+15551234567', opted_out_at: null },
    ]);
    const r = await recordOptOut(client, '+15551234567', 'unsubscribe');
    expect(r.ok).toBe(true);
    expect(store.get('+15551234567')?.opted_out_at).toBeTruthy();
});

test('recordOptOut returns tableMissing on the documented error', async () => {
    const { client } = makeFake([], {
        message: 'Could not find the table public.imessage_opt_outs in the schema cache',
    });
    const r = await recordOptOut(client, '+15551234567', 'STOP');
    expect(r.ok).toBe(false);
    expect(r.tableMissing).toBe(true);
});

test('clearOptOut sets opted_out_at to null', async () => {
    const { client, store } = makeFake([
        { sender: '+15551234567', opted_out_at: '2026-05-05T10:00:00Z' },
    ]);
    const r = await clearOptOut(client, '+15551234567');
    expect(r.ok).toBe(true);
    expect(store.get('+15551234567')?.opted_out_at).toBeNull();
});

test('empty sender input is rejected with empty_sender error', async () => {
    const { client } = makeFake([]);
    const a = await isOptedOut(client, '   ');
    expect(a.optedOut).toBe(false);
    const b = await recordOptOut(client, '', 'STOP');
    expect(b.ok).toBe(false);
    expect(b.error).toBe('empty_sender');
});
