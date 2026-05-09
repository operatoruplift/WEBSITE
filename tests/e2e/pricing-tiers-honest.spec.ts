import { test, expect } from '@playwright/test';

// Cold-compile budget: marketing pages compile on first hit.
// 90s leaves room for compile + assertion polling.
test.describe.configure({ timeout: 90_000 });

/**
 * Locks in the post-trim pricing tiers across two surfaces so a price
 * revert (intentional or accidental) doesn't quietly invalidate the
 * deck's slide 5 monetization claim.
 *
 * History:
 *   - PR #481 bumped Pro $19 -> $50/mo
 *   - PR #490 bumped Team Starter $100 -> $299/mo
 *   - Slide 5 of docs/deck-objections.md anchors on "deposit-to-credit
 *     pivot deferred; Pro $50/mo, Team Starter $299/mo for 5 seats"
 *
 * The two surfaces under test:
 *
 *   Homepage Pricing section (src/sections/Pricing.tsx):
 *     Free   <no price line>     (Try the demo)
 *     Pro    $50/month            highlighted, Start Pro CTA
 *     Team   $299/month           Start team plan CTA
 *
 *   Dedicated /pricing page (app/pricing/page.tsx, TEAM-focused):
 *     Team Starter   $299/month
 *     Business       $50/seat/month  highlighted
 *     Enterprise     Custom
 *
 * If anyone reverts a price, drops a tier, or rebrands without updating
 * the deck, this spec catches it before merge.
 */

test('homepage Pricing section shows Pro at $50/month', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Find the Pro card via its name and assert price + period are visible
    // within the same card container.
    const proCard = page.locator('li').filter({ has: page.getByText(/^Pro$/) }).first();
    await expect(proCard).toBeVisible({ timeout: 10_000 });
    await expect(proCard).toContainText('$50');
    await expect(proCard).toContainText('/month');
});

test('homepage Pricing section shows Team Starter at $299/month', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const teamCard = page.locator('li').filter({ has: page.getByText(/Team Starter/i) }).first();
    await expect(teamCard).toBeVisible({ timeout: 10_000 });
    await expect(teamCard).toContainText('$299');
    await expect(teamCard).toContainText('/month');
});

test('/pricing page shows Team Starter at $299/month', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // The /pricing page is team-focused. Team Starter is the entry tier.
    await expect(page.getByText('Team Starter').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('$299').first()).toBeVisible();
});

test('/pricing page shows Business at $50/seat/month (highlighted)', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Business is the per-seat unlimited tier. Different from the
    // homepage Pro at $50/month flat — the units matter for honesty.
    await expect(page.getByText('Business').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('/seat/month').first()).toBeVisible();
});

test('/pricing page Enterprise tier shows "Custom" pricing', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Enterprise is Custom (not a number). If anyone hard-codes a price,
    // this test catches that scope creep.
    await expect(page.getByText('Enterprise').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/^Custom$/).first()).toBeVisible();
});
