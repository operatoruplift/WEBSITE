import { test, expect } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getGoogleClientForSender } from '@/lib/photon/google-bridge';

/**
 * Hermetic tests for the iMessage -> Google bridge.
 *
 * The bridge only touches Google when both the imessage_users row
 * exists AND user_integrations.google has a refresh token. We mock
 * Supabase at both tables, so the test never actually calls the
 * Google OAuth API. The auth refresh path is harder to hermeticize
 * (it would require stubbing googleapis), so this suite focuses on
 * the four typed failure reasons + the supabase-null guard. The
 * happy path is covered by integration tests at deploy time.
 */

// Index-signature compatible row shapes so makeRowBuilder<T extends
// Record<string, unknown>> below accepts UserRow[] and IntegrationRow[]
// arguments (the builder indexes rows by arbitrary column name).
interface UserRow extends Record<string, unknown> {
    sender: string;
    privy_user_id: string | null;
    verified_at: string | null;
}

interface IntegrationRow extends Record<string, unknown> {
    user_id: string;
    provider: string;
    refresh_token: string | null;
}

interface FakeOptions {
    users?: UserRow[];
    integrations?: IntegrationRow[];
}

function makeFake(opts: FakeOptions = {}) {
    const users = opts.users ?? [];
    const integrations = opts.integrations ?? [];
    const client = {
        from(table: string) {
            if (table === 'imessage_users') return makeRowBuilder(users, 'sender');
            if (table === 'user_integrations') return makeRowBuilder(integrations, 'user_id');
            throw new Error(`unexpected table ${table}`);
        },
    } as unknown as SupabaseClient;
    return { client, users, integrations };
}

function makeRowBuilder<T extends Record<string, unknown>>(rows: T[], pk: keyof T) {
    const filters = new Map<string, unknown>();
    const builder = {
        select(_cols: string) { return builder; },
        eq(col: string, value: unknown) {
            filters.set(col, value);
            return builder;
        },
        async maybeSingle() {
            const found = rows.find(r => Array.from(filters.entries()).every(([c, v]) => r[c] === v));
            return { data: found ?? null, error: null };
        },
        async single() {
            const found = rows.find(r => Array.from(filters.entries()).every(([c, v]) => r[c] === v));
            return found
                ? { data: found, error: null }
                : { data: null, error: { message: 'No rows', code: 'PGRST116' } };
        },
    };
    return builder;
}

test('returns no_supabase failure when supabase is null', async () => {
    const r = await getGoogleClientForSender(null, '+15551234567');
    expect(r.ok).toBe(false);
    if (!r.ok) {
        expect(r.reason).toBe('no_supabase');
        expect(r.iMessageHint).toContain('connectivity');
    }
});

test('returns sender_not_verified when imessage_users has no row', async () => {
    const { client } = makeFake();
    const r = await getGoogleClientForSender(client, '+15551234567');
    expect(r.ok).toBe(false);
    if (!r.ok) {
        expect(r.reason).toBe('sender_not_verified');
        expect(r.iMessageHint).toContain('/integrations');
    }
});

test('returns sender_not_verified when row exists but verified_at is null', async () => {
    const { client } = makeFake({
        users: [{ sender: '+15551234567', privy_user_id: 'did:privy:abc', verified_at: null }],
    });
    const r = await getGoogleClientForSender(client, '+15551234567');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('sender_not_verified');
});

test('returns google_not_connected when verified user has no Google integration', async () => {
    const { client } = makeFake({
        users: [{ sender: '+15551234567', privy_user_id: 'did:privy:abc', verified_at: new Date().toISOString() }],
        integrations: [],
    });
    const r = await getGoogleClientForSender(client, '+15551234567');
    expect(r.ok).toBe(false);
    if (!r.ok) {
        expect(r.reason).toBe('google_not_connected');
        expect(r.iMessageHint).toContain('Google isn');
    }
});

test('iMessageHint copy is stable across reasons', async () => {
    // Catch accidental copy churn that could break downstream UI.
    const r = await getGoogleClientForSender(null, '+15551234567');
    expect(r.ok).toBe(false);
    if (!r.ok) {
        expect(r.iMessageHint.length).toBeGreaterThan(10);
        expect(r.iMessageHint.length).toBeLessThan(300);
    }
});
