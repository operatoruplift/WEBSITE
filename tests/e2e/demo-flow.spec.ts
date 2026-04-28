import { test, expect } from '@playwright/test';

/**
 * W1A-demo-1b acceptance — the simulated-mode chat flow is deterministic,
 * hits zero /api/* routes, and renders the exact canned reply text.
 *
 * Run (against local dev):
 *   pnpm dev &
 *   pnpm exec playwright test tests/e2e/demo-flow.spec.ts
 *
 * Run against staging/preview:
 *   PLAYWRIGHT_BASE_URL=https://preview.operatoruplift.com \
 *     pnpm exec playwright test tests/e2e/demo-flow.spec.ts
 *
 * See docs/research/DEMO_SCRIPT.md for the human-readable walkthrough.
 */

// Anonymous demo mode talks to one route only: POST /api/chat. The
// server's demo branch streams the canned reply directly. Anything
// else hitting /api/* (capabilities, audit/log, notifications/pinned,
// etc.) means the client leaked into the authenticated path.
const ALLOWED_DEMO_API = /\/api\/chat(\?|$)/;

function recordLeaks(page: import('@playwright/test').Page): string[] {
    const leaks: string[] = [];
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    const originOrigin = new URL(baseUrl).origin;
    page.on('request', (req) => {
        const url = req.url();
        if (!url.startsWith(originOrigin)) return;
        if (!url.includes('/api/')) return;
        if (ALLOWED_DEMO_API.test(url)) return;
        leaks.push(`${req.method()} ${url}`);
    });
    return leaks;
}

test('simulated chat: only /api/chat is hit, exact canned briefing reply', async ({ page, context }) => {
    // Belt-and-braces: anonymous visitor, no stale auth token. Server-side
    // canned replies arrive via /api/chat; nothing else should be called.
    await context.clearCookies();
    await context.addInitScript(() => {
        try { localStorage.removeItem('token'); } catch { /* noop */ }
    });

    const leaks = recordLeaks(page);

    await page.goto('/chat');

    // Simulated indicator must be visible before we type. data-testid
    // locks in the assertion contract so copy tweaks do not break it.
    await expect(page.getByTestId('simulated-indicator')).toBeVisible();
    await expect(page.getByTestId('simulated-indicator')).toContainText('Simulated');

    // Type the briefing prompt and click the send icon. Prefer typing
    // into the actual textarea so onKeyDown + onChange fire the same
    // way a real user would drive the UI.
    const textarea = page.getByPlaceholder(/Message .+/);
    await textarea.click();
    await textarea.fill('What\u2019s on my calendar today?');

    // Send button is the last sibling in the input row. Its aria-label
    // is implicit, so target by the Send lucide icon via role=button
    // nearest to the textarea. Assertion is robust because there is
    // exactly one send button per turn.
    const sendButton = page.locator('button[disabled=""], button:not([disabled])').filter({
        has: page.locator('svg.lucide-send'),
    }).first();
    await sendButton.click();

    // The canned briefing reply starts with this exact string (no typos,
    // no em dashes). Wait for the full text before the network check.
    const expectedOpener = "Here's what's on your calendar today:";
    const expectedFirstBullet = '9:00 AM';
    const expectedSecondBullet = '1:1 with Sarah';

    await expect(page.getByText(expectedOpener)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(expectedFirstBullet)).toBeVisible();
    await expect(page.getByText(expectedSecondBullet)).toBeVisible();

    // Hard acceptance: zero leaks to non-/api/chat routes in demo mode.
    expect(leaks, `Demo mode leaked into non-/api/chat routes:\n${leaks.join('\n')}`).toEqual([]);
});

test('simulated chat: tool approval routes to executeMock (no extra network)', async ({ page }) => {
    const leaks = recordLeaks(page);

    await page.goto('/chat');
    await expect(page.getByTestId('simulated-indicator')).toBeVisible();

    const textarea = page.getByPlaceholder(/Message .+/);
    await textarea.fill('What\u2019s on my calendar today?');
    await textarea.press('Enter');

    // Wait for the briefing reply + its tool_use block to stream in.
    // The ToolApprovalModal opens on the first <tool_use> block.
    await expect(page.getByText('Tool Permission Request')).toBeVisible({ timeout: 10_000 });
    // Simulated pill inside the modal confirms the mock path is selected.
    await expect(page.getByText(/Simulated/).first()).toBeVisible();

    // Deny closes the modal without an extra network call.
    await page.getByRole('button', { name: /Deny/i }).click();
    await expect(page.getByText('Tool Permission Request')).not.toBeVisible();

    expect(leaks, `Demo mode leaked into non-/api/chat routes:\n${leaks.join('\n')}`).toEqual([]);
});
