import { test, expect } from '@playwright/test';

// Cold-compile budget: homepage is the heaviest page on first hit.
// 90s leaves room for compile + assertion polling.
test.describe.configure({ timeout: 90_000 });

/**
 * Locks in the LocalFirst "Built on" infrastructure strip honesty.
 *
 * History:
 *   PR #491 replaced the old "Works with the model you already pay
 *   for" provider strip with a "Built on" infrastructure strip.
 *   PR #515 wired Filecoin receipt-anchoring (lib/filecoin/anchor.ts)
 *   and the ElevenLabs TTS endpoint (/api/voice/synth), promoting
 *   both from Soon -> Shipping.
 *
 * Current strip composition:
 *
 *   Shipping (no pill, wired in the codebase today):
 *     Solana, Vercel, Supabase, Photon, Filecoin, ElevenLabs
 *
 *   Roadmap (Soon pill, not yet wired):
 *     Base, Ethereum
 *
 * Project rule "make work or remove" (.claude/rules/project-overrides.md):
 * a Soon pill must accompany every roadmap item. Promoting a Soon item
 * to shipping without wiring it would overclaim — and a deck slide
 * referencing the strip (slide 6) would then be telling a story the
 * code can't back. This spec catches that drift before it ships.
 */

test('homepage LocalFirst "Built on" header is visible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(page.getByText(/Built on/i).first()).toBeVisible({ timeout: 10_000 });
});

test('homepage Built on strip lists the four shipping providers without Soon pills', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Find the "Built on" header, then walk up to its container so we
    // scope the assertions to this strip only (the homepage has many
    // sections that mention these brand names elsewhere).
    const builtOnSection = page.getByText('Built on').first().locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]');
    await expect(builtOnSection).toBeVisible({ timeout: 10_000 });

    for (const provider of ['Solana', 'Vercel', 'Supabase', 'Photon', 'Filecoin', 'ElevenLabs']) {
        const item = builtOnSection.locator(`span.inline-flex:has-text("${provider}")`).first();
        await expect(item, `${provider} should appear in the Built on strip`).toBeVisible();
        // Shipping items must NOT have a Soon pill in their span.
        const text = (await item.innerText()).toLowerCase();
        expect(text, `${provider} is shipping; no Soon pill expected`).not.toContain('soon');
    }
});

test('homepage Built on strip flags every roadmap provider with a Soon pill', async ({ page }) => {
    // Roadmap providers must wear the Soon pill. If anyone removes it,
    // the strip silently overclaims. This test catches that regression.
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const builtOnSection = page.getByText('Built on').first().locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]');
    await expect(builtOnSection).toBeVisible({ timeout: 10_000 });

    // After PR #515 wired Filecoin + ElevenLabs, only Base + Ethereum
    // remain on the roadmap (gated on the lib/paysh x402 buyer-client
    // work).
    for (const provider of ['Base', 'Ethereum']) {
        const item = builtOnSection.locator(`span.inline-flex:has-text("${provider}")`).first();
        await expect(item, `${provider} should appear in the Built on strip`).toBeVisible();
        const text = (await item.innerText()).toLowerCase();
        expect(text, `${provider} is roadmap; Soon pill required`).toContain('soon');
    }
});
