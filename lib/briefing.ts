/**
 * Daily briefing, server-side composer.
 *
 * Given a user_id, fetch today's Google Calendar events and compose a
 * short agenda string (max 280 chars). The cron route at
 * /api/cron/daily-briefing calls this once per opted-in user per day.
 *
 * Returns null when the user has no events today (the caller then
 * skips the notifications insert, an empty briefing is noise).
 */
import { google, calendar_v3 } from 'googleapis';
import { getAuthenticatedClient } from '@/lib/google/oauth';

export interface BriefingPayload {
    title: string;
    body: string;
    eventCount: number;
}

const MAX_BODY = 280;

/**
 * Pure formatter, exported separately so it can be unit-tested
 * without spinning up an authenticated calendar client.
 */
export function composeBriefingFromEvents(
    events: calendar_v3.Schema$Event[],
): BriefingPayload | null {
    if (events.length === 0) return null;

    const first = events[0];
    const firstStart = first.start?.dateTime
        ? new Date(first.start.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : 'All day';
    const firstSummary = (first.summary || '(no title)').slice(0, 60);

    const noAgendaCount = events.filter(e => !e.description && !e.attachments?.length).length;

    const title = `${events.length} meeting${events.length === 1 ? '' : 's'} today`;
    const parts: string[] = [
        `${events.length} event${events.length === 1 ? '' : 's'} today.`,
        `First: ${firstStart}, ${firstSummary}.`,
    ];
    if (noAgendaCount > 0) {
        parts.push(`${noAgendaCount} without an agenda, want me to draft one?`);
    }
    const body = parts.join(' ').slice(0, MAX_BODY);

    return { title, body, eventCount: events.length };
}

export async function composeBriefing(userId: string): Promise<BriefingPayload | null> {
    const client = await getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: client });

    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);

    const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 20,
    });

    return composeBriefingFromEvents(res.data.items ?? []);
}
