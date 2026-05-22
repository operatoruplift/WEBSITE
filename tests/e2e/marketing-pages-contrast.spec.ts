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

// 2026-05-22 dark redesign (PR #675): the homepage flipped from the
// light marketing palette to the design ref's dark palette (#0A0A0A
// background, foreground white, orange primary). The light-surface
// contrast contract no longer applies. /pricing, /press-kit, /blog,
// /contact, /docs still ride the light marketing palette and remain
// asserted below; when they convert to dark in follow-up PRs, drop
// their assertions too.
test('/ homepage uses the dark redesign palette', async ({ page }) => {
    await page.goto('/');
    // The homepage no longer wraps in `.theme-light`. Body computed
    // background is the dark token (#0A0A0A) and the h1 reads in the
    // light foreground (#FAFAFA). Lock both so a future revert to
    // light catches.
    const bodyBg = await page.evaluate(() => {
        const html = document.documentElement;
        const wrapper = html.querySelector('main')?.parentElement;
        return wrapper ? getComputedStyle(wrapper).backgroundColor : '';
    });
    // Tailwind compiles `bg-background` -> the CSS var -> rgb(10, 10, 10).
    // Allow either the rgb form or transparent (when the var resolves
    // through inheritance from <body>).
    expect(bodyBg, 'homepage wrapper background should be dark').toMatch(/rgb\(10,\s*10,\s*10\)|rgba\(0,\s*0,\s*0,\s*0\)/);

    // Hero h1 colour. In dark mode the heading is the foreground
    // token (#FAFAFA = rgb(250, 250, 250)).
    const h1Color = await page.locator('#hero-heading').first().evaluate(
        el => getComputedStyle(el).color,
    );
    expect(h1Color, 'hero h1 should render in the foreground token').toMatch(/rgb\(250,\s*250,\s*250\)/);
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

// /store was retired in the v10 reframe (Commitment Infrastructure
// has no marketplace surface). If a v10 storefront surface ships
// later, it should bring its own contrast test back.

test('/not-real-route 404 reads on light surface', async ({ page }) => {
    // Triggers the global app/not-found.tsx render. The 404 page wraps
    // in .theme-light per PR #364 so a misspelled URL on the marketing
    // site doesn't flip into the dashboard's dark chrome.
    await assertMarketingLightTheme(page, '/asdf-this-route-does-not-exist');
});
