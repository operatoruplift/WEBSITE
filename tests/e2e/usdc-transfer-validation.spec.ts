import { test, expect } from '@playwright/test';
import { buildUsdcTransfer } from '@/lib/solana/usdc-transfer';

/**
 * Hermetic unit tests for the input-validation contract of
 * buildUsdcTransfer (lib/solana/usdc-transfer.ts), the browser-side USDC
 * transfer builder behind the waitlist wallet checkout.
 *
 * These cover only the guard paths that throw BEFORE any RPC call
 * (non-positive/non-finite amount, malformed address), so they need no
 * network. The happy path (recent blockhash + token-account derivation)
 * is exercised manually with a real wallet, not in CI.
 */

const VALID = 'Hory1jnLvqdaiFYmSVWevVSCKzfrZLTfDizoA6veVmQ2';

test.describe('buildUsdcTransfer input validation', () => {
    for (const bad of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
        test(`rejects non-positive/non-finite amount: ${bad}`, async () => {
            await expect(
                buildUsdcTransfer({
                    senderAddress: VALID,
                    recipientAddress: VALID,
                    amountUsdc: bad,
                }),
            ).rejects.toThrow();
        });
    }

    test('rejects a malformed sender address', async () => {
        await expect(
            buildUsdcTransfer({
                senderAddress: 'not-a-real-base58-address!!!',
                recipientAddress: VALID,
                amountUsdc: 5,
            }),
        ).rejects.toThrow();
    });

    test('rejects a malformed recipient address', async () => {
        await expect(
            buildUsdcTransfer({
                senderAddress: VALID,
                recipientAddress: '0x-evm-style-not-solana',
                amountUsdc: 5,
            }),
        ).rejects.toThrow();
    });
});
