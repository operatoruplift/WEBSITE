import { createServiceSupabase } from '@/lib/supabase-server';
import { computeStreak } from './streak';
import { generateQuestline } from './questline';
import type {
    Goal,
    GoalCheckin,
    GoalWithMetrics,
    CreateGoalInput,
    CreateCheckinInput,
} from './types';

/**
 * Supabase data-access for goals + check-ins.
 *
 * Every function in this module is server-side only (uses the service
 * role). The caller is responsible for resolving the Privy user from
 * the request and passing the verified privyId here, so we never trust
 * a client-supplied id.
 */

/** Create a new goal. Returns the persisted row. */
export async function createGoal(
    privyId: string,
    input: CreateGoalInput,
): Promise<Goal> {
    if (!privyId) throw new Error('privyId required');
    if (!input.title || !input.title.trim()) {
        throw new Error('title required');
    }

    // Generate the questline before the insert. generateQuestline is
    // fail-soft: it returns FALLBACK_QUESTLINE on any error or missing
    // API key, so the insert never blocks on the model.
    const questline = await generateQuestline(input.title);

    const supabase = createServiceSupabase();
    const { data, error } = await supabase
        .from('goals')
        .insert({
            privy_id: privyId,
            title: input.title.trim(),
            stakes: input.stakes?.trim() || null,
            target_date: input.target_date || null,
            questline,
            status: 'active',
        })
        .select()
        .single();

    if (error) throw error;
    return data as Goal;
}

/** List a user's goals, newest first. Optional status filter. */
export async function listGoals(
    privyId: string,
    status?: 'active' | 'paused' | 'completed' | 'abandoned',
): Promise<Goal[]> {
    if (!privyId) throw new Error('privyId required');

    const supabase = createServiceSupabase();
    let query = supabase
        .from('goals')
        .select('*')
        .eq('privy_id', privyId)
        .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Goal[];
}

/**
 * Record a check-in. Idempotent on (goal_id, checkin_date): a second
 * call on the same day updates the existing row.
 */
export async function recordCheckin(
    privyId: string,
    goalId: string,
    input: CreateCheckinInput,
): Promise<GoalCheckin> {
    if (!privyId) throw new Error('privyId required');
    if (!goalId) throw new Error('goalId required');

    const supabase = createServiceSupabase();

    // Defense in depth: verify the goal belongs to the user before
    // writing a check-in. The RLS policies enforce this for the
    // service role too via the explicit privy_id match.
    const { data: goal, error: goalErr } = await supabase
        .from('goals')
        .select('id, privy_id')
        .eq('id', goalId)
        .single();

    if (goalErr || !goal || goal.privy_id !== privyId) {
        throw new Error('goal_not_found');
    }

    const checkin_date = input.checkin_date || todayUtcDate();
    const status = input.status || 'done';

    const { data, error } = await supabase
        .from('goal_checkins')
        .upsert(
            {
                goal_id: goalId,
                privy_id: privyId,
                checkin_date,
                status,
                note: input.note?.trim() || null,
            },
            { onConflict: 'goal_id,checkin_date' },
        )
        .select()
        .single();

    if (error) throw error;
    return data as GoalCheckin;
}

/**
 * Read a user's goals with computed streak and last-7 check-ins.
 * Returns one round-trip-friendly payload for the dashboard.
 */
export async function listGoalsWithMetrics(
    privyId: string,
): Promise<GoalWithMetrics[]> {
    const goals = await listGoals(privyId, 'active');
    if (goals.length === 0) return [];

    const supabase = createServiceSupabase();
    const { data: checkins, error } = await supabase
        .from('goal_checkins')
        .select('*')
        .eq('privy_id', privyId)
        .in('goal_id', goals.map((g) => g.id))
        .order('checkin_date', { ascending: false });

    if (error) throw error;

    const today = todayUtcDate();
    const byGoal = new Map<string, GoalCheckin[]>();
    for (const c of (checkins ?? []) as GoalCheckin[]) {
        const list = byGoal.get(c.goal_id) ?? [];
        list.push(c);
        byGoal.set(c.goal_id, list);
    }

    return goals.map((g) => {
        const all = byGoal.get(g.id) ?? [];
        return {
            ...g,
            streak: computeStreak(all, today),
            recent_checkins: all.slice(0, 7),
        };
    });
}

/** UTC date as 'YYYY-MM-DD'. Server time, not user-local. */
function todayUtcDate(): string {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
