import { test, expect } from '@playwright/test';
import { toEvent } from '@/lib/google/calendar';
import type { calendar_v3 } from 'googleapis';

/**
 * Unit tests for the Google Calendar API → CalendarEvent mapper.
 *
 * Every Calendar response item flows through toEvent() before the
 * UI renders. A regression in the field mapping means the calendar
 * page either shows blanks where data exists or crashes on unset
 * fields.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/calendar-toEvent.spec.ts --reporter=list
 */

test.describe('toEvent', () => {
    test('maps a fully-populated event correctly', () => {
        const item: calendar_v3.Schema$Event = {
            id: 'event-123',
            summary: 'Team standup',
            start: { dateTime: '2026-04-29T09:00:00Z' },
            end: { dateTime: '2026-04-29T09:30:00Z' },
            location: 'Conf Room A',
            description: 'Daily check-in',
            htmlLink: 'https://calendar.google.com/event?eid=...',
        };
        const result = toEvent(item);
        expect(result.id).toBe('event-123');
        expect(result.summary).toBe('Team standup');
        expect(result.start).toBe('2026-04-29T09:00:00Z');
        expect(result.end).toBe('2026-04-29T09:30:00Z');
        expect(result.location).toBe('Conf Room A');
        expect(result.description).toBe('Daily check-in');
        expect(result.htmlLink).toBe('https://calendar.google.com/event?eid=...');
    });

    test('falls back to date when dateTime is absent (all-day events)', () => {
        const allDay: calendar_v3.Schema$Event = {
            id: 'all-day-1',
            summary: 'Public holiday',
            start: { date: '2026-04-29' },
            end: { date: '2026-04-30' },
        };
        const result = toEvent(allDay);
        expect(result.start).toBe('2026-04-29');
        expect(result.end).toBe('2026-04-30');
    });

    test('prefers dateTime over date when both are present', () => {
        const item: calendar_v3.Schema$Event = {
            id: 'mixed',
            summary: 'event',
            start: { dateTime: '2026-04-29T09:00:00Z', date: '2026-04-29' },
            end: { dateTime: '2026-04-29T10:00:00Z', date: '2026-04-29' },
        };
        const result = toEvent(item);
        expect(result.start).toBe('2026-04-29T09:00:00Z');
        expect(result.end).toBe('2026-04-29T10:00:00Z');
    });

    test('uses "(No title)" when summary is missing', () => {
        const item: calendar_v3.Schema$Event = {
            id: 'no-title',
            start: { dateTime: '2026-04-29T09:00:00Z' },
            end: { dateTime: '2026-04-29T10:00:00Z' },
        };
        const result = toEvent(item);
        expect(result.summary).toBe('(No title)');
    });

    test('returns empty string id when id is missing', () => {
        const item: calendar_v3.Schema$Event = {
            summary: 'No ID event',
        };
        const result = toEvent(item);
        expect(result.id).toBe('');
    });

    test('returns empty string for start/end when both dateTime and date are missing', () => {
        const item: calendar_v3.Schema$Event = {
            id: 'half-empty',
            summary: 'event',
            start: {},
            end: {},
        };
        const result = toEvent(item);
        expect(result.start).toBe('');
        expect(result.end).toBe('');
    });

    test('returns empty string when start/end are missing entirely', () => {
        const item: calendar_v3.Schema$Event = {
            id: 'no-times',
            summary: 'event',
        };
        const result = toEvent(item);
        expect(result.start).toBe('');
        expect(result.end).toBe('');
    });

    test('omits optional fields when absent (location, description, htmlLink)', () => {
        const minimal: calendar_v3.Schema$Event = {
            id: 'min',
            summary: 'minimal',
            start: { dateTime: '2026-04-29T09:00:00Z' },
            end: { dateTime: '2026-04-29T10:00:00Z' },
        };
        const result = toEvent(minimal);
        expect(result.location).toBeUndefined();
        expect(result.description).toBeUndefined();
        expect(result.htmlLink).toBeUndefined();
    });

    test('handles null fields from the API gracefully', () => {
        // The Google Calendar SDK can return null for optional string
        // fields. The mapper coerces null to undefined for optional
        // output fields. A regression that left null in the output
        // would surface as `null` strings in the UI.
        const item: calendar_v3.Schema$Event = {
            id: null,
            summary: null,
            location: null,
            description: null,
            htmlLink: null,
        };
        const result = toEvent(item);
        expect(result.id).toBe('');
        expect(result.summary).toBe('(No title)');
        expect(result.location).toBeUndefined();
        expect(result.description).toBeUndefined();
        expect(result.htmlLink).toBeUndefined();
    });
});
