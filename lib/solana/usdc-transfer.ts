/**
 * Browser-side USDC (SPL) transfer builder for the waitlist payments.
 *
 * Produces the *unsigned* serialized transaction bytes that Privy's
 * `useSignAndSendTransaction` expects. Privy signs with the connected
 * wallet (WalletConnect / Phantom / Solflare / Backpack) and submits it
 * over its own RPC; this module only reads from `SOLANA_RPC_URL` to fetch
 * a recent blockhash and derive token accounts.
 *
 * The matching server-side confirmation lives in
 * `lib/solana/verify-usdc-transfer.ts` — the checkout posts the returned
 * signature to a verify endpoint which re-reads the tx from RPC and
 * confirms recipient + amount before granting anything. The client is
 * never trusted to self-report a successful payment.
 */
import {
    Connection,
    PublicKey,
    Transaction,
} from '@solana/web3.js';
import {
    createAssociatedTokenAccountIdempotentInstruction,
    createTransferCheckedInstruction,
    getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import {
    SOLANA_RPC_URL,
    USDC_DECIMALS,
    USDC_MAINNET_MINT,
} from '@/lib/waitlist-constants';

export interface BuildUsdcTransferInput {
    /** Connected wallet address (base58) paying the USDC. */
    senderAddress: string;
    /** Recipient treasury address (base58). */
    recipientAddress: string;
    /** Whole-dollar USDC amount, e.g. 5, 25, 50, 100. */
    amountUsdc: number;
    /** Optional RPC override; defaults to SOLANA_RPC_URL. */
    rpcUrl?: string;
}

/**
 * Build the unsigned, serialized USDC transfer transaction. Throws on an
 * invalid address or a non-positive amount so the caller surfaces a clear
 * error instead of asking the wallet to sign garbage.
 */
export async function buildUsdcTransfer(
    input: BuildUsdcTransferInput,
): Promise<Uint8Array> {
    const { senderAddress, recipientAddress, amountUsdc, rpcUrl } = input;

    if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) {
        throw new Error(`Invalid USDC amount: ${amountUsdc}`);
    }

    const sender = new PublicKey(senderAddress);
    const recipient = new PublicKey(recipientAddress);
    const mint = new PublicKey(USDC_MAINNET_MINT);

    const senderAta = getAssociatedTokenAddressSync(mint, sender);
    const recipientAta = getAssociatedTokenAddressSync(mint, recipient);

    // USDC has 6 decimals. Round to the smallest unit to avoid float drift.
    const baseUnits = BigInt(Math.round(amountUsdc * 10 ** USDC_DECIMALS));

    const connection = new Connection(rpcUrl ?? SOLANA_RPC_URL, 'confirmed');
    const { blockhash } = await connection.getLatestBlockhash('confirmed');

    const tx = new Transaction();
    tx.feePayer = sender;
    tx.recentBlockhash = blockhash;
    tx.add(
        // No-op when the treasury ATA already exists (it does); guards the
        // edge case where a fresh recipient has never held USDC.
        createAssociatedTokenAccountIdempotentInstruction(
            sender,
            recipientAta,
            recipient,
            mint,
        ),
        createTransferCheckedInstruction(
            senderAta,
            mint,
            recipientAta,
            sender,
            baseUnits,
            USDC_DECIMALS,
        ),
    );

    // requireAllSignatures:false — Privy adds the wallet signature on send.
    return tx.serialize({ requireAllSignatures: false, verifySignatures: false });
}
