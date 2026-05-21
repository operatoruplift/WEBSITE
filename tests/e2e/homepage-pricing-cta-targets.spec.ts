import { test, expect } from '@playwright/test';

// Cold-compile budget: homepage compiles on first hit. 90s leaves
// room for compile + locator polling.
test.describe.configure({ timeout: 90_000 });

/**
 * Locks in the homepage Pricing section CTA targets so a future
 * copy sweep doesn't silently break the conversion path.
 *
 * v10 reframe (2026-05-21 Commitment Infrastructure):
 *   Operator Free   -> /waitlist  (Join the waitlist)
 *   Operator Pro    -> /waitlist  (Join the waitlist)
 *   Operator Circle -> /waitlist  (Join the waitlist)
 *
 * All three tiers funnel into /waitlist until the paid surface
 * ships in Phase 8. Source of truth: docs/PIVOT_GAMIFY_GROWTH.md.
 */

test('homepage Pricing Operator Free tier CTA points at /waitlist', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Scope to the homepage Pricing section so the assertion does not
    // pick up the Hero waitlist CTA above.
    const pricing = page.locator('#pricing');
    await expect(pricing).toBeVisible({ timeout: 10_000 });

    const freeCard = pricing.locator('li').filter({ has: page.getByText(/^Operator Free$/) }).first();
    const href = await freeCard.getByRole('link', { name: /Join the waitlist/i }).first().getAttribute('href');
    expect(href).toBe('/waitlist');
});

test('homepage Pricing Operator Pro tier CTA points at /waitlist', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const pricing = page.locator('#pricing');
    await expect(pricing).toBeVisible({ timeout: 10_000 });

    // Locator anchors on the FULL tier name so it does not collide
    // with "Operator Pro" matching "Operator Free" or other partials.
    const proCard = pricing.locator('li').filter({ has: page.getByText(/^Operator Pro$/) }).first();
    const href = await proCard.getByRole('link', { name: /Join the waitlist/i }).first().getAttribute('href');
    expect(href).toBe('/waitlist');
});

test('homepage Pricing Operator Circle tier CTA points at /waitlist', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // v10 replaces the Custom "Team" tier (with a "Book a call" CTA
    // to cal.com) with Operator Circle at $24/month. The Circle CTA
    // funnels into the same waitlist as the other tiers until the
    // paid surface ships.
    const pricing = page.locator('#pricing');
    await expect(pricing).toBeVisible({ timeout: 10_000 });

    const circleCard = pricing.locator('li').filter({ has: page.getByText(/^Operator Circle$/) }).first();
    const href = await circleCard.getByRole('link', { name: /Join the waitlist/i }).first().getAttribute('href');
    expect(href).toBe('/waitlist');
});
