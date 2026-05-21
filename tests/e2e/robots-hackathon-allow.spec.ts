import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the robots.ts disallow list against re-blocking the judge-facing
 * hackathon surfaces.
 *
 * /demo/hackathon was historically marked "internal demo, not a public
 * landing" and disallowed in robots.ts. PRs #503 + #628 turned it into
 * the canonical judge-facing anchor URL referenced in deck slides and
 * outbound DMs. Keeping it in robots.ts disallow contradicted the
 * sitemap entry added in PR #640, and meant search-discovered traffic
 * landing on `/demo/hackathon` was getting actively de-prioritized by
 * crawlers.
 *
 * This spec ensures the contradiction doesn't reappear:
 *
 *  - `/demo/hackathon` is NOT in the disallow list.
 *  - `/arkiv` is NOT in the disallow list.
 *  - The sitemap is still pointed at the canonical operatoruplift.com host.
 *
 * Companion to:
 *   - sitemap-hackathon-routes.spec.ts (sitemap entry side)
 *   - demo-hackathon-judge-links.spec.ts (page coherence side)
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const robotsSrc = fs.readFileSync(path.join(repoRoot, 'app', 'robots.ts'), 'utf-8');

test('robots.ts does NOT disallow /demo/hackathon', () => {
    // PR #503 + #628 made this the canonical judge-facing anchor URL.
    // Keeping it in the disallow list contradicts the sitemap entry
    // and hurts search-discovered traffic. A future refactor that
    // re-adds the line should fail this spec first.
    expect(robotsSrc).not.toMatch(/['"]\/demo\/hackathon['"]/);
});

test('robots.ts does NOT disallow /arkiv', () => {
    // The Arkiv ETHLisbon entrant demo page must be crawlable; it is
    // explicitly listed in app/sitemap.ts as a discoverable surface.
    expect(robotsSrc).not.toMatch(/['"]\/arkiv['"]/);
});

test('robots.ts points at the canonical operatoruplift.com sitemap URL', () => {
    // Catches accidental hardcoding of a preview URL or stale www
    // prefix. Crawlers ingesting an off-domain sitemap URL just skip
    // it silently.
    expect(robotsSrc).toMatch(
        /sitemap:\s*['"]https:\/\/operatoruplift\.com\/sitemap\.xml['"]/,
    );
});
