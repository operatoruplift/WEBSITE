import { test, expect } from '@playwright/test';

// Cold-compile budget: /demo/hackathon is a client component the dev
// server compiles on first hit; CI hits it cold. 90s leaves room for
// compile + assertions.
test.describe.configure({ timeout: 90_000 });

/**
 * Locks in the "Judge-ready verifiable links" on /demo/hackathon so
 * the trust pillar's verification flow doesn't break invisibly.
 *
 * Slide 4 of docs/deck-objections.md anchors the demo on artifacts a
 * hackathon judge can independently check. PR #594 expanded the
 * VerifyCards grid from 4 to 6 by adding 0G Storage + 0G AgenticID
 * cards alongside the existing Calendar manifest, Gmail manifest,
 * Receipt public key, and Filecoin links. PR #595 refreshed the
 * page eyebrow + headline + DEMO_CLICKS prompt from the older
 * Loops House framing to the 0G-primary trust-stack framing.
 *
 * If any href flips to a typo or a deprecated path, a judge clicking
 * through gets a 404 and the entire "verify it yourself" pitch
 * collapses.
 */

test('GET /demo/hackathon renders with the canonical H1', async ({ page }) => {
    await page.goto('/demo/hackathon', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // PR #594 retitled this from "x402 + ERC-8004, working end-to-end"
    // to lead with the consumer wedge instead of the protocol soup.
    // The page now carries protocol detail in sections below the hero.
    await expect(page.getByRole('heading', { level: 1, name: /Verifiable AI for Gmail and Calendar/i }))
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

test('/demo/hackathon Filecoin VerifyCard points at /security', async ({ page }) => {
    // PR #515 wired Filecoin receipt-anchoring; the demo page added
    // a fourth VerifyCard pointing at /security so a judge can find
    // the per-receipt filecoin_cid link after signing in.
    await page.goto('/demo/hackathon', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const href = await page
        .getByRole('link', { name: /Signed receipts on Filecoin/i })
        .getAttribute('href');
    expect(href).toBe('/security');
});

test('/demo/hackathon 0G Storage VerifyCard points at the public verifier route', async ({ page }) => {
    // PR #594 added a fifth VerifyCard pointing at /api/og/storage/[rootHash]
    // so a judge can land on the JSON envelope that documents how to
    // fetch the bytes via the 0G SDK against the Turbo indexer.
    await page.goto('/demo/hackathon', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const href = await page
        .getByRole('link', { name: /Signed receipts on 0G Storage/i })
        .getAttribute('href');
    expect(href).toContain('/api/og/storage/');
});

test('/demo/hackathon AgenticID VerifyCard points at chainscan-galileo contract page', async ({ page }) => {
    // PR #594 added a sixth VerifyCard pointing at the ERC-7857
    // contract on 0G Galileo Testnet so a judge can see the
    // reference deployment + any minted tokens directly on chainscan.
    // The contract address is locked by tests/e2e/og-agent-id.spec.ts;
    // if that test fails, this one also fails (intentional).
    await page.goto('/demo/hackathon', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const href = await page
        .getByRole('link', { name: /Agent ID on 0G AgenticID/i })
        .getAttribute('href');
    expect(href).toContain('chainscan-galileo.0g.ai/address/');
    expect(href).toContain('0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F');
});

test('/demo/hackathon Arkiv VerifyCard points at /arkiv', async ({ page }) => {
    // The Arkiv VerifyCard surfaces the ETHLisbon entrant (AI theme)
    // alongside the other trust pillars so a judge can verify the
    // third tamper-proof network (Braga testnet) from the same page.
    // /arkiv is the on-site demo route; clicking through must land
    // on the live entity list, not a 404.
    await page.goto('/demo/hackathon', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const href = await page
        .getByRole('link', { name: /Agent cards \+ memory on Arkiv/i })
        .getAttribute('href');
    expect(href).toBe('/arkiv');
});

test('/demo/hackathon eyebrow leads with the trust-stack framing, not Loops House', async ({ page }) => {
    // PR #595 retired the "Loops House · Challenge 02" eyebrow that
    // was correct for the older hackathon but stale for 0G APAC.
    // Lock the new eyebrow so a future refactor cannot accidentally
    // restore the old framing.
    await page.goto('/demo/hackathon', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const body = await page.locator('body').textContent();
    expect(body).toContain('Trust-stack demo');
    expect(body).not.toContain('Loops House · Challenge 02');
});
