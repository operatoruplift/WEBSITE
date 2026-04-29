import { test, expect } from '@playwright/test';

/**
 * Unit tests for lib/auditLog.ts — the localStorage-backed audit
 * trail of every tool action taken by agents.
 *
 * Public surface (covered):
 *   getAuditLog(limit)
 *   logAction(category, action, details, agentName?, approved?)
 *   clearAuditLog()
 *   getAuditStats()
 *
 * Not covered (skipped, requires fetch + Anchor mocks):
 *   publishMerkleRoot()
 *   getOnChainRecord()
 *
 * The module is browser-shaped: localStorage + window are required.
 *
 * A regression in the slice(0, MAX_ENTRIES) cap would mean the audit
 * log grows without bound. A regression that swapped the [newest, ...rest]
 * order would mean recent actions appear at the bottom of the audit
 * page. A regression in JSON.parse error handling would crash the
 * audit page on a corrupted localStorage entry.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/auditLog-localStorage.spec.ts --reporter=list
 */

// Static import is safe — module body just declares functions.
// localStorage and window are only touched at function-call time.
import {
    getAuditLog,
    logAction,
    clearAuditLog,
    getAuditStats,
    type AuditEntry,
} from '@/lib/auditLog';

test.describe.configure({ mode: 'serial' });

// Polyfills scoped to this spec's lifetime via beforeAll/afterAll.
// Setting globals at top-level leaks across Playwright workers and
// breaks any other spec that imports lib/auth (Privy throws on
// detected window).
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
    // logAction reads window.localStorage.getItem('token') to gate
    // the server-side POST. We keep token null so the fetch path stays
    // skipped throughout the spec.
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

test.describe('getAuditLog', () => {
    test('returns [] when localStorage is empty', () => {
        expect(getAuditLog()).toEqual([]);
    });

    test('returns [] when stored value is malformed JSON (no crash)', () => {
        store.set('ou-audit-log', '{not valid}');
        expect(getAuditLog()).toEqual([]);
    });

    test('returns entries when present', () => {
        logAction('calendar', 'create', 'Created event "Standup"');
        const log = getAuditLog();
        expect(log).toHaveLength(1);
        expect(log[0].category).toBe('calendar');
        expect(log[0].action).toBe('create');
    });

    test('respects the limit argument (default 100)', () => {
        for (let i = 0; i < 30; i++) {
            logAction('agent', `action-${i}`, '');
        }
        // Default limit is 100, so all 30 returned
        expect(getAuditLog()).toHaveLength(30);
        // Limit smaller than total count slices
        expect(getAuditLog(10)).toHaveLength(10);
        // Limit larger than total count returns all
        expect(getAuditLog(500)).toHaveLength(30);
    });
});

test.describe('logAction', () => {
    test('returns the AuditEntry it just created with id, timestamp, fields populated', () => {
        const entry = logAction('gmail', 'send', 'Sent to alice@example.com');
        expect(entry.id).toMatch(/^audit-/);
        expect(entry.timestamp).toBeTruthy();
        expect(entry.category).toBe('gmail');
        expect(entry.action).toBe('send');
        expect(entry.details).toBe('Sent to alice@example.com');
    });

    test('id is unique across rapid back-to-back calls (random suffix)', () => {
        // Defends against a Date.now()-only id (which collides on
        // same-millisecond calls). lib/auditLog.ts uses a slice(2,6)
        // random suffix, so two adjacent calls should differ.
        const a = logAction('agent', 'a1', 'd');
        const b = logAction('agent', 'a2', 'd');
        const c = logAction('agent', 'a3', 'd');
        expect(new Set([a.id, b.id, c.id]).size).toBe(3);
    });

    test('preserves agentName and approved when provided', () => {
        const entry = logAction('approval', 'gmail.send', 'Approved by user', 'AgentSmith', true);
        expect(entry.agentName).toBe('AgentSmith');
        expect(entry.approved).toBe(true);
    });

    test('agentName and approved are undefined when not provided', () => {
        const entry = logAction('agent', 'fired', '');
        expect(entry.agentName).toBeUndefined();
        expect(entry.approved).toBeUndefined();
    });

    test('newest entries are stored first (top of the array)', () => {
        logAction('agent', 'first-op', '');
        logAction('agent', 'second-op', '');
        const log = getAuditLog();
        expect(log[0].action).toBe('second-op');
        expect(log[1].action).toBe('first-op');
    });

    test('caps the array at 500 entries (oldest are dropped)', () => {
        // Add 510 entries, only newest 500 should remain.
        for (let i = 0; i < 510; i++) {
            logAction('agent', `op-${i}`, '');
        }
        const log = getAuditLog(500);
        expect(log).toHaveLength(500);
        // op-509 is at the top (newest)
        expect(log[0].action).toBe('op-509');
        // op-10 is the oldest of the surviving 500
        expect(log[499].action).toBe('op-10');
    });

    test('writes the entry to localStorage', () => {
        logAction('encryption', 'setup', 'Encryption configured');
        const raw = store.get('ou-audit-log');
        expect(raw).toBeTruthy();
        const parsed: AuditEntry[] = JSON.parse(raw!);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].category).toBe('encryption');
    });

    test('does not POST to /api/audit/log when no auth token is set', () => {
        // window.localStorage.getItem('token') returns null in our
        // polyfill, so the server-side POST branch is skipped.
        // No fetch call should happen during this test — and our spec
        // doesn't mock fetch, so a stray network call would surface as
        // a real outbound request. Run and confirm no throw.
        const before = store.size;
        logAction('agent', 'op', '');
        // Just verify the local write happened (the network call would
        // fire .catch silently, so this is the strongest verification
        // we can do without network monkey-patching).
        expect(store.size).toBeGreaterThan(before);
    });
});

test.describe('clearAuditLog', () => {
    test('removes the localStorage entry', () => {
        logAction('agent', 'op', '');
        expect(store.has('ou-audit-log')).toBe(true);
        clearAuditLog();
        expect(store.has('ou-audit-log')).toBe(false);
    });

    test('getAuditLog returns [] after clearAuditLog', () => {
        logAction('agent', 'op', '');
        clearAuditLog();
        expect(getAuditLog()).toEqual([]);
    });
});

test.describe('getAuditStats', () => {
    test('returns empty object when no entries exist', () => {
        expect(getAuditStats()).toEqual({});
    });

    test('counts entries grouped by category', () => {
        logAction('calendar', 'create', '');
        logAction('calendar', 'update', '');
        logAction('gmail', 'send', '');
        logAction('agent', 'spawn', '');
        const stats = getAuditStats();
        expect(stats.calendar).toBe(2);
        expect(stats.gmail).toBe(1);
        expect(stats.agent).toBe(1);
    });

    test('omits categories with zero entries', () => {
        logAction('calendar', 'create', '');
        const stats = getAuditStats();
        expect('gmail' in stats).toBe(false);
    });
});
