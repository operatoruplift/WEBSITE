import { test, expect } from '@playwright/test';

// Cold-compile budget: homepage compiles on first hit. 90s leaves
// room for compile + locator polling.
test.describe.configure({ timeout: 90_000 });

/**
 * Locks in the homepage Pricing section CTA targets so a future
 * copy sweep doesn't silently break the conversion path.
 *
 * Wave1-risks.spec.ts covers the dedicated /pricing page CTAs. This
 * spec covers the homepage Pricing section CTAs, which sit one
 * scroll above the Comparison table and are the primary signup
 * surface for a first-time visitor.
 *
 * Updated 2026-05-21 for the waitlist pivot (PR #656). Operator
 * directive: users should not be able to sign up bypassing the
 * waitlist. The Pro tier CTA flipped from "Start Pro" -> /paywall
 * to "Join the waitlist" -> /waitlist.
 *
 *   Free   -> /chat                  (Try the demo)
 *   Pro    -> /waitlist              (Join the waitlist)
 *   Team   -> https://cal.com/...    (Book a call) -- Team pricing is custom
 *
 * If anyone reroutes the Pro CTA back to /paywall, /signup, or /login
 * without a waitlist gate, the pivot silently regresses and strangers
 * can sign up bypassing the queue.
 */

test('homepage Pricing "Try the demo" CTA points at /chat', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const href = await page.getByRole('link', { name: /Try the demo/i }).first().getAttribute('href');
    expect(href).toBe('/chat');
});

test('homepage Pricing Pro tier CTA points at /waitlist', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // /waitlist is the canonical signup surface for the consumer Pro
    // tier after the waitlist pivot (PR #656). The /paywall page
    // still exists for invited users + the operator-side flow; the
    // homepage Pricing card just stops sending strangers there.
    const href = await page.getByRole('link', { name: /Join the waitlist/i }).first().getAttribute('href');
    expect(href).toBe('/waitlist');
});

test('homepage Pricing "Book a call" CTA points at cal.com (Team is custom)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Team pricing is now custom (not $299/mo). The CTA goes straight
    // to Cal.com so a team buyer can reach a human without first
    // signing in. Previously this pointed at /login?returnTo=/paywall.
    const href = await page.getByRole('link', { name: /Book a call/i }).first().getAttribute('href');
    expect(href).toMatch(/cal\.com/);
});
