import { test, expect } from '@playwright/test';
import {
    recordSameOriginApiCalls,
    mockSubscriptionPro,
    authBypassViaStorage,
    prepareGatedSession,
    newContextWithUA,
    UA,
} from './_helpers';

/**
 * W1B-playwright-baseline acceptance spec. Proves every helper in
 * `_helpers.ts` actually works against the live dev server. Run:
 *
 *   pnpm exec playwright test tests/e2e/helpers.spec.ts --reporter=list
 *
 * This spec is the canonical reference for "how to write a new E2E
 * spec" — every later spec should look like one of these four shapes.
 */

test('recordSameOriginApiCalls tracks only same-origin /api/* requests', async ({ page }) => {
    const { apiCalls } = recordSameOriginApiCalls(page);
    await page.goto('/');
    // The landing page may or may not fire /api/* requests depending on
    // capability-detection; the assertion is structural, not about count.
    for (const entry of apiCalls) {
        expect(entry).toMatch(/^(GET|POST|PUT|DELETE|PATCH) /);
        expect(entry).toContain('/api/');
    }
});

test('mockSubscriptionPro fulfills /api/subscription with a pro-tier payload', async ({ page }) => {
    await mockSubscriptionPro(page);
    // Load an origin page so the browser context can issue the fetch.
    // `page.request.fetch` bypasses page.route interception because it
    // uses a separate APIRequestContext; we must fetch from the page.
    await page.goto('/chat');
    const body = await page.evaluate(async () => {
        const res = await fetch('/api/subscription');
        return { status: res.status, json: await res.json() };
    });
    expect(body.status).toBe(200);
    expect(body.json.tier).toBe('pro');
    expect(body.json.active).toBe(true);
    expect(body.json.source).toBe('test_mock');
});

test('authBypassViaStorage seeds early_access + subscription_tier', async ({ page }) => {
    await authBypassViaStorage(page);
    const early = await page.evaluate(() => localStorage.getItem('early_access'));
    const tier = await page.evaluate(() => localStorage.getItem('subscription_tier'));
    expect(early).toBe('granted');
    expect(tier).toBe('pro');
});

test('prepareGatedSession combines mock + storage in one call', async ({ page }) => {
    const { apiCalls } = recordSameOriginApiCalls(page);
    await prepareGatedSession(page);
    // Browser-initiated fetch goes through the route interception.
    const body = await page.evaluate(async () => {
        const res = await fetch('/api/subscription');
        return res.json();
    });
    expect(body.source).toBe('test_mock');
    // The request log tracked the subscription call (mocked — still same-origin from the page's perspective)
    expect(apiCalls.some(c => c.includes('/api/subscription'))).toBe(true);
});

test('newContextWithUA creates an isolated context with a custom UA', async ({ browser }) => {
    const { page, context } = await newContextWithUA(browser, UA.WINDOWS);
    await page.goto('/');
    const uaOnPage = await page.evaluate(() => navigator.userAgent);
    expect(uaOnPage).toContain('Windows');
    await context.close();
});
