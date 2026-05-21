import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the /team page composition per pitch deck v10 slide 11
 * ("Built by an operator").
 *
 * The page used to surface five co-founders + one advisor from the
 * v7 deck. The v10 reframe retires the 5-co-founder framing in
 * favor of the solo-founder track record. Source of truth:
 * docs/PIVOT_GAMIFY_GROWTH.md (v10 reframe section).
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const teamSrc = fs.readFileSync(path.join(repoRoot, 'app', 'team', 'page.tsx'), 'utf-8');
const sitemapSrc = fs.readFileSync(path.join(repoRoot, 'app', 'sitemap.ts'), 'utf-8');

test('/team page names Matthew Sim as solo founder', () => {
    expect(teamSrc).toContain('Matthew Sim');
    expect(teamSrc).toContain("'Solo Founder, CEO'");
});

test('/team page drops the retired v7 co-founders', () => {
    // The v7 deck listed Olawale Olapo (CPO), Paul Balogun (CBO),
    // Francesca Centini (CCO), Matus Remis (COO). v10 retires them.
    // If a future copy edit reintroduces any of these as founder
    // cards, the page is showing a team Operator Uplift no longer
    // claims.
    expect(teamSrc).not.toContain('Olawale Olapo');
    expect(teamSrc).not.toContain('Paul Balogun');
    expect(teamSrc).not.toContain('Francesca Centini');
    expect(teamSrc).not.toContain('Matus Remis');
});

test('/team page founder bio covers the v10 track record beats', () => {
    // v10 slide 11 lists three credibility beats for the founder:
    // 13-year solo founder, top-5 esports, military discipline.
    const foundersBlock = teamSrc.match(/const FOUNDERS:[\s\S]+?\];/);
    expect(foundersBlock).not.toBeNull();
    const block = foundersBlock![0];
    expect(block).toMatch(/[Tt]hirteen-year solo founder|13-year solo founder/);
    expect(block).toMatch(/esports/i);
    expect(block).toMatch(/[Mm]ilitary/);
});

test('/team page carries the verbatim "why" quote', () => {
    // The "I built this because I was tired of lying to myself"
    // line is the founder voice from the v10 deck. Locking it so
    // a future copy sweep cannot quietly tone it down.
    expect(teamSrc).toContain('tired of lying to myself');
    expect(teamSrc).toContain('punished me for missing the mark');
});

test('/team page keeps the advisor card', () => {
    expect(teamSrc).toContain('Lubos Brzobohaty');
});

test('/team page primary CTA points at /waitlist', () => {
    expect(teamSrc).toContain('href="/waitlist"');
    expect(teamSrc).toContain('Join the waitlist');
});

test('/team page header reads "Built by an operator"', () => {
    expect(teamSrc).toContain('// Built by an operator');
    expect(teamSrc).toContain('Solo founder');
    expect(teamSrc).not.toContain('The operators behind Operator Uplift');
});

test('/team page carries the values strip', () => {
    expect(teamSrc).toContain('Show up daily');
    expect(teamSrc).toContain('Tell the truth');
    expect(teamSrc).toContain('Build for the operator');
});

test('/team page does not claim retired AI-assistant credentials', () => {
    // Honesty net: aspirational deck numbers (78% / 7500 waitlist /
    // 50 enterprise from v7) stay off the live page.
    expect(teamSrc).not.toMatch(/7,?500\+? waitlist/i);
    expect(teamSrc).not.toMatch(/78% completion/i);
    expect(teamSrc).not.toMatch(/50\+? enterprise/i);
});

test('Sitemap lists /team', () => {
    expect(sitemapSrc).toMatch(/\$\{HOST\}\/team/);
});
