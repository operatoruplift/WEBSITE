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
 * Update an owned goal. Any subset of these fields is accepted:
 *   - status       'active' | 'paused' | 'completed' | 'abandoned'
 *   - title        non-empty string, trimmed, max 200 chars
 *   - stakes       string or null (explicitly null to clear)
 *   - target_date  YYYY-MM-DD or null (explicitly null to clear)
 *
 * At least one editable field must be present, otherwise the call
 * is rejected as a no-op. The questline is NOT editable via this
 * endpoint; use POST /api/goals/[id]/regenerate for that.
 */
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const meta = withRequestMeta(request, 'goals.patch');
    try {
        const { userId } = await verifySession(request);
        const { id: goalId } = await params;

        const body = (await request.json()) as {
            status?: unknown;
            title?: unknown;
            stakes?: unknown;
            target_date?: unknown;
        };

        // Validate every present field, accumulate the update payload.
        const updates: Record<string, unknown> = {};

        if (body.status !== undefined) {
            if (typeof body.status !== 'string' || !VALID_STATUSES.includes(body.status as GoalStatus)) {
                return validationError(
                    'Invalid status',
                    "status must be one of 'active', 'paused', 'completed', 'abandoned'.",
                    meta,
                    { field: 'status' },
                );
            }
            updates.status = body.status;
        }
        if (body.title !== undefined) {
            if (typeof body.title !== 'string' || body.title.trim().length === 0 || body.title.length > 200) {
                return validationError(
                    'Invalid title',
                    'title must be a non-empty string up to 200 characters.',
                    meta,
                    { field: 'title' },
                );
            }
            updates.title = body.title.trim();
        }
        if (body.stakes !== undefined) {
            if (body.stakes === null) {
                updates.stakes = null;
            } else if (typeof body.stakes === 'string') {
                const trimmed = body.stakes.trim();
                updates.stakes = trimmed.length === 0 ? null : trimmed.slice(0, 300);
            } else {
                return validationError(
                    'Invalid stakes',
                    'stakes must be a string or null.',
                    meta,
                    { field: 'stakes' },
                );
            }
        }
        if (body.target_date !== undefined) {
            if (body.target_date === null) {
                updates.target_date = null;
            } else if (typeof body.target_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.target_date)) {
                updates.target_date = body.target_date;
            } else {
                return validationError(
                    'Invalid target_date',
                    'target_date must be YYYY-MM-DD or null.',
                    meta,
                    { field: 'target_date' },
                );
            }
        }

        if (Object.keys(updates).length === 0) {
            return validationError(
                'No editable fields supplied',
                'Send at least one of status, title, stakes, or target_date.',
                meta,
                { field: 'body' },
            );
        }

        const supabase = createServiceSupabase();

        // Ownership check before update; the service role would
        // otherwise bypass RLS and let a stranger edit your goal.
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
            .update(updates)
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
