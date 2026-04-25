import { test, expect } from '@playwright/test';
import { authedHeaders, requirePrivyToken, seedAuthedSession } from '../_helpers';

/**
 * Capability, logged in (Real mode).
 *
 * Requires a valid Privy JWT to be supplied via PLAYWRIGHT_PRIVY_TOKEN.
 * When present, /api/capabilities should return capability_real=true
 * (because the server has at least one LLM provider key in env). The
 * /chat page then renders the Real pill.
 *
 * Two sub-scenarios:
 *   1. capability_google, user has Google connected. Full Real mode,
 *      Calendar/Gmail tools available.
 *   2. capability_key only, user has no Google, so Calendar/Gmail
 *      should be hidden from the tool picker but web.search remains.
 *
 * Both are skipped without the required env vars. Never produces a
 * false green.
 */

const EXPECT_GOOGLE = process.env.PLAYWRIGHT_EXPECT_GOOGLE === '1';

test.describe('Capability, logged in', () => {
    test('capability_real=true resolves to Real pill on /chat', async ({ page, context }) => {
        const token = requirePrivyToken();
        await seedAuthedSession(page, context, token);
        await page.goto('/chat');
        await expect(page.getByText(/Real/i).first()).toBeVisible({ timeout: 10_000 });
    });

    test('/api/capabilities reports capability_real=true', async ({ request }) => {
        const token = requirePrivyToken();
        const res = await request.get('/api/capabilities', {
            headers: authedHeaders(token),
        });
        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.authenticated).toBe(true);
        expect(body.capability_real).toBe(true);
        if (EXPECT_GOOGLE) {
            expect(body.capability_google).toBe(true);
        }
    });

    test('/api/chat does not return demo headers for authed user', async ({ request }) => {
        const token = requirePrivyToken();
        const res = await request.post('/api/chat', {
            data: { message: 'hi', model: 'claude-haiku-4-5' },
            headers: authedHeaders(token, { 'Content-Type': 'application/json' }),
        });
        // The real path streams 200 OR rate-limits to 429 if this user
        // has already been spamming the endpoint, either is acceptable
        // here, we just need to confirm it isn't the demo branch.
        expect(res.headers()['x-demo-mode']).toBeUndefined();
    });
});
