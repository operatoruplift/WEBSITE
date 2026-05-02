import { test, expect } from '@playwright/test';

/**
 * Light-mode contrast guards for the marketing-site standalone pages
 * polished across PRs #358-#364.
 *
 * Each page wraps in `.theme-light` and relies on the override block
 * in app/globals.css to flip dark-palette utility classes (text-white,
 * text-gray-*, bg-white/N, border-white/N) into readable equivalents
 * on the #FAFAFA marketing surface. If a future change either drops
 * `theme-light`, swaps to a non-overridden class (e.g. `text-white/30`),
 * or hardcodes a near-white color, the body text would silently
 * regress to invisible.
 *
 * The earlier light-mode-contrast.spec.ts covers /docs/getting-started,
 * /blog/audit-trail, and /demo/hackathon. This file extends coverage
 * to the standalone editorial pages (pricing, press-kit, blog landing,
 * contact, store) and the global boundary pages (404).
 */

const NEAR_WHITE_THRESHOLD = 160;

function parseRgb(rgbString: string): [number, number, number] | null {
    const match = rgbString.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (!match) return null;
    return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isReadableOnLight(rgbString: string): boolean {
    const channels = parseRgb(rgbString);
    if (!channels) return false;
    return channels.every((c) => c < NEAR_WHITE_THRESHOLD);
}

async function assertMarketingLightTheme(page: import('@playwright/test').Page, route: string) {
    await page.goto(route, { waitUntil: 'load', timeout: 60_000 });

    // Step 1: assert the page has a `.theme-light` wrapper. This is the
    // root cause that protects every dark-palette utility class
    // (text-white, text-gray-*, bg-white/N, border-white/N, plus the
    // `text-[#D4D4D8]` arbitrary hex used by blog content) from
    // rendering near-white on the #FAFAFA marketing surface. Without
    // the wrapper, every override block in app/globals.css sits idle.
    const hasThemeLight = await page.evaluate(() => {
        return !!document.querySelector('.theme-light');
    });
    expect(hasThemeLight, `${route} is missing the .theme-light wrapper`).toBe(true);

    // Step 2: assert body copy is readable. We sample paragraphs over
    // headings because a number of headings on the marketing site use
    // `bg-clip-text` gradients with `text-fill-color: transparent`,
    // which technically reports `color: rgb(...)` from getComputedStyle
    // but renders as the gradient instead. Body copy uses simple text
    // tokens that any theme-flip regression would expose immediately.
    const styles = await page.evaluate(() => {
        const out: Array<{ tag: string; text: string; color: string }> = [];
        document.querySelectorAll('p, li').forEach((el) => {
            if (!(el instanceof HTMLElement)) return;
            const text = (el.textContent || '').trim();
            // Skip empty and decorative text (icons, very short labels).
            if (text.length < 8) return;
            // Skip elements that are inside an .always-dark block (the
            // footer card, modals, etc., which intentionally stay dark
            // even on the light marketing surface).
            if (el.closest('[data-always-dark]')) return;
            const cs = window.getComputedStyle(el);
            out.push({
                tag: el.tagName,
                text: text.slice(0, 40),
                color: cs.color,
            });
        });
        return out.slice(0, 10);
    });

    expect(styles.length, `${route} renders no body copy to sample`).toBeGreaterThan(0);
    for (const s of styles) {
        expect(
            isReadableOnLight(s.color),
            `${route}: ${s.tag} "${s.text}" rendered at ${s.color} (too light for the marketing surface)`,
        ).toBe(true);
    }
}

test('/ homepage reads on light surface', async ({ page }) => {
    // The homepage is the primary marketing surface and the entry
    // point most visitors land on. Cover it explicitly so a future
    // change that drops `theme-light` from app/page.tsx (e.g. during
    // a refactor) doesn't ship as an invisible regression.
    await assertMarketingLightTheme(page, '/');
});

test('/pricing standalone page heading reads on light surface', async ({ page }) => {
    await assertMarketingLightTheme(page, '/pricing');
});

test('/press-kit page heading reads on light surface', async ({ page }) => {
    await assertMarketingLightTheme(page, '/press-kit');
});

test('/blog landing page heading reads on light surface', async ({ page }) => {
    await assertMarketingLightTheme(page, '/blog');
});

test('/contact page heading reads on light surface', async ({ page }) => {
    await assertMarketingLightTheme(page, '/contact');
});

test('/store page heading reads on light surface', async ({ page }) => {
    await assertMarketingLightTheme(page, '/store');
});

test('/not-real-route 404 reads on light surface', async ({ page }) => {
    // Triggers the global app/not-found.tsx render. The 404 page wraps
    // in .theme-light per PR #364 so a misspelled URL on the marketing
    // site doesn't flip into the dashboard's dark chrome.
    await assertMarketingLightTheme(page, '/asdf-this-route-does-not-exist');
});
