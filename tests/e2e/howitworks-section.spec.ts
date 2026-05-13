import { test, expect } from '@playwright/test';

// Cold-compile budget: homepage compiles on first hit. 90s leaves
// room for compile + locator polling.
test.describe.configure({ timeout: 90_000 });

/**
 * Locks in the HowItWorks section composition.
 *
 * Added per user feedback referencing clawcage.hackyguru.com's
 * "Zero to sandbox in 10 seconds" walkthrough: a time-to-value
 * 4-step explainer between Hero and LocalFirst. The LocalFirst
 * section below covers WHY each step is trustworthy; this section
 * covers WHAT the user does, in order.
 *
 * If a future trim removes this section or rewrites a step into
 * something that no longer reads as a verb the user performs,
 * this spec catches it.
 */

test('HowItWorks section renders on the homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const section = page.locator('#how-it-works');
    await expect(section).toBeVisible({ timeout: 10_000 });
});

test('HowItWorks section eyebrow + title + description', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const section = page.locator('#how-it-works');
    await expect(section).toContainText(/How it works/i);
    await expect(section).toContainText(/From sign-in to first action in under a minute/i);
    await expect(section).toContainText(/Four steps/i);
});

test('HowItWorks lists all four steps with concrete action verbs', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const section = page.locator('#how-it-works');
    // Each step name is a verb the user actually performs. If anyone
    // rewrites these as abstract jargon ("Authentication", "Discovery"),
    // this fires.
    await expect(section).toContainText(/Sign in with Google/i);
    await expect(section).toContainText(/Ask in plain English/i);
    await expect(section).toContainText(/Tap to approve/i);
    await expect(section).toContainText(/It runs in your real Gmail/i);
});

test('HowItWorks step numbers render as Step 01..04 in order', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const section = page.locator('#how-it-works');
    const stepLabels = await section.locator('text=/Step 0[1-4]/').allInnerTexts();
    expect(stepLabels.join(' ')).toMatch(/Step 01[\s\S]*Step 02[\s\S]*Step 03[\s\S]*Step 04/);
});

test('HowItWorks sits between Hero and LocalFirst on the homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // DOM order anchors the narrative: Hero (sets the pitch),
    // HowItWorks (walks through the four steps), LocalFirst (explains
    // the trust pillar behind each step). If a future trim moves
    // HowItWorks after LocalFirst, the trust narrative reads before
    // the walkthrough that motivates caring about it.
    const heroIndex = await page.locator('section').filter({ hasText: /Operator Uplift drafts your replies/i }).first().evaluate(el =>
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
