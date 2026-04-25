import { test as baseTest } from '@playwright/test';
import type { Browser, BrowserContext, Page, Request as PWRequest } from '@playwright/test';

/**
 * Shared Playwright helpers for Operator Uplift E2E specs.
 *
 * Consolidates the auth-bypass, subscription-mock, and same-origin
 * /api/* request-log patterns that every new spec has needed. Without
 * this file each spec re-implements the same 20-30 lines of setup and
 * the patterns drift.
 *
 * When to reach for what:
 *
 *   authBypassViaStorage()   — unit-ish E2E that needs to land on a
 *                              gated route without a real Privy JWT
 *   mockSubscriptionPro()    — pair with authBypassViaStorage so the
 *                              AuthGate's subscription fetch resolves
 *                              immediately rather than timing out
 *   recordSameOriginApiCalls() — any spec that asserts a network
 *                              invariant (e.g. "zero /api/* in
 *                              simulated mode"). Filters out third-
 *                              party SDK calls so Privy traffic
 *                              doesn't pollute the log.
 *   newContextWithUA()       — variant testing for OS-aware or
 *                              browser-aware code paths
 *   waitForSettled()         — small readable alternative to
 *                              page.waitForTimeout where the reason
 *                              is "let an animation play"
 *
 * Conventions:
 *   - Every helper is pure + side-effect-described-in-name
 *   - Every helper returns a plain value or a tear-down function
 *   - No globals; nothing persists across tests
 */

export const DEFAULT_BASE_URL = 'http://localhost:3000';

function resolveBaseUrl(): string {
    return process.env.PLAYWRIGHT_BASE_URL || DEFAULT_BASE_URL;
}

/**
 * Same-origin `/api/*` request recorder.
 *
 * Attach once per test. Returns the mutable log array + a detach fn.
 * Filters out third-party calls (Privy analytics, Google, etc.) so the
 * network invariant is about our server, not our dependencies.
 *
 * @example
 *   const { apiCalls } = recordSameOriginApiCalls(page);
 *   await page.goto('/chat');
 *   expect(apiCalls).toEqual([]);
 */
export function recordSameOriginApiCalls(page: Page): {
    apiCalls: string[];
    detach: () => void;
} {
    const apiCalls: string[] = [];
    const origin = new URL(resolveBaseUrl()).origin;
    const listener = (req: PWRequest) => {
        const url = req.url();
        if (url.startsWith(origin) && url.includes('/api/')) {
            apiCalls.push(`${req.method()} ${url}`);
        }
    };
    page.on('request', listener);
    return {
        apiCalls,
        detach: () => page.off('request', listener),
    };
}

/**
 * Seed the minimum localStorage to pass AuthGate's fast-path.
 *
 * Requires an auth-optional route to load first so `localStorage` has
 * an origin; `/chat` is the safest because it's already in
 * `AUTH_OPTIONAL_ROUTES`. We do the navigation + seed here so callers
 * don't have to remember the two-step dance.
 *
 * @example
 *   await authBypassViaStorage(page);
 *   await page.goto('/agents');  // AuthGate lets us through now
 */
export async function authBypassViaStorage(page: Page): Promise<void> {
    await page.goto('/chat');
    await page.evaluate(() => {
        try {
            localStorage.setItem('early_access', 'granted');
            localStorage.setItem('subscription_tier', 'pro');
        } catch {
            /* storage blocked in some environments; not fatal */
        }
    });
}

/**
 * Intercept `/api/subscription` so the AuthGate sees an active Pro
 * tier regardless of Supabase availability. Use when the spec must be
 * hermetic (no real backend required).
 */
export async function mockSubscriptionPro(page: Page): Promise<void> {
    await page.route('**/api/subscription', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                tier: 'pro',
                active: true,
                expiresAt: null,
                source: 'test_mock',
            }),
        });
    });
}

/**
 * Combined setup: mock subscription + seed storage + land on /chat
 * ready for navigation to a gated route.
 */
export async function prepareGatedSession(page: Page): Promise<void> {
    await mockSubscriptionPro(page);
    await authBypassViaStorage(page);
}

/**
 * Fresh context with a specific user agent. Each context is its own
 * origin-scoped storage bucket, so tests that exercise UA-dependent
 * behaviour stay independent.
 */
export async function newContextWithUA(
    browser: Browser,
    userAgent: string,
    opts: { viewport?: { width: number; height: number } } = {},
): Promise<{ page: Page; context: BrowserContext }> {
    const context = await browser.newContext({
        userAgent,
        viewport: opts.viewport ?? { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    return { page, context };
}

/** Small readable alias for `page.waitForTimeout(ms)` when the reason is "let animations settle". */
export async function waitForSettled(page: Page, ms = 300): Promise<void> {
    await page.waitForTimeout(ms);
}

/** Common UA strings used across specs. */
export const UA = {
    MAC: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    WINDOWS: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    LINUX: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
} as const;

/**
 * Real-mode helper: returns PLAYWRIGHT_PRIVY_TOKEN or skips the test.
 *
 * Replaces the `const token = process.env...; test.skip(!token, ...)`
 * pair that the four real-mode spec files (bypass, paywall, x402-gate,
 * capability/logged-in) repeated 15+ times. Centralizing the skip
 * message keeps the failure mode uniform across CI logs.
 *
 * @example
 *   test('thing', async ({ request }) => {
 *     const token = requirePrivyToken();
 *     const res = await request.get('/api/x', { headers: authedHeaders(token) });
 *   });
 */
export function requirePrivyToken(): string {
    const token = process.env.PLAYWRIGHT_PRIVY_TOKEN;
    baseTest.skip(!token, 'PLAYWRIGHT_PRIVY_TOKEN not set');
    return token as string;
}

/**
 * Returns the standard Bearer-auth header set used by every real-mode
 * spec. Pass `extra` to merge additional headers like Content-Type.
 */
export function authedHeaders(token: string, extra: Record<string, string> = {}): Record<string, string> {
    return { Authorization: `Bearer ${token}`, ...extra };
}

/**
 * Seed both the cookie and the localStorage token that the client
 * AuthGate looks for. Used by browser-side specs that need a
 * pre-authenticated page before the first navigation.
 *
 * @example
 *   const token = requirePrivyToken();
 *   await seedAuthedSession(page, context, token);
 *   await page.goto('/chat');
 */
export async function seedAuthedSession(
    page: Page,
    context: BrowserContext,
    token: string,
): Promise<void> {
    await context.addCookies([
        {
            name: 'privy-token',
            value: token,
            domain: new URL(page.url() || resolveBaseUrl()).hostname,
            path: '/',
        },
    ]);
    await page.addInitScript((tok: string) => {
        localStorage.setItem('token', tok);
    }, token);
}
