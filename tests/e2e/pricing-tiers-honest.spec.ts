import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Lock the canonical personal pricing tiers against drift.
 *
 * 2026-06-05: re-created to read app/pricing/page.tsx. The original
 * pricing-tiers-honest.spec.ts referenced src/sections/Pricing.tsx,
 * which was retired when the homepage Pricing section moved to the
 * standalone /pricing route. The CI workflow still listed the spec
 * by name, so it silently skipped (Playwright treats a missing
 * explicit path as a no-match); this restores the lock against the
 * file that actually ships.
 *
 * Source of truth (memory project_bucharest_pricing_model):
 *   Free / Pro $8 / Circle $24 monthly. The backend paywall still
 *   settles $50 USDC until the Phase 8 migration, so /pricing's
 *   marketing tiers and the paywall settlement are two truths that
 *   live in different files. This spec locks ONLY the marketing
 *   tiers on /pricing.
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const pricingSrc = fs.readFileSync(
    path.join(repoRoot, 'app', 'pricing', 'page.tsx'),
    'utf-8',
);

test('personal tiers are Free $0, Pro $8, Circle $24', () => {
    expect(pricingSrc).toMatch(/tier:\s*'Free',\s*price:\s*'\$0'/);
    expect(pricingSrc).toMatch(/tier:\s*'Pro',\s*price:\s*'\$8'/);
    expect(pricingSrc).toMatch(/tier:\s*'Circle',\s*price:\s*'\$24'/);
});

test('pricing does not regress to retired price points', () => {
    // $19 and $50 were earlier personal-tier experiments; $14.99 was
    // a v7 placeholder. None should appear as a personal price again.
    expect(pricingSrc).not.toMatch(/tier:\s*'Pro',\s*price:\s*'\$19'/);
    expect(pricingSrc).not.toMatch(/tier:\s*'Pro',\s*price:\s*'\$50'/);
    expect(pricingSrc).not.toMatch(/price:\s*'\$14\.99'/);
});

test('org tier is Operator Circle $24 and Enterprise is Custom', () => {
    expect(pricingSrc).toMatch(/name:\s*'Operator Circle',\s*\n?\s*price:\s*'\$24'/);
    expect(pricingSrc).toMatch(/name:\s*'Enterprise',\s*\n?\s*price:\s*'Custom'/);
});
