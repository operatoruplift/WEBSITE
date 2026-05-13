import { test, expect } from '@playwright/test';
import {
    AmountError,
    MAX_SAFE_BASE_UNITS,
    formatDecimalAmount,
    isDecimalString,
    parseDecimalAmount,
    toSafeNumber,
} from '@/lib/x402/amount';

/**
 * Decimal amount helpers, ported (MIT) from
 * solana-foundation/solana-developer-platform apps/sdp-api/src/lib/amount.ts.
 *
 * These are pure functions, so the spec runs as a Playwright file but
 * never opens a page. Coverage targets the bug class we ported the
 * helpers to fix: float precision when a tool price is not exactly
 * 0.01 (e.g. 0.025, 0.0001, 1.23456789).
 *
 * Bucharest targets ES2017, so BigInt literal syntax (`0n`) is
 * unavailable. We use BigInt() constructors throughout.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/x402-amount.spec.ts --reporter=list
 */

test.describe('isDecimalString', () => {
    test('returns true for plain integers', () => {
        expect(isDecimalString('0')).toBe(true);
        expect(isDecimalString('1')).toBe(true);
        expect(isDecimalString('123456789')).toBe(true);
    });

    test('returns true for typical decimals', () => {
        expect(isDecimalString('0.01')).toBe(true);
        expect(isDecimalString('0.025')).toBe(true);
        expect(isDecimalString('1.23456789')).toBe(true);
        expect(isDecimalString('.5')).toBe(true);
    });

    test('returns false for empty string', () => {
        expect(isDecimalString('')).toBe(false);
    });

    test('returns false when no digits present', () => {
        expect(isDecimalString('.')).toBe(false);
    });

    test('returns false for negative or signed strings', () => {
        expect(isDecimalString('-0.01')).toBe(false);
        expect(isDecimalString('+1')).toBe(false);
    });

    test('returns false for multiple decimal points', () => {
        expect(isDecimalString('1.2.3')).toBe(false);
    });

    test('returns false for non-digit characters', () => {
        expect(isDecimalString('1e10')).toBe(false);
        expect(isDecimalString('0,01')).toBe(false);
        expect(isDecimalString('0.01 USDC')).toBe(false);
    });
});

test.describe('parseDecimalAmount', () => {
    test('USDC: 0.01 at 6 decimals returns 10000', () => {
        expect(parseDecimalAmount('0.01', 6)).toBe(BigInt(10000));
    });

    test('USDC: 1 at 6 decimals returns 1000000', () => {
        expect(parseDecimalAmount('1', 6)).toBe(BigInt(1000000));
    });

    test('USDC: 0.025 at 6 decimals returns 25000 (precision survives)', () => {
        // This is the float-bug case: 0.025 as a JS number drifts.
        // As a string parsed with helpers, it lands on 25000 exactly.
        expect(parseDecimalAmount('0.025', 6)).toBe(BigInt(25000));
    });

    test('USDC: 1.234567 at 6 decimals returns 1234567', () => {
        expect(parseDecimalAmount('1.234567', 6)).toBe(BigInt(1234567));
    });

    test('SOL: 1 at 9 decimals returns 1000000000', () => {
        expect(parseDecimalAmount('1', 9)).toBe(BigInt(1000000000));
    });

    test('zero returns 0', () => {
        expect(parseDecimalAmount('0', 6)).toBe(BigInt(0));
        expect(parseDecimalAmount('0.0', 6)).toBe(BigInt(0));
        expect(parseDecimalAmount('0.000000', 6)).toBe(BigInt(0));
    });

    test('strips leading zeros without losing the value', () => {
        expect(parseDecimalAmount('0001.5', 6)).toBe(BigInt(1500000));
    });

    test('throws AmountError when fraction exceeds decimals', () => {
        // 6 decimals = max 6 fractional digits; 7 should throw.
        expect(() => parseDecimalAmount('0.1234567', 6)).toThrow(AmountError);
    });

    test('throws AmountError on invalid input', () => {
        expect(() => parseDecimalAmount('', 6)).toThrow(AmountError);
        expect(() => parseDecimalAmount('-1', 6)).toThrow(AmountError);
        expect(() => parseDecimalAmount('abc', 6)).toThrow(AmountError);
    });

    test('throws AmountError on invalid decimals', () => {
        expect(() => parseDecimalAmount('1', -1)).toThrow(AmountError);
        expect(() => parseDecimalAmount('1', 1.5)).toThrow(AmountError);
    });
});

test.describe('formatDecimalAmount', () => {
    test('USDC: 10000 at 6 decimals -> 0.01', () => {
        expect(formatDecimalAmount(BigInt(10000), 6)).toBe('0.01');
    });

    test('USDC: 1000000 at 6 decimals -> 1', () => {
        expect(formatDecimalAmount(BigInt(1000000), 6)).toBe('1');
    });

    test('USDC: 25000 at 6 decimals -> 0.025', () => {
        expect(formatDecimalAmount(BigInt(25000), 6)).toBe('0.025');
    });

    test('trims trailing zeros from the fraction', () => {
        expect(formatDecimalAmount(BigInt(1500000), 6)).toBe('1.5');
    });

    test('returns 0 for zero with any decimals', () => {
        expect(formatDecimalAmount(BigInt(0), 6)).toBe('0');
        expect(formatDecimalAmount(BigInt(0), 0)).toBe('0');
    });

    test('handles negative bigint', () => {
        expect(formatDecimalAmount(BigInt(-10000), 6)).toBe('-0.01');
    });

    test('accepts numeric string input', () => {
        expect(formatDecimalAmount('10000', 6)).toBe('0.01');
    });

    test('decimals=0 returns whole-only string', () => {
        expect(formatDecimalAmount(BigInt(42), 0)).toBe('42');
    });
});

test.describe('toSafeNumber', () => {
    test('round-trips USDC 0.01 -> 0.01', () => {
        expect(toSafeNumber('0.01', 6)).toBe(0.01);
    });

    test('round-trips USDC 1 -> 1', () => {
        expect(toSafeNumber('1', 6)).toBe(1);
    });

    test('round-trips USDC 0.025 -> 0.025', () => {
        expect(toSafeNumber('0.025', 6)).toBe(0.025);
    });

    test('throws when amount exceeds Number.MAX_SAFE_INTEGER base units', () => {
        // MAX_SAFE_BASE_UNITS + 1 cannot round-trip through a JS number.
        const tooLarge = formatDecimalAmount(MAX_SAFE_BASE_UNITS + BigInt(1), 0);
        expect(() => toSafeNumber(tooLarge, 0)).toThrow(AmountError);
    });

    test('throws AmountError on invalid input', () => {
        expect(() => toSafeNumber('abc', 6)).toThrow(AmountError);
    });
});

test.describe('regression: precision parity with the ToolPrice table', () => {
    // The whole reason we ported these helpers is the moment a price
    // is not 0.01, float arithmetic loses cents. Lock that in.
    test('0.025 USDC survives parse + format round-trip', () => {
        const base = parseDecimalAmount('0.025', 6);
        expect(base).toBe(BigInt(25000));
        expect(formatDecimalAmount(base, 6)).toBe('0.025');
    });

    test('1.23456789 SOL survives parse + format round-trip', () => {
        const base = parseDecimalAmount('1.23456789', 9);
        expect(base).toBe(BigInt(1234567890));
        expect(formatDecimalAmount(base, 9)).toBe('1.23456789');
    });
});
