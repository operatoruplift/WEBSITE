import { NextResponse } from 'next/server';
import { verifySession, AuthError } from '@/lib/auth';
import { withRequestMeta, errorResponse } from '@/lib/apiHelpers';
import { createServiceSupabase } from '@/lib/supabase-server';
import { generateQuestline } from '@/lib/goals/questline';
import type { Goal } from '@/lib/goals/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/goals/[id]/regenerate
 *
 * Ask the AI for a fresh questline. The endpoint reads the goal's
 * title from the verified row (we never trust a client-supplied
 * title because it would let a stranger ask the AI to plan a goal
 * they do not own), then calls generateQuestline and stores the
 * new array.
 *
 * Body: ignored.
 * Response: { goal: Goal, requestId, timestamp }.
 *
 * Rate limiting is not enforced here because each regenerate is a
 * single Claude Haiku call (~$0.001) and the route is auth-gated.
 * If abuse becomes a problem, gate this behind a 1-per-minute
 * per-user limit.
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const meta = withRequestMeta(request, 'goals.regenerate');
    try {
        const { userId } = await verifySession(request);
        const { id: goalId } = await params;

        const supabase = createServiceSupabase();

        // Ownership check + title read happen in one round-trip.
        const { data: goal, error: lookupErr } = await supabase
            .from('goals')
            .select('id, privy_id, title')
            .eq('id', goalId)
            .single();
        if (lookupErr || !goal || goal.privy_id !== userId) {
            return NextResponse.json(
                { error: 'goal_not_found', requestId: meta.requestId },
                { status: 404, headers: meta.headers },
            );
        }

        const questline = await generateQuestline(goal.title);

        const { data: updated, error: updateErr } = await supabase
            .from('goals')
            .update({ questline })
            .eq('id', goalId)
            .select()
            .single();
        if (updateErr) throw updateErr;

        return NextResponse.json(
            { goal: updated as Goal, requestId: meta.requestId, timestamp: meta.startedAt },
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
