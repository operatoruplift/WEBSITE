import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/cron/morning-briefing
 *
 * Called by Vercel Cron at 8 AM MYT (0:00 UTC) every weekday.
 * For each user with connected Google Calendar:
 * 1. Fetch today's events
 * 2. Build a summary
 * 3. Send a self-to-self Gmail notification
 *
 * Protected by CRON_SECRET — Vercel sends this header automatically.
 */
export async function GET(request: Request) {
    // Verify cron secret (Vercel sends this automatically for cron jobs)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    // Get all users with connected Google
    const { data: users, error } = await supabase
        .from('user_integrations')
        .select('user_id, refresh_token')
        .eq('provider', 'google')
        .not('refresh_token', 'is', null);

    if (error || !users) {
        return NextResponse.json({ error: 'Failed to fetch users', detail: error?.message }, { status: 500 });
    }

    let processed = 0;
    let notified = 0;

    for (const user of users) {
        try {
            const oauth2 = new google.auth.OAuth2(
                process.env.GOOGLE_OAUTH_CLIENT_ID,
                process.env.GOOGLE_OAUTH_CLIENT_SECRET,
            );
            oauth2.setCredentials({ refresh_token: user.refresh_token });

            const cal = google.calendar({ version: 'v3', auth: oauth2 });

            // Fetch today's events
            const now = new Date();
            const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);

            const res = await cal.events.list({
                calendarId: 'primary',
                timeMin: startOfDay.toISOString(),
                timeMax: endOfDay.toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
                maxResults: 20,
            });

            const events = res.data.items ?? [];
            processed++;

            if (events.length === 0) continue;

            // Build summary
            const lines = events.map(e => {
                const start = e.start?.dateTime
                    ? new Date(e.start.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    : 'All day';
                return `${start} — ${e.summary || '(No title)'}`;
            });

            const subject = `${events.length} meeting${events.length === 1 ? '' : 's'} today`;
            const body = `Good morning! Here's your schedule:\n\n${lines.join('\n')}\n\nWant me to prepare agendas? Open operatoruplift.com/chat and ask.\n\n— Operator Uplift`;

            // Send self-to-self Gmail notification
            const gmail = google.gmail({ version: 'v1', auth: oauth2 });
            const profile = await gmail.users.getProfile({ userId: 'me' });
            const email = profile.data.emailAddress;
            if (!email) continue;

            const raw = Buffer.from(
                `To: ${email}\r\nFrom: ${email}\r\nSubject: [Operator Uplift] ${subject}\r\nContent-Type: text/plain; charset="UTF-8"\r\nMIME-Version: 1.0\r\n\r\n${body}`
            ).toString('base64url');

            await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
            notified++;
        } catch (err) {
            console.error(`[morning-briefing] Error for ${user.user_id}:`, err);
        }
    }

    return NextResponse.json({
        success: true,
        users_processed: processed,
        users_notified: notified,
        timestamp: new Date().toISOString(),
    });
}
