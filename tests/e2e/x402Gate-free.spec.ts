import { test, expect } from '@playwright/test';
import { x402Gate } from '@/lib/x402/middleware';

/**
 * Unit tests for x402Gate's "free action" branch.
 *
 * x402Gate is the per-request decision point that says:
 *   - free: tool/action not gated, caller just executes
 *   - 402:  payment required, return the response unchanged
 *   - paid: valid proof attached, caller executes + creates receipt
 *
 * The free branch is hermetic: pricing lookup is in-memory (TOOL_PRICING
 * from lib/x402/pricing.ts), and when the action has no price entry the
 * function short-circuits to {type: 'free'} BEFORE any Supabase call.
 *
 * This spec covers the free branch end-to-end. The 402 + paid branches
 * are covered by integration tests that hit a live dev server.
 *
 * A regression that converted the in-memory free decision into a DB
 * call would show up here as a hang or the runtime error from the
 * absent SUPABASE_SERVICE_ROLE_KEY.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/x402Gate-free.spec.ts --reporter=list
 */

function makeRequest(headers: Record<string, string> = {}): Request {
    return new Request('https://example.com/api/tools/calendar', {
        method: 'POST',
        headers,
    });
}

test.describe('x402Gate — free branch', () => {
    test('calendar.list returns {type: "free"} (read-only, not gated)', async () => {
        const result = await x402Gate({
            request: makeRequest(),
            tool: 'calendar',
            action: 'list',
            params: { days_ahead: 7 },
            user_id: 'test-user-1',
        });
        expect(result.type).toBe('free');
    });

    test('calendar.free_slots returns free', async () => {
        const result = await x402Gate({
            request: makeRequest(),
            tool: 'calendar',
            action: 'free_slots',
            params: {},
            user_id: 'test-user-1',
        });
        expect(result.type).toBe('free');
    });

    test('gmail.list returns free (reads are free)', async () => {
        const result = await x402Gate({
            request: makeRequest(),
            tool: 'gmail',
            action: 'list',
            params: { query: 'in:inbox' },
            user_id: 'test-user-1',
        });
        expect(result.type).toBe('free');
    });

    test('gmail.read returns free', async () => {
        const result = await x402Gate({
            request: makeRequest(),
            tool: 'gmail',
            action: 'read',
            params: { id: 'msg-1' },
            user_id: 'test-user-1',
        });
        expect(result.type).toBe('free');
    });

    test('unknown tool returns free (default fail-open behavior)', async () => {
        const result = await x402Gate({
            request: makeRequest(),
            tool: 'nonexistent-tool',
            action: 'whatever',
            params: {},
            user_id: 'test-user-1',
        });
        expect(result.type).toBe('free');
    });

    test('unknown action on a known tool returns free', async () => {
        // gmail.search_archive isn't in TOOL_PRICING, so getToolPrice
        // returns null and x402Gate short-circuits to free.
        const result = await x402Gate({
            request: makeRequest(),
            tool: 'gmail',
            action: 'search_archive',
            params: {},
            user_id: 'test-user-1',
        });
        expect(result.type).toBe('free');
    });

    test('free branch ignores X-Payment-Proof header (no DB call)', async () => {
        // The 'paid' code path is only reached when getToolPrice returns
        // a non-null price. For free actions, the proof header is ignored,
        // proving the function short-circuits BEFORE any DB call. If the
        // ordering were reversed, a missing Supabase env var would make
        // this throw.
        const result = await x402Gate({
            request: makeRequest({ 'x-payment-proof': 'unused' }),
            tool: 'calendar',
            action: 'list',
            params: {},
            user_id: 'test-user-1',
        });
        expect(result.type).toBe('free');
    });

    test('free result has no invoice or createReceipt fields', async () => {
        // Type-narrows on result.type. The 'free' variant carries
        // no createReceipt or invoice, since the caller doesn't sign
        // anything for a free action.
        const result = await x402Gate({
            request: makeRequest(),
            tool: 'calendar',
            action: 'list',
            params: {},
            user_id: 'test-user-1',
        });
        if (result.type === 'free') {
            // TypeScript: free branch has no other fields. Verify at
            // runtime that no createReceipt is attached.
            expect((result as Record<string, unknown>).createReceipt).toBeUndefined();
            expect((result as Record<string, unknown>).invoice).toBeUndefined();
        } else {
            throw new Error('expected free result');
        }
    });

    test('free branch is consistent across params shapes (no params-hash needed)', async () => {
        const r1 = await x402Gate({
            request: makeRequest(),
            tool: 'calendar',
            action: 'list',
            params: { a: 1 },
            user_id: 'test-user-1',
        });
        const r2 = await x402Gate({
            request: makeRequest(),
            tool: 'calendar',
            action: 'list',
            params: { a: 1, b: 2 },
            user_id: 'test-user-1',
        });
        const r3 = await x402Gate({
            request: makeRequest(),
            tool: 'calendar',
            action: 'list',
            params: null,
            user_id: 'test-user-1',
        });
        expect(r1.type).toBe('free');
        expect(r2.type).toBe('free');
        expect(r3.type).toBe('free');
    });

    test('free branch tolerates undefined params', async () => {
        const result = await x402Gate({
            request: makeRequest(),
            tool: 'calendar',
            action: 'list',
            params: undefined,
            user_id: 'test-user-1',
        });
        expect(result.type).toBe('free');
    });
});
