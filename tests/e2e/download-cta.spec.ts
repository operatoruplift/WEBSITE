import { test, expect, type Page } from '@playwright/test';

/**
 * W1A-download-1 acceptance. The Hero download CTA picks the right
 * installer per OS and supports manual override via the dropdown.
 *
 * Covers:
 *  - macOS userAgent → primary button says "Download for Mac".
 *  - Windows userAgent → primary button says "Download for Windows".
 *  - Manual override via the dropdown changes both label and link.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/download-cta.spec.ts --reporter=list
 */

const UA_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const UA_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function withUserAgent(browser: import('@playwright/test').Browser, userAgent: string): Promise<Page> {
    const ctx = await browser.newContext({ userAgent });
    return ctx.newPage();
}

test('Mac UA gets "Download for Mac" CTA', async ({ browser }) => {
    const page = await withUserAgent(browser, UA_MAC);
    await page.goto('/');
    const primary = page.getByTestId('download-primary');
    await expect(primary).toBeVisible();
    await expect(primary).toHaveAttribute('data-os', 'macos');
    await expect(primary).toContainText(/Download for Mac/i);
});

test('Windows UA gets "Download for Windows" CTA', async ({ browser }) => {
    const page = await withUserAgent(browser, UA_WIN);
    await page.goto('/');
    const primary = page.getByTestId('download-primary');
    await expect(primary).toBeVisible();
    await expect(primary).toHaveAttribute('data-os', 'windows');
    await expect(primary).toContainText(/Download for Windows/i);
});

test('picking Linux from the dropdown overrides the default', async ({ browser }) => {
    const page = await withUserAgent(browser, UA_MAC);
    await page.goto('/');

    await expect(page.getByTestId('download-primary')).toHaveAttribute('data-os', 'macos');

    await page.getByTestId('download-other-toggle').click();
    await page.getByTestId('download-option-linux').click();

    await expect(page.getByTestId('download-primary')).toHaveAttribute('data-os', 'linux');
    await expect(page.getByTestId('download-primary')).toContainText(/Download for Linux/i);
});
