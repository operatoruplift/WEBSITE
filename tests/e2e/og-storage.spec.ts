import { test, expect } from '@playwright/test';
import { get0gConfig, og0Status, ogPublicUrl } from '@/lib/og/storage';

/**
 * Hermetic spec for the 0G Storage receipt-anchor integration shipped
 * in PR #569. Sister to tests/e2e/og-agent-id.spec.ts (PR #575).
 *
 * Locks three things judges and operators depend on:
 *
 *   1. Hide-when-NULL config — when OG_PRIVATE_KEY is unset,
 *      get0gConfig() returns null and og0Status() reports inactive.
 *      The cron must read this contract to avoid no-op SDK calls.
 *
 *   2. Public verifier URL builder — ogPublicUrl() always returns
 *      `/api/og/storage/<encoded>` so links rendered on /security
 *      point at the documented verifier passthrough route. The
 *      rootHash is URL-encoded to defend against XSS via malformed
 *      input from the indexer.
 *
 *   3. Public verifier passthrough envelope shape — the route at
 *      /api/og/storage/[rootHash] returns the documented JSON
 *      envelope (rootHash + indexer + verify instructions). A judge
 *      clicking the `0g:` link on /security depends on this envelope.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/og-storage.spec.ts --reporter=list
 */

test.describe('get0gConfig() — env-gated config loader', () => {
    test('returns null when OG_PRIVATE_KEY is not set', () => {
        // The CI environment never carries OG_PRIVATE_KEY (no funded
        // testnet wallet committed to the repo), so this is the
        // baseline contract that the cron and the public route rely on.
        const original = process.env.OG_PRIVATE_KEY;
        delete process.env.OG_PRIVATE_KEY;
        try {
            expect(get0gConfig()).toBeNull();
        } finally {
            if (original !== undefined) process.env.OG_PRIVATE_KEY = original;
        }
    });

    test('returns OgConfig with default endpoints when only OG_PRIVATE_KEY is set', () => {
        const original = {
            key: process.env.OG_PRIVATE_KEY,
            rpc: process.env.OG_RPC_URL,
            indexer: process.env.OG_INDEXER_RPC,
        };
        process.env.OG_PRIVATE_KEY = '0x' + 'a'.repeat(64);
        delete process.env.OG_RPC_URL;
        delete process.env.OG_INDEXER_RPC;
        try {
            const cfg = get0gConfig();
            expect(cfg).not.toBeNull();
            expect(cfg!.rpcUrl).toBe('https://evmrpc-testnet.0g.ai');
            expect(cfg!.indexerRpc).toBe('https://indexer-storage-testnet-turbo.0g.ai');
            expect(cfg!.privateKey).toBe('0x' + 'a'.repeat(64));
        } finally {
            restoreEnv(original);
        }
    });

    test('honours env overrides for RPC + indexer', () => {
        const original = {
            key: process.env.OG_PRIVATE_KEY,
            rpc: process.env.OG_RPC_URL,
            indexer: process.env.OG_INDEXER_RPC,
        };
        process.env.OG_PRIVATE_KEY = '0x' + 'b'.repeat(64);
        process.env.OG_RPC_URL = 'https://custom-rpc.example.com';
        process.env.OG_INDEXER_RPC = 'https://custom-indexer.example.com';
        try {
            const cfg = get0gConfig();
            expect(cfg!.rpcUrl).toBe('https://custom-rpc.example.com');
            expect(cfg!.indexerRpc).toBe('https://custom-indexer.example.com');
        } finally {
            restoreEnv(original);
        }
    });

    test('trims whitespace on OG_PRIVATE_KEY (env vars commonly arrive with newlines from .env files)', () => {
        const original = process.env.OG_PRIVATE_KEY;
        process.env.OG_PRIVATE_KEY = '  0x' + 'c'.repeat(64) + '\n';
        try {
            const cfg = get0gConfig();
            expect(cfg!.privateKey).toBe('0x' + 'c'.repeat(64));
        } finally {
            if (original !== undefined) process.env.OG_PRIVATE_KEY = original;
            else delete process.env.OG_PRIVATE_KEY;
        }
    });
});

test.describe('og0Status() — honest health surface for /api/health/adapters', () => {
    test('reports active=false, network=unknown when OG_PRIVATE_KEY is unset', () => {
        const original = process.env.OG_PRIVATE_KEY;
        delete process.env.OG_PRIVATE_KEY;
        try {
            const status = og0Status();
            expect(status.active).toBe(false);
            expect(status.network).toBe('unknown');
            expect(status.rpcUrl).toBeUndefined();
            expect(status.indexerRpc).toBeUndefined();
        } finally {
            if (original !== undefined) process.env.OG_PRIVATE_KEY = original;
        }
    });

    test('reports active=true, network=testnet when targeting the default testnet RPC', () => {
        const original = {
            key: process.env.OG_PRIVATE_KEY,
            rpc: process.env.OG_RPC_URL,
        };
        process.env.OG_PRIVATE_KEY = '0x' + 'd'.repeat(64);
        delete process.env.OG_RPC_URL;
        try {
            const status = og0Status();
            expect(status.active).toBe(true);
            expect(status.network).toBe('testnet');
            expect(status.rpcUrl).toBe('https://evmrpc-testnet.0g.ai');
        } finally {
            restoreEnv(original);
        }
    });

    test('reports network=unknown when RPC URL does not contain "testnet"', () => {
        // Future mainnet swap should NOT report as testnet — the row on
        // /api/health/adapters must reflect reality.
        const original = {
            key: process.env.OG_PRIVATE_KEY,
            rpc: process.env.OG_RPC_URL,
        };
        process.env.OG_PRIVATE_KEY = '0x' + 'e'.repeat(64);
        process.env.OG_RPC_URL = 'https://evmrpc-mainnet.0g.ai';
        try {
            const status = og0Status();
            expect(status.active).toBe(true);
            expect(status.network).toBe('unknown');
        } finally {
            restoreEnv(original);
        }
    });
});

test.describe('ogPublicUrl() — verifier passthrough URL builder', () => {
    test('returns /api/og/storage/<rootHash> for standard hashes', () => {
        const url = ogPublicUrl('0xdeadbeef');
        expect(url).toBe('/api/og/storage/0xdeadbeef');
    });

    test('URL-encodes the rootHash to defend against XSS via path traversal', () => {
        const url = ogPublicUrl('../malicious?x=1');
        expect(url).toContain('%2F');
        expect(url).toContain('%3F');
        expect(url).not.toContain('?x=1');
    });

    test('handles real-world 32-byte rootHashes (64 hex + 0x prefix)', () => {
        const rootHash = '0x' + 'f'.repeat(64);
        const url = ogPublicUrl(rootHash);
        expect(url).toBe(`/api/og/storage/${rootHash}`);
    });
});

test.describe('GET /api/og/storage/[rootHash] — public verifier envelope', () => {
    test('returns documented envelope shape (200, public route)', async ({ request }) => {
        const fakeHash = '0x' + 'a'.repeat(64);
        const res = await request.get(`/api/og/storage/${fakeHash}`);
        // 200 because the route is purely informational — it doesn't
        // fetch from 0G itself, just returns documentation pointers.
        expect(res.status()).toBe(200);

        const body = await res.json();
        expect(body.rootHash).toBe(fakeHash);
        expect(body).toHaveProperty('network');
        expect(body).toHaveProperty('anchored');
        expect(body).toHaveProperty('indexerRpc');
        expect(body).toHaveProperty('rpcUrl');
        expect(body).toHaveProperty('verify');
        expect(body.verify).toHaveProperty('instructions');
        expect(Array.isArray(body.verify.instructions)).toBe(true);
        expect(body.verify.instructions.length).toBeGreaterThan(0);
        expect(body.verify).toHaveProperty('docs');
        expect(body.verify.docs).toContain('0g.ai');
        expect(body).toHaveProperty('requestId');
        expect(body).toHaveProperty('timestamp');
    });

    test('reflects honest anchored=false when OG_PRIVATE_KEY is unset (CI default)', async ({ request }) => {
        // CI ships without a funded testnet wallet, so the route MUST
        // report anchored=false and indexerRpc=null. A judge clicking
        // the link sees the route is reachable but the bytes are not
        // pinned on this deploy — no overclaim.
        const res = await request.get(`/api/og/storage/0x${'b'.repeat(64)}`);
        const body = await res.json();
        if (!process.env.OG_PRIVATE_KEY) {
            expect(body.anchored).toBe(false);
            expect(body.indexerRpc).toBeNull();
            expect(body.rpcUrl).toBeNull();
            expect(body.network).toBe('unknown');
        } else {
            // When env IS set (operator's deploy), the envelope
            // reports the indexer the cron anchors against.
            expect(body.anchored).toBe(true);
            expect(body.indexerRpc).toContain('0g.ai');
        }
    });

    test('public route: no auth header required, no 401', async ({ request }) => {
        const res = await request.get(`/api/og/storage/0x${'c'.repeat(64)}`);
        expect(res.status()).not.toBe(401);
    });

    test('response carries X-Request-Id header (trust-gate contract)', async ({ request }) => {
        const res = await request.get(`/api/og/storage/0x${'d'.repeat(64)}`);
        const headers = res.headers();
        // The repo-wide trust-gate contract says every API response
        // — including public ones — carries X-Request-Id for log
        // correlation. Locking it here so the og verifier doesn't
        // accidentally drop the header in a future refactor.
        expect(headers['x-request-id']).toBeTruthy();
    });
});

function restoreEnv(original: Record<string, string | undefined>) {
    for (const [shortName, value] of Object.entries(original)) {
        const envName = shortName === 'key' ? 'OG_PRIVATE_KEY'
            : shortName === 'rpc' ? 'OG_RPC_URL'
            : shortName === 'indexer' ? 'OG_INDEXER_RPC'
            : null;
        if (!envName) continue;
        if (value === undefined) delete process.env[envName];
        else process.env[envName] = value;
    }
}
