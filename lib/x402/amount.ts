/**
 * Decimal-safe amount helpers for token amounts (USDC, SOL, etc.).
 *
 * Ported (MIT) from solana-foundation/solana-developer-platform,
 * apps/sdp-api/src/lib/amount.ts, with Mosaic-specific helpers
 * dropped (we do not mint Token-2022 assets).
 *
 * Why: JS numbers lose precision the moment a price is not a clean
 * decimal like 0.01. Storing prices as strings and converting to
 * bigint base units before any arithmetic keeps every cent honest.
 *
 * For USDC, decimals = 6 (so "0.01" -> 10000n base units).
 */

export const MAX_SAFE_BASE_UNITS = BigInt(Number.MAX_SAFE_INTEGER);

export class AmountError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AmountError';
    }
}

const isDigit = (char: string) => char >= '0' && char <= '9';

export const isDecimalString = (value: string): boolean => {
    if (!value) {
        return false;
    }

    let hasDigit = false;
    let seenDot = false;

    for (const char of value) {
        if (char === '.') {
            if (seenDot) {
                return false;
            }
            seenDot = true;
            continue;
        }

        if (!isDigit(char)) {
            return false;
        }

        hasDigit = true;
    }

    return hasDigit;
};

const normalizeDecimalParts = (value: string): { whole: string; fraction: string } => {
    const [wholeRaw = '', fractionRaw = ''] = value.split('.');
    const whole = wholeRaw.length ? wholeRaw : '0';
    const fraction = fractionRaw ?? '';
    return { whole, fraction };
};

/**
 * Parse a human-readable decimal string into bigint base units.
 *
 * parseDecimalAmount('0.01', 6) -> 10000n  (USDC)
 * parseDecimalAmount('1', 9)    -> 1000000000n  (SOL)
 *
 * Throws AmountError on invalid input.
 */
export const parseDecimalAmount = (value: string, decimals: number): bigint => {
    const normalized = value.trim();

    if (!isDecimalString(normalized)) {
        throw new AmountError('Invalid decimal amount');
    }

    if (!Number.isInteger(decimals) || decimals < 0) {
        throw new AmountError('Invalid decimals configuration');
    }

    const { whole, fraction } = normalizeDecimalParts(normalized);

    if (fraction.length > decimals) {
        throw new AmountError('Amount has too many decimal places');
    }

    const paddedFraction = fraction.padEnd(decimals, '0');
    const combined = `${whole}${paddedFraction}`;
    let startIndex = 0;
    while (startIndex < combined.length && combined[startIndex] === '0') {
        startIndex += 1;
    }
    const sanitized = startIndex >= combined.length ? '0' : combined.slice(startIndex);

    return BigInt(sanitized);
};

/**
 * Format bigint base units (or a base-unit numeric string) as a
 * human-readable decimal string with trailing zeros trimmed.
 *
 * formatDecimalAmount(10000n, 6) -> '0.01'
 * formatDecimalAmount(1000000000n, 9) -> '1'
 */
export const formatDecimalAmount = (value: string | bigint, decimals: number): string => {
    if (!Number.isInteger(decimals) || decimals < 0) {
        throw new AmountError('Invalid decimals configuration');
    }

    const bigintValue = typeof value === 'bigint' ? value : BigInt(value || '0');
    const zero = BigInt(0);
    const negative = bigintValue < zero;
    const absolute = negative ? -bigintValue : bigintValue;

    let digits = absolute.toString();

    if (decimals === 0) {
        return `${negative ? '-' : ''}${digits}`;
    }

    if (digits.length <= decimals) {
        digits = digits.padStart(decimals + 1, '0');
    }

    const whole = digits.slice(0, -decimals);
    let fraction = digits.slice(-decimals);

    let trimIndex = fraction.length;
    while (trimIndex > 0 && fraction[trimIndex - 1] === '0') {
        trimIndex -= 1;
    }

    fraction = fraction.slice(0, trimIndex);

    const formatted = fraction.length ? `${whole}.${fraction}` : whole;
    return `${negative ? '-' : ''}${formatted}`;
};

/**
 * Convert a decimal amount to a plain JS number for legacy callers
 * that store amounts in a numeric column. Throws when precision
 * cannot be preserved (e.g. amount exceeds Number.MAX_SAFE_INTEGER
 * base units, or formatting round-trips to a different value).
 *
 * Use sparingly; prefer keeping amounts as strings + bigint base
 * units end-to-end.
 */
export const toSafeNumber = (value: string, decimals: number): number => {
    const baseUnits = parseDecimalAmount(value, decimals);

    if (baseUnits > MAX_SAFE_BASE_UNITS) {
        throw new AmountError('Amount is too large to represent safely as a JS number');
    }

    const formatted = formatDecimalAmount(baseUnits, decimals);
    const amount = Number(formatted);

    if (!Number.isFinite(amount)) {
        throw new AmountError('Amount is not a valid number');
    }

    const roundTrip = parseDecimalAmount(amount.toString(), decimals);
    if (roundTrip !== baseUnits) {
        throw new AmountError('Amount loses precision when converted to a number');
    }

    return amount;
};
