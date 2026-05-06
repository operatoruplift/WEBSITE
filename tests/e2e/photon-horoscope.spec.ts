import { test, expect } from '@playwright/test';
import {
    ZODIAC_SIGNS,
    normalizeSign,
    parseSignFromText,
    signFromBirthday,
} from '@/lib/photon/horoscope';

/**
 * Pure-function tests for the zodiac normalizer + parser. No
 * Supabase, no external API; entirely hermetic.
 */

test('ZODIAC_SIGNS contains 12 canonical lowercase entries', () => {
    expect(ZODIAC_SIGNS).toHaveLength(12);
    for (const s of ZODIAC_SIGNS) {
        expect(s).toBe(s.toLowerCase());
    }
});

test('normalizeSign accepts case-insensitive valid signs', () => {
    expect(normalizeSign('Leo')).toBe('leo');
    expect(normalizeSign('SCORPIO')).toBe('scorpio');
    expect(normalizeSign('  pisces  ')).toBe('pisces');
});

test('normalizeSign returns null for invalid input', () => {
    expect(normalizeSign(null)).toBeNull();
    expect(normalizeSign(undefined)).toBeNull();
    expect(normalizeSign('')).toBeNull();
    expect(normalizeSign('not a sign')).toBeNull();
    expect(normalizeSign('lion')).toBeNull();
});

test('parseSignFromText pulls a sign from natural language', () => {
    expect(parseSignFromText("I'm a leo")).toBe('leo');
    expect(parseSignFromText('Set my sign to Virgo')).toBe('virgo');
    expect(parseSignFromText('make me a Libra please')).toBe('libra');
    expect(parseSignFromText('Aries here')).toBe('aries');
});

test('parseSignFromText returns null when no sign appears', () => {
    expect(parseSignFromText('hello there')).toBeNull();
    expect(parseSignFromText('what is the weather')).toBeNull();
    expect(parseSignFromText(null)).toBeNull();
});

test('parseSignFromText requires word boundaries (no substring matches)', () => {
    // "lion" contains no zodiac sign
    expect(parseSignFromText('I saw a lion at the zoo')).toBeNull();
    // "ariess" is not a word boundary match
    expect(parseSignFromText('the ariess company')).toBeNull();
});

test('signFromBirthday maps known dates to the right sign', () => {
    expect(signFromBirthday(7, 27)).toBe('leo');
    expect(signFromBirthday(11, 21)).toBe('scorpio');
    expect(signFromBirthday(11, 22)).toBe('sagittarius');
    expect(signFromBirthday(12, 22)).toBe('capricorn');
    expect(signFromBirthday(1, 19)).toBe('capricorn');
    expect(signFromBirthday(1, 20)).toBe('aquarius');
});

test('signFromBirthday rejects invalid month/day', () => {
    expect(signFromBirthday(0, 1)).toBeNull();
    expect(signFromBirthday(13, 1)).toBeNull();
    expect(signFromBirthday(2, 32)).toBeNull();
    expect(signFromBirthday(NaN, 1)).toBeNull();
});
