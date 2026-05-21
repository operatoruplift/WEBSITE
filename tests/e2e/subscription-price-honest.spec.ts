import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the subscription invoice price at $50 USDC.
 *
 * PR #481 bumped the Pro tier price from $19 to $50 across all
 * marketing surfaces (homepage Pricing, FAQ, /paywall CTA, /settings/
 * part2-runner). The API route at /api/subscription that actually
 * creates the on-chain invoice was missed and continued to charge
 * $19. That meant the marketing said $50 while the wallet popup
 * showed $19, which is both a revenue leak and a trust violation
 * (we promise the price; the payment confirms a different one).
 *
 * This spec locks the API route price + amount fields at 50.00 so
 * a future refactor can't silently revert. It also asserts there
 * is no leftover 19.00 literal in the file.
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const routeSrc = fs.readFileSync(
    path.join(repoRoot, 'app', 'api', 'subscription', 'route.ts'),
    'utf-8',
);

test('subscription invoice price_usdc is 50.00', () => {
    // Both upsert blocks (create_invoice + dev_simulate) write the
    // same price_usdc value into the subscriptions table.
    const matches = routeSrc.match(/price_usdc:\s*50\.00/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
});

test('create_invoice response amount_usdc is 50.00', () => {
    // The amount the client uses to build the Solana Pay URL must
    // match the price stored in the row.
    expect(routeSrc).toMatch(/amount_usdc:\s*50\.00/);
});

test('subscription route has no leftover 19.00 literal', () => {
    // Catches a future refactor that introduces a constant called
    // PRO_PRICE_USDC = 19.00 by mistake, even if the upsert lines
    // above are updated to read from the constant.
    expect(routeSrc).not.toMatch(/19\.00/);
});
