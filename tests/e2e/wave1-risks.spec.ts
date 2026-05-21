import { test, expect } from '@playwright/test';

// Cold-compile budget: the dev server compiles each route on first
// hit; CI runs against a cold server. 90s leaves room for compile +
// assertions on /signup and /pricing without flaking under load.
test.describe.configure({ timeout: 90_000 });

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
    // The redirect is server-side via next/navigation::redirect.
    // Use waitUntil:'load' (not domcontentloaded) so Playwright follows
    // the 307 all the way to /login. With domcontentloaded the URL
    // can briefly read as /signup on a cold dev server before Next
    // emits the redirect response.
    await page.goto('/signup', { waitUntil: 'load', timeout: 60_000 });

    // The final URL should be /login (with no query string from us).
    // Increase the toHaveURL polling budget to absorb cold-compile.
    await expect(page).toHaveURL(/\/login(\?|$)/, { timeout: 30_000 });
});

test('/login is reachable directly (sanity)', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(page).toHaveURL(/\/login(\?|$)/);
});

test('/pricing Operator Circle CTA goes to /waitlist (v10 reframe)', async ({ page }) => {
    // v10 reframes /pricing as the org/B2B entry point. The
    // retired Team/Business/Enterprise tier grid is gone. Operator
    // Circle is the highlighted self-serve tier and funnels into
    // /waitlist (same as the homepage Pricing CTAs) until the
    // paid surface ships in Phase 8.
    await page.goto('/pricing', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const circleCtaHref = await page
        .locator('a:has-text("Join the waitlist")')
        .first()
        .getAttribute('href');
    expect(circleCtaHref).toBe('/waitlist');
});

test('/pricing Enterprise CTA stays /contact (org sales handoff)', async ({ page }) => {
    // Enterprise is the explicit exception: custom pricing for orgs
    // that want SSO + per-seat + compliance paperwork. The handoff
    // is human, not self-serve, so this CTA must keep landing on
    // /contact even when other tier CTAs change.
    await page.goto('/pricing', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const enterpriseHref = await page
        .locator('a:has-text("Book a call")')
        .first()
        .getAttribute('href');
    expect(enterpriseHref).toBe('/contact');
});

test('homepage hero CTA "Join the waitlist" deep-links to /waitlist', async ({ page }) => {
    // 2026-05-21 Gamify Your Growth pivot. The Hero primary CTA used
    // to be "Sign in and connect Gmail" -> /login?returnTo=/integrations
    // for the AI-assistant product. The pivot funnels visitors into
    // /waitlist instead until the paid surface ships in Phase 8.
    // Source of truth: docs/PIVOT_GAMIFY_GROWTH.md.
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const heroCtaHref = await page
        .getByRole('link', { name: /join the waitlist/i })
        .first()
        .getAttribute('href');
    expect(heroCtaHref).toBe('/waitlist');
});
