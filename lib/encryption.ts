// AES-256-GCM encryption using the Web Crypto API
// Encrypts localStorage data at rest

const SALT_KEY = 'ou-enc-salt';
const KEY_CHECK = 'ou-enc-check';

/** Derive an AES-256 key from a password using PBKDF2 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' } as Algorithm,
        false,
        ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256',
        } as Pbkdf2Params,
        keyMaterial,
        { name: 'AES-GCM', length: 256 } as AesKeyGenParams,
        false,
        ['encrypt', 'decrypt']
    );
}

/** Get or create the salt for key derivation */
function getSalt(): Uint8Array {
    const stored = localStorage.getItem(SALT_KEY);
    if (stored) return new Uint8Array(JSON.parse(stored));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem(SALT_KEY, JSON.stringify(Array.from(salt)));
    return salt;
}

/** Encrypt a string with AES-256-GCM */
export async function encrypt(plaintext: string, password: string): Promise<string> {
    const salt = getSalt();
    const key = await deriveKey(password, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv } as AesGcmParams,
        key,
        encoder.encode(plaintext)
    );
    const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return btoa(String.fromCharCode(...combined));
}

/** Decrypt a string with AES-256-GCM */
export async function decrypt(encrypted: string, password: string): Promise<string> {
    const salt = getSalt();
    const key = await deriveKey(password, salt);
    const combined = new Uint8Array(atob(encrypted).split('').map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv } as AesGcmParams,
        key,
        ciphertext
    );
    return new TextDecoder().decode(decrypted);
}

/** Store encrypted data in localStorage */
export async function secureStore(key: string, data: unknown, password: string): Promise<void> {
    const json = JSON.stringify(data);
    const encrypted = await encrypt(json, password);
    localStorage.setItem(`enc:${key}`, encrypted);
}

/** Retrieve and decrypt data from localStorage */
export async function secureRetrieve<T>(key: string, password: string): Promise<T | null> {
    const encrypted = localStorage.getItem(`enc:${key}`);
    if (!encrypted) return null;
    try {
        const json = await decrypt(encrypted, password);
        return JSON.parse(json) as T;
    } catch {
        return null;
    }
}

/** Check if encryption is set up */
export function isEncryptionConfigured(): boolean {
    return localStorage.getItem(SALT_KEY) !== null;
}

/** Verify a password against stored check value */
export async function verifyPassword(password: string): Promise<boolean> {
    const check = localStorage.getItem(KEY_CHECK);
    if (!check) return false;
    try {
        const decrypted = await decrypt(check, password);
        return decrypted === 'OPERATOR_UPLIFT_KEY_CHECK';
    } catch {
        return false;
    }
}

/** Set up encryption with a password */
export async function setupEncryption(password: string): Promise<void> {
    const check = await encrypt('OPERATOR_UPLIFT_KEY_CHECK', password);
    localStorage.setItem(KEY_CHECK, check);
}
