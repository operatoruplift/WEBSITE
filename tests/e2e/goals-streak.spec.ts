import { test, expect } from '@playwright/test';
import { computeStreak, addDays } from '@/lib/goals/streak';
import type { GoalCheckin } from '@/lib/goals/types';

test.describe.configure({ timeout: 15_000 });

/**
 * Pure-function tests for the streak math. No webserver, no DB. The
 * streak helper is the most behavior-rich piece of the Phase 8
 * dashboard and the spec covers the edge cases the dashboard depends
 * on (today + yesterday windows, partial vs skipped statuses,
 * dedupe).
 *
 * If a future change breaks the streak math, this fires before any
 * dashboard render goes wrong.
 */

function checkin(
    date: string,
    status: 'done' | 'partial' | 'skipped' = 'done',
): GoalCheckin {
    return {
        id: `c-${date}-${status}`,
        goal_id: 'g',
        privy_id: 'u',
        checkin_date: date,
        status,
        note: null,
        created_at: `${date}T12:00:00Z`,
    };
}

test('addDays handles month + year + leap-year boundaries', () => {
    expect(addDays('2026-05-21', -1)).toBe('2026-05-20');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    // 2024 is a leap year; 2026 is not.
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
});

test('computeStreak returns 0 for no check-ins', () => {
    expect(computeStreak([], '2026-05-21')).toBe(0);
});

test('computeStreak returns 1 for a single same-day check-in', () => {
    expect(computeStreak([checkin('2026-05-21')], '2026-05-21')).toBe(1);
});

test('computeStreak accepts yesterday as the streak anchor', () => {
    // Operator has not checked in yet today but checked in yesterday.
    // The streak is still alive.
    expect(computeStreak([checkin('2026-05-20')], '2026-05-21')).toBe(1);
});

test('computeStreak returns 0 if the most recent check-in is two days ago', () => {
    // The streak has lapsed; no anchor in (today, yesterday).
    expect(computeStreak([checkin('2026-05-19')], '2026-05-21')).toBe(0);
});

test('computeStreak counts consecutive done days', () => {
    const cks = [
        checkin('2026-05-21'),
        checkin('2026-05-20'),
        checkin('2026-05-19'),
        checkin('2026-05-18'),
    ];
    expect(computeStreak(cks, '2026-05-21')).toBe(4);
});

test('computeStreak breaks the streak on a missing day', () => {
    const cks = [
        checkin('2026-05-21'),
        checkin('2026-05-20'),
        // 05-19 missing
        checkin('2026-05-18'),
    ];
    expect(computeStreak(cks, '2026-05-21')).toBe(2);
});

test('computeStreak counts partial days as part of the streak', () => {
    const cks = [
        checkin('2026-05-21', 'partial'),
        checkin('2026-05-20', 'done'),
        checkin('2026-05-19', 'partial'),
    ];
    expect(computeStreak(cks, '2026-05-21')).toBe(3);
});

test('computeStreak breaks on a skipped day', () => {
    const cks = [
        checkin('2026-05-21'),
        checkin('2026-05-20', 'skipped'),
        checkin('2026-05-19'),
    ];
    expect(computeStreak(cks, '2026-05-21')).toBe(1);
});

test('computeStreak dedupes multiple check-ins per day, taking the best status', () => {
    // The DB unique index prevents this, but the helper still
    // defends against it. Today has done + skipped recorded; done
    // should win.
    const cks = [
        checkin('2026-05-21', 'skipped'),
        checkin('2026-05-21', 'done'),
        checkin('2026-05-20'),
    ];
    expect(computeStreak(cks, '2026-05-21')).toBe(2);
});
