import { test, expect } from '@playwright/test';

/**
 * Consumer-copy regression tests.
 *
 * Locks in the plain-English voice shipped across PRs #152-#168. If a
 * future PR rewrites a hero or a CTA back to dev/jargon vocabulary, CI
 * fails before merge.
 *
 * Each test asserts BOTH:
 *   1. The new consumer phrasing is present
 *   2. The retired developer/jargon phrasing is absent
 *
 * That way the test is symmetric: a regression to either side trips it.
 */

const BANNED_DEV_PHRASES = [
    // Sci-fi cosplay vocabulary retired in #163, #164, #166
    'Commander',
    'Uplift Core',
    'Warp Network',
    'Blackwall',
    'CodePilot Pro',
    'Founder Ops',
    'Gold Agent',
    'DeepRepo Orchestration',
    // Banned dev jargon retired across the consumer-copy sweep
    'Multi-agent orchestration',
    'AI Operating System',
    'On-chain Merkle audit trail',
    'agent orchestration',
    'Self-Hosted',
    // Council fabrication retired in #155 / #156 / #157
    'LLM Council',
    '5 agents debate',
    'Chairman',
    'Contrarian',
    'First Principles thinker',
    'Expansionist',
    'Outsider',
];

function assertNoBannedPhrases(body: string, surface: string) {
    const lower = body.toLowerCase();
    for (const phrase of BANNED_DEV_PHRASES) {
        expect(lower, `banned dev phrase on ${surface}: "${phrase}"`).not.toContain(phrase.toLowerCase());
    }
}

test('homepage hero shows the consumer pitch', async ({ page }) => {
    await page.goto('/');

    // New consumer headline + CTA must be visible
    await expect(page.getByText(/stay in charge/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /try it free/i }).first()).toBeVisible();

    const body = await page.locator('body').innerText();
    assertNoBannedPhrases(body, '/');
});

test('navbar uses plain-English labels', async ({ page }) => {
    await page.goto('/');

    // The post-#152 navbar uses these explicit strings
    await expect(page.getByText(/HOW IT WORKS/).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/HELPERS/).first()).toBeVisible();
    await expect(page.getByText(/WATCH DEMO/).first()).toBeVisible();
});

test('/paywall sells real features, not the removed council', async ({ page }) => {
    await page.goto('/paywall');

    // Pro pitch must be the consumer text from #155
    await expect(page.getByText(/Drafts your replies/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /Pick a plan/i })).toBeVisible();

    const body = await page.locator('body').innerText();
    assertNoBannedPhrases(body, '/paywall');
});

test('/store leads with Helpers and free-in-beta pricing', async ({ page }) => {
    await page.goto('/store');

    await expect(page.getByRole('heading', { name: /^Helpers$/ })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Free in beta/i).first()).toBeVisible();
    // The "Deploy with SOL" button label was retired in #154
    await expect(page.getByRole('button', { name: /Install/i }).first()).toBeVisible();

    const body = await page.locator('body').innerText();
    assertNoBannedPhrases(body, '/store');
});

test('/pricing disambiguates personal vs team plans', async ({ page }) => {
    await page.goto('/pricing');

    await expect(page.getByRole('heading', { name: /Pricing for teams/i })).toBeVisible({ timeout: 10_000 });
    // Disambiguation line shipped in #161
    await expect(page.getByText(/Personal plans start free/i)).toBeVisible();
    await expect(page.getByText(/Up to 10 helpers/i)).toBeVisible();

    const body = await page.locator('body').innerText();
    assertNoBannedPhrases(body, '/pricing');
});

test('OG metadata leads with the daily job', async ({ page }) => {
    await page.goto('/');

    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description, 'meta description').toContain('drafts your email');
    expect(description, 'meta description').not.toContain('Multi-agent orchestration');

    const title = await page.title();
    expect(title.toLowerCase()).toContain('inbox and calendar');
    expect(title).not.toContain('AI Operating System');
});
