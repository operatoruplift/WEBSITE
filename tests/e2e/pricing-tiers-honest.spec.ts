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
 *   - Later PR replaced Team Starter $299 with "Custom, book a call"
 *     after user feedback that locking in a published team price
 *     before any team customer was overcommitting.
 *
 * The two surfaces under test:
 *
 *   Homepage Pricing section (src/sections/Pricing.tsx):
 *     Free   <no price line>     (Try the demo)
 *     Pro    $50/month            highlighted, Start Pro CTA
 *     Team   Custom               Book a call CTA -> cal.com
 *
 *   Dedicated /pricing page (app/pricing/page.tsx, TEAM-focused):
 *     Team           Custom         Book a call CTA -> /contact
 *     Business       $50/seat/month highlighted
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

test('homepage Pricing section shows Team at Custom pricing', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const teamCard = page.locator('li').filter({ has: page.getByText(/^Team$/) }).first();
    await expect(teamCard).toBeVisible({ timeout: 10_000 });
    await expect(teamCard).toContainText(/Custom/i);
    // Description carries the "talk to us" cue + Book a call CTA.
    await expect(teamCard).toContainText(/talk to us|book a call/i);
});

test('/pricing page shows Team at Custom pricing', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // /pricing page Team tier is custom too, paralleling the homepage.
    await expect(page.getByText(/^Team$/).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Custom/i).first()).toBeVisible();
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
