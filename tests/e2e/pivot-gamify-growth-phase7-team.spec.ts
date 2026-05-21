import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock Phase 7 of the Gamify Your Growth pivot: /team page.
 *
 * Source of truth: docs/PIVOT_GAMIFY_GROWTH.md Phase 7 and pitch
 * deck v7 slide 14. The page lists the five founders from the
 * deck and the one advisor.
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const teamSrc = fs.readFileSync(path.join(repoRoot, 'app', 'team', 'page.tsx'), 'utf-8');
const sitemapSrc = fs.readFileSync(path.join(repoRoot, 'app', 'sitemap.ts'), 'utf-8');

test('/team page lists every founder from the deck', () => {
    // If a founder leaves or is added, this fires so the deck and
    // the live page stay in sync (the deck is the source of truth).
    expect(teamSrc).toContain('Matthew Sim');
    expect(teamSrc).toContain('Olawale Olapo');
    expect(teamSrc).toContain('Paul Balogun');
    expect(teamSrc).toContain('Francesca Centini');
    expect(teamSrc).toContain('Matus Remis');
});

test('/team page lists the advisor', () => {
    expect(teamSrc).toContain('Lubos Brzobohaty');
});

test('/team page primary CTA points at /waitlist', () => {
    // The /team page is a recruiting + investor surface; the only
    // path forward should be the same waitlist the rest of the site
    // funnels into. If a future edit reintroduces /paywall or /chat
    // as the CTA, the pivot has drifted.
    expect(teamSrc).toContain('href="/waitlist"');
    expect(teamSrc).toContain('Join the waitlist');
});

test('/team page surfaces the founder roles per the deck', () => {
    // Slide 14 lists "Founder, CEO" + CPO + CBO + CCO + COO.
    expect(teamSrc).toContain('Founder, CEO');
    expect(teamSrc).toContain('CPO');
    expect(teamSrc).toContain('CBO');
    expect(teamSrc).toContain('CCO');
    expect(teamSrc).toContain('COO');
});

test('/team page carries the values strip used on the pivot deck', () => {
    expect(teamSrc).toContain('Show up daily');
    expect(teamSrc).toContain('Tell the truth');
    expect(teamSrc).toContain('Build for the operator');
});

test('/team page does not claim retired AI-assistant credentials', () => {
    // Honesty net: a future copy edit could try to fold deck
    // numbers (78% / 7500 waitlist / 50 enterprise) onto the team
    // page as social proof. These are aspirational and live on the
    // deck only.
    expect(teamSrc).not.toMatch(/7,?500\+? waitlist/i);
    expect(teamSrc).not.toMatch(/78% completion/i);
    expect(teamSrc).not.toMatch(/50\+? enterprise/i);
});

test('Sitemap lists /team', () => {
    expect(sitemapSrc).toMatch(/\$\{HOST\}\/team/);
});
