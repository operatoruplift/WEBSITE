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
 * dispatches a 'notification' CustomEvent to window. We polyfill
 * both before importing the module.
 *
 * A regression in addNotification's slice(0, 50) cap would mean
 * the user's notifications array grows unbounded. A regression in
 * markAllRead would mean the badge count never clears.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/notifications-localStorage.spec.ts --reporter=list
 */

// localStorage polyfill (shared per worker)
const store = new Map<string, string>();
const localStorageStub: Storage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => { store.clear(); },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
};
(globalThis as unknown as { localStorage: Storage }).localStorage = localStorageStub;

// window polyfill: addNotification dispatches a CustomEvent. We don't
// actually need to listen to it for these tests, but the stub must
// exist so `window.dispatchEvent` doesn't throw.
const dispatched: CustomEvent[] = [];
(globalThis as unknown as { window: { dispatchEvent: (e: CustomEvent) => boolean } }).window = {
    dispatchEvent: (e: CustomEvent) => {
        dispatched.push(e);
        return true;
    },
};
// Polyfill CustomEvent constructor for node (it exists in Node 18+ but
// is sometimes missing in test workers).
if (typeof globalThis.CustomEvent === 'undefined') {
    class CustomEventPolyfill<T = unknown> extends Event {
        detail: T;
        constructor(type: string, init?: { detail?: T }) {
            super(type);
            this.detail = init?.detail as T;
        }
    }
    (globalThis as unknown as { CustomEvent: typeof CustomEvent }).CustomEvent = CustomEventPolyfill as unknown as typeof CustomEvent;
}

import {
    getNotifications,
    addNotification,
    markNotificationRead,
    markAllRead,
    deleteNotification,
    getUnreadCount,
} from '@/lib/notifications';

test.describe.configure({ mode: 'serial' });

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
        // Per the contract, JSON.parse failure is caught and returns [].
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
        // Add 60 notifications; only the newest 50 should remain.
        for (let i = 0; i < 60; i++) {
            addNotification({ type: 't', title: `n${i}`, message: '', icon: 'x', color: 'y' });
        }
        const list = getNotifications();
        expect(list).toHaveLength(50);
        // The freshest one (n59) is at the top.
        expect(list[0].title).toBe('n59');
        // n9 is the oldest of the surviving 50 (n10..n59 and the
        // newest, n59, kept at index 0). The 10 oldest (n0..n9) are
        // dropped.
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
