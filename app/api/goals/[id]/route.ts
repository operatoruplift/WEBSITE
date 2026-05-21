import { NextResponse } from 'next/server';
import { verifySession, AuthError } from '@/lib/auth';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';
import { createServiceSupabase } from '@/lib/supabase-server';
import { computeStreak } from '@/lib/goals/streak';
import type { Goal, GoalCheckin, GoalStatus, GoalWithMetrics } from '@/lib/goals/types';

export const dynamic = 'force-dynamic';

const VALID_STATUSES: readonly GoalStatus[] = ['active', 'paused', 'completed', 'abandoned'] as const;

/**
 * GET /api/goals/[id]
 *
 * Return a single goal with computed streak and all check-ins, scoped
 * to the verified user. Returns 404 for a goal that does not exist or
 * belongs to a different user (so we never leak ownership info).
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const meta = withRequestMeta(request, 'goals.detail');
    try {
        const { userId } = await verifySession(request);
        const { id: goalId } = await params;

        const supabase = createServiceSupabase();
        const { data: goal, error: goalErr } = await supabase
            .from('goals')
            .select('*')
            .eq('id', goalId)
            .single();

        if (goalErr || !goal || goal.privy_id !== userId) {
            return NextResponse.json(
                { error: 'goal_not_found', requestId: meta.requestId },
                { status: 404, headers: meta.headers },
            );
        }

        const { data: checkins, error: checkErr } = await supabase
            .from('goal_checkins')
            .select('*')
            .eq('goal_id', goalId)
            .eq('privy_id', userId)
            .order('checkin_date', { ascending: false });

        if (checkErr) throw checkErr;

        const today = todayUtcDate();
        const all = (checkins ?? []) as GoalCheckin[];
        const detail: GoalWithMetrics = {
            ...(goal as Goal),
            streak: computeStreak(all, today),
            recent_checkins: all,
        };

        return NextResponse.json(
            { goal: detail, requestId: meta.requestId, timestamp: meta.startedAt },
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
 * PATCH /api/goals/[id]
 *
 * Update a goal's status (active / paused / completed / abandoned).
 * Title and stakes edits live in a follow-up; this endpoint is the
 * minimum needed to pause or close out a goal.
 *
 * Body: { status: GoalStatus }
 */
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const meta = withRequestMeta(request, 'goals.patch');
    try {
        const { userId } = await verifySession(request);
        const { id: goalId } = await params;

        const body = (await request.json()) as { status?: unknown };
        if (!body.status || typeof body.status !== 'string' || !VALID_STATUSES.includes(body.status as GoalStatus)) {
            return validationError(
                'Invalid status',
                "status must be one of 'active', 'paused', 'completed', 'abandoned'.",
                meta,
                { field: 'status' },
            );
        }

        const supabase = createServiceSupabase();

        // Ownership check before update; the service role would
        // otherwise bypass RLS and let a stranger pause your goal.
        const { data: existing, error: lookupErr } = await supabase
            .from('goals')
            .select('id, privy_id')
            .eq('id', goalId)
            .single();
        if (lookupErr || !existing || existing.privy_id !== userId) {
            return NextResponse.json(
                { error: 'goal_not_found', requestId: meta.requestId },
                { status: 404, headers: meta.headers },
            );
        }

        const { data: updated, error: updateErr } = await supabase
            .from('goals')
            .update({ status: body.status })
            .eq('id', goalId)
            .select()
            .single();
        if (updateErr) throw updateErr;

        return NextResponse.json(
            { goal: updated, requestId: meta.requestId, timestamp: meta.startedAt },
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

function todayUtcDate(): string {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
