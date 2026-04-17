/**
 * MagicBlock adapter — Ephemeral Rollup (ER) integration.
 *
 * MagicBlock runs public ER validators that speak regular Solana
 * JSON-RPC. Point a `Connection` at one of them and every ix you
 * submit settles inside the rollup within ~10 ms with zero fee,
 * then commits to mainnet/devnet asynchronously. Docs:
 *   https://docs.magicblock.gg/pages/overview/products
 *
 * This module gives callers (notably /api/tools/x402/pay) a way to
 * submit a transaction via an ER validator instead of raw devnet.
 * When the flag is off we just expose the ability to tell callers
 * "use the default devnet path" so the receipt can still record
 * `executed_via: 'solana-devnet'`.
 *
 * Env:
 *   NEXT_PUBLIC_MAGICBLOCK_ENABLED — turn on ER routing (0/1).
 *   MAGICBLOCK_CLUSTER             — 'devnet' (default) | 'mainnet'.
 *   MAGICBLOCK_REGION              — 'us' (default) | 'eu' | 'as' | 'tee'.
 *   MAGICBLOCK_RPC                 — full override. If set, used verbatim
 *                                    instead of the region/cluster pair.
 */

import { Connection } from '@solana/web3.js';

/** MagicBlock published RPC endpoints. Source: docs.magicblock.gg/pages/overview/products */
const ER_ENDPOINTS = {
    devnet: {
        us: 'https://devnet-us.magicblock.app',
        eu: 'https://devnet-eu.magicblock.app',
        as: 'https://devnet-as.magicblock.app',
        tee: 'https://devnet-tee.magicblock.app',
    },
    mainnet: {
        us: 'https://us.magicblock.app',
        eu: 'https://eu.magicblock.app',
        as: 'https://as.magicblock.app',
        tee: 'https://mainnet-tee.magicblock.app',
    },
} as const;

export type MagicBlockCluster = 'devnet' | 'mainnet';
export type MagicBlockRegion = 'us' | 'eu' | 'as' | 'tee';

export interface MagicBlockAdapter {
    isActive(): boolean;
    getRpcUrl(): string | null;
    /**
     * Return a configured @solana/web3.js Connection bound to the ER
     * validator. Null when the adapter isn't active.
     */
    connection(): Connection | null;
    /** What the receipt should record under `executed_via`. */
    executedVia(): 'magicblock' | 'solana-devnet';
}

function resolveCluster(): MagicBlockCluster {
    const v = process.env.MAGICBLOCK_CLUSTER?.toLowerCase();
    return v === 'mainnet' ? 'mainnet' : 'devnet';
}

function resolveRegion(): MagicBlockRegion {
    const v = process.env.MAGICBLOCK_REGION?.toLowerCase();
    if (v === 'eu' || v === 'as' || v === 'tee' || v === 'us') return v;
    return 'us';
}

function resolveRpc(): string | null {
    const override = process.env.MAGICBLOCK_RPC?.trim();
    if (override) return override;
    if (process.env.NEXT_PUBLIC_MAGICBLOCK_ENABLED !== '1') return null;
    const cluster = resolveCluster();
    const region = resolveRegion();
    return ER_ENDPOINTS[cluster][region];
}

const adapter: MagicBlockAdapter = {
    isActive(): boolean {
        return resolveRpc() !== null;
    },
    getRpcUrl(): string | null {
        return resolveRpc();
    },
    connection(): Connection | null {
        const url = resolveRpc();
        if (!url) return null;
        return new Connection(url, 'confirmed');
    },
    executedVia(): 'magicblock' | 'solana-devnet' {
        return resolveRpc() ? 'magicblock' : 'solana-devnet';
    },
};

export function getMagicBlockAdapter(): MagicBlockAdapter {
    return adapter;
}

/**
 * Surface status for /demo/hackathon + Truth Table. Honest labels
 * only — if the flag is off, we report Inactive even with the
 * validator list known.
 */
export function magicBlockSurfaceStatus(): {
    label: string;
    active: boolean;
    reason: string;
    rpcUrl: string | null;
} {
    const url = resolveRpc();
    if (url) {
        return {
            label: 'Active',
            active: true,
            reason: `Ephemeral Rollup routing enabled at ${url}. Receipts record executed_via: 'magicblock'.`,
            rpcUrl: url,
        };
    }
    return {
        label: 'Inactive',
        active: false,
        reason: 'NEXT_PUBLIC_MAGICBLOCK_ENABLED != 1. Set the flag + MAGICBLOCK_CLUSTER (devnet|mainnet) + MAGICBLOCK_REGION (us|eu|as|tee) to route x402 settlements through a MagicBlock ER validator. Receipts will keep recording executed_via: solana-devnet until then.',
        rpcUrl: null,
    };
}
