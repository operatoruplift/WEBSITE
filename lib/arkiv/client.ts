import { createPublicClient, createWalletClient, http } from '@arkiv-network/sdk';
import { privateKeyToAccount } from '@arkiv-network/sdk/accounts';
import { braga } from '@arkiv-network/sdk/chains';

/**
 * Arkiv public client (read-only). Safe to call from anywhere —
 * frontend, server routes, edge runtime. No private key.
 *
 * Cached behind a module-level singleton so repeated calls in the same
 * Next.js runtime share one connection.
 */
let publicClientSingleton: ReturnType<typeof createPublicClient> | null = null;

export function getArkivPublicClient() {
    if (!publicClientSingleton) {
        publicClientSingleton = createPublicClient({
            chain: braga,
            transport: http(),
        });
    }
    return publicClientSingleton;
}

/**
 * Arkiv wallet client (read + write). Requires ARKIV_PRIVATE_KEY in
 * the server-side environment. Throws if called without one set.
 *
 * Only use this for backend-published entities (blog posts, product
 * updates, receipt mirrors). User-owned data (Memory entities) is
 * written by the user's own wallet via MetaMask + wagmi in a separate
 * code path.
 *
 * Cached behind a module-level singleton so repeated calls in the same
 * Next.js server runtime share one signer.
 */
let walletClientSingleton: ReturnType<typeof createWalletClient> | null = null;

export function getArkivWalletClient() {
    if (walletClientSingleton) return walletClientSingleton;

    const privateKey = process.env.ARKIV_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error(
            'ARKIV_PRIVATE_KEY is not set. Backend Arkiv writes require a funded Braga testnet wallet — see https://braga.hoodi.arkiv.network/faucet/',
        );
    }

    const normalized = privateKey.startsWith('0x')
        ? (privateKey as `0x${string}`)
        : (`0x${privateKey}` as `0x${string}`);

    walletClientSingleton = createWalletClient({
        chain: braga,
        transport: http(),
        account: privateKeyToAccount(normalized),
    });

    return walletClientSingleton;
}

/**
 * Returns true if the backend has an Arkiv signer configured. UI
 * surfaces use this to decide whether to show write CTAs vs hide them
 * (the hide-when-NULL contract carried over from Filecoin/0G).
 */
export function hasArkivWriteKey(): boolean {
    return Boolean(process.env.ARKIV_PRIVATE_KEY);
}
