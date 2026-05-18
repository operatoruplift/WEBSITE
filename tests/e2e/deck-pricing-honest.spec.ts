import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock docs/deck-objections.md monetization claims against the
 * actual pricing model.
 *
 * The deck is the founder's stage pitch. If it claims a pricing
 * model the product doesn't ship, the founder gets caught
 * mid-paragraph in front of judges. The previous deck (pre-PR
 * fixing this spec's predecessor regression) pitched
 * "$50 USDC deposit, $0.01 per write action, refundable, no
 * subscription" — a deposit-to-credit model that was deferred.
 * The actual product is "$50/month Pro subscription."
 *
 * The deck still acknowledges this in the surface-map row
 * ("`/paywall` currently $50/month Pro subscription;
 * deposit-to-credit pivot deferred") but the pitch and objection
 * answers had drifted from reality. PR fixing this lock pulled
 * the pitch back in line with reality.
 *
 * Companion to:
 *   - pricing-tiers-honest.spec.ts (homepage + /pricing copy)
 *   - faq-pricing-honest.spec.ts (homepage FAQ answer)
 *   - wave6-copy.spec.ts (Pro tier deliverables)
 *   - positioning-tagline-coherence.spec.ts (canonical one-liner)
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const deck = fs.readFileSync(path.join(repoRoot, 'docs', 'deck-objections.md'), 'utf-8');

test('deck pitch claims Pro at $50/month, not a deposit', () => {
    // The pitch paragraph is the most-quoted text in the doc. If
    // it drifts back to "$50 deposit, refill, no subscription",
    // the founder pitches a product the codebase doesn't ship.
    expect(deck).toMatch(/Pro is \$50 a month/);
    expect(deck).not.toMatch(/Pay \$50 once/);
    expect(deck).not.toMatch(/refill when you want/);
});

test('deck monetization point names $50/month + gas-on-us, not per-action surcharge', () => {
    // Point 4 of the brief's four-part pitch ("How monetization
    // works") must match the homepage promise: $50/month Pro,
    // gas on us (the server-side x402 micropayment is our cost,
    // not the user's per-action fee).
    expect(deck).toMatch(/Pro is \$50\/month, gas on us/);
    expect(deck).not.toMatch(/\$0\.01 per write action, refundable, no subscription/);
});

test('deck "Why Solana?" objection answer keeps x402 micropayment framing without claiming the user sees it', () => {
    // The Solana micropayment story is real (x402 gate fires
    // per-action on Solana devnet). The deck just must not pitch
    // it as "the user pays $0.01 per action" — that's never been
    // the model. Lock the corrected framing: micropayments exist
    // server-side, paid by us.
    expect(deck).toMatch(/server-side x402 micropayments per tool call/);
    expect(deck).toMatch(/we pay them so you don't see them/);
});

test('deck "Why pay" objection answer matches actual pricing', () => {
    // The "Why would anyone pay?" answer must align with the
    // homepage pricing. Pro is $50/month + gas-on-us + cancel any
    // time. The old "deposit $50 once, refundable" answer pitched
    // a deferred pricing model.
    expect(deck).toMatch(/Pro is \$50 a month, gas on us, cancel any time/);
    expect(deck).not.toMatch(/The deposit is \$50 once, refundable/);
});

test('deck slide 5 monetization bullet matches the homepage', () => {
    // Slide 5 (the monetization slide) must align with the actual
    // pricing model. "deposit-to-credit, $50 USDC minimum, $0.01
    // per write action, refundable" was the deferred pivot, not
    // what ships.
    expect(deck).toMatch(/Pro \$50\/month, gas on us, no per-action user surcharge/);
    expect(deck).not.toMatch(/deposit-to-credit, \$50 USDC minimum/);
});

test('homepage pricing source-of-truth still says Pro $50/month', () => {
    // Cross-check the deck's claim against the actual source.
    // src/sections/Pricing.tsx renders the homepage tier; if a
    // future refactor moves Pro to a different price or period,
    // this fires and we know to update the deck in lockstep.
    const homepagePricing = fs.readFileSync(
        path.join(repoRoot, 'src', 'sections', 'Pricing.tsx'),
        'utf-8',
    );
    expect(homepagePricing).toMatch(/price:\s*'\$50'/);
    expect(homepagePricing).toMatch(/period:\s*'\/month'/);
});

test('README pricing paragraph matches the actual subscription model', () => {
    // The README is the judge's other entry point (alongside the
    // deck). It used to claim "$50 USDC Pro tier with $0.01 per
    // write action gated through x402" — same deposit-to-credit
    // fabrication-rot that surfaced in the deck. PR fixing this
    // moved the framing to "Pro is $50/month + gas on us."
    const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf-8');
    expect(readme).toMatch(/Pro is \$50\/month in USDC/);
    expect(readme).toMatch(/Per-action gas[\s\S]*?is on us/i);
    expect(readme).not.toMatch(/\$50 USDC Pro tier with \$0\.01 per write action/);
});
