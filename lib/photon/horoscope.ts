/**
 * Zodiac-sign normalizer + parser for the iMessage agent.
 *
 * The agent stores a user's sign on imessage_users.zodiac and
 * folds it into the system prompt's "what you know about this
 * user" block. When the user texts a horoscope question, the
 * agent generates a brief daily reading itself via Claude Haiku
 * (no external horoscope API), so we don't depend on a third-
 * party service that could rot or get rate-limited.
 *
 * This module's job is the boring side: validate a sign string,
 * parse the sign out of natural-language sets ("I'm a leo",
 * "set my sign to virgo", "make me a Libra please"), and reject
 * anything that isn't a real zodiac sign.
 */

export const ZODIAC_SIGNS = [
    'aries',
    'taurus',
    'gemini',
    'cancer',
    'leo',
    'virgo',
    'libra',
    'scorpio',
    'sagittarius',
    'capricorn',
    'aquarius',
    'pisces',
] as const;

export type ZodiacSign = typeof ZODIAC_SIGNS[number];

/**
 * Returns the canonical lowercase sign name when `input` matches a
 * real zodiac (case-insensitive, whitespace-trimmed). Otherwise null.
 */
export function normalizeSign(input: string | null | undefined): ZodiacSign | null {
    if (!input) return null;
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return null;
    return (ZODIAC_SIGNS as readonly string[]).includes(trimmed)
        ? (trimmed as ZodiacSign)
        : null;
}

/**
 * Pulls a sign out of free text. Conservative: requires the sign as
 * a standalone word (so "I scorpio my coffee" doesn't accidentally
 * set the user's sign to scorpio, but "I'm a scorpio" does).
 *
 * Returns the matched sign, or null when no clear sign appears.
 */
export function parseSignFromText(text: string | null | undefined): ZodiacSign | null {
    if (!text) return null;
    const lower = text.toLowerCase();
    for (const sign of ZODIAC_SIGNS) {
        const re = new RegExp(`\\b${sign}\\b`, 'i');
        if (re.test(lower)) return sign;
    }
    return null;
}

/**
 * Date ranges per sign for natural-language commands like "I was born
 * in May" or "I'm born September 21st". Returns null when the input
 * doesn't unambiguously map to a sign (cusp dates: returns the later
 * sign so we always pick *some* answer for follow-up questions).
 *
 * Inputs like "march 30" / "march 30th" / "3/30" / "30 march" all
 * route to the same sign.
 */
const SIGN_RANGES: Array<{ sign: ZodiacSign; from: [number, number]; to: [number, number] }> = [
    { sign: 'capricorn', from: [12, 22], to: [1, 19] },
    { sign: 'aquarius', from: [1, 20], to: [2, 18] },
    { sign: 'pisces', from: [2, 19], to: [3, 20] },
    { sign: 'aries', from: [3, 21], to: [4, 19] },
    { sign: 'taurus', from: [4, 20], to: [5, 20] },
    { sign: 'gemini', from: [5, 21], to: [6, 20] },
    { sign: 'cancer', from: [6, 21], to: [7, 22] },
    { sign: 'leo', from: [7, 23], to: [8, 22] },
    { sign: 'virgo', from: [8, 23], to: [9, 22] },
    { sign: 'libra', from: [9, 23], to: [10, 22] },
    { sign: 'scorpio', from: [10, 23], to: [11, 21] },
    { sign: 'sagittarius', from: [11, 22], to: [12, 21] },
];

export function signFromBirthday(month: number, day: number): ZodiacSign | null {
    if (!Number.isInteger(month) || !Number.isInteger(day)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    for (const r of SIGN_RANGES) {
        if (r.sign === 'capricorn') {
            if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'capricorn';
            continue;
        }
        if (month === r.from[0] && day >= r.from[1]) return r.sign;
        if (month === r.to[0] && day <= r.to[1]) return r.sign;
    }
    return null;
}
