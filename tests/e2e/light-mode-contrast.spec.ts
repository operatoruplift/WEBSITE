import { test, expect } from '@playwright/test';

/**
 * Light-mode contrast regression guards.
 *
 * Locks in the fixes shipped across PRs #319 (docs/blog prose tokens),
 * #320 (arbitrary hex overrides), and #321 (hackathon drops the
 * marketing theme). Without these guards, any future component that
 * uses the dark-mode color palette inside a `.theme-light` wrapper
 * would silently regress to near-white-on-white text.
 *
 * Each test reads the rendered foreground color of body copy that
 * previously regressed, and asserts the channel intensity is below the
 * "near-white" threshold (160 / 255 max per channel). The earlier
 * regressions returned 250-as-each-channel, which is unreadable on the
 * #FAFAFA marketing surface.
 */

const NEAR_WHITE_THRESHOLD = 160;

function parseRgb(rgbString: string): [number, number, number] | null {
    // matches "rgb(R, G, B)" or "rgb(R G B)" or "rgba(R,G,B,A)"
    const match = rgbString.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (!match) return null;
    return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isReadableOnLight(rgbString: string): boolean {
    const channels = parseRgb(rgbString);
    if (!channels) return false;
    return channels.every((c) => c < NEAR_WHITE_THRESHOLD);
}

test('docs body prose is dark on light, not near-white', async ({ page }) => {
    await page.goto('/docs/getting-started', { waitUntil: 'load', timeout: 60_000 });

    const styles = await page.evaluate(() => {
        const out: Array<{ tag: string; text: string; color: string }> = [];
        const pickFor = (selector: string) => {
            document.querySelectorAll(selector).forEach((el) => {
                if (!(el instanceof HTMLElement)) return;
                const cs = window.getComputedStyle(el);
                out.push({
                    tag: el.tagName,
                    text: (el.textContent || '').trim().slice(0, 40),
                    color: cs.color,
                });
            });
        };
        pickFor('.docs-prose h2');
        pickFor('.docs-prose .lead');
        pickFor('.docs-prose p');
        return out.slice(0, 6);
    });

    expect(styles.length).toBeGreaterThan(0);
    for (const s of styles) {
        expect(
            isReadableOnLight(s.color),
            `${s.tag} "${s.text}" rendered at ${s.color} which is too light for /docs marketing surface`,
        ).toBe(true);
    }
});

test('blog post body is dark on light, not near-white', async ({ page }) => {
    await page.goto('/blog/audit-trail', { waitUntil: 'load', timeout: 60_000 });

    const styles = await page.evaluate(() => {
        const out: Array<{ tag: string; text: string; color: string }> = [];
        document.querySelectorAll('.blog-content p').forEach((el) => {
            if (!(el instanceof HTMLElement)) return;
            const cs = window.getComputedStyle(el);
            out.push({
                tag: el.tagName,
                text: (el.textContent || '').trim().slice(0, 40),
                color: cs.color,
            });
        });
        return out.slice(0, 5);
    });

    expect(styles.length).toBeGreaterThan(0);
    for (const s of styles) {
        expect(
            isReadableOnLight(s.color),
            `blog ${s.tag} "${s.text}" rendered at ${s.color} which is too light for /blog marketing surface`,
        ).toBe(true);
    }
});

test('hackathon page stays dark, does not adopt theme-light', async ({ page }) => {
    await page.goto('/demo/hackathon', { waitUntil: 'load', timeout: 60_000 });

    // The hackathon page is intentionally dark by design (PR #321).
    // The top-level wrapper must NOT carry the theme-light class, or the
    // dark-bg cards inside will render with dark-on-dark text.
    const wrapperHasThemeLight = await page.evaluate(() => {
        const root = document.querySelector('main')?.parentElement
            ?? document.body.firstElementChild;
        return !!(root && root.classList.contains('theme-light'));
    });
    expect(wrapperHasThemeLight).toBe(false);

    // The "Agent proposes an action" step title must be readable on its
    // dark card. Before #321, theme-light flipped this to #0A0A0A on
    // bg-[#111111], making it invisible.
    const heading = page.getByText('Agent proposes an action').first();
    await expect(heading).toBeVisible();
    const color = await heading.evaluate((el) => window.getComputedStyle(el).color);
    const rgb = parseRgb(color);
    expect(rgb, `step title color: ${color}`).not.toBeNull();
    if (rgb) {
        // White text on dark card: each channel should be high (>= 200).
        expect(rgb.every((c) => c >= 200)).toBe(true);
    }
});
