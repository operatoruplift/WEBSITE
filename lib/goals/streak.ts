import type { GoalCheckin } from './types';

/**
 * Compute the current consecutive-day streak from a check-in history.
 *
 * Rules:
 *   - A streak counts consecutive calendar days ending at TODAY or
 *     YESTERDAY. Ending only at "today" would penalize an operator
 *     for not yet checking in today; ending only at "yesterday" would
 *     hide a same-day check-in. We accept either.
 *   - Only check-ins with status === 'done' OR 'partial' count.
 *     A 'skipped' check-in breaks the streak.
 *   - A missing day breaks the streak.
 *   - Multiple check-ins on the same date (which the unique index
 *     prevents at the DB layer) are deduped here as a defense in
 *     depth.
 *
 * The function is pure and timezone-naive: callers must pass dates as
 * 'YYYY-MM-DD' strings in the user's local timezone. The API layer
 * normalizes this; the test suite passes string dates directly.
 *
 * @param checkins  Check-ins for one goal, any order.
 * @param today     'YYYY-MM-DD' representing the user's local "today".
 * @returns Streak length in days (0 if no streak is active).
 */
export function computeStreak(checkins: GoalCheckin[], today: string): number {
    if (checkins.length === 0) return 0;

    // Dedupe by date and keep the most-counted status per day
    // ('done' > 'partial' > 'skipped'). The unique index in SQL means
    // dedupe here is defense in depth.
    const byDate = new Map<string, 'done' | 'partial' | 'skipped'>();
    const STATUS_RANK: Record<'done' | 'partial' | 'skipped', number> = {
        done: 2,
        partial: 1,
        skipped: 0,
    };
    for (const c of checkins) {
        const existing = byDate.get(c.checkin_date);
        if (!existing || STATUS_RANK[c.status] > STATUS_RANK[existing]) {
            byDate.set(c.checkin_date, c.status);
        }
    }

    // Walk back from today. If today has no check-in, start from
    // yesterday (the streak still counts as "alive").
    let cursor = today;
    let streak = 0;

    // Allow the first check-in to be today OR yesterday, but no
    // earlier; if the most recent check-in is two days ago, the
    // streak has already lapsed.
    const yesterday = addDays(today, -1);
    if (!byDate.has(today) && !byDate.has(yesterday)) return 0;
    if (!byDate.has(today)) {
        cursor = yesterday;
    }

    while (true) {
        const status = byDate.get(cursor);
        if (!status || status === 'skipped') break;
        streak += 1;
        cursor = addDays(cursor, -1);
    }

    return streak;
}

/**
 * Add (or subtract) days from a 'YYYY-MM-DD' string. Pure, no Date
 * timezone shenanigans: the function manipulates the string-level
 * representation and uses Date only for the leap-year + month-length
 * arithmetic.
 */
export function addDays(date: string, delta: number): string {
    const [y, m, d] = date.split('-').map(Number);
    // Use UTC so the arithmetic does not drift across DST boundaries.
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + delta);
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
