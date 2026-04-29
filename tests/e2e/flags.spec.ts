import { test, expect } from '@playwright/test';
import { isDecUiEnabledServer, isDecUiEnabled } from '@/lib/flags';

/**
 * Unit tests for the DEC_UI feature flags. These two functions decide
 * whether API routes / server components and React client components
 * see the new Dec UI shell.
 *
 * The contract is: both must be exactly "1" to enable. Any other value
 * (truthy strings like "true", missing, empty, "0") falls through to
 * OFF. This pattern is shared with NEXT_PUBLIC_PAYWALL_BYPASS so the
 * "exactly 1" semantics are predictable across the codebase.
 *
 * Tests mutate process.env so the describe block is serial.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/flags.spec.ts --reporter=list
 */

test.describe.configure({ mode: 'serial' });

const ORIG_DEC_UI = process.env.DEC_UI;
const ORIG_PUBLIC_DEC_UI = process.env.NEXT_PUBLIC_DEC_UI;

function restoreEnv() {
    if (ORIG_DEC_UI === undefined) delete process.env.DEC_UI;
    else process.env.DEC_UI = ORIG_DEC_UI;
    if (ORIG_PUBLIC_DEC_UI === undefined) delete process.env.NEXT_PUBLIC_DEC_UI;
    else process.env.NEXT_PUBLIC_DEC_UI = ORIG_PUBLIC_DEC_UI;
}

test.afterEach(() => {
    restoreEnv();
});

test.describe('isDecUiEnabledServer', () => {
    test('true only when DEC_UI is exactly "1"', () => {
        process.env.DEC_UI = '1';
        expect(isDecUiEnabledServer()).toBe(true);
    });

    test('false when unset', () => {
        delete process.env.DEC_UI;
        expect(isDecUiEnabledServer()).toBe(false);
    });

    test('false when set to "0"', () => {
        process.env.DEC_UI = '0';
        expect(isDecUiEnabledServer()).toBe(false);
    });

    test('false when set to "true" (must be exactly "1")', () => {
        process.env.DEC_UI = 'true';
        expect(isDecUiEnabledServer()).toBe(false);
    });

    test('false when empty string', () => {
        process.env.DEC_UI = '';
        expect(isDecUiEnabledServer()).toBe(false);
    });

    test('two flags are independent: server reads DEC_UI, not NEXT_PUBLIC_DEC_UI', () => {
        delete process.env.DEC_UI;
        process.env.NEXT_PUBLIC_DEC_UI = '1';
        expect(isDecUiEnabledServer()).toBe(false);
    });
});

test.describe('isDecUiEnabled', () => {
    test('true only when NEXT_PUBLIC_DEC_UI is exactly "1"', () => {
        process.env.NEXT_PUBLIC_DEC_UI = '1';
        expect(isDecUiEnabled()).toBe(true);
    });

    test('false when unset', () => {
        delete process.env.NEXT_PUBLIC_DEC_UI;
        expect(isDecUiEnabled()).toBe(false);
    });

    test('false when set to "0"', () => {
        process.env.NEXT_PUBLIC_DEC_UI = '0';
        expect(isDecUiEnabled()).toBe(false);
    });

    test('false when set to "true" (must be exactly "1")', () => {
        process.env.NEXT_PUBLIC_DEC_UI = 'true';
        expect(isDecUiEnabled()).toBe(false);
    });

    test('two flags are independent: client reads NEXT_PUBLIC_DEC_UI, not DEC_UI', () => {
        delete process.env.NEXT_PUBLIC_DEC_UI;
        process.env.DEC_UI = '1';
        expect(isDecUiEnabled()).toBe(false);
    });
});

test.describe('runtime evaluation contract', () => {
    test('isDecUiEnabledServer re-evaluates env on every call (no cache)', () => {
        process.env.DEC_UI = '1';
        expect(isDecUiEnabledServer()).toBe(true);
        process.env.DEC_UI = '0';
        expect(isDecUiEnabledServer()).toBe(false);
        process.env.DEC_UI = '1';
        expect(isDecUiEnabledServer()).toBe(true);
    });

    test('isDecUiEnabled re-evaluates env on every call (no cache)', () => {
        process.env.NEXT_PUBLIC_DEC_UI = '1';
        expect(isDecUiEnabled()).toBe(true);
        delete process.env.NEXT_PUBLIC_DEC_UI;
        expect(isDecUiEnabled()).toBe(false);
        process.env.NEXT_PUBLIC_DEC_UI = '1';
        expect(isDecUiEnabled()).toBe(true);
    });
});
