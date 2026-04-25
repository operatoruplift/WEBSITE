import { test, expect } from '@playwright/test';
import { authedHeaders, requirePrivyToken } from './_helpers';

/**
 * Blocker 2 smoke tests, paywall bypass for a session email / userId.
 *
 * Requires:
 *   PLAYWRIGHT_PRIVY_TOKEN     valid Privy JWT for a bypass-listed user
 *   PLAYWRIGHT_BYPASS_EMAIL    email on PAYWALL_BYPASS_EMAILS (or)
 *   PLAYWRIGHT_BYPASS_USER_ID  userId on PAYWALL_BYPASS_USER_IDS
 *   DEBUG_ADMIN_KEY            matching server key, for /api/whoami
 */

test.describe('bypass, server', () => {
    test('/api/subscription returns active=true with tier=pro when session email is bypassed', async ({ request }) => {
        const token = requirePrivyToken();

        const res = await request.get('/api/subscription', {
            headers: authedHeaders(token),
        });
        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        // One of: bypass_all | bypass_email | supabase_active
        expect(['bypass_all', 'bypass_email', 'supabase_active']).toContain(body.source);
        expect(body.active).toBe(true);
        expect(body.tier === 'pro' || body.tier === 'enterprise').toBe(true);
    });

    test('/api/whoami diagnostic reports used_identifier', async ({ request }) => {
        const token = requirePrivyToken();
        const adminKey = process.env.DEBUG_ADMIN_KEY;
        test.skip(!adminKey, 'DEBUG_ADMIN_KEY required');

        const res = await request.get('/api/whoami', {
            headers: authedHeaders(token, { 'X-Debug-Key': adminKey! }),
        });
        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.privy_user_id).toMatch(/^did:privy:/);
        expect(body.jws_diagnostic.shape_ok).toBe(true);
        // One of the bypass paths must have matched
        expect(['global_flag', 'user_id', 'email', 'supabase_row']).toContain(body.used_identifier);
    });
});

test.describe('bypass, client', () => {
    test('bypass user lands on /chat (not /marketplace) after visiting a gated URL', async ({ page }) => {
        const token = requirePrivyToken();

        // Pre-seed the session token into localStorage
        await page.addInitScript(tok => {
            localStorage.setItem('token', tok);
            localStorage.setItem('user', JSON.stringify({ email: 'bypass@example.com', id: 'did:privy:test' }));
        }, token);

        await page.goto('/chat');
        // Should remain on /chat (not redirect to /paywall)
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/\/chat/);
    });
});
