import { test, expect } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createPending } from '@/lib/photon/pending-actions';
import { tryPendingResponse } from '@/lib/photon/pending-replies';

/**
 * Hermetic tests for the dispatch-time YES/NO handler. Reuses the
 * same fake Supabase builder shape as photon-pending-actions.spec.ts
 * so the two test files share assumptions about how rows flow
 * through createPending -> getPending -> deletePending.
 */

interface PendingRow {
    sender: string;
    action_type: string;
    params: Record<string, unknown>;
    preview_text: string | null;
    expires_at: string;
    created_at: string;
}

function makeFake() {
    const store = new Map<string, PendingRow>();
    return {
        store,
        client: {
            from(table: string) {
                if (table === 'imessage_pending_actions') return makeBuilder(store);
                if (table === 'imessage_users') return makeUsersBuilder();
                throw new Error(`unexpected table ${table}`);
            },
        } as unknown as SupabaseClient,
    };
}

// imessage_users lookups in the executor return null for any
// sender, so the bridge reports `sender_not_verified` and the
// confirm path returns the "verify your phone first" hint instead
// of touching real Google APIs.
function makeUsersBuilder() {
    const builder = {
        select(_cols: string) { return builder; },
        eq(_col: string, _value: string) { return builder; },
        async maybeSingle() { return { data: null, error: null }; },
    };
    return builder;
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

test('returns null reply when supabase is null', async () => {
    const r = await tryPendingResponse(null, '+15551234567', 'yes');
    expect(r.replyText).toBeNull();
    expect(r.matched).toBeNull();
    expect(r.consumed).toBe(false);
});

test('returns null reply when text is not a YES/NO keyword', async () => {
    const { client } = makeFake();
    await createPending(client, '+15551234567', 'gmail.draft', { to: 'a@x.com' }, 'preview');
    const r = await tryPendingResponse(client, '+15551234567', 'how are you doing today');
    expect(r.replyText).toBeNull();
    expect(r.matched).toBeNull();
});

test('returns null reply when there is no pending row, even on YES', async () => {
    const { client } = makeFake();
    const r = await tryPendingResponse(client, '+15551234567', 'yes');
    expect(r.replyText).toBeNull();
    expect(r.matched).toBeNull();
});

test('YES on a pending gmail.draft routes through the bridge and consumes the row', async () => {
    const { client, store } = makeFake();
    await createPending(client, '+15551234567', 'gmail.draft', { to: 'mom@example.com', body: 'Sounds great' }, 'Send to mom?');
    const r = await tryPendingResponse(client, '+15551234567', 'yes');
    expect(r.matched).toBe('confirm');
    expect(r.consumed).toBe(true);
    // The fake imessage_users returns null, so the bridge reports
    // sender_not_verified and the executor surfaces that hint.
    expect(r.replyText).toContain('verify your phone');
    expect(store.has('+15551234567')).toBe(false);
});

test('YES on a pending calendar.create still falls back to the connector hint', async () => {
    const { client } = makeFake();
    await createPending(client, '+15551234567', 'calendar.create', { title: '9am sync' }, 'Create event?');
    const r = await tryPendingResponse(client, '+15551234567', 'send it');
    expect(r.matched).toBe('confirm');
    // calendar.create handler isn't wired yet; falls back to the
    // describeAction/connectorHint copy.
    expect(r.replyText).toContain('create that calendar event');
});

test('NO on a pending row cancels and clears the row', async () => {
    const { client, store } = makeFake();
    await createPending(client, '+15551234567', 'gmail.draft', { to: 'a@x.com' }, 'preview');
    const r = await tryPendingResponse(client, '+15551234567', 'cancel');
    expect(r.matched).toBe('cancel');
    expect(r.consumed).toBe(true);
    expect(r.replyText).toBe('Cancelled. Anything else?');
    expect(store.has('+15551234567')).toBe(false);
});

test('substring "yes" inside a longer message is NOT consumed', async () => {
    const { client, store } = makeFake();
    await createPending(client, '+15551234567', 'gmail.draft', { to: 'a@x.com' }, 'preview');
    const r = await tryPendingResponse(client, '+15551234567', 'well yes I think we should reschedule');
    expect(r.replyText).toBeNull();
    expect(r.matched).toBeNull();
    expect(store.has('+15551234567')).toBe(true);
});

test('YES does not pay for a Supabase round-trip when text is not a decision', async () => {
    let getCalls = 0;
    const trackedClient = {
        from(table: string) {
            getCalls += 1;
            if (table !== 'imessage_pending_actions') throw new Error(`unexpected table ${table}`);
            return makeBuilder(new Map());
        },
    } as unknown as SupabaseClient;
    await tryPendingResponse(trackedClient, '+15551234567', 'this is just chat');
    expect(getCalls).toBe(0);
});
