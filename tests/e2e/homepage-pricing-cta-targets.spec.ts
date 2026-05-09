import { test, expect } from '@playwright/test';

// Cold-compile budget: homepage compiles on first hit. 90s leaves
// room for compile + locator polling.
test.describe.configure({ timeout: 90_000 });

/**
 * Locks in the homepage Pricing section CTA targets so a future
 * copy sweep doesn't silently break the conversion path.
 *
 * Wave1-risks.spec.ts already covers the dedicated /pricing page
 * CTAs (Team Starter + Business -> /login?returnTo=/paywall). This
 * spec covers the homepage Pricing section CTAs, which sit one
 * scroll above the Comparison table and are the primary signup
 * surface for a first-time visitor:
 *
 *   Free          -> /chat            (Try the demo)
 *   Pro           -> /paywall         (Start Pro)
 *   Team Starter  -> /login?returnTo=/paywall (Start team plan)
 *
 * If anyone reroutes "Start Pro" to /signup, /pricing, or removes
 * /paywall, the conversion path silently breaks — and the demo
 * recording's signup beat collapses with it.
 */

test('homepage Pricing "Try the demo" CTA points at /chat', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const href = await page.getByRole('link', { name: /Try the demo/i }).first().getAttribute('href');
    expect(href).toBe('/chat');
});

test('homepage Pricing "Start Pro" CTA points at /paywall', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // /paywall is the deposit-to-credit page (app/(auth)/paywall/page.tsx)
    // and is the canonical Pro signup surface for both anonymous and
    // logged-in visitors. usePrivy in the (auth) layout handles the
    // post-login redirect.
    const href = await page.getByRole('link', { name: /Start Pro/i }).first().getAttribute('href');
    expect(href).toBe('/paywall');
});

test('homepage Pricing "Start team plan" CTA points at /login?returnTo=/paywall', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Team Starter requires login first because the team flow needs
    // a signed-in user to attach the seat allocation to (server-side
    // user_subscriptions row). The deep-link returnTo=/paywall keeps
    // the team buyer on the conversion path post-login.
    const href = await page.getByRole('link', { name: /Start team plan/i }).first().getAttribute('href');
    expect(href).toBe('/login?returnTo=/paywall');
});
