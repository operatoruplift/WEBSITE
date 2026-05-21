import { test, expect } from '@playwright/test';

// Cold-compile budget: homepage compiles on first hit. 90s leaves
// room for compile + locator polling.
test.describe.configure({ timeout: 90_000 });

/**
 * Locks in the homepage Pricing section CTA targets so a future
 * copy sweep doesn't silently break the conversion path.
 *
 * Post-pivot (2026-05-21 Gamify Your Growth) the Free and Pro
 * tiers both funnel into /waitlist until the paid Pro surface
 * ships in Phase 8. Team pricing is custom and goes straight to
 * Cal.com so a team buyer can reach a human without first
 * signing in.
 *
 *   Free   -> /waitlist               (Join the waitlist)
 *   Pro    -> /waitlist               (Join the waitlist)
 *   Team   -> https://cal.com/...     (Book a call)
 *
 * Source of truth: docs/PIVOT_GAMIFY_GROWTH.md.
 */

test('homepage Pricing Free tier CTA points at /waitlist', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Scope to the homepage Pricing section so the assertion does not
    // pick up the Hero waitlist CTA above.
    const pricing = page.locator('#pricing');
    await expect(pricing).toBeVisible({ timeout: 10_000 });

    const freeCard = pricing.locator('li').filter({ has: page.getByText(/^Free$/) }).first();
    const href = await freeCard.getByRole('link', { name: /Join the waitlist/i }).first().getAttribute('href');
    expect(href).toBe('/waitlist');
});

test('homepage Pricing Pro tier CTA points at /waitlist', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Pre-pivot this CTA pointed at /paywall. Phase 8 will reintroduce
    // a paid Pro surface; until then the waitlist captures intent.
    const pricing = page.locator('#pricing');
    await expect(pricing).toBeVisible({ timeout: 10_000 });

    const proCard = pricing.locator('li').filter({ has: page.getByText(/^Pro$/) }).first();
    const href = await proCard.getByRole('link', { name: /Join the waitlist/i }).first().getAttribute('href');
    expect(href).toBe('/waitlist');
});

test('homepage Pricing "Book a call" CTA points at cal.com (Team is custom)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const href = await page.getByRole('link', { name: /Book a call/i }).first().getAttribute('href');
    expect(href).toMatch(/cal\.com/);
});
