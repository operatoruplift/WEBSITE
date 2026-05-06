import { test, expect } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { generateCode, hashCode, issueCode, confirmCode, MAX_ATTEMPTS, CODE_LENGTH } from '@/lib/photon/verify-codes';

/**
 * Unit tests for the 6-digit verification helpers used by
 * /api/integrations/imessage/start and /confirm.
 *
 * Hermetic: a fake Supabase client lets us assert the exact query
 * shape (eq sender, upsert onConflict, delete on success, increment
 * attempts on mismatch) without touching the real database.
 */

interface VerificationRow {
    sender: string;
    code_hash: string;
    expires_at: string;
    pending_for: string;
    attempts: number;
}

function makeFake(initial: VerificationRow[] = []) {
    const store = new Map<string, VerificationRow>();
    for (const r of initial) store.set(r.sender, r);
    return {
        store,
        client: {
            from(table: string) {
                if (table !== 'imessage_verifications') throw new Error(`unexpected table ${table}`);
                return makeBuilder(store);
            },
        } as unknown as SupabaseClient,
    };
}

function makeBuilder(store: Map<string, VerificationRow>) {
    let filterSender: string | null = null;
    let updatePatch: Partial<VerificationRow> | null = null;
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
        async upsert(payload: VerificationRow) {
            store.set(payload.sender, payload);
            return { data: payload, error: null };
        },
        update(patch: Partial<VerificationRow>) {
            updatePatch = patch;
            return builder;
        },
        delete() {
            pendingDelete = true;
            return builder;
        },
        // Terminal: applies any queued mutation (delete or update)
        // when the chain is awaited.
        then(onFulfilled: (v: { data: null; error: null }) => void) {
            if (filterSender) {
                if (pendingDelete) {
                    store.delete(filterSender);
                    pendingDelete = false;
                } else if (updatePatch) {
                    const existing = store.get(filterSender);
                    if (existing) store.set(filterSender, { ...existing, ...updatePatch });
                    updatePatch = null;
                }
            }
            onFulfilled({ data: null, error: null });
        },
    };
    return builder;
}

test('generateCode is 6-digit string with leading zeros possible', () => {
    for (let i = 0; i < 200; i++) {
        const c = generateCode();
        expect(c).toMatch(/^\d{6}$/);
        expect(c.length).toBe(CODE_LENGTH);
    }
});

test('hashCode is deterministic + sensitive to single-digit changes', () => {
    expect(hashCode('123456')).toBe(hashCode('123456'));
    expect(hashCode('123456')).not.toBe(hashCode('123457'));
    // SHA-256 hex output is 64 chars
    expect(hashCode('any').length).toBe(64);
});

test('issueCode upserts a row + returns the plaintext code', async () => {
    const { client, store } = makeFake();
    const r = await issueCode(client, '+15551234567', 'privy:user-123');
    expect(r.ok).toBe(true);
    expect(r.code).toMatch(/^\d{6}$/);
    const row = store.get('+15551234567');
    expect(row).toBeTruthy();
    expect(row?.code_hash).toBe(hashCode(r.code!));
    expect(row?.pending_for).toBe('privy:user-123');
    expect(row?.attempts).toBe(0);
});

test('issueCode returns ok:false on null supabase', async () => {
    const r = await issueCode(null, '+15551234567', 'privy:user');
    expect(r.ok).toBe(false);
    expect(r.code).toBeNull();
});

test('confirmCode succeeds + deletes the row on the right code', async () => {
    const { client, store } = makeFake();
    const issued = await issueCode(client, '+15551234567', 'privy:user-123');
    expect(issued.code).toBeTruthy();
    const r = await confirmCode(client, '+15551234567', issued.code!, 'privy:user-123');
    expect(r.ok).toBe(true);
    expect(store.has('+15551234567')).toBe(false);
});

test('confirmCode returns no_pending when there is no row', async () => {
    const { client } = makeFake();
    const r = await confirmCode(client, '+15551234567', '000000', 'privy:user-123');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('no_pending');
});

test('confirmCode returns wrong_user when a different signed-in user tries', async () => {
    const { client } = makeFake();
    const issued = await issueCode(client, '+15551234567', 'privy:user-A');
    const r = await confirmCode(client, '+15551234567', issued.code!, 'privy:user-B');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('wrong_user');
});

test('confirmCode returns mismatch + increments attempts', async () => {
    const { client, store } = makeFake();
    await issueCode(client, '+15551234567', 'privy:user-123');
    const r = await confirmCode(client, '+15551234567', '999999', 'privy:user-123');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('mismatch');
    expect(store.get('+15551234567')?.attempts).toBe(1);
});

test('confirmCode returns too_many_attempts after MAX_ATTEMPTS wrong tries', async () => {
    const { client, store } = makeFake();
    await issueCode(client, '+15551234567', 'privy:user-123');
    // Force attempts to MAX_ATTEMPTS to bypass the increment loop.
    const row = store.get('+15551234567')!;
    store.set('+15551234567', { ...row, attempts: MAX_ATTEMPTS });
    const r = await confirmCode(client, '+15551234567', '000000', 'privy:user-123');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('too_many_attempts');
});

test('confirmCode returns expired + deletes the row when past expires_at', async () => {
    const { client, store } = makeFake();
    await issueCode(client, '+15551234567', 'privy:user-123');
    const row = store.get('+15551234567')!;
    store.set('+15551234567', {
        ...row,
        expires_at: new Date(Date.now() - 1000).toISOString(),
    });
    const r = await confirmCode(client, '+15551234567', '000000', 'privy:user-123');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('expired');
    expect(store.has('+15551234567')).toBe(false);
});
