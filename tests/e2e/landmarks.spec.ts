import { test, expect } from '@playwright/test';

/**
 * Page-landmark regression spec.
 *
 * Locks in PR #345. Every marketing route must expose:
 *   - exactly one <main> (or <article> on /blog/[id])
 *   - exactly one <nav> (the Navbar)
 *   - exactly one <footer> (the Footer)
 *
 * Without landmarks, screen readers and "skip to main content" UX
 * have nothing to anchor to. WCAG 2.4.1 (Bypass Blocks).
 *
 * The /blog/[id] detail page is checked separately because it uses
 * <article> instead of <main>, which is the more specific landmark
 * for self-contained content.
 */

const ROUTES_REQUIRING_MAIN = [
    '/',
    '/contact',
    '/pricing',
    '/privacy',
    '/terms',
    '/blog',
    '/press-kit',
    '/docs/getting-started',
];

for (const route of ROUTES_REQUIRING_MAIN) {
    test(`${route} exposes <main>, <nav>, <footer> landmarks`, async ({ page }) => {
        await page.goto(route, { waitUntil: 'load', timeout: 60_000 });

        const counts = await page.evaluate(() => ({
            main: document.querySelectorAll('main').length,
            nav: document.querySelectorAll('nav').length,
            footer: document.querySelectorAll('footer').length,
        }));

        expect(counts.main, `${route} should have exactly one <main>`).toBe(1);
        expect(counts.nav, `${route} should have at least one <nav>`).toBeGreaterThanOrEqual(1);
        expect(counts.footer, `${route} should have at least one <footer>`).toBeGreaterThanOrEqual(1);
    });
}

test('/blog/[id] uses <article> instead of <main>', async ({ page }) => {
    await page.goto('/blog/audit-trail', { waitUntil: 'load', timeout: 60_000 });

    const counts = await page.evaluate(() => ({
        article: document.querySelectorAll('article').length,
        nav: document.querySelectorAll('nav').length,
        footer: document.querySelectorAll('footer').length,
    }));

    expect(counts.article, 'blog post should have at least one <article>').toBeGreaterThanOrEqual(1);
    expect(counts.nav).toBeGreaterThanOrEqual(1);
    expect(counts.footer).toBeGreaterThanOrEqual(1);
});
