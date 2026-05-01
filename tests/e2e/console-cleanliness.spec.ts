import { test, expect } from '@playwright/test';

/**
 * Console-cleanliness regression spec.
 *
 * Locks in PR #331 (Privy Solana connectors) and PR #319-#345
 * (light-mode contrast). Two assertions per route:
 *
 *   1. No console.error events fire during page load.
 *   2. No "Solana wallet login enabled, but no Solana wallet
 *      connectors" warning. PR #331 fixed this; without a regression
 *      test, the import or connector list could be removed and the
 *      warning would silently come back (20+ messages per page).
 *
 * Other warnings are tolerated, including the WalletConnect double-
 * init message which is a Privy/StrictMode quirk in dev (and the
 * env-var-driven fallback in prod). The assertions stay narrow so
 * the test doesn't fail on unrelated SDK noise.
 */

const ROUTES = ['/', '/pricing', '/contact', '/docs/getting-started', '/blog'];

for (const route of ROUTES) {
    test(`${route} has no console errors and no Privy Solana connector warning`, async ({ page }) => {
        const errors: string[] = [];
        const offendingWarnings: string[] = [];

        page.on('console', (msg) => {
            const text = msg.text();
            if (msg.type() === 'error') {
                errors.push(text);
            }
            if (msg.type() === 'warning' && /Solana wallet (connectors|login enabled)/i.test(text)) {
                offendingWarnings.push(text);
            }
        });
        page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

        await page.goto(route, { waitUntil: 'load', timeout: 60_000 });
        // Privy initializes asynchronously; wait long enough for the
        // SDK to log the warning if the regression is back.
        await page.waitForTimeout(2_500);

        expect(
            errors,
            `${route} produced console errors: ${errors.slice(0, 3).join(' | ')}`,
        ).toHaveLength(0);
        expect(
            offendingWarnings,
            `${route} re-introduced the Solana connector warning: ${offendingWarnings[0]?.slice(0, 200)}`,
        ).toHaveLength(0);
    });
}
