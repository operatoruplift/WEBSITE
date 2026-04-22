/**
 * AES-256-GCM encryption for browser localStorage
 * Uses Web Crypto API (crypto.subtle), works in all modern browsers
 *
 * Data is encrypted before storing and decrypted when reading.
 * The encryption key is derived from the user's session token using PBKDF2.
 */

const SALT = new TextEncoder().encode('operator-uplift-v1');
const ITERATIONS = 100000;

/** Derive an AES-256 key from a password/token using PBKDF2 */
async function deriveKey(password: string): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: SALT, iterations: ITERATIONS, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/** Encrypt a string with AES-256-GCM */
export async function encrypt(plaintext: string, password: string): Promise<string> {
    const key = await deriveKey(password);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
    );

    // Combine IV + ciphertext and base64 encode
    const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return btoa(String.fromCharCode(...combined));
}

/** Decrypt an AES-256-GCM encrypted string */
export async function decrypt(encrypted: string, password: string): Promise<string> {
    const key = await deriveKey(password);
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}

/**
 * Encrypted localStorage wrapper
 * Uses the user's auth token as the encryption key
 */
export class SecureStorage {
    private keyPromise: Promise<string> | null = null;

    private getKey(): string {
        if (typeof window === 'undefined') return 'server-key';
        return localStorage.getItem('token') || 'default-key';
    }

    async setItem(key: string, value: string): Promise<void> {
        try {
            const encrypted = await encrypt(value, this.getKey());
            localStorage.setItem(`enc_${key}`, encrypted);
        } catch {
            // Fallback to plain storage if encryption fails
            localStorage.setItem(key, value);
        }
    }

    async getItem(key: string): Promise<string | null> {
        try {
            const encrypted = localStorage.getItem(`enc_${key}`);
            if (!encrypted) {
                // Check for unencrypted fallback
                return localStorage.getItem(key);
            }
            return await decrypt(encrypted, this.getKey());
        } catch {
            // Fallback to plain storage
            return localStorage.getItem(key);
        }
    }

    removeItem(key: string): void {
        localStorage.removeItem(`enc_${key}`);
        localStorage.removeItem(key);
    }
}

/** Singleton instance */
export const secureStorage = new SecureStorage();
