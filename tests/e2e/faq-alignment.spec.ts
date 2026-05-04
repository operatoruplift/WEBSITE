import { test, expect } from '@playwright/test';

/**
 * FAQ horizontal-alignment regression guard.
 *
 * PR #393 fixed the FAQ section: the inner column used max-w-[800px]
 * with a w-full list, while the SectionHeader inside is max-w-2xl
 * (672px). The questions extended ~64px past the centered header on
 * each side, reading as "off-center." The fix matched the column to
 * max-w-2xl and dropped a doubled gap (mb-12 on header + gap-12 on
 * the flex column = 96px between header and first question).
 *
 * This spec pins both invariants so a future polish pass that
 * reintroduces either looks suspicious in CI:
 *
 *   1. The first FAQ disclosure row's left edge is within ±2px of the
 *      SectionHeader description's left edge.
 *   2. The FAQ disclosure rows' right edges align similarly.
 *   3. The vertical gap between description bottom and first question
 *      top is < 80px (catches the previous 96px doubled gap).
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/faq-alignment.spec.ts --reporter=list
 */

test('FAQ list shares the SectionHeader horizontal anchor', async ({ page }) => {
    await page.goto('/#faq', { waitUntil: 'load', timeout: 60_000 });
    await page.waitForTimeout(800);

    const heading = page.locator('#faq-heading');
    await expect(heading).toBeVisible();

    const description = page.locator('#faq-heading + p');
    await expect(description).toBeVisible();

    const firstQuestion = page.locator('[id^="faq-trigger-"]').first();
    await expect(firstQuestion).toBeVisible();

    const descBox = await description.boundingBox();
    const qBox = await firstQuestion.boundingBox();
    expect(descBox, 'expected the FAQ description to render').not.toBeNull();
    expect(qBox, 'expected the first FAQ question to render').not.toBeNull();
    if (!descBox || !qBox) return;

    // Tolerance: 2px swallows browser rounding; anything beyond means
    // the FAQ list and the SectionHeader sit at different anchors
    // again. The PR #393 fix put both at max-w-2xl (672px).
    const leftDelta = Math.abs(descBox.x - qBox.x);
    expect(
        leftDelta,
        `expected FAQ list left edge (${qBox.x}) within 2px of header description left edge (${descBox.x})`,
    ).toBeLessThanOrEqual(2);

    const descRight = descBox.x + descBox.width;
    const qRight = qBox.x + qBox.width;
    const rightDelta = Math.abs(descRight - qRight);
    expect(
        rightDelta,
        `expected FAQ list right edge (${qRight}) within 2px of header description right edge (${descRight})`,
    ).toBeLessThanOrEqual(2);
});

test('FAQ first question sits within 80px of the SectionHeader description', async ({ page }) => {
    await page.goto('/#faq', { waitUntil: 'load', timeout: 60_000 });
    await page.waitForTimeout(800);

    const description = page.locator('#faq-heading + p');
    const firstQuestion = page.locator('[id^="faq-trigger-"]').first();
    await expect(description).toBeVisible();
    await expect(firstQuestion).toBeVisible();

    const descBox = await description.boundingBox();
    const qBox = await firstQuestion.boundingBox();
    if (!descBox || !qBox) return;

    const gap = qBox.y - (descBox.y + descBox.height);
    // Pre-PR-#393 the gap was ~96px (mb-12 + gap-12). Post-fix it's
    // ~48px (mb-12 only). The 80px ceiling is a regression alarm: if
    // a future change re-doubles the spacing, this test fails before
    // the visible top-heavy bug ships.
    expect(
        gap,
        `expected FAQ section header to first question gap < 80px (got ${gap.toFixed(1)}px)`,
    ).toBeLessThan(80);
});
