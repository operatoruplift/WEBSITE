import { test, expect } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
    createPending,
    getPending,
    deletePending,
    classifyPendingResponse,
} from '@/lib/photon/pending-actions';

/**
 * Hermetic tests for the pending tool-call confirmation buffer.
 *
 * Pin createPending upsert semantics, getPending expiry handling,
 * deletePending no-op safety, and the classifyPendingResponse
 * full-text matcher (so "yes please" maps to confirm but
 * "well yes I think we should reschedule" stays a normal message).
 */

interface PendingRow {
    sender: string;
    action_type: string;
    params: Record<string, unknown>;
    preview_text: string | null;
    expires_at: string;
    created_at: string;
}

function makeFake(initial: PendingRow[] = []) {
    const store = new Map<string, PendingRow>();
    for (const r of initial) store.set(r.sender, r);
    return {
        store,
        client: {
            from(table: string) {
                if (table !== 'imessage_pending_actions') throw new Error(`unexpected table ${table}`);
                return makeBuilder(store);
            },
        } as unknown as SupabaseClient,
    };
}

function makeBuilder(store: Map<string, PendingRow>) {
    let filterSender: string | null = null;
    let pendingDelete = false;
    const builder = {
        select(_cols: string) { return builder; },
        eq(col: string, value: string) {
            if (col === 'sender') filterSender = value;
            return builder;
        },
        async maybeSingle() {
            return { data: filterSender ? store.get(filterSender) ?? null : null, error: null };
        },
        async upsert(payload: Omit<PendingRow, 'created_at'>) {
            store.set(payload.sender, { ...payload, created_at: new Date().toISOString() });
            return { data: payload, error: null };
        },
        delete() {
            pendingDelete = true;
            return builder;
        },
        then(onFulfilled: (v: { data: null; error: null }) => void) {
            if (filterSender && pendingDelete) {
                store.delete(filterSender);
                pendingDelete = false;
            }
            onFulfilled({ data: null, error: null });
        },
    };
    return builder;
}

test('createPending writes a row with the right shape', async () => {
    const { client, store } = makeFake();
    const r = await createPending(
        client,
        '+15551234567',
        'gmail.draft',
        { to: 'mom@example.com', body: 'Sounds great' },
        'Want me to send Sounds great to mom@example.com? Reply YES.',
    );
    expect(r.ok).toBe(true);
    const row = store.get('+15551234567');
    expect(row?.action_type).toBe('gmail.draft');
    expect(row?.params).toEqual({ to: 'mom@example.com', body: 'Sounds great' });
    expect(row?.preview_text).toContain('Reply YES');
});

test('createPending overwrites a prior row (latest wins)', async () => {
    const { client, store } = makeFake();
    await createPending(client, '+15551234567', 'gmail.draft', { to: 'a@x.com' }, 'first');
    await createPending(client, '+15551234567', 'calendar.create', { title: '9am sync' }, 'second');
    expect(store.get('+15551234567')?.action_type).toBe('calendar.create');
    expect(store.get('+15551234567')?.preview_text).toBe('second');
});

test('getPending returns null when supabase is null', async () => {
    const r = await getPending(null, '+15551234567');
    expect(r.pending).toBeNull();
});

test('getPending returns the row when fresh', async () => {
    const { client } = makeFake();
    await createPending(client, '+15551234567', 'gmail.draft', { to: 'm@x.com' }, 'preview');
    const r = await getPending(client, '+15551234567');
    expect(r.pending?.action_type).toBe('gmail.draft');
});

test('getPending returns null + deletes the row when expired', async () => {
    const { client, store } = makeFake();
    await createPending(client, '+15551234567', 'gmail.draft', {}, null, undefined, -1000);
    const r = await getPending(client, '+15551234567');
    expect(r.pending).toBeNull();
    expect(store.has('+15551234567')).toBe(false);
});

test('deletePending drops the row', async () => {
    const { client, store } = makeFake();
    await createPending(client, '+15551234567', 'gmail.draft', {}, null);
    const r = await deletePending(client, '+15551234567');
    expect(r.ok).toBe(true);
    expect(store.has('+15551234567')).toBe(false);
});

test('classifyPendingResponse maps YES variants to confirm', () => {
    for (const t of ['yes', 'YES', 'Yes!', 'send it', 'send', 'confirm', 'go', 'do it', 'sure', 'yep', 'yeah']) {
        expect(classifyPendingResponse(t)).toBe('confirm');
    }
});

test('classifyPendingResponse maps NO variants to cancel', () => {
    for (const t of ['no', 'NO', 'cancel', 'stop', 'wait', 'never mind', 'nope']) {
        expect(classifyPendingResponse(t)).toBe('cancel');
    }
});

test('classifyPendingResponse leaves substring matches unclassified', () => {
    expect(classifyPendingResponse('well yes I think so')).toBeNull();
    expect(classifyPendingResponse('please go ahead with that')).toBeNull();
    expect(classifyPendingResponse('I cancelled the other one')).toBeNull();
    expect(classifyPendingResponse('long messages over 32 chars never match this is a real reply')).toBeNull();
});

test('classifyPendingResponse returns null on empty / null input', () => {
    expect(classifyPendingResponse('')).toBeNull();
    expect(classifyPendingResponse('   ')).toBeNull();
    expect(classifyPendingResponse(null)).toBeNull();
    expect(classifyPendingResponse(undefined)).toBeNull();
});
