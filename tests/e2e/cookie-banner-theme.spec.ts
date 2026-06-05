import { test, expect } from '@playwright/test';

/**
 * Cookie banner theme regression spec.
 *
 * The CookieConsent banner is rendered at the root layout outside any
 * themed wrapper, so it route-switches its surface explicitly. After
 * the 2026-05-26 default-light flip, the surface allowlist inverted:
 * light by default.
 *
 * 2026-06-05: DARK_PATHS is now empty. /arkiv was the only dark-only
 * surface and it was retired with the post-pivot cleanup (#797), so
 * every public route now shows the light banner. The "renders DARK
 * on /arkiv" test was removed with the route. The remaining tests
 * lock that marketing routes stay LIGHT, which still catches anyone
 * moving the banner inside a themed wrapper or re-darkening it.
 *
 * Strategy: clear localStorage to force the banner, sample the
 * computed background color, and assert which side of the light/dark
 * line it lands on.
 *
 * The banner appears after a 1500ms timer (CookieConsent.tsx). Wait
 * for it to mount before sampling.
 */

interface BannerSurface {
    found: boolean;
    background: string;
    foreground: string;
}

async function readBannerSurface(page: import('@playwright/test').Page): Promise<BannerSurface> {
    return page.evaluate(() => {
        // The banner is a `<div class="fixed bottom-4 ... z-[90]">` wrapper
        // containing a `<div class={cardClass}>` with the actual themed
        // surface. The card has either bg-white (light) or bg-[#0a0a0f]
        // (dark). Find the wrapper by its fixed-bottom + z-90 class set
        // and read its first child (the card).
        const wrapper = Array.from(document.querySelectorAll('div.fixed')).find((el) => {
            const cl = (el as HTMLElement).className;
            return /bottom-4/.test(cl) && /z-\[90\]/.test(cl);
        }) as HTMLElement | undefined;
        if (!wrapper) return { found: false, background: '', foreground: '' };
        const card = wrapper.firstElementChild as HTMLElement | null;
        if (!card) return { found: false, background: '', foreground: '' };
        const cs = window.getComputedStyle(card);
        return { found: true, background: cs.backgroundColor, foreground: cs.color };
    });
}

function parseRgb(rgbString: string): [number, number, number] | null {
    const match = rgbString.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (!match) return null;
    return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isLightSurface(rgb: [number, number, number]): boolean {
    // Average channel intensity above 200 is unambiguously a light surface.
    return (rgb[0] + rgb[1] + rgb[2]) / 3 > 200;
}

test.describe('cookie banner theme', () => {
    test('renders LIGHT on /  (marketing route)', async ({ page }) => {
        await page.context().clearCookies();
        await page.addInitScript(() => {
            try { localStorage.removeItem('cookie-consent'); } catch { /* noop */ }
        });
        await page.goto('/', { waitUntil: 'load', timeout: 60_000 });
        // Banner is gated behind a 1500ms timer in CookieConsent.tsx.
        await page.waitForTimeout(2_500);

        const surface = await readBannerSurface(page);
        expect(surface.found, 'cookie banner not found on /').toBe(true);

        const rgb = parseRgb(surface.background);
        expect(rgb, `unexpected background color: ${surface.background}`).not.toBeNull();
        if (rgb) {
            expect(
                isLightSurface(rgb),
                `expected light banner on /, got rgb(${rgb.join(', ')}) average ${(rgb[0] + rgb[1] + rgb[2]) / 3}`,
            ).toBe(true);
        }
    });

    test('renders LIGHT on /demo/hackathon (now follows default-light)', async ({ page }) => {
        // Before the 2026-05-26 flip /demo/hackathon was on the dark
        // allowlist. Its content uses bg-background / text-foreground
        // tokens that flip with the theme, so the banner now follows
        // the page palette like every other marketing surface.
        await page.context().clearCookies();
        await page.addInitScript(() => {
            try { localStorage.removeItem('cookie-consent'); } catch { /* noop */ }
        });
        await page.goto('/demo/hackathon', { waitUntil: 'load', timeout: 60_000 });
        await page.waitForTimeout(2_500);

        const surface = await readBannerSurface(page);
        expect(surface.found, 'cookie banner not found on /demo/hackathon').toBe(true);

        const rgb = parseRgb(surface.background);
        expect(rgb, `unexpected background color: ${surface.background}`).not.toBeNull();
        if (rgb) {
            expect(
                isLightSurface(rgb),
                `expected light banner on /demo/hackathon, got rgb(${rgb.join(', ')}) average ${(rgb[0] + rgb[1] + rgb[2]) / 3}`,
            ).toBe(true);
        }
    });
});
