import { test, expect } from '@playwright/test';

/**
 * Locks in PR #458's Wave 1 demo-day risk fixes so they don't
 * silently regress before recording.
 *
 * Wave 1 risk #1: /signup wrote a Supabase session token to
 *   localStorage.token, but the rest of the app verifies that token
 *   as a Privy JWT via lib/auth.ts::verifySession. Anyone signing up
 *   through that path got a token that couldn't authenticate against
 *   any gated API. Fix: app/(auth)/signup/page.tsx is now a server
 *   redirect to /login.
 *
 * Wave 1 risk #3: /pricing Team and Business CTAs pointed at /contact
 *   (the sales page), creating a dead end for self-serve buyers who
 *   wanted to start a paid subscription. Fix: those CTAs now go to
 *   /login?returnTo=/paywall. Enterprise stays /contact.
 *
 * The /api/health route gets its own spec at tests/e2e/health-route.spec.ts.
 */

test('GET /signup redirects to /login (Wave 1 risk #1)', async ({ page }) => {
    // domcontentloaded skips wait on fonts/images we don't need.
    // The redirect is server-side via next/navigation::redirect, so
    // the URL after navigation must be /login, not /signup.
    await page.goto('/signup', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // The final URL should be /login (with no query string from us).
    await expect(page).toHaveURL(/\/login(\?|$)/);
});

test('/login is reachable directly (sanity)', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(page).toHaveURL(/\/login(\?|$)/);
});

test('/pricing Team + Business CTAs go to /login?returnTo=/paywall (Wave 1 risk #3)', async ({ page }) => {
    // Marketing pages adopt theme-light at the wrapper, the page is a
    // client component; domcontentloaded is enough since we read DOM.
    await page.goto('/pricing', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Both Team and Business tiers must direct self-serve buyers
    // through Privy auth to the paywall. Enterprise is the
    // sales-call exception and is asserted separately below.
    const ctaHrefs = await page.locator('a:has-text("Get started")').evaluateAll(els =>
        els.map(el => (el as HTMLAnchorElement).getAttribute('href')),
    );
    expect(ctaHrefs.length).toBeGreaterThanOrEqual(2);
    for (const href of ctaHrefs) {
        expect(href).toBe('/login?returnTo=/paywall');
    }
});

test('/pricing Enterprise CTA stays /contact (Wave 1 risk #3 exception)', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Enterprise is the explicit exception: a custom-priced tier
    // with audit/SLA/firewall requirements that needs a sales call,
    // not a self-serve checkout. Locked in so a future "consolidate
    // all tier CTAs" sweep doesn't accidentally route Enterprise
    // buyers through the paywall and lose the human handoff.
    const enterpriseHref = await page
        .locator('a:has-text("Book a call")')
        .first()
        .getAttribute('href');
    expect(enterpriseHref).toBe('/contact');
});
