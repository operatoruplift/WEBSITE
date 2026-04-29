import { test, expect } from '@playwright/test';
import { Keypair } from '@solana/web3.js';
import {
    getTreasuryAddress,
    getEarlyAccessPriceSol,
    getEarlyAccessPriceLamports,
    buildSolanaPayUrl,
    buildPhantomDeeplink,
} from '@/lib/solana/pay';

/**
 * Unit tests for the URL/PublicKey builders in lib/solana/pay.
 *
 * The /login → Early Access flow generates a Solana Pay URL and a
 * Phantom deeplink that include:
 *   - The treasury wallet address
 *   - The 0.1 SOL price
 *   - A unique reference key (so the verify-payment route can find
 *     this exact tx among the treasury's recent activity)
 *
 * A regression in any of these would either:
 * - Charge a different amount than the UI shows
 * - Send funds to the wrong address
 * - Lose the reference, breaking the on-chain verification step
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/solana-pay-builders.spec.ts --reporter=list
 */

test.describe('Constants', () => {
    test('Early Access price is 0.1 SOL', () => {
        expect(getEarlyAccessPriceSol()).toBe(0.1);
    });

    test('Early Access lamports is 0.1 * LAMPORTS_PER_SOL = 100,000,000', () => {
        expect(getEarlyAccessPriceLamports()).toBe(100_000_000);
    });

    test('Treasury address parses as a valid Solana PublicKey', () => {
        const addr = getTreasuryAddress();
        // Sanity: a Solana PublicKey base58-encodes to 32-44 chars.
        // The previous fallback ("UpL1ft1...") was 44 chars but did not
        // decode to a valid 32-byte pubkey, so getTreasuryAddress()
        // threw whenever NEXT_PUBLIC_TREASURY_WALLET was unset. The
        // current fallback is the System Program ID, which is a
        // canonical valid pubkey (decodes to 32 zero bytes).
        expect(() => addr.toBase58()).not.toThrow();
        expect(addr.toBase58().length).toBeGreaterThanOrEqual(32);
        expect(addr.toBase58().length).toBeLessThanOrEqual(44);
    });
});

test.describe('buildSolanaPayUrl', () => {
    test('returns a solana: URI with all required Solana Pay fields', () => {
        const ref = Keypair.generate().publicKey;
        const url = buildSolanaPayUrl(ref);
        expect(url).toMatch(/^solana:[1-9A-HJ-NP-Za-km-z]+/);
        expect(url).toContain(`amount=${getEarlyAccessPriceSol()}`);
        expect(url).toContain(`reference=${ref.toBase58()}`);
        expect(url).toContain('label=');
        expect(url).toContain('message=');
    });

    test('embeds the treasury address as the recipient', () => {
        const ref = Keypair.generate().publicKey;
        const url = buildSolanaPayUrl(ref);
        const treasury = getTreasuryAddress().toBase58();
        // recipient comes right after `solana:` and before `?`
        const match = url.match(/^solana:([^?]+)\?/);
        expect(match).not.toBeNull();
        expect(match![1]).toBe(treasury);
    });

    test('URL-encodes label and message', () => {
        const ref = Keypair.generate().publicKey;
        const url = buildSolanaPayUrl(ref);
        // Spaces become %20 in the URL-encoded form. The decoded label
        // should be "Operator Uplift Early Access".
        const labelParam = new URL(url.replace(/^solana:/, 'https://example/?recipient=')).searchParams.get('label');
        expect(labelParam).toBe('Operator Uplift Early Access');
        const msgParam = new URL(url.replace(/^solana:/, 'https://example/?recipient=')).searchParams.get('message');
        expect(msgParam).toBe('Payment for immediate dashboard access');
    });

    test('different references produce different URLs', () => {
        const a = buildSolanaPayUrl(Keypair.generate().publicKey);
        const b = buildSolanaPayUrl(Keypair.generate().publicKey);
        expect(a).not.toBe(b);
    });
});

test.describe('buildPhantomDeeplink', () => {
    test('returns a phantom.app/ul/transfer URL', () => {
        const ref = Keypair.generate().publicKey;
        const url = buildPhantomDeeplink(ref);
        expect(url.startsWith('https://phantom.app/ul/transfer?')).toBe(true);
    });

    test('includes recipient, amount, reference, label, message as query params', () => {
        const ref = Keypair.generate().publicKey;
        const url = new URL(buildPhantomDeeplink(ref));
        expect(url.searchParams.get('recipient')).toBe(getTreasuryAddress().toBase58());
        expect(url.searchParams.get('amount')).toBe(String(getEarlyAccessPriceSol()));
        expect(url.searchParams.get('reference')).toBe(ref.toBase58());
        expect(url.searchParams.get('label')).toBe('Operator Uplift Early Access');
        expect(url.searchParams.get('message')).toBe('Payment for immediate dashboard access');
    });

    test('different references produce different deeplinks', () => {
        const a = buildPhantomDeeplink(Keypair.generate().publicKey);
        const b = buildPhantomDeeplink(Keypair.generate().publicKey);
        expect(a).not.toBe(b);
    });

    test('amount param matches the Solana Pay URL amount exactly', () => {
        // Cross-builder consistency: the same payment description on
        // both surfaces must charge the exact same amount. A regression
        // that drifted these would charge users one amount but show
        // them another in the wallet UI.
        const ref = Keypair.generate().publicKey;
        const solanaUrl = buildSolanaPayUrl(ref);
        const phantomUrl = new URL(buildPhantomDeeplink(ref));
        const solanaAmount = solanaUrl.match(/amount=([^&]+)/)?.[1];
        expect(phantomUrl.searchParams.get('amount')).toBe(solanaAmount);
    });

    test('recipient on Phantom deeplink matches treasury on Solana Pay URL', () => {
        const ref = Keypair.generate().publicKey;
        const solanaUrl = buildSolanaPayUrl(ref);
        const phantomUrl = new URL(buildPhantomDeeplink(ref));
        const solanaRecipient = solanaUrl.match(/^solana:([^?]+)\?/)?.[1];
        expect(phantomUrl.searchParams.get('recipient')).toBe(solanaRecipient);
    });
});
