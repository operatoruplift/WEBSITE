import { test, expect } from '@playwright/test';

/**
 * Hero canvas animation perf guard.
 *
 * Locks in PR #326: the HeroAnimation rAF loop must pause when the
 * canvas scrolls offscreen so we stop burning CPU on a visualization
 * the user can no longer see. The pre-#326 implementation kept the
 * loop firing at ~60fps regardless of scroll position.
 *
 * Strategy: instrument requestAnimationFrame with a getter, scroll the
 * page past the hero, wait for the IntersectionObserver to fire, and
 * assert the rAF call count flatlines.
 */

test('hero canvas animation pauses when scrolled offscreen', async ({ page }) => {
    await page.addInitScript(() => {
        let rafCount = 0;
        const orig = window.requestAnimationFrame;
        window.requestAnimationFrame = (fn) => {
            rafCount++;
            return orig.call(window, fn);
        };
        Object.defineProperty(window, '__rafCount', { get: () => rafCount });
    });

    await page.goto('/', { waitUntil: 'load', timeout: 60_000 });
    await page.setViewportSize({ width: 1440, height: 900 });

    // Wait for the canvas to mount + the rAF loop to start.
    await page.waitForTimeout(2_000);

    // Hero is in view: rAF should be firing actively.
    const onscreenStart = await page.evaluate(() => window.__rafCount);
    await page.waitForTimeout(1_000);
    const onscreenEnd = await page.evaluate(() => window.__rafCount);
    const onscreenRate = onscreenEnd - onscreenStart;
    expect(
        onscreenRate,
        `expected onscreen rAF ~60/s, got ${onscreenRate}/s. Animation may not be running.`,
    ).toBeGreaterThan(20);

    // Scroll well past the hero.
    await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'instant' }));
    // Allow IntersectionObserver to fire and the in-flight frame to clear.
    await page.waitForTimeout(800);

    // Hero is offscreen: rAF should be paused.
    const offscreenStart = await page.evaluate(() => window.__rafCount);
    await page.waitForTimeout(1_000);
    const offscreenEnd = await page.evaluate(() => window.__rafCount);
    const offscreenRate = offscreenEnd - offscreenStart;
    expect(
        offscreenRate,
        `expected offscreen rAF near 0/s, got ${offscreenRate}/s. Loop kept firing past the hero.`,
    ).toBeLessThan(10);
});
