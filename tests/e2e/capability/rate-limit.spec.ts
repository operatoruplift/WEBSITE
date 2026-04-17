import { test, expect } from '@playwright/test';

/**
 * Capability — demo rate limit.
 *
 * /api/chat gives anonymous visitors 10 requests per IP per hour before
 * responding 429. The test fires 12 parallel POSTs and asserts at least
 * one 429 is returned. Using parallel rather than sequential so the
 * test is fast and the rate-limit window is hit deterministically on a
 * cold limiter.
 */
test.describe('Capability — rate limit (demo)', () => {
    test('11th+ /api/chat request from same IP returns 429', async ({ request }) => {
        const messages = Array.from({ length: 12 }, (_, i) => `What is on my calendar today? ${i}`);
        const responses = await Promise.all(
            messages.map(msg =>
                request.post('/api/chat', {
                    data: { message: msg },
                    headers: { 'Content-Type': 'application/json' },
                }),
            ),
        );
        const statuses = responses.map(r => r.status());
        const got429 = statuses.some(s => s === 429);
        expect(got429).toBe(true);
    });
});
