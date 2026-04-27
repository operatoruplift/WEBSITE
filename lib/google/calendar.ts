/**
 * Google Calendar integration, server-side helpers.
 *
 * Every function takes a userId and internally fetches + refreshes
 * the OAuth tokens via lib/google/oauth.ts. Caller never touches tokens.
 */
import { google, calendar_v3 } from 'googleapis';
import { getAuthenticatedClient } from './oauth';

export interface CalendarEvent {
    id: string;
    summary: string;
    start: string;
    end: string;
    location?: string;
    description?: string;
    htmlLink?: string;
}

export interface FreeSlot {
    start: string;
    end: string;
    durationMinutes: number;
}

/** List upcoming events for the next N days. */
export async function listEvents(
    userId: string,
    daysAhead: number = 7,
    maxResults: number = 20,
): Promise<CalendarEvent[]> {
    const auth = await getAuthenticatedClient(userId);
    const cal = google.calendar({ version: 'v3', auth });

    const now = new Date();
    const until = new Date(now.getTime() + daysAhead * 86400_000);

    const res = await cal.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: until.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults,
        timeZone: 'Asia/Kuala_Lumpur',
    });

    return (res.data.items ?? []).map(toEvent);
}

/** Find free slots of at least `durationMin` minutes in the next N days. */
export async function findFreeSlots(
    userId: string,
    durationMin: number = 30,
    daysAhead: number = 7,
    maxSlots: number = 5,
    startDayOffset: number = 0,
    localDate?: string, // YYYY-MM-DD from the client's local timezone
): Promise<FreeSlot[]> {
    const auth = await getAuthenticatedClient(userId);
    const cal = google.calendar({ version: 'v3', auth });

    // All date math uses MYT (UTC+8) to match the user's timezone.
    // On Vercel (UTC server), we offset by +8 hours explicitly.
    const MYT_OFFSET_MS = 8 * 60 * 60 * 1000;

    // Get "now" in MYT
    const nowUTC = Date.now();
    const nowMYT = new Date(nowUTC + MYT_OFFSET_MS);

    // Base date: use client's local date if provided, otherwise MYT "today"
    let baseDate: Date;
    if (localDate && /^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
        const [y, m, d] = localDate.split('-').map(Number);
        // 9 AM MYT = 1 AM UTC
        baseDate = new Date(Date.UTC(y, m - 1, d, 1, 0, 0, 0));
    } else {
        // Today in MYT, 9 AM MYT
        baseDate = new Date(Date.UTC(
            nowMYT.getUTCFullYear(), nowMYT.getUTCMonth(), nowMYT.getUTCDate(),
            1, 0, 0, 0 // 1 AM UTC = 9 AM MYT
        ));
    }

    // Apply start offset (0 = today, 1 = tomorrow in MYT)
    const searchStart = new Date(baseDate.getTime() + startDayOffset * 86400_000);

    // If search start is in the past, use now
    if (searchStart.getTime() < nowUTC) {
        searchStart.setTime(nowUTC);
    }
    const until = new Date(searchStart.getTime() + daysAhead * 86400_000);

    const busy = await cal.freebusy.query({
        requestBody: {
            timeMin: searchStart.toISOString(),
            timeMax: until.toISOString(),
            timeZone: 'Asia/Kuala_Lumpur',
            items: [{ id: 'primary' }],
        },
    });

    const busyRanges = (busy.data.calendars?.['primary']?.busy ?? []).map((b) => ({
        start: new Date(b.start!).getTime(),
        end: new Date(b.end!).getTime(),
    }));

    // Build free windows between busy blocks, within 9am-6pm MYT
    const slots: FreeSlot[] = [];
    const durationMs = durationMin * 60_000;

    for (let day = 0; day < daysAhead && slots.length < maxSlots; day++) {
        // 9 AM MYT = 1 AM UTC for each day
        const baseDayUTC = new Date(searchStart.getTime() + day * 86400_000);
        const dayStart = new Date(Date.UTC(
            baseDayUTC.getUTCFullYear(), baseDayUTC.getUTCMonth(), baseDayUTC.getUTCDate(),
            1, 0, 0, 0 // 1 AM UTC = 9 AM MYT
        ));
        if (dayStart.getTime() < nowUTC) dayStart.setTime(nowUTC);

        // 6 PM MYT = 10 AM UTC
        const dayEnd = new Date(Date.UTC(
            baseDayUTC.getUTCFullYear(), baseDayUTC.getUTCMonth(), baseDayUTC.getUTCDate(),
            10, 0, 0, 0 // 10 AM UTC = 6 PM MYT
        ));

        let cursor = dayStart.getTime();
        // Round up to next 15-min boundary
        cursor = Math.ceil(cursor / 900_000) * 900_000;

        while (cursor + durationMs <= dayEnd.getTime() && slots.length < maxSlots) {
            const slotEnd = cursor + durationMs;
            const overlaps = busyRanges.some(
                (b) => cursor < b.end && slotEnd > b.start,
            );
            if (!overlaps) {
                slots.push({
                    start: new Date(cursor).toISOString(),
                    end: new Date(slotEnd).toISOString(),
                    durationMinutes: durationMin,
                });
                cursor = slotEnd; // move past this slot
            } else {
                cursor += 900_000; // try next 15-min slot
            }
        }
    }

    return slots;
}

/** Create a calendar event. Returns the created event. */
export async function createEvent(
    userId: string,
    event: {
        summary: string;
        start: string; // ISO datetime
        end: string;
        description?: string;
        location?: string;
        attendees?: string[]; // email addresses
    },
): Promise<CalendarEvent> {
    const auth = await getAuthenticatedClient(userId);
    const cal = google.calendar({ version: 'v3', auth });

    const res = await cal.events.insert({
        calendarId: 'primary',
        requestBody: {
            summary: event.summary,
            description: event.description,
            location: event.location,
            start: { dateTime: event.start, timeZone: 'Asia/Kuala_Lumpur' },
            end: { dateTime: event.end, timeZone: 'Asia/Kuala_Lumpur' },
            attendees: event.attendees?.map((email) => ({ email })),
        },
    });

    return toEvent(res.data);
}

function toEvent(item: calendar_v3.Schema$Event): CalendarEvent {
    return {
        id: item.id ?? '',
        summary: item.summary ?? '(No title)',
        start: item.start?.dateTime ?? item.start?.date ?? '',
        end: item.end?.dateTime ?? item.end?.date ?? '',
        location: item.location ?? undefined,
        description: item.description ?? undefined,
        htmlLink: item.htmlLink ?? undefined,
    };
}
