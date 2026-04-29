import { test, expect } from '@playwright/test';
import {
    getMagicBlockAdapter,
    magicBlockSurfaceStatus,
} from '@/lib/magicblock/adapter';

/**
 * Unit tests for the MagicBlock Ephemeral Rollup (ER) adapter.
 *
 * The adapter routes x402 settlements through one of MagicBlock's
 * regional ER validators when NEXT_PUBLIC_MAGICBLOCK_ENABLED=1; when
 * the flag is off, callers fall back to the default devnet RPC and
 * receipts record `executed_via: 'solana-devnet'`. The honest-status
 * rule from the module: even with the validator list known, label
 * remains "Inactive" until the flag flips on.
 *
 * Tests mutate process.env so the describe block is serial.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/magicblock-adapter.spec.ts --reporter=list
 */

test.describe.configure({ mode: 'serial' });

const ORIG_ENABLED = process.env.NEXT_PUBLIC_MAGICBLOCK_ENABLED;
const ORIG_CLUSTER = process.env.MAGICBLOCK_CLUSTER;
const ORIG_REGION = process.env.MAGICBLOCK_REGION;
const ORIG_RPC = process.env.MAGICBLOCK_RPC;

function clearAll() {
    delete process.env.NEXT_PUBLIC_MAGICBLOCK_ENABLED;
    delete process.env.MAGICBLOCK_CLUSTER;
    delete process.env.MAGICBLOCK_REGION;
    delete process.env.MAGICBLOCK_RPC;
}

function restoreEnv() {
    if (ORIG_ENABLED === undefined) delete process.env.NEXT_PUBLIC_MAGICBLOCK_ENABLED;
    else process.env.NEXT_PUBLIC_MAGICBLOCK_ENABLED = ORIG_ENABLED;
    if (ORIG_CLUSTER === undefined) delete process.env.MAGICBLOCK_CLUSTER;
    else process.env.MAGICBLOCK_CLUSTER = ORIG_CLUSTER;
    if (ORIG_REGION === undefined) delete process.env.MAGICBLOCK_REGION;
    else process.env.MAGICBLOCK_REGION = ORIG_REGION;
    if (ORIG_RPC === undefined) delete process.env.MAGICBLOCK_RPC;
    else process.env.MAGICBLOCK_RPC = ORIG_RPC;
}

test.beforeEach(() => {
    clearAll();
});

test.afterEach(() => {
    restoreEnv();
});

test.describe('isActive() + getRpcUrl()', () => {
    test('inactive when nothing is set', () => {
        const a = getMagicBlockAdapter();
        expect(a.isActive()).toBe(false);
        expect(a.getRpcUrl()).toBeNull();
    });

    test('inactive when only cluster/region set without ENABLED flag', () => {
        process.env.MAGICBLOCK_CLUSTER = 'devnet';
        process.env.MAGICBLOCK_REGION = 'us';
        const a = getMagicBlockAdapter();
        expect(a.isActive()).toBe(false);
        expect(a.getRpcUrl()).toBeNull();
    });

    test('active with NEXT_PUBLIC_MAGICBLOCK_ENABLED=1; default to devnet/us', () => {
        process.env.NEXT_PUBLIC_MAGICBLOCK_ENABLED = '1';
        const a = getMagicBlockAdapter();
        expect(a.isActive()).toBe(true);
        expect(a.getRpcUrl()).toBe('https://devnet-us.magicblock.app');
    });

    test('cluster=mainnet picks the mainnet endpoint', () => {
        process.env.NEXT_PUBLIC_MAGICBLOCK_ENABLED = '1';
        process.env.MAGICBLOCK_CLUSTER = 'mainnet';
        const a = getMagicBlockAdapter();
        expect(a.getRpcUrl()).toBe('https://us.magicblock.app');
    });

    test('region selects the right validator', () => {
        process.env.NEXT_PUBLIC_MAGICBLOCK_ENABLED = '1';
        process.env.MAGICBLOCK_CLUSTER = 'devnet';
        process.env.MAGICBLOCK_REGION = 'eu';
        expect(getMagicBlockAdapter().getRpcUrl()).toBe('https://devnet-eu.magicblock.app');
        process.env.MAGICBLOCK_REGION = 'as';
        expect(getMagicBlockAdapter().getRpcUrl()).toBe('https://devnet-as.magicblock.app');
        process.env.MAGICBLOCK_REGION = 'tee';
        expect(getMagicBlockAdapter().getRpcUrl()).toBe('https://devnet-tee.magicblock.app');
    });

    test('unrecognized region falls back to us', () => {
        process.env.NEXT_PUBLIC_MAGICBLOCK_ENABLED = '1';
        process.env.MAGICBLOCK_REGION = 'mars';
        expect(getMagicBlockAdapter().getRpcUrl()).toBe('https://devnet-us.magicblock.app');
    });

    test('unrecognized cluster falls back to devnet', () => {
        process.env.NEXT_PUBLIC_MAGICBLOCK_ENABLED = '1';
        process.env.MAGICBLOCK_CLUSTER = 'testnet';
        expect(getMagicBlockAdapter().getRpcUrl()).toBe('https://devnet-us.magicblock.app');
    });

    test('cluster + region matching is case-insensitive', () => {
        process.env.NEXT_PUBLIC_MAGICBLOCK_ENABLED = '1';
        process.env.MAGICBLOCK_CLUSTER = 'MAINNET';
        process.env.MAGICBLOCK_REGION = 'EU';
        expect(getMagicBlockAdapter().getRpcUrl()).toBe('https://eu.magicblock.app');
    });

    test('MAGICBLOCK_RPC override takes precedence over flag + cluster + region', () => {
        // The override is honored even when NEXT_PUBLIC_MAGICBLOCK_ENABLED
        // is unset, so an operator can paste a custom validator URL
        // without flipping the public flag.
        process.env.MAGICBLOCK_RPC = 'https://my-private-er.example.test/rpc';
        const a = getMagicBlockAdapter();
        expect(a.isActive()).toBe(true);
        expect(a.getRpcUrl()).toBe('https://my-private-er.example.test/rpc');
    });

    test('flag set to "0" is inactive (not "1")', () => {
        process.env.NEXT_PUBLIC_MAGICBLOCK_ENABLED = '0';
        expect(getMagicBlockAdapter().isActive()).toBe(false);
    });

    test('flag set to "true" is inactive (must be exactly "1")', () => {
        process.env.NEXT_PUBLIC_MAGICBLOCK_ENABLED = 'true';
        expect(getMagicBlockAdapter().isActive()).toBe(false);
    });
});

test.describe('connection()', () => {
    test('returns null when adapter is inactive', () => {
        expect(getMagicBlockAdapter().connection()).toBeNull();
    });

    test('returns a Connection instance when adapter is active', () => {
        process.env.NEXT_PUBLIC_MAGICBLOCK_ENABLED = '1';
        const conn = getMagicBlockAdapter().connection();
        expect(conn).not.toBeNull();
        // Sanity: the connection's _rpcEndpoint should match getRpcUrl().
        // We don't access private fields; just confirm a non-null obj
        // came back.
        expect(typeof conn).toBe('object');
    });
});

test.describe('executedVia()', () => {
    test('returns "solana-devnet" when adapter is inactive', () => {
        expect(getMagicBlockAdapter().executedVia()).toBe('solana-devnet');
    });

    test('returns "magicblock" when adapter is active', () => {
        process.env.NEXT_PUBLIC_MAGICBLOCK_ENABLED = '1';
        expect(getMagicBlockAdapter().executedVia()).toBe('magicblock');
    });

    test('returns "magicblock" when only MAGICBLOCK_RPC override is set', () => {
        process.env.MAGICBLOCK_RPC = 'https://custom-er.example.test/';
        expect(getMagicBlockAdapter().executedVia()).toBe('magicblock');
    });
});

test.describe('magicBlockSurfaceStatus()', () => {
    test('inactive label + reason mentions the env var to set', () => {
        const s = magicBlockSurfaceStatus();
        expect(s.active).toBe(false);
        expect(s.label).toBe('Inactive');
        expect(s.rpcUrl).toBeNull();
        expect(s.reason).toContain('NEXT_PUBLIC_MAGICBLOCK_ENABLED');
        expect(s.reason).toContain('executed_via');
    });

    test('active label + reason embeds the resolved RPC URL', () => {
        process.env.NEXT_PUBLIC_MAGICBLOCK_ENABLED = '1';
        const s = magicBlockSurfaceStatus();
        expect(s.active).toBe(true);
        expect(s.label).toBe('Active');
        expect(s.rpcUrl).toBe('https://devnet-us.magicblock.app');
        expect(s.reason).toContain('Ephemeral Rollup');
        expect(s.reason).toContain(s.rpcUrl as string);
        expect(s.reason).toContain('magicblock');
    });
});
