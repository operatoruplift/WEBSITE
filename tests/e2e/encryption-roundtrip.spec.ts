import { test, expect } from '@playwright/test';

/**
 * Unit tests for lib/encryption.ts — AES-256-GCM round-trip + PBKDF2
 * key derivation against the Web Crypto API.
 *
 * The module is browser-shaped (uses globalThis.localStorage to persist
 * the salt + key check). We polyfill localStorage with a Map-backed
 * stub so the round-trip can run in node.
 *
 * The polyfill is installed BEFORE importing the module so the salt
 * read-side hits our stub from the first call.
 *
 * A regression here means encrypted localStorage entries can't be
 * decrypted on next page load — the user loses every saved memory,
 * audit entry, and BYOK provider key.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/encryption-roundtrip.spec.ts --reporter=list
 */

// ── localStorage polyfill (stable per worker) ────────────────────
const store = new Map<string, string>();
const localStorageStub: Storage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => { store.clear(); },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
};

// Install before the dynamic import so getSalt() uses our stub.
(globalThis as unknown as { localStorage: Storage }).localStorage = localStorageStub;

// Static import after polyfill is installed
import {
    encrypt,
    decrypt,
    secureStore,
    secureRetrieve,
    isEncryptionConfigured,
    setupEncryption,
    verifyPassword,
} from '@/lib/encryption';

test.describe.configure({ mode: 'serial' });

test.beforeEach(() => {
    store.clear();
});

test.describe('encrypt / decrypt round-trip', () => {
    test('round-trips a simple string', async () => {
        const plaintext = 'hello world';
        const encrypted = await encrypt(plaintext, 'pw-1');
        const decrypted = await decrypt(encrypted, 'pw-1');
        expect(decrypted).toBe(plaintext);
    });

    test('round-trips a unicode string with emoji + multibyte chars', async () => {
        const plaintext = '🚀 こんにちは, café — €100';
        const encrypted = await encrypt(plaintext, 'pw-1');
        const decrypted = await decrypt(encrypted, 'pw-1');
        expect(decrypted).toBe(plaintext);
    });

    test('round-trips an empty string', async () => {
        const encrypted = await encrypt('', 'pw-1');
        const decrypted = await decrypt(encrypted, 'pw-1');
        expect(decrypted).toBe('');
    });

    test('different IV per encrypt() means same plaintext + same password produces different ciphertext', async () => {
        const e1 = await encrypt('same', 'pw');
        const e2 = await encrypt('same', 'pw');
        expect(e1).not.toBe(e2); // 12-byte random IV embedded
        // Both still decrypt to the same plaintext
        expect(await decrypt(e1, 'pw')).toBe('same');
        expect(await decrypt(e2, 'pw')).toBe('same');
    });

    test('decrypt with wrong password rejects (auth tag mismatch)', async () => {
        const encrypted = await encrypt('secret', 'right-pw');
        await expect(decrypt(encrypted, 'wrong-pw')).rejects.toThrow();
    });

    test('decrypt with tampered ciphertext rejects (auth tag mismatch)', async () => {
        const encrypted = await encrypt('secret', 'pw');
        // Flip a base64 char in the ciphertext
        const tampered = encrypted.slice(0, -2) + (encrypted.slice(-2) === 'AA' ? 'BB' : 'AA');
        await expect(decrypt(tampered, 'pw')).rejects.toThrow();
    });
});

test.describe('secureStore / secureRetrieve', () => {
    test('round-trips a plain object', async () => {
        const data = { name: 'alice', count: 42, items: ['a', 'b'] };
        await secureStore('user-prefs', data, 'pw');
        const out = await secureRetrieve<typeof data>('user-prefs', 'pw');
        expect(out).toEqual(data);
    });

    test('returns null when key is not stored', async () => {
        const out = await secureRetrieve('does-not-exist', 'pw');
        expect(out).toBeNull();
    });

    test('returns null when password is wrong (graceful, not throw)', async () => {
        await secureStore('saved', { x: 1 }, 'right-pw');
        // The contract is "decrypt-fail returns null", because the chat
        // UI calls this opportunistically and a thrown promise would
        // crash the page on a stale stored secret.
        const out = await secureRetrieve('saved', 'wrong-pw');
        expect(out).toBeNull();
    });

    test('storage key is prefixed with "enc:"', async () => {
        await secureStore('foo', { y: 2 }, 'pw');
        // Internal contract: prevents collisions with non-encrypted
        // localStorage entries written by the same app.
        expect(store.has('enc:foo')).toBe(true);
    });
});

test.describe('isEncryptionConfigured / setupEncryption / verifyPassword', () => {
    test('isEncryptionConfigured returns false when never set up', () => {
        expect(isEncryptionConfigured()).toBe(false);
    });

    test('setupEncryption + verifyPassword returns true for the matching password', async () => {
        await setupEncryption('correct-horse-battery-staple');
        expect(await verifyPassword('correct-horse-battery-staple')).toBe(true);
    });

    test('verifyPassword returns false for the wrong password', async () => {
        await setupEncryption('right');
        expect(await verifyPassword('wrong')).toBe(false);
    });

    test('verifyPassword returns false when encryption was never set up', async () => {
        // No setup call. The KEY_CHECK localStorage entry is absent.
        expect(await verifyPassword('anything')).toBe(false);
    });

    test('isEncryptionConfigured flips to true after a salt is generated by encrypt()', async () => {
        // The first encrypt() generates the salt as a side effect.
        await encrypt('seed', 'pw');
        expect(isEncryptionConfigured()).toBe(true);
    });
});
