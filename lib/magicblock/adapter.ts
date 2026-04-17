/**
 * MagicBlock adapter — feature-flagged, stub-only for May 14.
 *
 * MagicBlock is an ephemeral rollup for Solana that can settle
 * transactions faster than mainnet for short-lived interactive
 * workloads. Ideal for our tool-call receipts if we ever need sub-
 * second finality.
 *
 * For now: we ship the adapter interface + an always-inactive stub
 * so the code path exists and can be validated in tests. We do NOT
 * claim MagicBlock is live on the hackathon surface — see
 * /demo/hackathon's MagicBlock card which explicitly renders this as
 * inactive until the env flag is set AND the stub is replaced with a
 * real implementation.
 *
 * Gate:
 *   MAGICBLOCK_ENABLED=1   — flips the UI label from "Inactive" to
 *                            "Active". Does NOT magically make a real
 *                            adapter exist. If set without a real
 *                            implementation, the adapter still refuses
 *                            to submit — we never fake a receipt.
 */

export interface MagicBlockSubmitRequest {
    receiptHash: string;
    payloadBytes: Uint8Array;
}

export interface MagicBlockSubmitResult {
    ok: true;
    rollupTx: string;
    submittedAt: number;
    /** Always present so receipt metadata stores `executed_via = 'magicblock'` or `'solana-devnet'`. */
    executedVia: 'magicblock' | 'solana-devnet';
}

export interface MagicBlockSubmitError {
    ok: false;
    reason: 'disabled' | 'stub_not_configured' | 'network_error';
    message: string;
}

export interface MagicBlockAdapter {
    /** True when the env flag is set AND the adapter is a real implementation. */
    isActive(): boolean;
    submit(req: MagicBlockSubmitRequest): Promise<MagicBlockSubmitResult | MagicBlockSubmitError>;
}

/**
 * Stub adapter. Refuses every submit with reason=stub_not_configured
 * even when MAGICBLOCK_ENABLED=1, so we never pretend to have written
 * to an ephemeral rollup that we haven't wired up.
 *
 * Replace this with a real MagicBlock SDK call to flip `isActive` to
 * true and make `submit` return `{ ok: true, executedVia: 'magicblock' }`.
 */
const stubAdapter: MagicBlockAdapter = {
    isActive(): boolean {
        return false;
    },
    async submit(): Promise<MagicBlockSubmitError> {
        return {
            ok: false,
            reason: 'stub_not_configured',
            message: 'MagicBlock adapter is a stub. Replace lib/magicblock/adapter.ts with a real implementation before flipping MAGICBLOCK_ENABLED in prod.',
        };
    },
};

export function getMagicBlockAdapter(): MagicBlockAdapter {
    // When you ship a real adapter, branch on `process.env.MAGICBLOCK_ENABLED`
    // and return the real implementation. Today, regardless of the flag,
    // we return the stub so receipts never record a fake rollup tx.
    return stubAdapter;
}

/**
 * Helper used by /demo/hackathon to render an honest status pill.
 * Returns `inactive` unless both the flag is set AND the adapter
 * reports itself active. Never returns `active` for the stub.
 */
export function magicBlockSurfaceStatus(): {
    label: string;
    active: boolean;
    reason: string;
} {
    const flag = process.env.NEXT_PUBLIC_MAGICBLOCK_ENABLED === '1';
    const adapter = getMagicBlockAdapter();
    const active = flag && adapter.isActive();
    if (active) {
        return {
            label: 'Active',
            active: true,
            reason: 'Ephemeral rollup adapter wired and enabled.',
        };
    }
    if (flag) {
        return {
            label: 'Inactive',
            active: false,
            reason: 'Flag is on but adapter is still the stub — receipts fall back to Solana devnet.',
        };
    }
    return {
        label: 'Inactive',
        active: false,
        reason: 'Ephemeral rollup adapter shipped but not enabled. Receipts continue to land on Solana devnet.',
    };
}
