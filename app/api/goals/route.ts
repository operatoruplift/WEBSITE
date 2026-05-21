import { NextResponse } from 'next/server';
import { verifySession, AuthError } from '@/lib/auth';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';
import { createGoal, listGoalsWithMetrics } from '@/lib/goals/db';
import type { CreateGoalInput } from '@/lib/goals/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/goals
 *
 * Returns the verified user's active goals with computed streak +
 * last-7 check-ins per goal. Used by the /goals dashboard page.
 *
 * Response: { goals: GoalWithMetrics[], requestId, timestamp }.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'goals.list');
    try {
        const { userId } = await verifySession(request);
        const goals = await listGoalsWithMetrics(userId);
        return NextResponse.json(
            {
                goals,
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { headers: meta.headers },
        );
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json(
                { error: 'unauthorized', code: err.message, requestId: meta.requestId },
                { status: 401, headers: meta.headers },
            );
        }
        return errorResponse(err, meta);
    }
}

/**
 * POST /api/goals
 *
 * Create a new goal for the verified user. Body shape matches
 * lib/goals/types.ts::CreateGoalInput. The privy_id is filled in
 * server-side from the verified session; clients only send
 * title (required), stakes (optional), target_date (optional).
 *
 * Response: { goal: Goal, requestId, timestamp }.
 */
export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'goals.create');
    try {
        const { userId } = await verifySession(request);
        const body = (await request.json()) as Partial<CreateGoalInput>;

        if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
            return validationError(
                'Goal title required',
                'Send a non-empty title in the JSON body.',
                meta,
                { missing: ['title'] },
            );
        }
        if (body.stakes !== undefined && typeof body.stakes !== 'string') {
            return validationError(
                'stakes must be a string',
                'Send stakes as a string (or omit the field).',
                meta,
                { field: 'stakes' },
            );
        }
        if (body.target_date !== undefined && !isYmd(body.target_date)) {
            return validationError(
                'target_date must be YYYY-MM-DD',
                'Send target_date as an ISO calendar date (or omit it).',
                meta,
                { field: 'target_date' },
            );
        }

        const goal = await createGoal(userId, {
            title: body.title,
            stakes: body.stakes,
            target_date: body.target_date,
        });

        return NextResponse.json(
            { goal, requestId: meta.requestId, timestamp: meta.startedAt },
            { headers: meta.headers, status: 201 },
        );
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json(
                { error: 'unauthorized', code: err.message, requestId: meta.requestId },
                { status: 401, headers: meta.headers },
            );
        }
        return errorResponse(err, meta);
    }
}

function isYmd(s: unknown): s is string {
    return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
