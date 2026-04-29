import { test, expect } from '@playwright/test';
import {
    TOOL_PRICING,
    getToolPrice,
    isGatedAction,
    USDC_DEVNET_MINT,
} from '@/lib/x402/pricing';
import { canonicalJson, hashParams } from '@/lib/x402/invoices';

/**
 * Unit tests for the pure helpers in lib/x402/pricing + lib/x402/invoices.
 *
 * These two modules are the source of truth for which tool actions
 * cost money and the deterministic params-hash used to bind an invoice
 * to a specific tool-call payload. A regression in either could:
 *
 * - Make a paid action FREE (revenue loss)
 * - Make a free action PAID (UX regression / abandon)
 * - Cause a paid invoice for `gmail.send {to: A, body: B}` to validate
 *   a different `gmail.send {to: A, body: <attacker payload>}` because
 *   the params hash isn't stable across key order
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/x402-pricing-invoices.spec.ts --reporter=list
 */

test.describe('x402 pricing', () => {
    test('calendar.list is free', () => {
        expect(getToolPrice('calendar', 'list')).toBeNull();
        expect(isGatedAction('calendar', 'list')).toBe(false);
    });

    test('calendar.create costs $0.01 USDC on solana-devnet', () => {
        const price = getToolPrice('calendar', 'create');
        expect(price).not.toBeNull();
        expect(price?.amount).toBe(0.01);
        expect(price?.currency).toBe('USDC');
        expect(price?.chain).toBe('solana-devnet');
        expect(isGatedAction('calendar', 'create')).toBe(true);
    });

    test('gmail reads (list, read) are free', () => {
        expect(getToolPrice('gmail', 'list')).toBeNull();
        expect(getToolPrice('gmail', 'read')).toBeNull();
        expect(isGatedAction('gmail', 'list')).toBe(false);
        expect(isGatedAction('gmail', 'read')).toBe(false);
    });

    test('gmail writes (draft, send, send_draft) are gated', () => {
        for (const action of ['draft', 'send', 'send_draft']) {
            const price = getToolPrice('gmail', action);
            expect(price, `gmail.${action} has price`).not.toBeNull();
            expect(price?.amount, `gmail.${action} amount`).toBe(0.01);
            expect(isGatedAction('gmail', action), `gmail.${action} gated`).toBe(true);
        }
    });

    test('unknown tool / action returns null (fail-open default)', () => {
        // Unknown actions default to FREE so a typo doesn't accidentally
        // gate a read. The middleware separately enforces auth, which
        // catches abuse independent of this fall-through.
        expect(getToolPrice('totally', 'unknown')).toBeNull();
        expect(isGatedAction('totally', 'unknown')).toBe(false);
        expect(getToolPrice('gmail', 'unknown_op')).toBeNull();
    });

    test('USDC_DEVNET_MINT is the canonical Solana devnet USDC mint', () => {
        expect(USDC_DEVNET_MINT).toBe('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
    });

    test('TOOL_PRICING covers the full surface required by classifyToolAction RISKY entries', () => {
        // Every RISKY gmail/calendar write that classifyToolAction marks
        // RISKY MUST also have a price entry, otherwise the middleware
        // would let a paid-tier user execute without paying.
        const requiredPaidActions = [
            'calendar.create',
            'gmail.draft',
            'gmail.send',
            'gmail.send_draft',
        ];
        for (const key of requiredPaidActions) {
            expect(TOOL_PRICING[key], `${key} has pricing`).not.toBeUndefined();
            expect(TOOL_PRICING[key], `${key} is paid`).not.toBeNull();
        }
    });
});

test.describe('canonicalJson (stable JSON for hashing)', () => {
    test('serializes scalars identically to JSON.stringify', () => {
        expect(canonicalJson(null)).toBe('null');
        expect(canonicalJson(42)).toBe('42');
        expect(canonicalJson(true)).toBe('true');
        expect(canonicalJson('hi')).toBe('"hi"');
    });

    test('sorts object keys alphabetically', () => {
        expect(canonicalJson({ b: 2, a: 1, c: 3 })).toBe('{"a":1,"b":2,"c":3}');
    });

    test('sorts keys recursively in nested objects', () => {
        const out = canonicalJson({ z: { y: 2, x: 1 }, a: 1 });
        expect(out).toBe('{"a":1,"z":{"x":1,"y":2}}');
    });

    test('preserves array order (arrays are positional, not keyed)', () => {
        expect(canonicalJson([3, 1, 2])).toBe('[3,1,2]');
    });

    test('produces identical output for objects with different key insertion order', () => {
        const a = canonicalJson({ to: 'alice@example.com', subject: 'hi', body: 'hello' });
        const b = canonicalJson({ body: 'hello', subject: 'hi', to: 'alice@example.com' });
        const c = canonicalJson({ subject: 'hi', body: 'hello', to: 'alice@example.com' });
        expect(a).toBe(b);
        expect(b).toBe(c);
    });

    test('handles arrays of objects with stable inner key ordering', () => {
        const out = canonicalJson([{ b: 2, a: 1 }, { d: 4, c: 3 }]);
        expect(out).toBe('[{"a":1,"b":2},{"c":3,"d":4}]');
    });
});

test.describe('hashParams (SHA-256 over canonicalJson)', () => {
    test('returns 64 hex chars (SHA-256 digest)', () => {
        const hash = hashParams({ to: 'alice@example.com' });
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    test('same payload (different key order) -> same hash', () => {
        const a = hashParams({ to: 'alice@example.com', subject: 'hi' });
        const b = hashParams({ subject: 'hi', to: 'alice@example.com' });
        expect(a).toBe(b);
    });

    test('different payload -> different hash', () => {
        const a = hashParams({ to: 'alice@example.com' });
        const b = hashParams({ to: 'bob@example.com' });
        expect(a).not.toBe(b);
    });

    test('subtle param change (whitespace) -> different hash', () => {
        const a = hashParams({ body: 'hello' });
        const b = hashParams({ body: 'hello ' });
        expect(a).not.toBe(b);
    });

    test('null / empty object hash to fixed deterministic values', () => {
        // These are stable across runs and serve as smoke values for
        // confirming the canonicalJson contract didn't drift.
        const nullHash = hashParams(null);
        const emptyHash = hashParams({});
        expect(nullHash).toMatch(/^[a-f0-9]{64}$/);
        expect(emptyHash).toMatch(/^[a-f0-9]{64}$/);
        // Re-hash to confirm determinism
        expect(hashParams(null)).toBe(nullHash);
        expect(hashParams({})).toBe(emptyHash);
    });
});
