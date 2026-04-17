import { test, expect } from '@playwright/test';

/**
 * Capability — logged out (Demo mode).
 *
 * Anonymous visitor hits /chat. AUTH_OPTIONAL_ROUTES in AuthGate lets
 * them through. /api/capabilities returns all-false. The page renders
 * the Demo (simulated) pill and the "Anonymous demo" banner above the
 * composer. /api/chat returns canned replies.
 *
 * This spec is the minimum the Demo Day walk-through depends on —
 * judges land here first.
 */
test.describe('Capability — logged out', () => {
    test('loads /chat without redirect, shows Demo pill, simulated responses', async ({ page }) => {
        await page.goto('/chat');
        await expect(page).toHaveURL(/\/chat/);

        // Demo pill should appear once /api/capabilities resolves.
        await expect(page.getByText(/Demo · Simulated/i)).toBeVisible({ timeout: 10_000 });

        // Anonymous demo banner above the composer.
        await expect(page.getByText(/Anonymous demo/i)).toBeVisible();
    });

    test('/api/capabilities returns all-false for anonymous', async ({ request }) => {
        const res = await request.get('/api/capabilities');
        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.capability_google).toBe(false);
        expect(body.capability_key).toBe(false);
        expect(body.capability_real).toBe(false);
        expect(body.authenticated).toBe(false);
    });

    test('/api/chat returns the demo-mode stream for anonymous', async ({ request }) => {
        const res = await request.post('/api/chat', {
            data: { message: 'What is on my calendar today?' },
            headers: { 'Content-Type': 'application/json' },
        });
        expect(res.ok()).toBeTruthy();
        expect(res.headers()['x-demo-mode']).toBe('1');
        expect(res.headers()['x-demo-beat']).toBe('briefing');
    });
});
