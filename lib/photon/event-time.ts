/**
 * Natural-language event-time parser for the iMessage agent.
 *
 * The calendar_create intent stages a raw `when` substring like
 * "tomorrow at 3pm" or "next monday" so the user can NO it before
 * we commit. At YES confirm time, the executor calls this parser
 * to turn the substring into a concrete ISO datetime range that
 * Google Calendar can accept.
 *
 * Pure function, no external dependencies. Conservative match: if
 * we can't confidently extract a date AND a time, return null so
 * the caller can degrade gracefully (e.g., reply "I couldn't pin
 * down the time, try the dashboard").
 *
 * This is intentionally narrower than chrono-node. The cases we
 * cover are the ones we observe in the email/SMS register the
 * user actually types:
 *
 *   - "today" / "tomorrow" / "tonight"
 *   - "Monday" / "Tue" / etc (next occurrence; same-day if AT a
 *     future hour today, otherwise next week)
 *   - "next monday" / "next week"
 *   - "in N hours/days/weeks"
 *   - "at HH(am|pm)" or "at HH:MM(am|pm)"
 *   - ISO "YYYY-MM-DD" (with optional "at HH...")
 *
 * Default duration: 30 minutes. Default time when only a date is
 * supplied: 09:00 in the caller's timezone. Default date when only
 * a time is supplied: today (or tomorrow if the time is already
 * past).
 */

const DAY_NAMES: Record<string, number> = {
    sunday: 0, sun: 0,
    monday: 1, mon: 1,
    tuesday: 2, tue: 2, tues: 2,
    wednesday: 3, wed: 3,
    thursday: 4, thu: 4, thur: 4, thurs: 4,
    friday: 5, fri: 5,
    saturday: 6, sat: 6,
};

const DEFAULT_DURATION_MS = 30 * 60 * 1000;
const DEFAULT_HOUR = 9;
const TONIGHT_HOUR = 19;

export interface ParsedEventTime {
    /** ISO 8601 timestamp with offset, e.g. "2026-05-07T15:00:00.000Z". */
    startISO: string;
    endISO: string;
    /** True when only a date was given and we used the 09:00 default. */
    timeWasDefaulted: boolean;
}

export interface ParseEventOptions {
    /** Reference time the parser uses as "now". Useful for tests. */
    now?: Date;
}

/**
 * Try to parse a natural-language `when` substring into a concrete
 * ISO datetime range. Returns null when we can't confidently extract
 * both a date and a time (or a date+default).
 */
export function parseEventTime(when: string, opts: ParseEventOptions = {}): ParsedEventTime | null {
    const trimmed = when.trim().toLowerCase();
    if (!trimmed) return null;

    const now = opts.now ?? new Date();

    // 1. ISO date "YYYY-MM-DD" with optional time. Strip the ISO
    // segment before re-running the time-of-day parser so digits
    // inside the date (like "09" from 2026-09-15) don't accidentally
    // become the time.
    const isoMatch = trimmed.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        const [_, y, m, d] = isoMatch;
        const date = new Date(Number(y), Number(m) - 1, Number(d));
        const remainder = trimmed.replace(isoMatch[0], '').trim();
        return applyTimeOrDefault(remainder, date, false, now);
    }

    // 2. "in N hours/days/weeks"
    const inMatch = trimmed.match(/\bin\s+(\d+)\s+(hour|hours|day|days|week|weeks)\b/);
    if (inMatch) {
        const n = Number(inMatch[1]);
        const unit = inMatch[2];
        const start = new Date(now);
        if (unit.startsWith('hour')) start.setHours(start.getHours() + n);
        else if (unit.startsWith('day')) start.setDate(start.getDate() + n);
        else if (unit.startsWith('week')) start.setDate(start.getDate() + n * 7);
        // For "in N hours" we already have a precise time. For days/
        // weeks, fall through to the default-time logic.
        if (unit.startsWith('hour')) return finalize(start, false);
        return applyTimeOrDefault(trimmed, start, false, now);
    }

    // 3. "tonight"
    if (/\btonight\b/.test(trimmed)) {
        const start = new Date(now);
        start.setHours(TONIGHT_HOUR, 0, 0, 0);
        if (start.getTime() < now.getTime()) {
            start.setDate(start.getDate() + 1);
        }
        return applyTimeOverride(trimmed, start) ?? finalize(start, true);
    }

    // 4. "today" / "tomorrow" / day names with optional "next"
    const dayBase = resolveDayBase(trimmed, now);
    if (dayBase) {
        return applyTimeOrDefault(trimmed, dayBase, false, now);
    }

    // 5. "at 3pm" alone (no date) -> today, or tomorrow if past
    const timeOnly = parseTimeOfDay(trimmed);
    if (timeOnly) {
        const start = new Date(now);
        start.setHours(timeOnly.hour, timeOnly.minute, 0, 0);
        if (start.getTime() < now.getTime()) {
            start.setDate(start.getDate() + 1);
        }
        return finalize(start, false);
    }

    return null;
}

function resolveDayBase(text: string, now: Date): Date | null {
    if (/\btoday\b/.test(text)) {
        return startOfDay(now);
    }
    if (/\btomorrow\b/.test(text)) {
        const d = startOfDay(now);
        d.setDate(d.getDate() + 1);
        return d;
    }

    // "next week" -> next Monday
    if (/\bnext\s+week\b/.test(text)) {
        return nextDayOfWeek(now, 1);
    }

    const nextDay = text.match(/\bnext\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
    if (nextDay) {
        const dow = DAY_NAMES[nextDay[1]];
        return nextDayOfWeek(now, dow, true);
    }

    const dayMatch = text.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues?|wed|thurs?|fri|sat)\b/);
    if (dayMatch) {
        const dow = DAY_NAMES[dayMatch[1]];
        return nextDayOfWeek(now, dow);
    }

    return null;
}

function nextDayOfWeek(now: Date, dow: number, forceNextWeek: boolean = false): Date {
    const d = startOfDay(now);
    const todayDow = d.getDay();
    let delta = dow - todayDow;
    if (delta < 0) delta += 7;
    if (delta === 0 && forceNextWeek) delta = 7;
    if (delta === 0 && !forceNextWeek) {
        // Same day, but only treat as today if a time is supplied
        // and is in the future. Without a time, default to next week
        // so "Monday" on a Monday afternoon doesn't silently mean
        // 09:00 of the same day in the past.
        delta = 0;
    }
    d.setDate(d.getDate() + delta);
    return d;
}

function startOfDay(d: Date): Date {
    const out = new Date(d);
    out.setHours(0, 0, 0, 0);
    return out;
}

function applyTimeOrDefault(
    text: string,
    base: Date,
    timeWasDefaulted: boolean,
    now: Date,
): ParsedEventTime {
    const time = parseTimeOfDay(text);
    if (time) {
        const start = new Date(base);
        start.setHours(time.hour, time.minute, 0, 0);
        return finalize(start, false);
    }
    // No explicit time. Use 9am default.
    const start = new Date(base);
    start.setHours(DEFAULT_HOUR, 0, 0, 0);
    // If the day-of-week landed today AND default 9am has already
    // passed, push to next week's same day so we never schedule in
    // the past from a one-word "monday" prompt.
    if (start.getTime() < now.getTime() && start.toDateString() === now.toDateString()) {
        start.setDate(start.getDate() + 7);
    }
    return finalize(start, true || timeWasDefaulted);
}

function applyTimeOverride(text: string, base: Date): ParsedEventTime | null {
    const time = parseTimeOfDay(text);
    if (!time) return null;
    const start = new Date(base);
    start.setHours(time.hour, time.minute, 0, 0);
    return finalize(start, false);
}

function parseTimeOfDay(text: string): { hour: number; minute: number } | null {
    // Try high-precision patterns first, then degrade. We avoid a
    // single greedy regex because numeric tokens elsewhere in the
    // string ("3 days", "2026") would get caught and return wrong
    // times.
    const patterns: RegExp[] = [
        // "at H[:MM] am|pm" / "H[:MM]am|pm" (with meridiem, the
        // strongest signal a number is a time)
        /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i,
        // "at HH:MM" 24-hour (colon required so "at 3 days" doesn't
        // misfire)
        /\bat\s+(\d{1,2}):(\d{2})\b/i,
        // "at HH" 24-hour, hour > 12 only (so "at 15" works but
        // "at 3" is ambiguous and rejected by the next layer)
        /\bat\s+(1[3-9]|2[0-3])\b/,
    ];

    for (const re of patterns) {
        const m = text.match(re);
        if (!m) continue;
        let hour = Number(m[1]);
        const minute = m[2] ? Number(m[2]) : 0;
        const meridiem = m[3]?.toLowerCase();
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) continue;
        if (meridiem === 'pm' && hour < 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;
        return { hour, minute };
    }
    return null;
}

function finalize(start: Date, timeWasDefaulted: boolean): ParsedEventTime {
    const end = new Date(start.getTime() + DEFAULT_DURATION_MS);
    return {
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        timeWasDefaulted,
    };
}
