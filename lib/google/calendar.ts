/**
 * Google Calendar integration — server-side helpers.
 *
 * Every function takes a userId and internally fetches + refreshes
 * the OAuth tokens via lib/google/oauth.ts. Caller never touches tokens.
 */
import { google, calendar_v3 } from 'googleapis';
import { getAuthenticatedClient } from './oauth';

function getCalendar(auth: ReturnType<typeof google.auth.OAuth2.prototype.setCredentials> extends void ? never : Parameters<typeof google.calendar>[0]['auth']) {
    return google.calendar({ version: 'v3', auth: auth as any });
}

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
): Promise<FreeSlot[]> {
    const auth = await getAuthenticatedClient(userId);
    const cal = google.calendar({ version: 'v3', auth });

    const now = new Date();
    // Apply start offset (0 = today, 1 = tomorrow, etc.)
    const searchStart = new Date(now);
    if (startDayOffset > 0) {
        searchStart.setDate(searchStart.getDate() + startDayOffset);
        searchStart.setHours(9, 0, 0, 0); // Start at 9 AM on the offset day
    }
    const until = new Date(searchStart.getTime() + daysAhead * 86400_000);

    const busy = await cal.freebusy.query({
        requestBody: {
            timeMin: searchStart.toISOString(),
            timeMax: until.toISOString(),
            items: [{ id: 'primary' }],
        },
    });

    const busyRanges = (busy.data.calendars?.['primary']?.busy ?? []).map((b) => ({
        start: new Date(b.start!).getTime(),
        end: new Date(b.end!).getTime(),
    }));

    // Build free windows between busy blocks, within 9am–6pm local time
    const slots: FreeSlot[] = [];
    const durationMs = durationMin * 60_000;

    for (let day = 0; day < daysAhead && slots.length < maxSlots; day++) {
        const dayStart = new Date(searchStart);
        dayStart.setDate(dayStart.getDate() + day);
        dayStart.setHours(9, 0, 0, 0);
        if (dayStart.getTime() < now.getTime()) dayStart.setTime(now.getTime());

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(18, 0, 0, 0);

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
            start: { dateTime: event.start },
            end: { dateTime: event.end },
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
