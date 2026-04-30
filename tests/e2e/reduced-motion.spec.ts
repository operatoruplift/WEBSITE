import { test, expect } from '@playwright/test';

/**
 * Reduced-motion accessibility guard.
 *
 * Locks in PR #330. Two assertions:
 *
 *  1. CSS layer: when the browser reports prefers-reduced-motion: reduce,
 *     elements with `transition-opacity` / `transition-colors` etc. must
 *     report a near-zero computed transition-duration.
 *  2. JS layer: HeroAnimation checks matchMedia and bails out, so the
 *     requestAnimationFrame counter must stay near zero.
 *
 * If either layer regresses (someone removes the !important rule, or
 * deletes the matchMedia check in HeroAnimation), this spec fails.
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

    test('HeroAnimation rAF loop is skipped', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
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
        await page.waitForTimeout(2_000);

        const before = await page.evaluate(() => window.__rafCount);
        await page.waitForTimeout(1_500);
        const after = await page.evaluate(() => window.__rafCount);
        const rate = after - before;

        // Without reduced-motion: 30-60 rAF/1.5s. With: 0-2 (React internal).
        expect(
            rate,
            `expected rAF rate near 0 with reduced-motion, got ${rate}/1.5s`,
        ).toBeLessThan(10);
    });
});
