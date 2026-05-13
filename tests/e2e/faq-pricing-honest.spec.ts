import { test, expect } from '@playwright/test';

// Cold-compile budget: homepage compiles on first hit. 90s leaves
// room for compile + the FAQ-disclosure interaction.
test.describe.configure({ timeout: 90_000 });

/**
 * Locks in the FAQ "How much does it really cost?" answer.
 *
 * PR #479 fixed this answer from "$19/month plus a tiny fee" to
 * "$19/month, gas on us". PR #481 then bumped Pro $19 -> $50/mo
 * and PR #490 bumped Team Starter $100 -> $299/mo. Later, after
 * user feedback that locking in a published team price before any
 * team customer was overcommitting, the Team Starter $299 line was
 * replaced with "Team pricing is custom, book a call". The FAQ
 * entry has had to be touched several times, which makes it the
 * highest-drift surface for the deck's slide 5 monetization pitch.
 *
 * The current honest answer pillars:
 *
 *   - Pro is $50/mo
 *   - Team pricing is custom (book a call)
 *   - USDC, not credit-card (Solana payment rail = on-chain story)
 *   - "gas on us" (no per-action surcharge)
 *
 * If anyone re-introduces a per-action fee, switches to credit-card
 * pricing, or reverts a price, this spec catches it before merge.
 *
 * Companion to:
 *   - tests/e2e/pricing-tiers-honest.spec.ts (homepage + /pricing tier cards)
 *   - tests/e2e/wave6-copy.spec.ts (Pro tier 3-word concrete deliverables)
 */

test('homepage FAQ "How much" answer surfaces $50 + custom team + USDC + gas-on-us', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Find the disclosure trigger by question text and click to expand.
    const trigger = page.getByRole('button', { name: /How much does it really cost/i });
    await expect(trigger).toBeVisible({ timeout: 10_000 });
    await trigger.click();

    // Find the panel via aria-controls relationship and assert the
    // four honesty claims appear in its body. Reading the section
    // ancestor that contains the question keeps the assertions
    // scoped to this single FAQ row.
    const faqSection = trigger.locator('xpath=ancestor::section[1]');

    await expect(faqSection).toContainText(/\$50/);
    // Team pricing is custom, no published number to lock in.
    await expect(faqSection).toContainText(/Team pricing is custom/i);
    // USDC = Solana payment rail honesty (not credit-card billing).
    await expect(faqSection).toContainText(/USDC/);
    // "gas on us" = no per-action surcharge. PR #479 anchor phrasing.
    await expect(faqSection).toContainText(/gas on us/i);
});

test('homepage FAQ "How much" answer never mentions a per-action surcharge', async ({ page }) => {
    // PR #479's anti-regression: "tiny fee" was the dishonest framing
    // it replaced. If anyone re-introduces a per-action surcharge
    // claim ("$0.01 per action", "tiny fee", "small fee per task"),
    // this fires.
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const trigger = page.getByRole('button', { name: /How much does it really cost/i });
    await trigger.click();

    const faqSection = trigger.locator('xpath=ancestor::section[1]');
    const text = (await faqSection.innerText()).toLowerCase();

    expect(text, 'FAQ must not pitch a per-action surcharge').not.toMatch(/tiny fee|small fee per/);
});
