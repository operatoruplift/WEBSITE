import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock Phase 3 of the Gamify Your Growth pivot: Pricing rewrite.
 *
 * Source of truth: docs/PIVOT_GAMIFY_GROWTH.md and pitch deck v7
 * slide 12. The B2C model is freemium; Pro lands at $14.99/month;
 * Team stays Custom; CTAs route to /waitlist until the paid surface
 * ships in Phase 8.
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

test('homepage Pricing Pro tier prices at $14.99/month', () => {
    expect(pricingSrc).toMatch(/price:\s*'\$14\.99'/);
    expect(pricingSrc).toMatch(/period:\s*'\/month'/);
    expect(pricingSrc).not.toMatch(/price:\s*'\$50'/);
    expect(pricingSrc).not.toMatch(/price:\s*'\$19'/);
});

test('homepage Pricing Pro tier description leads with coaching, not Gmail', () => {
    // Scope to the TIERS array literal so the doc comment listing
    // retired copy (above the array) does not trip the guard.
    const tiersMatch = pricingSrc.match(/const TIERS\s*=\s*\[[\s\S]+?\];/);
    expect(tiersMatch).not.toBeNull();
    const tiers = tiersMatch![0];
    expect(tiers).toContain('Premium coaching for ambitious operators');
    expect(tiers).not.toContain('Real Gmail, real calendar, real receipts');
});

test('homepage Pricing Pro tier features describe the pivot product', () => {
    // Three high-signal features from the pivot tier. If any one of
    // these drops, the Pro description has likely drifted back to
    // the retired AI-assistant feature list.
    expect(pricingSrc).toContain('AI co-pilot that adapts to your behavior over time');
    expect(pricingSrc).toContain('Advanced analytics on what keeps you showing up');
    expect(pricingSrc).toContain('Personalized rewards and stakes calibrated to you');
});

test('homepage Pricing Free tier names the core loop, not "Try the demo"', () => {
    expect(pricingSrc).toContain('Set a goal, the AI breaks it into a daily questline');
    expect(pricingSrc).not.toContain('Try /chat with no signup, simulated mode');
    expect(pricingSrc).not.toContain('Bring your own API key');
});

test('homepage Pricing CTAs route Free and Pro to /waitlist', () => {
    // Both freemium tiers funnel into the waitlist until the paid
    // Pro surface lands in Phase 8.
    const ctaMatches = pricingSrc.match(/ctaLink:\s*'\/waitlist'/g) || [];
    expect(ctaMatches.length).toBeGreaterThanOrEqual(2);
    expect(pricingSrc).not.toContain("ctaLink: '/paywall'");
    expect(pricingSrc).not.toContain("ctaLink: '/chat'");
});

test('homepage Pricing CTA labels read "Join the waitlist"', () => {
    expect(pricingSrc).toContain("cta: 'Join the waitlist'");
    expect(pricingSrc).not.toContain("cta: 'Start Pro'");
    expect(pricingSrc).not.toContain("cta: 'Try the demo'");
});

test('homepage Pricing section header announces the freemium pivot', () => {
    expect(pricingSrc).toContain('Free to start. Pay when you want a coach.');
    expect(pricingSrc).toContain('$14.99 a month for premium coaching');
    expect(pricingSrc).not.toContain('Pro at $50 a month');
});

test('homepage Pricing Team description points at growth, not shared inbox', () => {
    expect(pricingSrc).toContain('Org-wide goals, squads, and leaderboards');
    expect(pricingSrc).toContain('Wellness and engagement dashboards for managers');
    expect(pricingSrc).not.toContain('Shared calendar, shared inbox, shared follow-ups');
});

test('/pricing page header line names $14.99 not $50', () => {
    expect(pricingPageSrc).toContain('$14.99/month');
    expect(pricingPageSrc).not.toContain('$0 or $50/month');
});

test('/pricing Team tier features mention squads and dashboards, not helpers + inbox', () => {
    expect(pricingPageSrc).toContain('Org-wide goals, squads, and leaderboards');
    expect(pricingPageSrc).not.toContain('Up to 10 helpers per seat');
});

test('no stray USDC badge survives on the Pro card', () => {
    // The USDC pill was tied to the retired x402/USDC settlement
    // story. Personal development is freemium with conventional card
    // payment; the pill no longer applies.
    expect(pricingSrc).not.toContain('USDC');
});
