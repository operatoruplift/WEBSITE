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
    // Local-machine fabrications retired in PRs #227-#239. The web
    // app is Vercel-hosted and routes prompts through Anthropic /
    // OpenAI / Google / xAI / DeepSeek per user selection per turn,
    // so any present-tense "local" / "encrypted" claim was wrong.
    'Everything lives on your computer',
    'on your machine instead of theirs',
    'AES-256 encrypted local storage',
    'AES-256-GCM Encrypted',
    'Your agent ran locally',
    'Zero cloud. Zero surveillance',
    'Encrypted on your computer',
    'your data never leaves your environment',
];

function assertNoBannedPhrases(body: string, surface: string) {
    const lower = body.toLowerCase();
    for (const phrase of BANNED_DEV_PHRASES) {
        expect(lower, `banned dev phrase on ${surface}: "${phrase}"`).not.toContain(phrase.toLowerCase());
    }
}

test('homepage hero shows the consumer pitch', async ({ page }) => {
    await page.goto('/');

    // April 30 2026 second-pass trim: hero headline switched from
    // "Inbox and calendar, on autopilot." to "AI that runs on your
    // terms." per user feedback (the new copy frames consent + control
    // up front instead of leading with the daily job).
    await expect(page.getByText(/AI that runs on your terms/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /sign in and connect gmail/i }).first()).toBeVisible();

    const body = await page.locator('body').innerText();
    assertNoBannedPhrases(body, '/');
});

test('navbar uses plain-English labels', async ({ page }) => {
    await page.goto('/');

    // April 30 2026 trim, second pass: WATCH DEMO removed from nav
    // (Hero already has a "Watch 90s demo" anchor), HELP relabeled to
    // DOCS so it points users to docs explicitly.
    await expect(page.getByText(/PRICING/).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/FAQ/).first()).toBeVisible();
    await expect(page.getByText(/DOCS/).first()).toBeVisible();
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
    // The previous "Install" button was a 2s setTimeout fake that wrote a
    // localStorage marker and toasted "X installed" without doing anything.
    // The CTA now deeplinks straight into /chat with the agent's testPrompt
    // seeded, so a visitor immediately sees the agent doing real work in
    // demo mode.
    await expect(page.getByRole('link', { name: /Try in chat/i }).first()).toBeVisible();

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
    // PR #242 retired "Runs on your computer" from meta + OG + Twitter
    // descriptions in favor of "Approval before every action; signed
    // receipt afterward." Both halves describe primitives the web app
    // actually ships today.
    expect(description, 'meta description').not.toContain('Runs on your computer');

    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogDescription, 'og:description').not.toContain('Runs on your computer');

    const twitterDescription = await page.locator('meta[name="twitter:description"]').getAttribute('content');
    expect(twitterDescription, 'twitter:description').not.toContain('Runs on your computer');

    const title = await page.title();
    expect(title.toLowerCase()).toContain('inbox and calendar');
    expect(title).not.toContain('AI Operating System');
});

test('JSON-LD structured data uses the consumer pitch', async ({ page }) => {
    // The schema.org SoftwareApplication blob is what Google reads for
    // rich-result snippets. PR #190 retired the "Local-first AI agent
    // platform" string from the description. PR #242 changed the
    // @type to WebApplication and retired "Runs on your computer".
    // Locking those in.
    await page.goto('/');

    const ldJson = await page.locator('script[type="application/ld+json"]').first().innerText();
    expect(ldJson).toContain('drafts your email');
    expect(ldJson).not.toContain('Local-first AI agent platform');
    expect(ldJson).not.toContain('autonomous agents');
    expect(ldJson).not.toContain('Runs on your computer');
    // Web app, not a desktop SoftwareApplication today.
    expect(ldJson).toContain('WebApplication');
});

test('/login + /signup auth pages do not show "Commander"', async ({ page }) => {
    // PRs #168, #186, and #191 retired "Commander" as a default
    // display name across signup, login, profile, onboarding,
    // settings, and the API. Lock that in: a fresh user landing on
    // /login or /signup must never see the word.
    for (const path of ['/login', '/signup']) {
        // domcontentloaded (vs default 'load') skips waiting on fonts +
        // images we don't need for innerText. 60s timeout absorbs the
        // Next.js dev-server first-compile cost in CI.
        await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        const body = (await page.locator('body').innerText()).toLowerCase();
        expect(body, `"Commander" leaked into ${path}`).not.toContain('commander');
        expect(body, `"Local-first" leaked into ${path}`).not.toContain('local-first');
    }
});
