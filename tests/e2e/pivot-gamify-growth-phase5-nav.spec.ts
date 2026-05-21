import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock Phase 5 of the Gamify Your Growth pivot: retire the iMessage
 * entry from the primary navigation and add /waitlist as the primary
 * conversion surface in the sitemap.
 *
 * Source of truth: docs/PIVOT_GAMIFY_GROWTH.md Phase 5.
 *
 * The /imessage / /integrations / /chat routes still resolve (so
 * existing inbound links and judge artifacts keep working) but they
 * are no longer on the marketing happy path.
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const navbarSrc = fs.readFileSync(
    path.join(repoRoot, 'src', 'components', 'Navbar.tsx'),
    'utf-8',
);
const sitemapSrc = fs.readFileSync(
    path.join(repoRoot, 'app', 'sitemap.ts'),
    'utf-8',
);

test('Navbar primary items lead with WAITLIST, not iMESSAGE', () => {
    // Scope to the navItems array literal so the docstring above the
    // array (which documents the pivot history) does not trip the
    // guard.
    const navMatch = navbarSrc.match(/const navItems\s*=\s*\[[\s\S]+?\];/);
    expect(navMatch).not.toBeNull();
    const navItems = navMatch![0];

    expect(navItems).toContain("name: 'WAITLIST'");
    expect(navItems).toContain("href: '/waitlist'");
    expect(navItems).not.toMatch(/name:\s*'iMESSAGE'/);
});

test('Navbar still carries Pricing, Blog, FAQ alongside Waitlist', () => {
    // The other three nav slots are not on the pivot retire list. If
    // a future trim removes one, this fires so we can reassess
    // intent. (Pricing answers "what does it cost," Blog and FAQ are
    // SEO + objection answers.)
    const navMatch = navbarSrc.match(/const navItems\s*=\s*\[[\s\S]+?\];/);
    const navItems = navMatch![0];
    expect(navItems).toContain("name: 'PRICING'");
    expect(navItems).toContain("name: 'BLOG'");
    expect(navItems).toContain("name: 'FAQ'");
});

test('Sitemap lists /waitlist as a high-priority surface', () => {
    expect(sitemapSrc).toMatch(/\$\{HOST\}\/waitlist/);
    // /waitlist is now the primary conversion path; priority must
    // beat /pricing (0.8) since the waitlist is the only converting
    // surface today.
    const waitlistEntry = sitemapSrc.match(/\$\{HOST\}\/waitlist[\s\S]+?priority:\s*([\d.]+)/);
    expect(waitlistEntry).not.toBeNull();
    const priority = parseFloat(waitlistEntry![1]);
    expect(priority).toBeGreaterThanOrEqual(0.8);
});

test('Sitemap does not promote retired AI-assistant routes', () => {
    // /imessage / /integrations / /chat routes still resolve so
    // inbound links and judge artifacts keep working, but they are
    // not on the marketing happy path. Listing them in the sitemap
    // would tell crawlers to surface them in organic search alongside
    // the pivot pitch.
    expect(sitemapSrc).not.toMatch(/\$\{HOST\}\/imessage/);
    expect(sitemapSrc).not.toMatch(/\$\{HOST\}\/integrations/);
    expect(sitemapSrc).not.toMatch(/\$\{HOST\}\/chat[^,/]/);
});
