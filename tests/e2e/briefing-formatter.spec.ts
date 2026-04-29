import { test, expect } from '@playwright/test';
import type { calendar_v3 } from 'googleapis';
import { composeBriefingFromEvents } from '@/lib/briefing';

/**
 * Unit tests for composeBriefingFromEvents — the pure formatter
 * extracted from composeBriefing.
 *
 * The /api/cron/daily-briefing route fetches today's events from
 * Google Calendar and turns them into a short notification body
 * (max 280 chars) for the user's daily digest. A regression here
 * means the briefing notification is mis-pluralized, mistakes an
 * "All day" event for a missing time, or exceeds 280 chars and
 * gets truncated by the notifications insert column constraint.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/briefing-formatter.spec.ts --reporter=list
 */

function evt(opts: Partial<calendar_v3.Schema$Event> = {}): calendar_v3.Schema$Event {
    return {
        summary: 'Standup',
        start: { dateTime: '2026-04-29T09:00:00Z' },
        end: { dateTime: '2026-04-29T09:30:00Z' },
        ...opts,
    };
}

test.describe('composeBriefingFromEvents', () => {
    test('returns null for an empty events array (no briefing posted)', () => {
        expect(composeBriefingFromEvents([])).toBeNull();
    });

    test('produces title with singular "meeting" for a single event', () => {
        const out = composeBriefingFromEvents([evt({ summary: 'Lunch with Bob' })]);
        expect(out?.title).toBe('1 meeting today');
        expect(out?.eventCount).toBe(1);
    });

    test('produces title with plural "meetings" for multiple events', () => {
        const out = composeBriefingFromEvents([
            evt({ summary: 'A' }),
            evt({ summary: 'B' }),
            evt({ summary: 'C' }),
        ]);
        expect(out?.title).toBe('3 meetings today');
        expect(out?.eventCount).toBe(3);
    });

    test('body uses singular "event" for a single event', () => {
        const out = composeBriefingFromEvents([evt({ summary: 'Solo' })]);
        expect(out?.body).toContain('1 event today.');
    });

    test('body uses plural "events" for multiple events', () => {
        const out = composeBriefingFromEvents([evt(), evt()]);
        expect(out?.body).toContain('2 events today.');
    });

    test('body includes the first event start time formatted en-US (h:mm AM/PM)', () => {
        const out = composeBriefingFromEvents([
            evt({ summary: 'Morning standup', start: { dateTime: '2026-04-29T09:00:00Z' } }),
        ]);
        // Format depends on the test runner's locale/TZ. Verify the
        // body contains the summary and a time-shaped substring.
        expect(out?.body).toContain('Morning standup');
        expect(out?.body).toMatch(/\b\d{1,2}:\d{2}\s?(AM|PM)\b/i);
    });

    test('body shows "All day" when first event has no dateTime (only date)', () => {
        const out = composeBriefingFromEvents([
            evt({ summary: 'Holiday', start: { date: '2026-04-29' } }),
        ]);
        expect(out?.body).toContain('First: All day, Holiday.');
    });

    test('first event summary is truncated to 60 chars', () => {
        const longTitle = 'A'.repeat(120);
        const out = composeBriefingFromEvents([evt({ summary: longTitle })]);
        // First: <time>, AAA...AAA. — count just the truncated summary
        expect(out?.body).toContain('A'.repeat(60));
        expect(out?.body).not.toContain('A'.repeat(61));
    });

    test('substitutes "(no title)" when summary is missing', () => {
        const out = composeBriefingFromEvents([evt({ summary: undefined })]);
        expect(out?.body).toContain('(no title)');
    });

    test('appends "without an agenda" callout when any event has no description and no attachments', () => {
        const out = composeBriefingFromEvents([
            evt({ summary: 'Has agenda', description: 'plan' }),
            evt({ summary: 'No agenda 1' }), // no description, no attachments
            evt({ summary: 'No agenda 2' }),
        ]);
        expect(out?.body).toContain('2 without an agenda, want me to draft one?');
    });

    test('omits "without an agenda" callout when every event has either description or attachments', () => {
        const out = composeBriefingFromEvents([
            evt({ summary: 'Has agenda', description: 'plan' }),
            evt({ summary: 'Has attachment', attachments: [{ fileUrl: 'http://x' }] }),
        ]);
        expect(out?.body).not.toContain('without an agenda');
    });

    test('treats events with empty attachments array as missing-agenda', () => {
        const out = composeBriefingFromEvents([
            evt({ summary: 'No real agenda', attachments: [] }),
        ]);
        expect(out?.body).toContain('1 without an agenda');
    });

    test('caps body at 280 chars (notifications column constraint)', () => {
        const events = Array.from({ length: 30 }, (_, i) =>
            evt({ summary: `Event ${i} with a lot of context`, start: { dateTime: '2026-04-29T09:00:00Z' } }),
        );
        const out = composeBriefingFromEvents(events);
        expect(out?.body.length).toBeLessThanOrEqual(280);
    });

    test('eventCount field equals input length', () => {
        const events = Array.from({ length: 7 }, (_, i) => evt({ summary: `m${i}` }));
        const out = composeBriefingFromEvents(events);
        expect(out?.eventCount).toBe(7);
    });

    test('title and body cohabit shape: title is short, body has the detail', () => {
        const out = composeBriefingFromEvents([
            evt({ summary: 'A' }),
            evt({ summary: 'B' }),
        ]);
        expect(out?.title.length).toBeLessThan(50);
        expect(out?.body.length).toBeGreaterThan(out?.title.length ?? 0);
    });
});
