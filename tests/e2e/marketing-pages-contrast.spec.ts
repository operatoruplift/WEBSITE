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

async function assertHeadingsReadable(page: import('@playwright/test').Page, route: string) {
    await page.goto(route, { waitUntil: 'load', timeout: 60_000 });

    const styles = await page.evaluate(() => {
        const out: Array<{ tag: string; text: string; color: string }> = [];
        // Headings carry the most weight on each page; if they regress
        // the entire page reads broken even if body copy is fine.
        document.querySelectorAll('h1, h2').forEach((el) => {
            if (!(el instanceof HTMLElement)) return;
            // Skip elements that are intentionally transparent (e.g.
            // `bg-clip-text` gradient titles set text-fill-color:transparent).
            // The gradient is the visible signal there, not the color.
            const cs = window.getComputedStyle(el);
            const fill = (cs as unknown as { webkitTextFillColor?: string }).webkitTextFillColor;
            if (fill && fill !== cs.color && fill.includes('rgba(0, 0, 0, 0)')) return;
            out.push({
                tag: el.tagName,
                text: (el.textContent || '').trim().slice(0, 40),
                color: cs.color,
            });
        });
        return out.slice(0, 8);
    });

    expect(styles.length, `${route} renders no h1/h2`).toBeGreaterThan(0);
    for (const s of styles) {
        expect(
            isReadableOnLight(s.color),
            `${route}: ${s.tag} "${s.text}" rendered at ${s.color} (too light for the marketing surface)`,
        ).toBe(true);
    }
}

test('/pricing standalone page heading reads on light surface', async ({ page }) => {
    await assertHeadingsReadable(page, '/pricing');
});

test('/press-kit page heading reads on light surface', async ({ page }) => {
    await assertHeadingsReadable(page, '/press-kit');
});

test('/blog landing page heading reads on light surface', async ({ page }) => {
    await assertHeadingsReadable(page, '/blog');
});

test('/contact page heading reads on light surface', async ({ page }) => {
    await assertHeadingsReadable(page, '/contact');
});

test('/store page heading reads on light surface', async ({ page }) => {
    await assertHeadingsReadable(page, '/store');
});

test('/not-real-route 404 reads on light surface', async ({ page }) => {
    // Triggers the global app/not-found.tsx render. The 404 page wraps
    // in .theme-light per PR #364 so a misspelled URL on the marketing
    // site doesn't flip into the dashboard's dark chrome.
    await assertHeadingsReadable(page, '/asdf-this-route-does-not-exist');
});
