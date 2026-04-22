/**
 * Solana Pay integration for Early Access payments.
 *
 * Generates a transfer request for 0.1 SOL to the treasury wallet.
 * After payment, the verify-payment API route confirms on-chain
 * and writes to the early_access Supabase table.
 */
import { PublicKey, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Treasury wallet, receives early-access payments
const TREASURY_WALLET = process.env.NEXT_PUBLIC_TREASURY_WALLET || 'UpL1ft11111111111111111111111111111111111111';
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const EARLY_ACCESS_PRICE_SOL = 0.1;

export function getTreasuryAddress(): PublicKey {
    return new PublicKey(TREASURY_WALLET);
}

export function getEarlyAccessPriceSol(): number {
    return EARLY_ACCESS_PRICE_SOL;
}

export function getEarlyAccessPriceLamports(): number {
    return EARLY_ACCESS_PRICE_SOL * LAMPORTS_PER_SOL;
}

/** Build a Solana Pay transfer URL for the early-access payment. */
export function buildSolanaPayUrl(reference: PublicKey): string {
    const recipient = getTreasuryAddress();
    const amount = EARLY_ACCESS_PRICE_SOL;
    const label = encodeURIComponent('Operator Uplift Early Access');
    const message = encodeURIComponent('Payment for immediate dashboard access');
    const ref = reference.toBase58();

    return `solana:${recipient.toBase58()}?amount=${amount}&label=${label}&message=${message}&reference=${ref}`;
}

/**
 * Build a Phantom deeplink that works on both desktop (opens Phantom browser
 * extension or redirects to phantom.app) and mobile (opens the Phantom app).
 * Falls back to the raw solana: URI if Phantom isn't the target.
 */
export function buildPhantomDeeplink(reference: PublicKey): string {
    const recipient = getTreasuryAddress();
    const amount = EARLY_ACCESS_PRICE_SOL;
    const ref = reference.toBase58();

    // Phantom's universal transfer deeplink
    const transferUrl = new URL('https://phantom.app/ul/transfer');
    transferUrl.searchParams.set('recipient', recipient.toBase58());
    transferUrl.searchParams.set('amount', String(amount));
    transferUrl.searchParams.set('reference', ref);
    transferUrl.searchParams.set('label', 'Operator Uplift Early Access');
    transferUrl.searchParams.set('message', 'Payment for immediate dashboard access');

    return transferUrl.toString();
}

/** Verify that a transaction with the given reference exists on-chain. */
export async function verifyPayment(referenceKey: string): Promise<{
    confirmed: boolean;
    signature?: string;
    error?: string;
}> {
    try {
        const connection = new Connection(SOLANA_RPC, 'confirmed');
        const reference = new PublicKey(referenceKey);

        // Find transactions that include this reference key
        const signatures = await connection.getSignaturesForAddress(reference, { limit: 1 });

        if (signatures.length === 0) {
            return { confirmed: false, error: 'No transaction found for this reference' };
        }

        const sig = signatures[0];
        if (sig.err) {
            return { confirmed: false, error: 'Transaction failed on-chain' };
        }

        // Verify the transaction transferred the correct amount to the treasury
        const tx = await connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
        });

        if (!tx || !tx.meta) {
            return { confirmed: false, error: 'Transaction not found or pending' };
        }

        // Check that the treasury received at least 0.1 SOL
        const treasuryIndex = tx.transaction.message.staticAccountKeys.findIndex(
            (key) => key.toBase58() === TREASURY_WALLET
        );

        if (treasuryIndex === -1) {
            return { confirmed: false, error: 'Treasury wallet not found in transaction' };
        }

        const preBalance = tx.meta.preBalances[treasuryIndex];
        const postBalance = tx.meta.postBalances[treasuryIndex];
        const received = (postBalance - preBalance) / LAMPORTS_PER_SOL;

        if (received < EARLY_ACCESS_PRICE_SOL * 0.99) {
            return { confirmed: false, error: `Insufficient payment: ${received.toFixed(4)} SOL (need ${EARLY_ACCESS_PRICE_SOL})` };
        }

        return { confirmed: true, signature: sig.signature };
    } catch (err) {
        return { confirmed: false, error: err instanceof Error ? err.message : 'Verification failed' };
    }
}
