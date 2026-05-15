import { test, expect } from '@playwright/test';

/**
 * Hermetic regression test for the /blog hero header centering bug
 * that landed twice (PRs #572 + #573 both failed to fix it; PR #587
 * fixed the underlying FadeIn inline-block issue).
 *
 * The bug: FadeIn's wrapper renders `inline-block` by default. When
 * a caller puts `flex items-center justify-center text-center` inside
 * FadeIn, the centering classes work against FadeIn's content-width
 * box, not the viewport. The h1 + lede end up horizontally centered
 * within the natural width of their longest line, which is narrower
 * than the viewport, so the whole block visually hugs left.
 *
 * What this spec locks:
 *
 *   1. The h1 "What we shipped, what we learned" is horizontally
 *      centered against the viewport (its midpoint is within 100px
 *      of viewport center).
 *   2. The lede paragraph is horizontally centered against the
 *      viewport (same tolerance).
 *   3. The eyebrow chip "Blog & Changelog" is horizontally centered.
 *   4. The hero region (FadeIn wrapper) renders as `block` not
 *      `inline-block` (catches the bug class directly so a future
 *      "fix" that reverts to inline-block fails CI).
 *
 * Tolerance is generous (100px) because text padding/margins and
 * viewport scrollbar widths vary. The bug shifted the block by
 * hundreds of pixels — well outside the tolerance.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/blog-header-centered.spec.ts --reporter=list
 */

const HERO_CENTER_TOLERANCE_PX = 100;

test.describe('/blog hero header is horizontally centered against the viewport', () => {
    test.beforeEach(async ({ page }) => {
        // Pin viewport to a desktop size so the centering math is
        // deterministic. Mobile centering is exercised separately by
        // the responsive-overflow tests.
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/blog', { waitUntil: 'networkidle' });
    });

    test('h1 "What we shipped, what we learned" midpoint is within 100px of viewport center', async ({ page }) => {
        const heading = page.getByRole('heading', { level: 1, name: /what we shipped/i });
        await expect(heading).toBeVisible();
        const box = await heading.boundingBox();
        expect(box, 'h1 must have a bounding box').not.toBeNull();
        const headingMidpoint = box!.x + box!.width / 2;
        const viewportMidpoint = 1440 / 2;
        const offset = Math.abs(headingMidpoint - viewportMidpoint);
        expect(
            offset,
            `h1 midpoint ${headingMidpoint}px vs viewport midpoint ${viewportMidpoint}px ` +
                `(offset ${offset}px); broken-state offset on PR #573 was 300+ px`,
        ).toBeLessThan(HERO_CENTER_TOLERANCE_PX);
    });

    test('lede paragraph "Stories from real users..." is also centered', async ({ page }) => {
        const lede = page.getByText(/Stories from real users, product updates/);
        await expect(lede).toBeVisible();
        const box = await lede.boundingBox();
        expect(box).not.toBeNull();
        const ledeMidpoint = box!.x + box!.width / 2;
        const viewportMidpoint = 1440 / 2;
        expect(Math.abs(ledeMidpoint - viewportMidpoint)).toBeLessThan(HERO_CENTER_TOLERANCE_PX);
    });

    test('eyebrow chip "Blog & Changelog" is centered', async ({ page }) => {
        const eyebrow = page.getByText(/Blog & Changelog/);
        await expect(eyebrow).toBeVisible();
        const box = await eyebrow.boundingBox();
        expect(box).not.toBeNull();
        const eyebrowMidpoint = box!.x + box!.width / 2;
        const viewportMidpoint = 1440 / 2;
        expect(Math.abs(eyebrowMidpoint - viewportMidpoint)).toBeLessThan(HERO_CENTER_TOLERANCE_PX);
    });

    test('hero FadeIn wrapper renders as block, not inline-block (root-cause guard)', async ({ page }) => {
        // The bug was that FadeIn's wrapper was display: inline-block.
        // After PR #587, the blog header passes <FadeIn block> which
        // renders display: block. This assertion locks the root cause
        // directly: a regression to inline-block fails CI even if the
        // bounding-box tests happen to pass on a particular viewport.
        //
        // We find the FadeIn wrapper as the closest ancestor of the
        // h1 whose class list contains 'transition-opacity' (FadeIn's
        // signature class).
        const heroDisplay = await page.evaluate(() => {
            const h1 = document.querySelector('h1');
            if (!h1) return null;
            let el: HTMLElement | null = h1;
            while (el && el !== document.body) {
                if (el.className && typeof el.className === 'string' && el.className.includes('transition-opacity')) {
                    return getComputedStyle(el).display;
                }
                el = el.parentElement;
            }
            return null;
        });
        expect(heroDisplay, 'must find a FadeIn-style transition-opacity ancestor of h1').not.toBeNull();
        expect(heroDisplay, 'hero FadeIn must render display:block, not inline-block').toBe('block');
    });
});
