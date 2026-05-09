import { test, expect } from '@playwright/test';

// Cold-compile budget: homepage compiles on first hit. 90s leaves
// room for compile + locator polling.
test.describe.configure({ timeout: 90_000 });

/**
 * Locks in the Channels section's post-#483 composition.
 *
 * PR #483 trimmed Slack, Discord, and Phone (voice) per the user's
 * "make the roadmap items work or remove them" rule. The remaining
 * three channels:
 *
 *   iMessage  Shipping  (PR #186 already locks the Shipping pill)
 *   Telegram  Ready
 *   WhatsApp  Ready
 *
 * Slide 6 of docs/deck-objections.md ("Channel-agnostic: iMessage
 * shipping, Telegram + WhatsApp ready") references this section
 * directly. If anyone re-adds Slack/Discord/Phone (without wiring
 * them) or flips Telegram/WhatsApp to Shipping (without verifying
 * end-to-end), the deck story silently desyncs from the page.
 *
 * This spec catches both regressions:
 *   1. Telegram + WhatsApp must show "Ready" (not "Shipping")
 *   2. Slack, Discord, Phone must NOT appear in the section
 *
 * Companion to:
 *   - tests/e2e/imessage-page.spec.ts (locks iMessage's Shipping pill)
 */

test('homepage Channels section shows Telegram and WhatsApp with "Ready" pills', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Find each channel card via its heading and assert the Ready pill
    // sits inside the same card. iMessage's Shipping pill is covered
    // by tests/e2e/imessage-page.spec.ts so we don't duplicate it.
    for (const channel of ['Telegram', 'WhatsApp']) {
        const card = page.locator('[class*="rounded"]').filter({
            has: page.getByRole('heading', { name: new RegExp(`^${channel}$`, 'i') }),
        }).first();
        await expect(card, `${channel} card visible`).toBeVisible({ timeout: 10_000 });
        await expect(card, `${channel} card has Ready pill`).toContainText(/ready/i);
        await expect(card, `${channel} must NOT carry the Shipping pill until verified`)
            .not.toContainText(/shipping/i);
    }
});

test('homepage Channels section does NOT include Slack, Discord, or Phone', async ({ page }) => {
    // PR #483 trimmed these per the "make work or remove" rule. If
    // anyone re-adds them without wiring an end-to-end loop, this
    // fires before the regression hits the deck.
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Scope to the Channels section by aria-labelledby pattern. The
    // homepage has many other sections that may legitimately mention
    // these brand names (e.g. blog teasers).
    const channelsSection = page.locator('section').filter({
        has: page.getByRole('heading', { level: 2, name: /channels/i }).first(),
    }).first();
    await expect(channelsSection).toBeVisible({ timeout: 10_000 });

    const text = (await channelsSection.innerText()).toLowerCase();
    expect(text, 'Slack must not appear as a channel card').not.toContain('slack');
    expect(text, 'Discord must not appear as a channel card').not.toContain('discord');
    // "Phone" is intentionally voice; the iMessage card mentions
    // "Full agent loop" not "phone", so a substring check is safe.
    expect(text, 'Phone (voice) must not appear as a channel card').not.toMatch(/\bphone\b/);
});
