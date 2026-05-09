import { test, expect } from '@playwright/test';

// Cold-compile budget: /demo/hackathon is a client component the dev
// server compiles on first hit; CI hits it cold. 90s leaves room for
// compile + assertions.
test.describe.configure({ timeout: 90_000 });

/**
 * Locks in the three "Judge-ready verifiable links" on /demo/hackathon
 * so the trust pillar's verification flow doesn't break invisibly.
 *
 * Slide 4 of docs/deck-objections.md anchors the demo on three
 * artifacts a hackathon judge can independently check:
 *
 *   1. Calendar agent manifest at /agents/calendar.json
 *   2. Gmail agent manifest at /agents/gmail.json
 *   3. ed25519 receipt public key at /api/receipts/public-key
 *
 * The /demo/hackathon page surfaces these as VerifyCards. If any
 * href flips to a typo or a deprecated path, a judge clicking
 * through gets a 404 and the entire "verify it yourself" pitch
 * collapses. PR #501 also publicly allowlisted the public-key
 * endpoint so anonymous fetches actually return 200.
 */

test('GET /demo/hackathon renders with the canonical H1', async ({ page }) => {
    await page.goto('/demo/hackathon', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    await expect(page.getByRole('heading', { level: 1, name: /x402 \+ ERC-8004/i }))
        .toBeVisible({ timeout: 10_000 });
});

test('/demo/hackathon Calendar manifest VerifyCard points at /agents/calendar.json', async ({ page }) => {
    await page.goto('/demo/hackathon', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const href = await page
        .getByRole('link', { name: /Calendar agent manifest/i })
        .getAttribute('href');
    expect(href).toBe('/agents/calendar.json');
});

test('/demo/hackathon Gmail manifest VerifyCard points at /agents/gmail.json', async ({ page }) => {
    await page.goto('/demo/hackathon', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const href = await page
        .getByRole('link', { name: /Gmail agent manifest/i })
        .getAttribute('href');
    expect(href).toBe('/agents/gmail.json');
});

test('/demo/hackathon Receipt public key VerifyCard points at /api/receipts/public-key', async ({ page }) => {
    // PR #501 publicly allowlisted this endpoint. The VerifyCard's
    // href has to keep pointing at it, otherwise a judge clicks
    // through to a 404 and the verification flow breaks.
    await page.goto('/demo/hackathon', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const href = await page
        .getByRole('link', { name: /Receipt public key/i })
        .getAttribute('href');
    expect(href).toBe('/api/receipts/public-key');
});
