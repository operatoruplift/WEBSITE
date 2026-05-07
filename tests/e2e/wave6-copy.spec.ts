import { test, expect } from '@playwright/test';

/**
 * Locks in PR #457's Wave 6 marketing-copy refresh.
 *
 * The consumer-copy spec (tests/e2e/consumer-copy.spec.ts) covers the
 * hero headline + Local-First trust-grid existence. This spec covers
 * the deck-aligned details that can quietly drift in a copy sweep:
 *
 * - LocalFirst continuity callout: "Move the API key, keep the
 *   assistant." This is the deck objection answer for "what if the
 *   model changes?" so it must stay on the page until the deck is
 *   recorded.
 * - TrustedBy section header: "Built on the model you already pay
 *   for." Replaced the original "Works With Any Model" because the
 *   marquee shows logos for the model menu, not external partners.
 * - Pricing Pro tier description: "Real Gmail, real calendar, real
 *   receipts". Three-word concrete deliverables, replaced softer
 *   "for the boring stuff" framing.
 */

test('homepage LocalFirst section shows the continuity callout', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Continuity callout was added in PR #457 below the trust grid.
    // The full sentence "Move the API key, keep the assistant." is
    // the deck objection answer for "what if the model changes?"
    // and the slide-deck-aligned anchor for the local-first pitch.
    await expect(page.getByText(/Move the API key, keep the assistant/i).first())
        .toBeVisible({ timeout: 10_000 });
});

test('homepage TrustedBy marquee uses the new "Built on" framing', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // PR #457 replaced "Works With Any Model" because the row is a
    // model-menu marquee, not third-party partner logos. The new
    // header is the right honesty pitch and shows up on the deck.
    await expect(page.getByText(/Built on the model you already pay for/i).first())
        .toBeVisible({ timeout: 10_000 });

    // The trim from 14 -> 7 logos was deliberate (one canonical per
    // provider); not asserted by exact count to avoid coupling the
    // test to the exact provider list, but the marquee container
    // must exist.
    expect(await page.locator('section, div').filter({ hasText: /Built on the model you already pay for/i }).count())
        .toBeGreaterThan(0);
});

test('/pricing Pro tier surfaces the three-word concrete deliverables', async ({ page }) => {
    // The Pro tier copy is the consumer-facing version of the pitch
    // ("Real Gmail, real calendar, real receipts"). It lives both on
    // /pricing and homepage Pricing section. Tests the homepage
    // version because /pricing is team-tier-focused (Wave 1 risk #4
    // disambiguation).
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    await expect(page.getByText(/Real Gmail, real calendar, real receipts/i).first())
        .toBeVisible({ timeout: 10_000 });
});
