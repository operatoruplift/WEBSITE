/**
 * Filecoin receipt-anchor.
 *
 * Pushes a signed receipt JSON to a Filecoin storage provider and
 * returns the Content Identifier (CID). The CID is stored on the
 * tool_receipts row as `filecoin_cid` so /security can render a
 * "View on Filecoin" link.
 *
 * The receipt itself is unchanged: ed25519 signature + canonical JSON
 * is already the source of truth (lib/x402/receipts.ts). Filecoin is
 * external provenance metadata, a public archive of the signed bytes.
 *
 * Three providers supported, picked via FILECOIN_PROVIDER env:
 *   - lighthouse  (default; single-token API, easiest)
 *   - pinata      (single JWT)
 *   - storacha    (UCAN; needs FILECOIN_STORACHA_KEY + _PROOF)
 *
 * If no provider env is set, anchorReceipt() returns { ok: false,
 * reason: 'not_configured' } and the caller should leave the
 * filecoin_cid column NULL. The /security UI hides the link when
 * NULL, so there is no awkward "pending" state and no overclaim.
 *
 * Per docs/filecoin-decision.md: this is reversible, opt-in, and
 * env-gated. The marketing pill on LocalFirst flips from "Soon" to
 * "Shipping" only after the env var is set on Vercel.
 */

import { safeLog, safeWarn } from '../safeLog';
import type { SignedReceipt } from '../x402/receipts';

export type FilecoinProvider = 'lighthouse' | 'pinata' | 'storacha';

export interface AnchorResult {
    ok: boolean;
    cid?: string;
    provider?: FilecoinProvider;
    /** Standard reason taxonomy: 'not_configured' | 'http_error' | 'invalid_response' | 'unknown' */
    reason?: string;
    /** HTTP status code on failure */
    httpStatus?: number;
}

interface ProviderConfig {
    provider: FilecoinProvider;
    token: string;
    /** Storacha-only: UCAN proof for the chosen space. */
    proof?: string;
}

/** Resolve provider from env. Returns null when no provider is configured. */
export function getFilecoinProvider(): ProviderConfig | null {
    const provider = (process.env.FILECOIN_PROVIDER || '').trim().toLowerCase() as FilecoinProvider | '';

    // Lighthouse single-token. Default if FILECOIN_PROVIDER unset but the
    // Lighthouse key is present. Convenient default for the "easy" path.
    if ((!provider || provider === 'lighthouse') && process.env.LIGHTHOUSE_API_KEY) {
        return { provider: 'lighthouse', token: process.env.LIGHTHOUSE_API_KEY };
    }
    if (provider === 'pinata' && process.env.PINATA_JWT) {
        return { provider: 'pinata', token: process.env.PINATA_JWT };
    }
    if (provider === 'storacha' && process.env.FILECOIN_STORACHA_KEY && process.env.FILECOIN_STORACHA_PROOF) {
        return {
            provider: 'storacha',
            token: process.env.FILECOIN_STORACHA_KEY,
            proof: process.env.FILECOIN_STORACHA_PROOF,
        };
    }

    return null;
}

/** Sanitized status snapshot for /api/health/adapters. Never names
 *  env-var values, only whether each provider is configured. */
export function filecoinStatus(): {
    active: boolean;
    provider: FilecoinProvider | null;
    reason: string;
} {
    const cfg = getFilecoinProvider();
    if (!cfg) {
        return { active: false, provider: null, reason: 'not_configured' };
    }
    return { active: true, provider: cfg.provider, reason: 'configured' };
}

/** Push the canonical SignedReceipt JSON to Filecoin and return the CID. */
export async function anchorReceipt(signed: SignedReceipt): Promise<AnchorResult> {
    const cfg = getFilecoinProvider();
    if (!cfg) {
        return { ok: false, reason: 'not_configured' };
    }

    // Canonical JSON of the SignedReceipt envelope (receipt + signature
    // + public_key). What gets pinned is exactly what /security shows
    // when a user clicks "Copy JSON".
    const body = JSON.stringify(signed);
    const filename = `receipt-${signed.receipt.receipt_reference}.json`;

    try {
        if (cfg.provider === 'lighthouse') {
            return await uploadLighthouse(body, filename, cfg.token);
        }
        if (cfg.provider === 'pinata') {
            return await uploadPinata(body, filename, cfg.token);
        }
        if (cfg.provider === 'storacha') {
            return await uploadStoracha(body, filename, cfg.token, cfg.proof!);
        }
        return { ok: false, reason: 'not_configured' };
    } catch (err) {
        safeWarn({
            at: 'filecoin.anchor',
            event: 'upload_failed',
            provider: cfg.provider,
            error: err instanceof Error ? err.message : String(err),
        });
        return { ok: false, reason: 'unknown', provider: cfg.provider };
    }
}

/** Lighthouse: POST multipart/form-data to /api/v0/add. Returns Hash (CID). */
async function uploadLighthouse(body: string, filename: string, token: string): Promise<AnchorResult> {
    const form = new FormData();
    form.append('file', new Blob([body], { type: 'application/json' }), filename);

    const res = await fetch('https://node.lighthouse.storage/api/v0/add', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
    });

    if (!res.ok) {
        return { ok: false, reason: 'http_error', httpStatus: res.status, provider: 'lighthouse' };
    }

    const json = (await res.json().catch(() => ({}))) as { Hash?: string };
    if (!json.Hash) {
        return { ok: false, reason: 'invalid_response', provider: 'lighthouse' };
    }

    safeLog({ at: 'filecoin.anchor', event: 'pinned', provider: 'lighthouse', cid: json.Hash });
    return { ok: true, cid: json.Hash, provider: 'lighthouse' };
}

/** Pinata: POST /pinning/pinJSONToIPFS. Returns IpfsHash (CID v0). */
async function uploadPinata(body: string, filename: string, token: string): Promise<AnchorResult> {
    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            pinataContent: JSON.parse(body),
            pinataMetadata: { name: filename },
        }),
    });

    if (!res.ok) {
        return { ok: false, reason: 'http_error', httpStatus: res.status, provider: 'pinata' };
    }

    const json = (await res.json().catch(() => ({}))) as { IpfsHash?: string };
    if (!json.IpfsHash) {
        return { ok: false, reason: 'invalid_response', provider: 'pinata' };
    }

    safeLog({ at: 'filecoin.anchor', event: 'pinned', provider: 'pinata', cid: json.IpfsHash });
    return { ok: true, cid: json.IpfsHash, provider: 'pinata' };
}

/** Storacha: UCAN-based upload via the HTTP /upload/add bridge.
 *  Implementation note: the @storacha/client SDK is the canonical path;
 *  this stub returns not_configured to nudge a future integration to
 *  add the SDK rather than bolt up a bespoke UCAN pipeline here. */
async function uploadStoracha(
    _body: string,
    _filename: string,
    _token: string,
    _proof: string,
): Promise<AnchorResult> {
    safeWarn({
        at: 'filecoin.anchor',
        event: 'storacha_not_yet_wired',
        note: 'Set FILECOIN_PROVIDER=lighthouse or pinata for the shipped paths.',
    });
    return { ok: false, reason: 'not_configured', provider: 'storacha' };
}

/** Build the public verification URL for a CID on a public IPFS gateway.
 *  /security renders this on the "View on Filecoin" link. */
export function cidPublicUrl(cid: string): string {
    // dweb.link is the Protocol Labs maintained public IPFS gateway.
    // Works for both Lighthouse and Pinata pins.
    return `https://${cid}.ipfs.dweb.link`;
}
