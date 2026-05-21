import { test, expect } from '@playwright/test';

// Cold-compile budget: homepage compiles on first hit. 90s leaves
// room for compile + locator polling.
test.describe.configure({ timeout: 90_000 });

/**
 * Locks in the HowItWorks section composition.
 *
 * Rewritten 2026-05-21 for the Gamify Your Growth pivot. The section
 * used to be a Gmail / Calendar four-step sign-in walkthrough; the
 * pivot replaces it with the four-step ambition-to-action loop from
 * pitch deck v7. Source of truth: docs/PIVOT_GAMIFY_GROWTH.md.
 *
 * This spec locks the live-page rendering. The file-scope spec at
 * tests/e2e/pivot-gamify-growth-phase2.spec.ts locks the source code.
 */

test('HowItWorks section renders on the homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const section = page.locator('#how-it-works');
    await expect(section).toBeVisible({ timeout: 10_000 });
});

test('HowItWorks section eyebrow + title + description', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const section = page.locator('#how-it-works');
    await expect(section).toContainText(/The protocol/i);
    await expect(section).toContainText(/Declare\. Stake\. Honor\. Watch\./i);
    await expect(section).toContainText(/Four steps/i);
});

test('HowItWorks lists all four v10 protocol steps as imperative verbs', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const section = page.locator('#how-it-works');
    // v10 protocol: DECLARE / STAKE / HONOR / WATCH. Each is an
    // action the operator performs. If anyone rewrites these as
    // abstract jargon, this fires.
    await expect(section).toContainText(/Declare/i);
    await expect(section).toContainText(/Stake/i);
    await expect(section).toContainText(/Honor/i);
    await expect(section).toContainText(/Watch/i);
});

test('HowItWorks step numbers render as Step 01..04 in order', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const section = page.locator('#how-it-works');
    const stepLabels = await section.locator('text=/Step 0[1-4]/i').allInnerTexts();
    // The labels render as uppercase ("STEP 01") via CSS text-transform.
    // The Playwright text= locator above is case-insensitive and matches
    // them, but allInnerTexts() returns the rendered (uppercase) form,
    // so the final regex must also be case-insensitive.
    expect(stepLabels.join(' ')).toMatch(/Step 01[\s\S]*Step 02[\s\S]*Step 03[\s\S]*Step 04/i);
});

test('HowItWorks sits between Hero and LocalFirst on the homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // DOM order anchors the pivot narrative: Hero (the tagline +
    // primary waitlist CTA), HowItWorks (the four-step questline),
    // LocalFirst (the Problem + Solution). The pre-pivot Hero locator
    // ("Operator Uplift drafts your replies") no longer applies; we
    // anchor to the new hero h1 instead.
    const heroIndex = await page.locator('section').filter({ has: page.locator('h1#hero-heading') }).first().evaluate(el =>
        Array.from(document.querySelectorAll('section')).indexOf(el as HTMLElement),
    );
    const howItWorksIndex = await page.locator('#how-it-works').evaluate(el =>
        Array.from(document.querySelectorAll('section')).indexOf(el as HTMLElement),
    );
    const localFirstIndex = await page.locator('#local-first').evaluate(el =>
        Array.from(document.querySelectorAll('section')).indexOf(el as HTMLElement),
    );

    expect(heroIndex).toBeGreaterThanOrEqual(0);
    expect(howItWorksIndex).toBeGreaterThan(heroIndex);
    expect(localFirstIndex).toBeGreaterThan(howItWorksIndex);
});
