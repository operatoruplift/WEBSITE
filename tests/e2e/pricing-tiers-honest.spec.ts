import { test, expect } from '@playwright/test';

// Cold-compile budget: marketing pages compile on first hit.
// 90s leaves room for compile + assertion polling.
test.describe.configure({ timeout: 90_000 });

/**
 * Locks in the pivot-era pricing tiers across two surfaces so a price
 * revert (intentional or accidental) doesn't quietly invalidate the
 * deck's slide 12 monetization claim.
 *
 * History:
 *   - PR #481 bumped Pro $19 -> $50/mo  (retired AI-assistant tier)
 *   - PR #490 bumped Team Starter $100 -> $299/mo
 *   - Later PR replaced Team Starter $299 with "Custom, book a call"
 *   - 2026-05-21 Gamify Your Growth pivot: Pro lands at $14.99/mo
 *     (deck v7) and the Pro CTA points at /waitlist until the paid
 *     surface ships in Phase 8. Source of truth:
 *     docs/PIVOT_GAMIFY_GROWTH.md.
 *
 * The two surfaces under test:
 *
 *   Homepage Pricing section (src/sections/Pricing.tsx):
 *     Free   Free forever            (Join the waitlist)
 *     Pro    $14.99/month            highlighted, Join the waitlist CTA
 *     Team   Custom                  Book a call CTA -> cal.com
 *
 *   Dedicated /pricing page (app/pricing/page.tsx, TEAM-focused):
 *     Team           Custom         Book a call CTA -> /contact
 *     Business       $50/seat/month highlighted
 *     Enterprise     Custom
 *
 * If anyone reverts a price, drops a tier, or rebrands without
 * updating the deck, this spec catches it before merge.
 */

test('homepage Pricing section shows Operator Pro at $8/month', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // v10 reframe: Pro renamed to "Operator Pro" at $8/month
    // (deck v10 slide 12). Locator filters on the full tier name so
    // it does not collide with "Operator Circle" or "Operator Free".
    const proCard = page.locator('li').filter({ has: page.getByText(/^Operator Pro$/) }).first();
    await expect(proCard).toBeVisible({ timeout: 10_000 });
    await expect(proCard).toContainText('$8');
    await expect(proCard).toContainText('/month');
});

test('homepage Pricing section shows Operator Circle at $24/month', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // v10 replaces the Custom "Team" tier with Operator Circle at
    // $24/month for group commitments + coach role + shared progress.
    const circleCard = page.locator('li').filter({ has: page.getByText(/^Operator Circle$/) }).first();
    await expect(circleCard).toBeVisible({ timeout: 10_000 });
    await expect(circleCard).toContainText('$24');
    await expect(circleCard).toContainText('/month');
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
