import { NextResponse } from 'next/server';
import { joinWaitlist, totalCount } from '@/lib/waitlist';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/waitlist
 *
 * Idempotent waitlist signup. Body: { email: string, source?: string }.
 * Response: { position, alreadyExisted, count, requestId, timestamp }.
 *
 * Position is sequential starting at 301 (see lib/waitlist-position-migration.sql).
 * Repeat signups return the existing position; the field also includes
 * a stable count of total signups so the UI can render "You are #X of Y."
 */
export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'waitlist.join');
    try {
        const { email, source } = await request.json();

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return validationError(
                'Valid email required',
                'Send a valid email in the JSON body.',
                meta,
                { missing: !email ? ['email'] : ['email_format'] },
            );
        }
        // RFC 5321 maximum local-part + domain length is 254 chars.
        // Reject longer values to prevent a payload-bloat vector
        // through Supabase (and to keep arbitrary strings out of the
        // unique-index column).
        if (email.length > 254) {
            return validationError(
                'Email too long',
                'Use an email under 254 characters (RFC 5321).',
                meta,
                { emailLength: email.length },
            );
        }

        const result = await joinWaitlist(email, typeof source === 'string' ? source : undefined);
        const count = await totalCount();

        return NextResponse.json(
            {
                position: result.position,
                alreadyExisted: result.alreadyExisted,
                count,
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}
