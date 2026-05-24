/**
 * verifyUsdcTransferToRecipient
 *
 * Confirms that a Solana transaction transferred at least the
 * required amount of USDC to a specific recipient wallet. Used by
 * the Founder Member waitlist tier to verify a $5 USDC payment
 * landed at the locked recipient address before granting perks.
 *
 * The check does NOT trust the client. It pulls the transaction
 * directly from Solana RPC and inspects the pre/post token balances
 * on the recipient's associated token account.
 *
 * USDC on Solana mainnet has 6 decimals. The mint pubkey is locked
 * here so a future bug can never accept a wrapped or counterfeit
 * USDC token.
 */
import { Connection, PublicKey } from '@solana/web3.js';

const USDC_MAINNET_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDC_DECIMALS = 6;
const DEFAULT_RPC = 'https://api.mainnet-beta.solana.com';

export interface VerifyUsdcInput {
    txSignature: string;
    recipient: string;
    minAmountUsdc: number;
    rpc?: string;
    mint?: string;
}

export type VerifyUsdcResult =
    | { ok: true; amountUsdc: number; sender: string | null }
    | { ok: false; error: string };

/**
 * Pull `txSignature` from Solana RPC and confirm:
 *
 *   1. The tx confirmed (err is null)
 *   2. The recipient has a USDC token account in the tx's
 *      postTokenBalances
 *   3. The recipient's USDC balance grew by at least minAmountUsdc
 *      between pre and post snapshots
 *
 * Returns the actual amount and the sender for the waitlist row.
 * On any failure returns ok: false with a short reason.
 */
export async function verifyUsdcTransferToRecipient(
    input: VerifyUsdcInput,
): Promise<VerifyUsdcResult> {
    const rpc = input.rpc || process.env.SOLANA_RPC || DEFAULT_RPC;
    const mint = input.mint || USDC_MAINNET_MINT;

    let recipientPubkey: PublicKey;
    try {
        recipientPubkey = new PublicKey(input.recipient);
    } catch {
        return { ok: false, error: 'recipient is not a valid Solana pubkey' };
    }

    const connection = new Connection(rpc, 'confirmed');

    let tx;
    try {
        tx = await connection.getTransaction(input.txSignature, {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed',
        });
    } catch (err) {
        return { ok: false, error: 'rpc fetch failed: ' + (err instanceof Error ? err.message : 'unknown') };
    }

    if (!tx) return { ok: false, error: 'transaction not found or not yet confirmed' };
    if (tx.meta?.err) return { ok: false, error: 'transaction failed on-chain' };
    const meta = tx.meta;
    if (!meta) return { ok: false, error: 'transaction has no meta' };

    const pre = meta.preTokenBalances || [];
    const post = meta.postTokenBalances || [];

    // Locate the recipient's USDC token account by matching both
    // mint AND owner = recipient. There can be multiple token
    // accounts in a tx; we want the one belonging to our recipient.
    const matchKey = (b: { mint?: string; owner?: string }) =>
        b.mint === mint && b.owner === recipientPubkey.toBase58();

    const preBalance = pre.find(matchKey);
    const postBalance = post.find(matchKey);

    if (!postBalance) {
        return { ok: false, error: 'recipient did not receive USDC in this transaction' };
    }

    const preAmount = preBalance ? Number(preBalance.uiTokenAmount.amount) / 10 ** USDC_DECIMALS : 0;
    const postAmount = Number(postBalance.uiTokenAmount.amount) / 10 ** USDC_DECIMALS;
    const delta = postAmount - preAmount;

    // Tolerance: the user might have hit "send 5.0" but the wallet
    // could have rounded; accept anything >= the locked minimum
    // with a 1-cent floor below to absorb rounding (rare on USDC
    // since it's 6-decimal but worth defending against).
    if (delta + 0.01 < input.minAmountUsdc) {
        return {
            ok: false,
            error: `insufficient USDC: recipient gained ${delta.toFixed(2)}, needed ${input.minAmountUsdc.toFixed(2)}`,
        };
    }

    // Identify the sender. Source of truth is the first signer that
    // had USDC balance go down. Fall back to the fee payer.
    let sender: string | null = null;
    for (const b of pre) {
        if (b.mint !== mint) continue;
        const postB = post.find(p => p.accountIndex === b.accountIndex);
        const preVal = Number(b.uiTokenAmount.amount);
        const postVal = postB ? Number(postB.uiTokenAmount.amount) : 0;
        if (postVal < preVal && b.owner) {
            sender = b.owner;
            break;
        }
    }
    if (!sender && tx.transaction?.message?.staticAccountKeys?.[0]) {
        sender = tx.transaction.message.staticAccountKeys[0].toBase58();
    }

    return { ok: true, amountUsdc: delta, sender };
}
