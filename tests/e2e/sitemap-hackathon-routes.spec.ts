import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the judge-facing hackathon routes in app/sitemap.ts.
 *
 * The sitemap drives crawler discovery; it also serves as a written
 * contract for "which public routes do we actually want indexed."
 * After PR #628 added the Arkiv VerifyCard to /demo/hackathon and
 * PR #620 added the live /arkiv entity list, both routes need to
 * appear in the sitemap so:
 *
 *  - Hackathon judges arriving via search find them directly.
 *  - Crawlers don't have to discover them through deep-linked pages.
 *  - A future refactor that drops one of the routes from sitemap.ts
 *    breaks this spec before it breaks SEO silently.
 *
 * File-scope only (no webserver bootstrap). The blog post entries
 * are already covered by their dynamic import from app/blog/posts.ts.
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const sitemapSrc = fs.readFileSync(path.join(repoRoot, 'app', 'sitemap.ts'), 'utf-8');

test('sitemap lists /demo/hackathon as a discoverable judge surface', () => {
    expect(sitemapSrc).toMatch(/\/demo\/hackathon/);
});

test('sitemap lists /arkiv as the live Arkiv entity demo surface', () => {
    expect(sitemapSrc).toMatch(/\$\{HOST\}\/arkiv/);
});

test('sitemap entries use the canonical operatoruplift.com host', () => {
    // Catches a future refactor that hardcodes a preview URL or
    // forgets the leading slash. Crawlers ingesting an inconsistent
    // host treat the URL as off-site and skip it.
    expect(sitemapSrc).toMatch(/const HOST = 'https:\/\/operatoruplift\.com'/);
});
