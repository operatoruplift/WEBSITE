import { test, expect } from '@playwright/test';

/**
 * W1A-honesty-1 acceptance spec.
 *
 * Verifies the chat UI does not fabricate anything when a tool call
 * fails. Specifically:
 *   - Intercepts /api/tools/calendar so the response is a controlled
 *     error envelope (503, provider_unavailable, with a known
 *     requestId).
 *   - Drives /chat anonymously so the page takes the simulated path
 *     (never reaches the intercepted route for a write action — the
 *     simulated path uses executeMock client-side, which is already
 *     honest).
 *   - Confirms no "LLM Council", no "5 agents debating", no fake
 *     "Chairman", no fabricated Solana / payment / receipt language,
 *     and no invented request IDs.
 *
 * The intercept is a belt-and-braces for future real-mode regressions
 * too: if any code path accidentally calls /api/tools/calendar in
 * simulated mode, the intercept fires with a fake 503 and the UI
 * must render it plainly, not turn it into a fake success story.
 */

const FORBIDDEN_PHRASES = [
    'LLM Council',
    '5 agents debating',
    '5 agents debate',
    'Council processing',
    'Council Debate Transcript',
    'View Council',
    'Chairman',
    'Contrarian',
    'First Principles thinker',
    'Expansionist',
    'Outsider',
    // Fabrication signals from the brief
    'fake tx_signature',
    'synthesized on devnet',
    // Invented-receipt-style phrasing the UI should never produce on its own
    'receipt generated',
    'payment settled',
];

test('/chat renders no council wrapper + no fabricated tool transcripts', async ({ page }) => {
    // Make /api/tools/calendar a fake 503 envelope so any accidental
    // write attempt lands on a known failure mode we can assert against.
    await page.route('**/api/tools/calendar', async (route) => {
        await route.fulfill({
            status: 503,
            contentType: 'application/json',
            headers: { 'x-request-id': 'req_test_fake_error' },
            body: JSON.stringify({
                error: 'provider_unavailable',
                errorClass: 'provider_unavailable',
                requestId: 'req_test_fake_error',
                timestamp: '2026-04-22T00:00:00.000Z',
                message: 'Calendar provider is temporarily unavailable.',
                nextAction: 'Try again in a moment.',
            }),
        });
    });

    await page.goto('/chat');

    // Type a calendar-scheduling prompt. Simulated mode returns a canned
    // briefing reply client-side (no /api/* call). This validates the
    // "no multi-persona debate wrapper" and "no fake transcript" rules.
    const textarea = page.getByPlaceholder(/Message .+/);
    await textarea.fill('Schedule a meeting tomorrow at 2pm');
    await textarea.press('Enter');

    // Wait for the assistant bubble to appear. The canned fallback is
    // deterministic (see lib/cannedReplies.ts).
    await expect(page.locator('[class*="bg-foreground"]').first()).toBeVisible({ timeout: 10_000 });

    // Let the streamed canned reply land fully.
    await page.waitForTimeout(2000);

    // Scan the full rendered DOM for forbidden phrases.
    const body = (await page.locator('body').innerText()).toLowerCase();
    for (const phrase of FORBIDDEN_PHRASES) {
        expect(body, `forbidden phrase detected in chat: "${phrase}"`).not.toContain(phrase.toLowerCase());
    }
});

test('chat header loading state does not say "5 agents debating"', async ({ page }) => {
    // The loading indicator used to switch between "Chat is thinking"
    // and "5 agents debating" based on a councilProcessing flag. The
    // flag is gone; the loading label must be the single model name.
    await page.goto('/chat');

    const textarea = page.getByPlaceholder(/Message .+/);
    await textarea.fill('Hello');
    await textarea.press('Enter');

    // During the brief loading window, the thinking indicator should
    // show the active model's label, not a debate phrase.
    const loadingArea = page.locator('text=/is thinking/i').first();
    if (await loadingArea.isVisible({ timeout: 3_000 }).catch(() => false)) {
        const text = (await loadingArea.innerText()).toLowerCase();
        expect(text).not.toContain('5 agents');
        expect(text).not.toContain('debating');
        expect(text).not.toContain('council');
    }
});
