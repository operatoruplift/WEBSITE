import { test, expect } from '@playwright/test';

/**
 * Unit tests for lib/notifications.ts — the localStorage-backed
 * in-app notification CRUD layer.
 *
 * Public surface:
 *   getNotifications()
 *   addNotification({ type, title, message, icon, color })
 *   markNotificationRead(id)
 *   markAllRead()
 *   deleteNotification(id)
 *   getUnreadCount()
 *
 * The module is browser-shaped: it reads/writes localStorage and
 * dispatches a 'notification' CustomEvent to window.
 *
 * IMPORTANT: polyfills are scoped to beforeAll/afterAll, NOT set at
 * top-level. Setting globalThis.window at module-load time made other
 * spec files (auth-diagnoseJws, capabilities-hasServerLLMKey) load
 * @privy-io/server-auth in the same Playwright worker and throw
 * "cannot be used in a browser environment" because Privy's library
 * checks `typeof window !== 'undefined'`. Cleanup in afterAll restores
 * the original globals so subsequent specs in the same worker see
 * server-shaped globals.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/notifications-localStorage.spec.ts --reporter=list
 */

import {
    getNotifications,
    addNotification,
    markNotificationRead,
    markAllRead,
    deleteNotification,
    getUnreadCount,
} from '@/lib/notifications';

test.describe.configure({ mode: 'serial' });

const store = new Map<string, string>();
const dispatched: CustomEvent[] = [];
let savedLocalStorage: unknown;
let savedWindow: unknown;
let savedCustomEvent: unknown;

function installPolyfills() {
    const g = globalThis as unknown as Record<string, unknown>;
    savedLocalStorage = g.localStorage;
    savedWindow = g.window;
    savedCustomEvent = g.CustomEvent;

    g.localStorage = {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => { store.set(k, String(v)); },
        removeItem: (k: string) => { store.delete(k); },
        clear: () => { store.clear(); },
        key: (i: number) => Array.from(store.keys())[i] ?? null,
        get length() { return store.size; },
    } satisfies Storage;

    g.window = {
        dispatchEvent: (e: CustomEvent) => {
            dispatched.push(e);
            return true;
        },
    };

    if (typeof savedCustomEvent === 'undefined') {
        class CustomEventPolyfill<T = unknown> extends Event {
            detail: T;
            constructor(type: string, init?: { detail?: T }) {
                super(type);
                this.detail = init?.detail as T;
            }
        }
        g.CustomEvent = CustomEventPolyfill;
    }
}

function restorePolyfills() {
    const g = globalThis as unknown as Record<string, unknown>;
    if (savedLocalStorage === undefined) delete g.localStorage;
    else g.localStorage = savedLocalStorage;
    if (savedWindow === undefined) delete g.window;
    else g.window = savedWindow;
    if (savedCustomEvent === undefined) delete g.CustomEvent;
    else g.CustomEvent = savedCustomEvent;
}

test.beforeAll(() => {
    installPolyfills();
});

test.afterAll(() => {
    restorePolyfills();
});

test.beforeEach(() => {
    store.clear();
    dispatched.length = 0;
});

test.describe('getNotifications', () => {
    test('returns [] when localStorage is empty', () => {
        expect(getNotifications()).toEqual([]);
    });

    test('returns [] when stored value is malformed JSON', () => {
        store.set('ou-notifications', '{not json}');
        expect(getNotifications()).toEqual([]);
    });

    test('returns notifications when present', () => {
        addNotification({
            type: 'tool',
            title: 'Calendar updated',
            message: 'Event created',
            icon: 'calendar',
            color: 'blue',
        });
        const list = getNotifications();
        expect(list).toHaveLength(1);
        expect(list[0].title).toBe('Calendar updated');
    });
});

test.describe('addNotification', () => {
    test('returns the newly-created entry with id, time, read fields populated', () => {
        const created = addNotification({
            type: 'tool',
            title: 'Calendar updated',
            message: 'Event X scheduled',
            icon: 'calendar',
            color: 'blue',
        });
        expect(created.id).toBeTruthy();
        expect(created.time).toBe('Just now');
        expect(created.read).toBe(false);
        expect(created.title).toBe('Calendar updated');
    });

    test('persists to localStorage so getNotifications can read it back', () => {
        addNotification({ type: 't', title: 'A', message: 'b', icon: 'x', color: 'y' });
        expect(JSON.parse(store.get('ou-notifications')!)).toHaveLength(1);
    });

    test('dispatches a "notification" CustomEvent with the new entry as detail', () => {
        const created = addNotification({ type: 't', title: 'A', message: 'b', icon: 'x', color: 'y' });
        expect(dispatched).toHaveLength(1);
        expect(dispatched[0].type).toBe('notification');
        expect((dispatched[0] as CustomEvent).detail).toEqual(created);
    });

    test('newest entries are stored first (top of array)', () => {
        addNotification({ type: 't', title: 'first', message: 'a', icon: 'x', color: 'y' });
        addNotification({ type: 't', title: 'second', message: 'b', icon: 'x', color: 'y' });
        const list = getNotifications();
        expect(list[0].title).toBe('second');
        expect(list[1].title).toBe('first');
    });

    test('caps the array at 50 entries (oldest are dropped)', () => {
        for (let i = 0; i < 60; i++) {
            addNotification({ type: 't', title: `n${i}`, message: '', icon: 'x', color: 'y' });
        }
        const list = getNotifications();
        expect(list).toHaveLength(50);
        expect(list[0].title).toBe('n59');
        expect(list[49].title).toBe('n10');
    });
});

test.describe('markNotificationRead / markAllRead', () => {
    test('markNotificationRead flips a single entry to read:true', () => {
        const a = addNotification({ type: 't', title: 'A', message: '', icon: 'x', color: 'y' });
        const b = addNotification({ type: 't', title: 'B', message: '', icon: 'x', color: 'y' });
        markNotificationRead(a.id);
        const list = getNotifications();
        const updatedA = list.find(n => n.id === a.id);
        const updatedB = list.find(n => n.id === b.id);
        expect(updatedA?.read).toBe(true);
        expect(updatedB?.read).toBe(false);
    });

    test('markAllRead flips every entry to read:true', () => {
        addNotification({ type: 't', title: 'A', message: '', icon: 'x', color: 'y' });
        addNotification({ type: 't', title: 'B', message: '', icon: 'x', color: 'y' });
        markAllRead();
        const list = getNotifications();
        for (const n of list) expect(n.read).toBe(true);
    });
});

test.describe('deleteNotification', () => {
    test('removes the matching entry by id', () => {
        const a = addNotification({ type: 't', title: 'A', message: '', icon: 'x', color: 'y' });
        const b = addNotification({ type: 't', title: 'B', message: '', icon: 'x', color: 'y' });
        deleteNotification(a.id);
        const list = getNotifications();
        expect(list).toHaveLength(1);
        expect(list[0].id).toBe(b.id);
    });

    test('is a no-op when id does not exist', () => {
        addNotification({ type: 't', title: 'A', message: '', icon: 'x', color: 'y' });
        deleteNotification('does-not-exist');
        expect(getNotifications()).toHaveLength(1);
    });
});

test.describe('getUnreadCount', () => {
    test('returns 0 when no notifications exist', () => {
        expect(getUnreadCount()).toBe(0);
    });

    test('counts unread entries only', () => {
        const a = addNotification({ type: 't', title: 'A', message: '', icon: 'x', color: 'y' });
        addNotification({ type: 't', title: 'B', message: '', icon: 'x', color: 'y' });
        addNotification({ type: 't', title: 'C', message: '', icon: 'x', color: 'y' });
        markNotificationRead(a.id);
        expect(getUnreadCount()).toBe(2);
    });

    test('returns 0 after markAllRead', () => {
        addNotification({ type: 't', title: 'A', message: '', icon: 'x', color: 'y' });
        addNotification({ type: 't', title: 'B', message: '', icon: 'x', color: 'y' });
        markAllRead();
        expect(getUnreadCount()).toBe(0);
    });
});
