/**
 * 0G Storage receipt-anchor.
 *
 * Companion to lib/filecoin/anchor.ts. Pushes the same signed
 * SignedReceipt JSON to the 0G Storage network and returns the
 * rootHash so the tool_receipts row can store it alongside the
 * Filecoin CID. /security then shows TWO public-storage links per
 * receipt, demonstrating multi-network archival to anyone who
 * doesn't want to trust a single decentralized storage provider.
 *
 * Same design rules as filecoin/anchor.ts:
 *   - Receipt content is unchanged. Signature + canonical JSON is
 *     still the source of truth.
 *   - Storage row metadata is OUTSIDE the signed payload, so the
 *     signature contract from PR #510 + lib/x402/receipts.ts stays.
 *   - If env vars are missing, anchorReceiptTo0G returns
 *     { ok: false, reason: 'not_configured' } and the caller leaves
 *     og_storage_root_hash NULL.
 *   - Per docs/0g-integration-decision.md, this integration is
 *     additive (does not replace Filecoin) and lives behind a
 *     dedicated cron the operator manually triggers.
 *
 * Required env (set on Vercel for the cron to run):
 *   OG_PRIVATE_KEY     wallet private key for 0G testnet (NOT mainnet)
 *   OG_RPC_URL         optional; defaults to testnet
 *   OG_INDEXER_RPC     optional; defaults to Turbo testnet indexer
 *
 * Default endpoints (testnet, per https://docs.0g.ai):
 *   RPC:     https://evmrpc-testnet.0g.ai
 *   Indexer: https://indexer-storage-testnet-turbo.0g.ai
 */

import { safeLog, safeWarn } from '../safeLog';
import type { SignedReceipt } from '../x402/receipts';

export interface OgAnchorResult {
    ok: boolean;
    rootHash?: string;
    reason?: 'not_configured' | 'sdk_load_failed' | 'upload_failed' | 'merkle_failed';
    detail?: string;
}

interface OgConfig {
    privateKey: string;
    rpcUrl: string;
    indexerRpc: string;
}

/** Pull config from env, return null when private key missing. */
export function get0gConfig(): OgConfig | null {
    const privateKey = process.env.OG_PRIVATE_KEY?.trim();
    if (!privateKey) return null;
    return {
        privateKey,
        rpcUrl: process.env.OG_RPC_URL?.trim() || 'https://evmrpc-testnet.0g.ai',
        indexerRpc: process.env.OG_INDEXER_RPC?.trim() || 'https://indexer-storage-testnet-turbo.0g.ai',
    };
}

/**
 * Honest-status surface for /api/health/adapters. Returns a
 * structured snapshot so the health endpoint can render whether
 * the 0G adapter is active and which endpoints it targets.
 */
export function og0Status(): {
    active: boolean;
    network: 'testnet' | 'unknown';
    rpcUrl?: string;
    indexerRpc?: string;
} {
    const cfg = get0gConfig();
    if (!cfg) return { active: false, network: 'unknown' };
    const isTestnet = cfg.rpcUrl.includes('testnet');
    return {
        active: true,
        network: isTestnet ? 'testnet' : 'unknown',
        rpcUrl: cfg.rpcUrl,
        indexerRpc: cfg.indexerRpc,
    };
}

/** Canonical JSON encoder matching lib/x402/invoices.ts so the bytes
 *  pinned to 0G match the bytes signed in the receipt exactly. */
function canonicalJson(value: unknown): string {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return '{' + keys.map(k =>
        JSON.stringify(k) + ':' + canonicalJson((value as Record<string, unknown>)[k]),
    ).join(',') + '}';
}

/**
 * Upload the SignedReceipt JSON to 0G Storage and return the rootHash.
 *
 * Loads the SDK + ethers dynamically so the module compiles + tree-
 * shakes cleanly when OG_PRIVATE_KEY is unset (the common case for
 * local dev). Production env sets the key, the cron sweeps, and the
 * row picks up the rootHash on its first pass.
 */
export async function anchorReceiptTo0G(signed: SignedReceipt): Promise<OgAnchorResult> {
    const cfg = get0gConfig();
    if (!cfg) return { ok: false, reason: 'not_configured' };

    let MemData: typeof import('@0gfoundation/0g-storage-ts-sdk').MemData;
    let Indexer: typeof import('@0gfoundation/0g-storage-ts-sdk').Indexer;
    let ethers: typeof import('ethers');
    try {
        const sdk = await import('@0gfoundation/0g-storage-ts-sdk');
        MemData = sdk.MemData;
        Indexer = sdk.Indexer;
        ethers = await import('ethers');
    } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        safeWarn({ at: 'og.storage', event: 'sdk_load_failed', detail });
        return { ok: false, reason: 'sdk_load_failed', detail };
    }

    const body = canonicalJson(signed);
    const data = new TextEncoder().encode(body);

    try {
        const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
        const signer = new ethers.Wallet(cfg.privateKey, provider);
        const indexer = new Indexer(cfg.indexerRpc);

        const memData = new MemData(data);
        const [, treeErr] = await memData.merkleTree();
        if (treeErr) {
            const detail = String(treeErr);
            safeWarn({ at: 'og.storage', event: 'merkle_failed', detail });
            return { ok: false, reason: 'merkle_failed', detail };
        }

        const [tx, uploadErr] = await indexer.upload(memData, cfg.rpcUrl, signer);
        if (uploadErr) {
            const detail = String(uploadErr);
            safeWarn({ at: 'og.storage', event: 'upload_failed', detail });
            return { ok: false, reason: 'upload_failed', detail };
        }

        // The SDK returns one of two shapes depending on single vs batch
        // upload: { rootHash, txHash, txSeq } or { rootHashes, txHashes,
        // txSeqs }. We always upload a single blob, but narrow defensively.
        const rootHash = tx && 'rootHash' in tx
            ? tx.rootHash
            : tx && 'rootHashes' in tx
                ? tx.rootHashes[0]
                : undefined;
        if (!rootHash) {
            safeWarn({ at: 'og.storage', event: 'no_root_hash', txKeys: Object.keys(tx ?? {}) });
            return { ok: false, reason: 'upload_failed', detail: 'tx.rootHash missing' };
        }

        safeLog({ at: 'og.storage', event: 'anchored', receipt_reference: signed.receipt.receipt_reference, rootHash });
        return { ok: true, rootHash };
    } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        safeWarn({ at: 'og.storage', event: 'unexpected_error', detail });
        return { ok: false, reason: 'upload_failed', detail };
    }
}

/**
 * Build a verification URL for a 0G Storage rootHash. Today the 0G
 * testnet doesn't have an https://<hash>.0g.dweb style public gateway
 * like dweb.link; the public verification path is via a 0G testnet
 * explorer query against the indexer.
 *
 * For the /security UI we link to our own pass-through verifier
 * route (built separately) so a judge gets the bytes back without
 * needing to install the SDK. If a public gateway URL becomes
 * available later, this function is the single place to swap it.
 */
export function ogPublicUrl(rootHash: string): string {
    return `/api/og/storage/${encodeURIComponent(rootHash)}`;
}
