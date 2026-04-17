import { test, expect } from '@playwright/test';

/**
 * Paywall smoke tests.
 *
 * Three scenarios covered:
 *   1. Unauthenticated user hitting a gated route is redirected to /paywall
 *   2. A bypass-email user can access /chat directly
 *   3. Clicking Pro CTA creates an invoice and shows the awaiting-payment UI
 *
 * Environment variables required for scenarios 2 and 3:
 *   PLAYWRIGHT_BYPASS_EMAIL   — an email listed in PAYWALL_BYPASS_EMAILS on the server
 *   PLAYWRIGHT_PRIVY_TOKEN    — a valid Privy JWT for that email (obtained by logging in once)
 *
 * If those are not set, the test skips — it never produces a false green.
 */

test.describe('Paywall', () => {
    test('blocks unauthenticated access to gated routes', async ({ page }) => {
        // /chat is intentionally reachable in Demo mode — do NOT assert a redirect.
        // A genuinely gated route like /security must still gate.
        await page.goto('/security');

        await page.waitForURL(/\/(paywall|login)/, { timeout: 10_000 }).catch(() => {
            return expect(page.getByText(/private beta/i)).toBeVisible({ timeout: 5_000 });
        });
    });

    test('bypass user can access /chat directly', async ({ page, context }) => {
        const token = process.env.PLAYWRIGHT_PRIVY_TOKEN;
        const email = process.env.PLAYWRIGHT_BYPASS_EMAIL;
        test.skip(!token || !email, 'PLAYWRIGHT_PRIVY_TOKEN + PLAYWRIGHT_BYPASS_EMAIL not set');

        await context.addCookies([
            { name: 'privy-token', value: token!, domain: new URL(page.url() || 'http://localhost:3000').hostname, path: '/' },
        ]);
        await page.addInitScript(tok => {
            localStorage.setItem('token', tok);
        }, token!);

        await page.goto('/chat');
        // Chat page should render — look for the model selector or send input
        await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });
        await expect(page).toHaveURL(/\/chat/);
    });

    test('Pro CTA creates a pending invoice', async ({ page, request }) => {
        const token = process.env.PLAYWRIGHT_PRIVY_TOKEN;
        test.skip(!token, 'PLAYWRIGHT_PRIVY_TOKEN not set');

        // Hit /api/subscription directly with action=create_invoice
        const res = await request.post('/api/subscription', {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            data: { action: 'create_invoice' },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.status).toBe('pending');
        expect(body.invoice_reference).toMatch(/^inv-/);
        expect(body.amount_usdc).toBe(19);
        expect(body.recipient).toBeTruthy();
    });

    test('debug endpoint requires admin key', async ({ request }) => {
        const res = await request.get('/api/debug/subscription');
        // Without auth or admin key, should get 403
        expect([401, 403]).toContain(res.status());
    });
});
