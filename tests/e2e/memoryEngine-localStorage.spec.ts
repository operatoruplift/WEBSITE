import { test, expect } from '@playwright/test';

/**
 * Unit tests for lib/memoryEngine.ts — the localStorage cache layer
 * of the 3-layer memory architecture (Supabase → localStorage → search).
 *
 * Public surface (covered):
 *   getMemoryIndex / getAllEntries
 *   addMemory / getMemory / updateMemory / deleteMemory
 *   searchMemory
 *   consolidateMemory
 *   buildMemoryContext
 *   MEMORY_TYPES (data contract)
 *
 * Not covered (requires fetch + Supabase mocks):
 *   syncMemory (network sync)
 *
 * The Supabase save/fetch/delete helpers in this module are
 * fire-and-forget with try/catch swallowing all failures. So in tests
 * without a fetch mock, the local cache layer remains intact and the
 * network failures are silent — exactly how the module is designed to
 * behave in any cold-cache state.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/memoryEngine-localStorage.spec.ts --reporter=list
 */

// Static import is safe — module body only declares functions.
import {
    getAllEntries,
    getMemoryIndex,
    addMemory,
    getMemory,
    updateMemory,
    deleteMemory,
    searchMemory,
    consolidateMemory,
    buildMemoryContext,
    MEMORY_TYPES,
} from '@/lib/memoryEngine';

test.describe.configure({ mode: 'serial' });

// Polyfills + fetch stub scoped to spec lifetime via beforeAll/afterAll.
// Top-level globalThis assignments leak across Playwright workers and
// break specs that import @privy-io/server-auth in the same process.
const store = new Map<string, string>();
let savedLocalStorage: unknown;
let savedFetch: typeof fetch;

test.beforeAll(() => {
    const g = globalThis as unknown as Record<string, unknown>;
    savedLocalStorage = g.localStorage;
    savedFetch = global.fetch;
    g.localStorage = {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => { store.set(k, String(v)); },
        removeItem: (k: string) => { store.delete(k); },
        clear: () => { store.clear(); },
        key: (i: number) => Array.from(store.keys())[i] ?? null,
        get length() { return store.size; },
    } satisfies Storage;
    // Stub fetch so saveToSupabase fire-and-forget calls don't fire real
    // network. Resolve with 200 so the catch arm doesn't swallow.
    global.fetch = (async () => new Response('{"entries":[]}', { status: 200 })) as typeof fetch;
});

test.afterAll(() => {
    const g = globalThis as unknown as Record<string, unknown>;
    if (savedLocalStorage === undefined) delete g.localStorage;
    else g.localStorage = savedLocalStorage;
    global.fetch = savedFetch;
});

test.beforeEach(() => {
    store.clear();
});

test.describe('getAllEntries / getMemoryIndex', () => {
    test('returns [] when nothing is cached', () => {
        expect(getAllEntries()).toEqual([]);
    });

    test('returns [] when cache is malformed JSON', () => {
        store.set('ou-memory-cache', '{not valid}');
        expect(getAllEntries()).toEqual([]);
    });

    test('getMemoryIndex returns version + entries (id/name/desc/type) + lastConsolidated', () => {
        addMemory({ name: 'test', description: 'd', type: 'user', content: 'c', tags: [] });
        const index = getMemoryIndex();
        expect(index.version).toBe(1);
        expect(index.entries).toHaveLength(1);
        expect(index.entries[0]).toHaveProperty('id');
        expect(index.entries[0]).toHaveProperty('name');
        expect(index.entries[0]).toHaveProperty('description');
        expect(index.entries[0]).toHaveProperty('type');
        expect(index.lastConsolidated).toBeTruthy();
    });
});

test.describe('addMemory', () => {
    test('returns the entry with id, createdAt, updatedAt populated', () => {
        const entry = addMemory({
            name: 'preferences',
            description: 'user prefers dark mode',
            type: 'user',
            content: 'Always use dark theme.',
            tags: ['ui', 'preferences'],
        });
        expect(entry.id).toMatch(/^mem-/);
        expect(entry.createdAt).toBeTruthy();
        expect(entry.updatedAt).toBe(entry.createdAt);
        expect(entry.accessCount).toBe(0);
        expect(entry.lastAccessed).toBe(entry.createdAt);
    });

    test('id is unique across rapid back-to-back calls (random suffix)', () => {
        const a = addMemory({ name: 'a', description: 'a', type: 'user', content: '', tags: [] });
        const b = addMemory({ name: 'b', description: 'b', type: 'user', content: '', tags: [] });
        const c = addMemory({ name: 'c', description: 'c', type: 'user', content: '', tags: [] });
        expect(new Set([a.id, b.id, c.id]).size).toBe(3);
    });

    test('newest entries are stored first via unshift', () => {
        addMemory({ name: 'first', description: '', type: 'user', content: '', tags: [] });
        addMemory({ name: 'second', description: '', type: 'user', content: '', tags: [] });
        const all = getAllEntries();
        expect(all[0].name).toBe('second');
        expect(all[1].name).toBe('first');
    });
});

test.describe('getMemory', () => {
    test('returns null when id does not exist', () => {
        expect(getMemory('nope')).toBeNull();
    });

    test('returns the entry and increments accessCount + updates lastAccessed', () => {
        const created = addMemory({ name: 'foo', description: '', type: 'user', content: '', tags: [] });
        expect(created.accessCount).toBe(0);

        const fetched = getMemory(created.id);
        expect(fetched).toBeTruthy();
        expect(fetched?.accessCount).toBe(1);

        const fetched2 = getMemory(created.id);
        expect(fetched2?.accessCount).toBe(2);
    });
});

test.describe('updateMemory', () => {
    test('returns null when id does not exist', () => {
        expect(updateMemory('nope', { name: 'x' })).toBeNull();
    });

    test('merges partial updates and updates updatedAt timestamp', async () => {
        const created = addMemory({ name: 'old', description: 'old desc', type: 'user', content: '', tags: ['a'] });
        // Sleep 1ms so the new timestamp differs from createdAt
        await new Promise(r => setTimeout(r, 5));

        const updated = updateMemory(created.id, { name: 'new', tags: ['b', 'c'] });
        expect(updated?.name).toBe('new');
        expect(updated?.description).toBe('old desc'); // preserved
        expect(updated?.tags).toEqual(['b', 'c']);
        expect(updated?.updatedAt).not.toBe(created.updatedAt);
    });
});

test.describe('deleteMemory', () => {
    test('returns false when id does not exist', () => {
        expect(deleteMemory('nope')).toBe(false);
    });

    test('returns true and removes the entry', () => {
        const created = addMemory({ name: 'doomed', description: '', type: 'user', content: '', tags: [] });
        expect(deleteMemory(created.id)).toBe(true);
        expect(getMemory(created.id)).toBeNull();
    });
});

test.describe('searchMemory', () => {
    test('matches name, description, content, or tags (case-insensitive)', () => {
        addMemory({ name: 'Banana split', description: 'dessert', type: 'user', content: '', tags: [] });
        addMemory({ name: 'apple', description: '', type: 'user', content: 'with banana puree', tags: [] });
        addMemory({ name: 'cherry', description: '', type: 'user', content: '', tags: ['fruit', 'banana'] });
        addMemory({ name: 'dog', description: '', type: 'user', content: '', tags: ['pet'] });

        const hits = searchMemory('BANANA');
        expect(hits).toHaveLength(3);
        // dog is excluded
        expect(hits.find(e => e.name === 'dog')).toBeUndefined();
    });

    test('returns [] for a no-match query', () => {
        addMemory({ name: 'foo', description: '', type: 'user', content: '', tags: [] });
        expect(searchMemory('nonexistent')).toHaveLength(0);
    });

    test('sorts results by accessCount descending', () => {
        const a = addMemory({ name: 'apple', description: '', type: 'user', content: '', tags: [] });
        const b = addMemory({ name: 'apple core', description: '', type: 'user', content: '', tags: [] });
        const c = addMemory({ name: 'apple seed', description: '', type: 'user', content: '', tags: [] });

        // Bump access counts asymmetrically: c=2, a=1, b=0
        getMemory(c.id); getMemory(c.id);
        getMemory(a.id);

        const hits = searchMemory('apple');
        expect(hits.map(h => h.name)).toEqual(['apple seed', 'apple', 'apple core']);
    });
});

test.describe('consolidateMemory', () => {
    test('merges duplicates with the same (type, name) key', () => {
        addMemory({ name: 'pref', description: 'short', type: 'user', content: 'short content', tags: ['a'] });
        addMemory({ name: 'PREF', description: 'longer', type: 'user', content: 'long content here', tags: ['b', 'a'] });
        addMemory({ name: 'pref', description: 'desc3', type: 'user', content: 'short again', tags: ['c'] });

        const result = consolidateMemory();
        expect(result.merged).toBe(2);

        const all = getAllEntries();
        const prefs = all.filter(e => e.name.toLowerCase() === 'pref');
        expect(prefs).toHaveLength(1);
        // Tags from all duplicates merged + de-duplicated
        expect(prefs[0].tags.sort()).toEqual(['a', 'b', 'c']);
        // Longest content wins
        expect(prefs[0].content).toBe('long content here');
    });

    test('removes entries older than 30 days with low access count', () => {
        // Add then mutate the cached entry to fake an old lastAccessed.
        const a = addMemory({ name: 'old', description: '', type: 'user', content: '', tags: [] });
        const b = addMemory({ name: 'fresh', description: '', type: 'user', content: '', tags: [] });

        const cached = getAllEntries();
        const aOld = cached.find(e => e.id === a.id)!;
        aOld.lastAccessed = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
        aOld.accessCount = 0;
        store.set('ou-memory-cache', JSON.stringify(cached));

        const result = consolidateMemory();
        expect(result.removed).toBe(1);

        const survivors = getAllEntries();
        expect(survivors.map(e => e.id)).toEqual([b.id]);
    });

    test('keeps high-access old entries (accessCount > 5)', () => {
        const a = addMemory({ name: 'evergreen', description: '', type: 'user', content: '', tags: [] });
        const cached = getAllEntries();
        const aOld = cached.find(e => e.id === a.id)!;
        aOld.lastAccessed = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
        aOld.accessCount = 50;
        store.set('ou-memory-cache', JSON.stringify(cached));

        const result = consolidateMemory();
        expect(result.removed).toBe(0);
        expect(getAllEntries()).toHaveLength(1);
    });
});

test.describe('buildMemoryContext', () => {
    test('returns empty string when no entries exist', () => {
        expect(buildMemoryContext()).toBe('');
    });

    test('returns formatted block with up to 10 entries when no query given', () => {
        for (let i = 0; i < 12; i++) {
            addMemory({ name: `m${i}`, description: `d${i}`, type: 'user', content: '', tags: [] });
        }
        const ctx = buildMemoryContext();
        expect(ctx).toContain('--- Memory Context ---');
        expect(ctx).toContain('--- End Memory ---');
        // 10 entries (cap), one per line, prefixed [type]
        const matches = ctx.match(/\[user\]/g) ?? [];
        expect(matches.length).toBe(10);
    });

    test('with query, uses searchMemory and returns up to 10 matches', () => {
        addMemory({ name: 'apple', description: '', type: 'user', content: '', tags: [] });
        addMemory({ name: 'orange', description: '', type: 'user', content: '', tags: [] });
        const ctx = buildMemoryContext('apple');
        expect(ctx).toContain('apple');
        expect(ctx).not.toContain('orange');
    });

    test('returns empty string when query has no matches', () => {
        addMemory({ name: 'apple', description: '', type: 'user', content: '', tags: [] });
        expect(buildMemoryContext('zebra')).toBe('');
    });
});

test.describe('MEMORY_TYPES (data contract)', () => {
    test('exposes the 5 documented type ids', () => {
        const ids = MEMORY_TYPES.map(t => t.id).sort();
        expect(ids).toEqual(['agent', 'feedback', 'project', 'reference', 'user']);
    });

    test('every entry has id + label + description', () => {
        for (const t of MEMORY_TYPES) {
            expect(t.id).toBeTruthy();
            expect(t.label).toBeTruthy();
            expect(t.description).toBeTruthy();
        }
    });
});
