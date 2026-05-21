import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Phase 3 of the Gamify Your Growth pivot, updated for v10 pricing.
 *
 * v10 reframe (pitch deck v10):
 *   Operator Free   $0/mo  — 1 active commitment, up to 1 witness
 *   Operator Pro    $8/mo  — unlimited + money stakes + 5 witnesses
 *   Operator Circle $24/mo — group commitments + coach role
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const pricingSrc = fs.readFileSync(
    path.join(repoRoot, 'src', 'sections', 'Pricing.tsx'),
    'utf-8',
);
const pricingPageSrc = fs.readFileSync(
    path.join(repoRoot, 'app', 'pricing', 'page.tsx'),
    'utf-8',
);

test('homepage Pricing Pro tier prices at $8/month', () => {
    expect(pricingSrc).toMatch(/price:\s*'\$8'/);
    expect(pricingSrc).toMatch(/period:\s*'\/month'/);
    expect(pricingSrc).not.toMatch(/price:\s*'\$50'/);
    expect(pricingSrc).not.toMatch(/price:\s*'\$19'/);
    expect(pricingSrc).not.toMatch(/price:\s*'\$14\.99'/);
});

test('homepage Pricing introduces the Operator Circle tier at $24/month', () => {
    // v10 adds a third paid tier between Pro and Custom for groups +
    // coaches. If a future trim collapses this back into Pro, the
    // spec catches it.
    expect(pricingSrc).toMatch(/'Operator Circle'/);
    expect(pricingSrc).toMatch(/price:\s*'\$24'/);
});

test('homepage Pricing Pro tier description names the Hunter persona', () => {
    const tiersMatch = pricingSrc.match(/const TIERS\s*=\s*\[[\s\S]+?\];/);
    expect(tiersMatch).not.toBeNull();
    const tiers = tiersMatch![0];
    expect(tiers).toContain('For the Hunters');
    expect(tiers).not.toContain('Premium coaching for ambitious operators');
});

test('homepage Pricing Pro tier features describe the v10 stakes model', () => {
    expect(pricingSrc).toContain('Money stakes in any amount (USDC or card)');
    expect(pricingSrc).toContain('AI Game Master verification + slashing');
    expect(pricingSrc).toContain('On-chain settlement receipts');
});

test('homepage Pricing Free tier names the gateway role', () => {
    expect(pricingSrc).toContain('1 active commitment');
    expect(pricingSrc).toContain('practice keeping your word');
});

test('homepage Pricing CTAs route every tier to /waitlist', () => {
    const ctaMatches = pricingSrc.match(/ctaLink:\s*'\/waitlist'/g) || [];
    expect(ctaMatches.length).toBeGreaterThanOrEqual(3);
    expect(pricingSrc).not.toContain("ctaLink: '/paywall'");
    expect(pricingSrc).not.toContain("ctaLink: '/chat'");
});

test('homepage Pricing CTA labels read "Join the waitlist"', () => {
    expect(pricingSrc).toContain("cta: 'Join the waitlist'");
    expect(pricingSrc).not.toContain("cta: 'Start Pro'");
    expect(pricingSrc).not.toContain("cta: 'Try the demo'");
});

test('homepage Pricing section header announces the v10 framing', () => {
    expect(pricingSrc).toContain('Incentivized integrity');
    expect(pricingSrc).toContain('Free to honor your word');
    expect(pricingSrc).not.toContain('Pro at $50 a month');
    expect(pricingSrc).not.toContain('Free to start. Pay when you want a coach.');
});

test('homepage Pricing Circle description names group commitments', () => {
    expect(pricingSrc).toContain('Group commitments and shared stakes');
    expect(pricingSrc).toContain('Coach role with cohort analytics');
});

test('/pricing page header line names $14.99 not $50', () => {
    // The /pricing team page still references the personal tier
    // entry point. Keep the disambiguation line; it points users at
    // the homepage Pricing for the new $8/$24 personal tiers.
    expect(pricingPageSrc).toContain('$14.99/month');
    expect(pricingPageSrc).not.toContain('$0 or $50/month');
});

test('/pricing Team tier features mention squads and dashboards, not helpers + inbox', () => {
    expect(pricingPageSrc).toContain('Org-wide goals, squads, and leaderboards');
    expect(pricingPageSrc).not.toContain('Up to 10 helpers per seat');
});

test('no stray standalone USDC badge survives on the Pro card', () => {
    // The retired USDC pill was a separate visual element next to the
    // price. The new "USDC or card" mention inside the feature list is
    // expected; the pill (an extra <span class="...USDC">) is not.
    expect(pricingSrc).not.toMatch(/text-\[#F97316\]"\s*>\s*USDC\s*<\/span>/);
});
