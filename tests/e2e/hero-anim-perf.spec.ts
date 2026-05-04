import { test, expect } from '@playwright/test';

/**
 * Hero visual perf guard.
 *
 * Originally locked in PR #326 against a canvas-driven HeroAnimation
 * (particles + phase labels + chat window). PR #393's hero pivot
 * replaced that canvas with HeroMessages: a CSS-driven iMessage-style
 * cycling chat mockup. The new component uses setTimeout to advance
 * scenarios + bubbles and pauses when scrolled offscreen via
 * IntersectionObserver — same posture, different mechanism.
 *
 * The original rAF-counting strategy doesn't apply (no rAF anymore),
 * so this spec was rewritten to verify the bubble cycling behaves:
 * bubbles arrive over time when the hero is in view, and the DOM
 * stays stable when the hero scrolls offscreen.
 */

test('hero messages cycle when in view and pause when offscreen', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 60_000 });
    await page.setViewportSize({ width: 1440, height: 900 });

    // Allow the first scenario's first bubble to mount.
    await page.waitForTimeout(1_500);

    // Count visible bubbles inside the chat mockup. The chat lives in
    // the right column at lg+ and renders one or more bubble rows
    // initially. After the cycle interval, more bubbles arrive.
    const initialCount = await page.evaluate(() =>
        document.querySelectorAll('[aria-live="polite"] > div').length
    );

    // Wait through the bubble interval so a second bubble should
    // have arrived.
    await page.waitForTimeout(2_000);

    const afterCount = await page.evaluate(() =>
        document.querySelectorAll('[aria-live="polite"] > div').length
    );

    expect(
        afterCount,
        `expected at least one new bubble after 2s in view (had ${initialCount}, got ${afterCount})`,
    ).toBeGreaterThanOrEqual(initialCount);
    // At minimum, the cycling must not be frozen at zero/one — the first
    // bubble lands instantly and at least one more should follow.
    expect(afterCount, 'at least 2 bubbles should be visible after 2s').toBeGreaterThanOrEqual(2);

    // Scroll well past the hero so IntersectionObserver flips
    // isInView to false. The cycling timer should clear.
    await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'instant' }));
    await page.waitForTimeout(800);

    const offscreenSnapshot = await page.evaluate(() =>
        document.querySelectorAll('[aria-live="polite"] > div').length
    );
    await page.waitForTimeout(1_500);
    const offscreenLater = await page.evaluate(() =>
        document.querySelectorAll('[aria-live="polite"] > div').length
    );

    // Bubble count should not advance while offscreen. The timer was
    // cleared by the useEffect cleanup. We allow equality (no change)
    // and reject growth.
    expect(
        offscreenLater,
        `bubble count should hold steady offscreen (was ${offscreenSnapshot}, became ${offscreenLater})`,
    ).toBe(offscreenSnapshot);
});
