import { test, expect } from '@playwright/test';

/**
 * Unit tests for getOnChainRecord in lib/auditLog.ts.
 *
 * The Security page renders the latest on-chain Merkle-root publish
 * via this getter. A regression in:
 *   - JSON.parse error guard → page crashes on a corrupted entry
 *   - missing-key default     → page shows "no record" when one exists
 *
 * This complements tests/e2e/auditLog-localStorage.spec.ts which
 * covers the rest of the lib's CRUD surface.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/auditLog-getOnChainRecord.spec.ts --reporter=list
 */

import { getOnChainRecord } from '@/lib/auditLog';

test.describe.configure({ mode: 'serial' });

const store = new Map<string, string>();
let savedLocalStorage: unknown;
let savedWindow: unknown;

test.beforeAll(() => {
    const g = globalThis as unknown as Record<string, unknown>;
    savedLocalStorage = g.localStorage;
    savedWindow = g.window;
    const localStorageStub: Storage = {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => { store.set(k, String(v)); },
        removeItem: (k: string) => { store.delete(k); },
        clear: () => { store.clear(); },
        key: (i: number) => Array.from(store.keys())[i] ?? null,
        get length() { return store.size; },
    };
    g.localStorage = localStorageStub;
    g.window = { localStorage: localStorageStub };
});

test.afterAll(() => {
    const g = globalThis as unknown as Record<string, unknown>;
    if (savedLocalStorage === undefined) delete g.localStorage;
    else g.localStorage = savedLocalStorage;
    if (savedWindow === undefined) delete g.window;
    else g.window = savedWindow;
});

test.beforeEach(() => {
    store.clear();
});

test.describe('getOnChainRecord', () => {
    test('returns null when localStorage has no entry', () => {
        expect(getOnChainRecord()).toBeNull();
    });

    test('returns null when stored value is malformed JSON', () => {
        store.set('ou-audit-on-chain', '{not json}');
        // Per the contract, JSON.parse failure returns null without
        // crashing the security page.
        expect(getOnChainRecord()).toBeNull();
    });

    test('returns the parsed record when valid JSON is stored', () => {
        const record = {
            merkleRoot: '0x' + 'a'.repeat(64),
            txSignature: 'sig-abc-123',
            explorerUrl: 'https://solscan.io/tx/sig-abc-123?cluster=devnet',
            actionCount: 7,
            publishedAt: '2026-04-30T00:00:00Z',
        };
        store.set('ou-audit-on-chain', JSON.stringify(record));
        const result = getOnChainRecord();
        expect(result).toEqual(record);
    });

    test('returns the parsed record even with extra fields (forward-compat)', () => {
        // A future server-side update might add new fields. The getter
        // shouldn't drop them or crash — JSON.parse is permissive.
        const record = {
            merkleRoot: '0xdeadbeef',
            txSignature: 'sig',
            explorerUrl: 'https://example.com',
            actionCount: 1,
            publishedAt: '2026-04-30T00:00:00Z',
            futureField: 'unknown',
        };
        store.set('ou-audit-on-chain', JSON.stringify(record));
        const result = getOnChainRecord() as Record<string, unknown>;
        expect(result?.futureField).toBe('unknown');
    });

    test('returns null when stored value is empty string', () => {
        store.set('ou-audit-on-chain', '');
        // Empty string falsy guard returns null without parsing.
        expect(getOnChainRecord()).toBeNull();
    });
});
