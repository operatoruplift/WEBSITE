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

test('homepage hero shows the pivot pitch', async ({ page }) => {
    await page.goto('/');

    // 2026-05-21 Gamify Your Growth pivot. Hero headline is
    // "Keep your word. Bet on yourself." Primary CTA is
    // "Join the waitlist" pointing at /waitlist. Source of truth:
    // docs/PIVOT_GAMIFY_GROWTH.md.
    await expect(page.getByText(/Keep your word\. Bet on yourself\./i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /join the waitlist/i }).first()).toBeVisible();

    const body = await page.locator('body').innerText();
    assertNoBannedPhrases(body, '/');
});

test('homepage shows the Problem + Solution section before the demo video', async ({ page }) => {
    await page.goto('/');

    // 2026-05-21 v10 update. The #local-first section frames the
    // problem as the post-willpower era and the solution as
    // consequences over motivation. Source of truth:
    // docs/PIVOT_GAMIFY_GROWTH.md (v10 reframe section).
    const localFirst = page.locator('#local-first');
    await expect(localFirst).toBeVisible({ timeout: 10_000 });
    await expect(localFirst).toContainText(/honor system is dead/i);
    await expect(localFirst).toContainText(/We don't sell motivation/i);
    await expect(localFirst).toContainText(/Built for the ambitious/i);
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

test('/paywall sells v10 Operator Pro features', async ({ page }) => {
    // v10 reframe: the paywall used to advertise the retired
    // AI-assistant feature list ("Drafts your replies", model swap,
    // signed receipts). The new list mirrors the homepage Operator
    // Pro tier so a buyer landing on /paywall from /#pricing reads
    // the same benefits in the same order.
    await page.goto('/paywall');

    await expect(page.getByText(/Unlimited commitments/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/AI Game Master/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Pick a plan/i })).toBeVisible();

    // Mac-app-upcoming bullet retired with the rewrite; honesty
    // about the desktop app lives in the public docs now.
    const body = await page.locator('body').innerText();
    expect(body, 'paywall must not claim a free Mac app').not.toMatch(/Free Mac app(?!\s*\(beta)/i);

    assertNoBannedPhrases(body, '/paywall');
});

test('homepage FAQ surfaces the v10 commitment-protocol questions', async ({ page }) => {
    // v10 reframe (2026-05-21 Commitment Infrastructure): the FAQ
    // was rewritten end-to-end around the new pitch. The "How do I
    // use it?" + Mac-app-upcoming question retired because v10 does
    // not pitch a Mac app. Instead, lock the two highest-trust v10
    // questions: the AI Game Master and the money-stakes flow.
    await page.goto('/#faq', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const gameMasterQ = page.getByText('What does the AI Game Master actually do?').first();
    await expect(gameMasterQ).toBeVisible({ timeout: 10_000 });

    const stakesQ = page.getByText('How do the money stakes work?').first();
    await expect(stakesQ).toBeVisible();
});

// v10 reframe (2026-05-21 Commitment Infrastructure): /store was a
// v7 AI-agent marketplace surface pitching "Helpers" deeplinks into
// /chat. v10 has no marketplace; the page was retired. If a future
// PR brings it back, it should ship its own spec with the v10 framing
// instead of resurrecting the Helpers / Free-in-beta assertions.

test('/pricing disambiguates personal vs team plans', async ({ page }) => {
    await page.goto('/pricing');

    // v10 reframe: /pricing is now the org/B2B entry point with
    // Operator Circle + Enterprise tiers. The header points users
    // back to the homepage for the personal Free/Pro/Circle tiers.
    await expect(page.getByRole('heading', { name: /Group accountability/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Personal commitments live at/i)).toBeVisible();
    await expect(page.getByText(/Free, Pro \$8\/mo, or Circle \$24\/mo/i)).toBeVisible();

    const body = await page.locator('body').innerText();
    assertNoBannedPhrases(body, '/pricing');
});

test('OG metadata leads with the pivot pitch', async ({ page }) => {
    await page.goto('/');

    // 2026-05-21 Gamify Your Growth pivot. Meta + OG + Twitter
    // descriptions lead with the personal-development framing now.
    // Lock both that the new pitch is present AND that the retired
    // AI-assistant copy is gone, so a partial revert is caught.
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description, 'meta description').toContain('Keep your word');
    expect(description, 'meta description').toContain('Commitment infrastructure');
    expect(description, 'meta description').not.toContain('drafts your email');
    expect(description, 'meta description').not.toContain('Multi-agent orchestration');
    expect(description, 'meta description').not.toContain('Runs on your computer');

    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogDescription, 'og:description').toContain('Keep your word');
    expect(ogDescription, 'og:description').not.toContain('Runs on your computer');

    const twitterDescription = await page.locator('meta[name="twitter:description"]').getAttribute('content');
    expect(twitterDescription, 'twitter:description').toContain('Keep your word');
    expect(twitterDescription, 'twitter:description').not.toContain('Runs on your computer');

    const title = await page.title();
    // 2026-05-21 v10 update. The canonical one-liner for short-form
    // surfaces is now "commitment infrastructure" (see app/layout.tsx
    // and docs/PIVOT_GAMIFY_GROWTH.md v10 reframe).
    expect(title.toLowerCase()).toContain('commitment infrastructure');
    expect(title.toLowerCase()).not.toContain('runs on your terms');
    expect(title.toLowerCase()).not.toContain('gamify your growth');
    expect(title).not.toContain('AI Operating System');
});

test('JSON-LD structured data uses the pivot pitch', async ({ page }) => {
    // 2026-05-21 Gamify Your Growth pivot. The schema.org blob feeds
    // Google rich-result snippets; the description must lead with
    // the personal-development pitch, not the retired AI assistant
    // copy. Source of truth: docs/PIVOT_GAMIFY_GROWTH.md.
    await page.goto('/');

    const ldJson = await page.locator('script[type="application/ld+json"]').first().innerText();
    expect(ldJson).toContain('Commitment infrastructure');
    expect(ldJson).toContain('Keep your word');
    expect(ldJson).toContain('AI Game Master');
    expect(ldJson).not.toContain('drafts your email');
    expect(ldJson).not.toContain('Local-first AI agent platform');
    expect(ldJson).not.toContain('autonomous agents');
    expect(ldJson).not.toContain('Runs on your computer');
    // Web app, not a desktop SoftwareApplication.
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
