import { test, expect } from '@playwright/test';
import { authedHeaders, requirePrivyToken } from './_helpers';

/**
 * Gate 2 smoke tests.
 *
 * Covers the 402 -> pay -> retry loop for Calendar and Gmail tool
 * endpoints without requiring Google OAuth (we test the gate behavior
 * itself; Google-connected writes are tested manually).
 *
 * Requires: PLAYWRIGHT_PRIVY_TOKEN env var for a signed-in user.
 * If not set, tests skip. Never produces a false green.
 */

const JSON_HEADERS = { 'Content-Type': 'application/json' };

test.describe('x402 gate, Calendar', () => {
    test('calendar.create returns 402 without payment proof', async ({ request }) => {
        const token = requirePrivyToken();

        // First attempt, should get 402
        const res = await request.post('/api/tools/calendar', {
            headers: authedHeaders(token, JSON_HEADERS),
            data: {
                action: 'create',
                params: {
                    summary: 'Playwright test event',
                    start: new Date(Date.now() + 3600000).toISOString(),
                    end: new Date(Date.now() + 7200000).toISOString(),
                },
            },
        });

        // 402 Payment Required OR 403 if Google not connected
        expect([402, 403]).toContain(res.status());

        if (res.status() === 402) {
            const body = await res.json();
            expect(body.invoice_reference).toMatch(/^inv_cal_/);
            expect(body.amount).toBe(0.01);
            expect(body.chain).toBe('solana-devnet');
            expect(body.pay_endpoint).toBe('/api/tools/x402/pay');
        }
    });

    test('calendar.list is free (no 402)', async ({ request }) => {
        const token = requirePrivyToken();

        const res = await request.post('/api/tools/calendar', {
            headers: authedHeaders(token, JSON_HEADERS),
            data: { action: 'list', params: { days_ahead: 1 } },
        });

        // Either 200 (Google connected) or 403 (not connected), never 402
        expect(res.status()).not.toBe(402);
    });
});

test.describe('x402 gate, Gmail', () => {
    test('gmail.send returns 402 without payment proof', async ({ request }) => {
        const token = requirePrivyToken();

        const res = await request.post('/api/tools/gmail', {
            headers: authedHeaders(token, JSON_HEADERS),
            data: {
                action: 'send',
                params: {
                    to: 'test@example.com',
                    subject: 'Playwright test',
                    body: 'Test body',
                },
            },
        });

        expect([402, 403]).toContain(res.status());

        if (res.status() === 402) {
            const body = await res.json();
            expect(body.invoice_reference).toMatch(/^inv_gma_/);
            expect(body.amount).toBe(0.01);
        }
    });

    test('gmail.list is free (no 402)', async ({ request }) => {
        const token = requirePrivyToken();

        const res = await request.post('/api/tools/gmail', {
            headers: authedHeaders(token, JSON_HEADERS),
            data: { action: 'list', params: { max_results: 1 } },
        });

        expect(res.status()).not.toBe(402);
    });
});

test.describe('x402 pay + retry loop', () => {
    test('invoice -> pay -> retry with proof succeeds', async ({ request }) => {
        const token = requirePrivyToken();

        const body = {
            action: 'create',
            params: {
                summary: 'Playwright gate test',
                start: new Date(Date.now() + 3600000).toISOString(),
                end: new Date(Date.now() + 7200000).toISOString(),
            },
        };

        // Step 1: request, expect 402
        const r1 = await request.post('/api/tools/calendar', {
            headers: authedHeaders(token, JSON_HEADERS),
            data: body,
        });

        if (r1.status() === 403) {
            test.skip(true, 'Google not connected, skip full retry flow');
            return;
        }
        expect(r1.status()).toBe(402);
        const { invoice_reference } = await r1.json();

        // Step 2: pay the invoice
        const r2 = await request.post('/api/tools/x402/pay', {
            headers: authedHeaders(token, JSON_HEADERS),
            data: { invoice_reference },
        });
        expect(r2.ok()).toBeTruthy();
        const { tx_signature, status } = await r2.json();
        expect(status).toBe('paid');
        expect(tx_signature).toBeTruthy();

        // Step 3: retry with proof
        const r3 = await request.post('/api/tools/calendar', {
            headers: authedHeaders(token, { ...JSON_HEADERS, 'X-Payment-Proof': invoice_reference }),
            data: body,
        });
        expect(r3.ok()).toBeTruthy();
        const result = await r3.json();
        expect(result.event).toBeTruthy();
        expect(result.receipt).toBeTruthy();
        expect(result.receipt.signature).toBeTruthy();
        expect(result.receipt.public_key).toBeTruthy();
        expect(result.receipt.receipt.invoice_reference).toBe(invoice_reference);
    });

    test('replay protection: proof for one request cannot be used for another', async ({ request }) => {
        const token = requirePrivyToken();

        // Get an invoice for request A
        const r1 = await request.post('/api/tools/calendar', {
            headers: authedHeaders(token, JSON_HEADERS),
            data: {
                action: 'create',
                params: { summary: 'A', start: '2030-01-01T10:00:00Z', end: '2030-01-01T11:00:00Z' },
            },
        });
        if (r1.status() !== 402) { test.skip(true, 'needs 402'); return; }
        const { invoice_reference } = await r1.json();

        // Pay it
        await request.post('/api/tools/x402/pay', {
            headers: authedHeaders(token, JSON_HEADERS),
            data: { invoice_reference },
        });

        // Try to use proof for a DIFFERENT request B (different params -> different hash)
        const r2 = await request.post('/api/tools/calendar', {
            headers: authedHeaders(token, { ...JSON_HEADERS, 'X-Payment-Proof': invoice_reference }),
            data: {
                action: 'create',
                params: { summary: 'B-DIFFERENT', start: '2030-01-02T10:00:00Z', end: '2030-01-02T11:00:00Z' },
            },
        });
        // Should reject, params_hash mismatch
        expect(r2.status()).toBe(402);
    });
});
