import { NextResponse } from 'next/server';
import { verifySession, AuthError } from '@/lib/auth';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';
import { recordCheckin } from '@/lib/goals/db';
import type { CreateCheckinInput, CheckinStatus } from '@/lib/goals/types';

export const dynamic = 'force-dynamic';

const VALID_STATUSES: readonly CheckinStatus[] = ['done', 'partial', 'skipped'] as const;

/**
 * POST /api/goals/[id]/checkin
 *
 * Idempotent daily check-in. The (goal_id, checkin_date) unique
 * constraint means a second tap on the same day updates the existing
 * row instead of creating a duplicate. lib/goals/db.ts::recordCheckin
 * verifies the goal belongs to the verified user before writing.
 *
 * Body: { status?: 'done' | 'partial' | 'skipped', note?: string, checkin_date?: 'YYYY-MM-DD' }
 * Response: { checkin: GoalCheckin, requestId, timestamp }
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const meta = withRequestMeta(request, 'goals.checkin');
    try {
        const { userId } = await verifySession(request);
        const { id: goalId } = await params;

        if (!goalId || typeof goalId !== 'string') {
            return validationError(
                'Goal id required',
                'Send the goal id in the URL path.',
                meta,
                { missing: ['id'] },
            );
        }

        // Body is optional; an empty body means "default check-in for today
        // with status=done." Tolerate JSON parse errors on empty bodies.
        let body: Partial<CreateCheckinInput> = {};
        try {
            const text = await request.text();
            if (text.trim().length > 0) body = JSON.parse(text);
        } catch {
            return validationError(
                'Invalid JSON body',
                'Body must be valid JSON or empty.',
                meta,
                { field: 'body' },
            );
        }

        if (body.status !== undefined && !VALID_STATUSES.includes(body.status as CheckinStatus)) {
            return validationError(
                'Invalid status',
                "status must be one of 'done', 'partial', 'skipped'.",
                meta,
                { field: 'status' },
            );
        }
        if (body.checkin_date !== undefined && !isYmd(body.checkin_date)) {
            return validationError(
                'checkin_date must be YYYY-MM-DD',
                'Send checkin_date as an ISO calendar date or omit it.',
                meta,
                { field: 'checkin_date' },
            );
        }
        if (body.note !== undefined && typeof body.note !== 'string') {
            return validationError(
                'note must be a string',
                'Send note as a string or omit the field.',
                meta,
                { field: 'note' },
            );
        }

        const checkin = await recordCheckin(userId, goalId, body);

        return NextResponse.json(
            { checkin, requestId: meta.requestId, timestamp: meta.startedAt },
            { headers: meta.headers, status: 201 },
        );
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json(
                { error: 'unauthorized', code: err.message, requestId: meta.requestId },
                { status: 401, headers: meta.headers },
            );
        }
        if (err instanceof Error && err.message === 'goal_not_found') {
            return NextResponse.json(
                { error: 'goal_not_found', requestId: meta.requestId },
                { status: 404, headers: meta.headers },
            );
        }
        return errorResponse(err, meta);
    }
}

function isYmd(s: unknown): s is string {
    return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
