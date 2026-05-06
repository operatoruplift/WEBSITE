import { test, expect } from '@playwright/test';
import { parseEventTime } from '@/lib/photon/event-time';

/**
 * Hermetic tests for the natural-language event-time parser. We
 * pin "now" to a known instant so the relative cases ("tomorrow",
 * "next monday", "in 2 hours") are deterministic regardless of when
 * the test runs.
 */

// Wednesday, May 6, 2026 at 09:00 LOCAL time. Picking 9am gives us
// "in the morning" so afternoon hour-only times ("at 3pm") still
// land today, while early-morning ones ("at 9am") have already
// passed (since we ARE 9am) and roll forward.
//
// Using local time avoids brittle UTC offset assumptions in CI.
const NOW = (() => {
    const d = new Date(2026, 4, 6, 9, 0, 0, 0); // May is month=4 (0-indexed)
    return d;
})();

function isoToLocalDate(iso: string): string {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

function isoToLocalHour(iso: string): number {
    return new Date(iso).getHours();
}

test('returns null on empty input', () => {
    expect(parseEventTime('', { now: NOW })).toBeNull();
    expect(parseEventTime('   ', { now: NOW })).toBeNull();
});

test('parses ISO date with default 9am', () => {
    const r = parseEventTime('2026-09-15', { now: NOW });
    expect(r).not.toBeNull();
    if (r) {
        expect(isoToLocalDate(r.startISO)).toBe('2026-09-15');
        expect(isoToLocalHour(r.startISO)).toBe(9);
        expect(r.timeWasDefaulted).toBe(true);
    }
});

test('parses ISO date + explicit time', () => {
    const r = parseEventTime('2026-09-15 at 3pm', { now: NOW });
    expect(r).not.toBeNull();
    if (r) {
        expect(r.timeWasDefaulted).toBe(false);
        expect(isoToLocalDate(r.startISO)).toBe('2026-09-15');
        expect(isoToLocalHour(r.startISO)).toBe(15);
    }
});

test('parses "tomorrow at 3pm"', () => {
    const r = parseEventTime('tomorrow at 3pm', { now: NOW });
    expect(r).not.toBeNull();
    if (r) {
        expect(r.timeWasDefaulted).toBe(false);
        expect(isoToLocalDate(r.startISO)).toBe('2026-05-07');
        expect(isoToLocalHour(r.startISO)).toBe(15);
    }
});

test('parses "today at 5pm"', () => {
    const r = parseEventTime('today at 5pm', { now: NOW });
    expect(r).not.toBeNull();
    if (r) {
        expect(isoToLocalDate(r.startISO)).toBe('2026-05-06');
        expect(isoToLocalHour(r.startISO)).toBe(17);
    }
});

test('parses "tonight" with default 7pm', () => {
    const r = parseEventTime('tonight', { now: NOW });
    expect(r).not.toBeNull();
    if (r) {
        expect(isoToLocalDate(r.startISO)).toBe('2026-05-06');
        expect(isoToLocalHour(r.startISO)).toBe(19);
        expect(r.timeWasDefaulted).toBe(true);
    }
});

test('parses "in 2 hours"', () => {
    const r = parseEventTime('in 2 hours', { now: NOW });
    expect(r).not.toBeNull();
    if (r) {
        expect(r.timeWasDefaulted).toBe(false);
        // 9am + 2h = 11am same day, in local time
        expect(isoToLocalDate(r.startISO)).toBe('2026-05-06');
        expect(isoToLocalHour(r.startISO)).toBe(11);
    }
});

test('parses "in 3 days at 10am"', () => {
    const r = parseEventTime('in 3 days at 10am', { now: NOW });
    expect(r).not.toBeNull();
    if (r) {
        expect(isoToLocalDate(r.startISO)).toBe('2026-05-09');
        expect(isoToLocalHour(r.startISO)).toBe(10);
    }
});

test('parses "next monday"', () => {
    // NOW is Wed 2026-05-06. Next Monday is 2026-05-11.
    const r = parseEventTime('next monday', { now: NOW });
    expect(r).not.toBeNull();
    if (r) expect(isoToLocalDate(r.startISO)).toBe('2026-05-11');
});

test('parses "monday at 10am"', () => {
    const r = parseEventTime('monday at 10am', { now: NOW });
    expect(r).not.toBeNull();
    if (r) {
        expect(isoToLocalDate(r.startISO)).toBe('2026-05-11');
        expect(isoToLocalHour(r.startISO)).toBe(10);
    }
});

test('parses "fri at 2pm" abbreviated day', () => {
    const r = parseEventTime('fri at 2pm', { now: NOW });
    expect(r).not.toBeNull();
    if (r) {
        expect(isoToLocalDate(r.startISO)).toBe('2026-05-08');
        expect(isoToLocalHour(r.startISO)).toBe(14);
    }
});

test('parses "next week" -> next Monday', () => {
    const r = parseEventTime('next week', { now: NOW });
    expect(r).not.toBeNull();
    if (r) expect(isoToLocalDate(r.startISO)).toBe('2026-05-11');
});

test('"at 3pm" alone defaults to today (NOW is 9am, 3pm is future)', () => {
    const r = parseEventTime('at 3pm', { now: NOW });
    expect(r).not.toBeNull();
    if (r) {
        expect(isoToLocalDate(r.startISO)).toBe('2026-05-06');
        expect(isoToLocalHour(r.startISO)).toBe(15);
    }
});

test('"at 8am" alone, when 8am has passed today (NOW is 9am), rolls to tomorrow', () => {
    const r = parseEventTime('at 8am', { now: NOW });
    expect(r).not.toBeNull();
    if (r) {
        expect(isoToLocalDate(r.startISO)).toBe('2026-05-07');
        expect(isoToLocalHour(r.startISO)).toBe(8);
    }
});

test('rejects ambiguous bare hour like "at 5"', () => {
    // No meridiem, hour < 7 is ambiguous (5am vs 5pm). We reject
    // rather than guess.
    expect(parseEventTime('at 5', { now: NOW })).toBeNull();
});

test('default duration is 30 minutes', () => {
    const r = parseEventTime('tomorrow at 3pm', { now: NOW });
    expect(r).not.toBeNull();
    if (r) {
        const start = new Date(r.startISO).getTime();
        const end = new Date(r.endISO).getTime();
        expect(end - start).toBe(30 * 60 * 1000);
    }
});

test('returns null when no recognizable date or time', () => {
    expect(parseEventTime('something', { now: NOW })).toBeNull();
    expect(parseEventTime('with the team', { now: NOW })).toBeNull();
});
