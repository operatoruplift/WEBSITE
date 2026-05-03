import { test, expect } from '@playwright/test';

/**
 * Reduced-motion accessibility guard.
 *
 * Locks in PR #330. Two assertions:
 *
 *  1. CSS layer: when the browser reports prefers-reduced-motion: reduce,
 *     elements with `transition-opacity` / `transition-colors` etc. must
 *     report a near-zero computed transition-duration.
 *  2. JS layer: HeroMessages reads matchMedia at mount and skips the
 *     bubble cycling (renders the full first scenario expanded
 *     instead). The earlier rAF assertion targeted a canvas-driven
 *     HeroAnimation that was retired in PR #393; we now check that
 *     all bubbles render immediately under reduced-motion.
 *
 * If either layer regresses (someone removes the !important rule, or
 * deletes the matchMedia check in HeroMessages), this spec fails.
 */

test.describe('prefers-reduced-motion', () => {
    test('CSS animations are collapsed to near-zero duration', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/', { waitUntil: 'load', timeout: 60_000 });
        await page.waitForTimeout(1_500);

        const transitionDuration = await page.evaluate(() => {
            const el = document.querySelector('[class*="transition-opacity"]');
            if (!el || !(el instanceof HTMLElement)) return null;
            return window.getComputedStyle(el).transitionDuration;
        });

        expect(transitionDuration, 'expected a transition-opacity element on /').not.toBeNull();
        if (transitionDuration) {
            // 0.001ms = 1µs = "1e-06s" once converted by the engine.
            // We tolerate anything <= 0.01s so the assertion survives
            // browser rounding without accepting a 100ms regression.
            const seconds = parseFloat(transitionDuration);
            expect(
                seconds,
                `transition-duration ${transitionDuration} not collapsed for reduced-motion`,
            ).toBeLessThanOrEqual(0.01);
        }
    });

    test('HeroMessages renders all bubbles immediately', async ({ page }) => {
        // PR #393 swap: with reduced-motion, HeroMessages should
        // render the first scenario's full bubble list at mount
        // instead of revealing one bubble at a time.
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/', { waitUntil: 'load', timeout: 60_000 });
        await page.waitForTimeout(1_000);

        const bubbleCount = await page.evaluate(() =>
            document.querySelectorAll('[aria-live="polite"] > div').length
        );

        // The Morning scenario has 3 bubbles. Reduced-motion should
        // surface all 3 at first paint, no cycling delay.
        expect(
            bubbleCount,
            `expected all bubbles immediately with reduced-motion (got ${bubbleCount})`,
        ).toBeGreaterThanOrEqual(3);
    });
});
