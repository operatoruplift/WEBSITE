import { test, type Page } from '@playwright/test';
import path from 'node:path';

/**
 * Captures screenshots of the DownloadCTA variants for W1A-download-1.
 * Not a regression test, just a deterministic way to produce the
 * deliverable images. Run manually when you need fresh shots:
 *
 *   pnpm exec playwright test tests/e2e/download-screenshots.spec.ts
 *
 * Artifacts land in docs/research/screenshots/. Commit the files.
 */

const UA_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const UA_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const OUT_DIR = path.join(process.cwd(), 'docs', 'research', 'screenshots');

async function withUA(browser: import('@playwright/test').Browser, ua: string): Promise<Page> {
    const ctx = await browser.newContext({ userAgent: ua, viewport: { width: 1280, height: 800 } });
    return ctx.newPage();
}

test('snapshot mac variant', async ({ browser }) => {
    const page = await withUA(browser, UA_MAC);
    await page.goto('/');
    const primary = page.getByTestId('download-primary');
    await primary.waitFor({ state: 'visible' });
    // Wait for FadeIn animation to settle + hydrate
    await page.waitForTimeout(1500);
    const root = page.getByTestId('download-cta-root');
    await root.screenshot({ path: path.join(OUT_DIR, 'download-cta-macos.png') });
});

test('snapshot windows variant', async ({ browser }) => {
    const page = await withUA(browser, UA_WIN);
    await page.goto('/');
    const primary = page.getByTestId('download-primary');
    await primary.waitFor({ state: 'visible' });
    await page.waitForTimeout(1500);
    const root = page.getByTestId('download-cta-root');
    await root.screenshot({ path: path.join(OUT_DIR, 'download-cta-windows.png') });
});
