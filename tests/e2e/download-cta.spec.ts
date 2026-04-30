import { test, expect, type Page } from '@playwright/test';

/**
 * W1A-download-1 acceptance. The Hero download CTA picks the right
 * installer per OS automatically.
 *
 * Covers:
 *  - macOS userAgent → primary button says "Download for Mac".
 *  - Windows userAgent → primary button says "Download for Windows".
 *
 * The "Other downloads" dropdown was removed in PR #310 (user feedback
 * called it repetitive next to the Sign-In primary CTA). Users on a
 * different OS get the installer via /docs.
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

// Pre-launch (no NEXT_PUBLIC_DOWNLOAD_<OS> env vars set) the CTA reads
// "Get early access for <OS>" instead of "Download for <OS>" so the
// button text matches what actually happens on click. The data-os
// attribute is the stable signal across both modes; assertions allow
// either label so the spec works pre-launch and post-launch.
const DOWNLOAD_OR_EARLY_ACCESS_RE = (os: string) =>
    new RegExp(`(Download|Get early access)\\s+for\\s+${os}`, 'i');

test('Mac UA selects the macOS install option', async ({ browser }) => {
    const page = await withUserAgent(browser, UA_MAC);
    await page.goto('/');
    const primary = page.getByTestId('download-primary');
    await expect(primary).toBeVisible();
    await expect(primary).toHaveAttribute('data-os', 'macos');
    await expect(primary).toContainText(DOWNLOAD_OR_EARLY_ACCESS_RE('Mac'));
});

test('Windows UA selects the Windows install option', async ({ browser }) => {
    const page = await withUserAgent(browser, UA_WIN);
    await page.goto('/');
    const primary = page.getByTestId('download-primary');
    await expect(primary).toBeVisible();
    await expect(primary).toHaveAttribute('data-os', 'windows');
    await expect(primary).toContainText(DOWNLOAD_OR_EARLY_ACCESS_RE('Windows'));
});

test('Mac UA does not show an "Other downloads" dropdown', async ({ browser }) => {
    const page = await withUserAgent(browser, UA_MAC);
    await page.goto('/');
    // The dropdown was removed in PR #310 — assert it stays gone.
    await expect(page.getByTestId('download-other-toggle')).toHaveCount(0);
    await expect(page.getByTestId('download-menu')).toHaveCount(0);
});
