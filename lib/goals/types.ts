/**
 * Goal + check-in types for the Gamify Your Growth dashboard.
 *
 * The shape mirrors the SQL in lib/goals-migration.sql. Keep the two
 * in lockstep: if a field is added in SQL, add it here; if a status
 * value is added, update the union below.
 *
 * The questline shape lives here as a real TypeScript type even
 * though it persists as JSONB; the column-level type freedom lets
 * the AI-generated questline evolve without a migration, but the
 * application-level type catches drift at compile time.
 */

export type GoalStatus = 'active' | 'paused' | 'completed' | 'abandoned';

export type CheckinStatus = 'done' | 'partial' | 'skipped';

/**
 * One step in the AI-generated questline. The AI breaks the operator's
 * ambition into N actions; each action has a relative day offset from
 * goal creation (day 1 = day of creation, day 2 = next day, etc.),
 * a short imperative action, and optional notes.
 */
export interface QuestlineStep {
    /** Day offset from goal creation. 1-indexed. */
    day: number;
    /** Short imperative phrase. Example: "20 min easy run". */
    action: string;
    /** Optional context. Example: "Aim for conversational pace". */
    notes?: string;
}

/**
 * A goal as it lands on the dashboard. Mirrors the `goals` SQL row.
 */
export interface Goal {
    id: string;
    privy_id: string;
    title: string;
    stakes: string | null;
    questline: QuestlineStep[];
    status: GoalStatus;
    target_date: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * One daily check-in against a goal. Mirrors the `goal_checkins` SQL
 * row. The (goal_id, checkin_date) unique constraint means a second
 * tap on the same day updates the existing row.
 */
export interface GoalCheckin {
    id: string;
    goal_id: string;
    privy_id: string;
    checkin_date: string;
    status: CheckinStatus;
    note: string | null;
    created_at: string;
}

/**
 * Payload shape for POST /api/goals. The privy_id is filled in
 * server-side from the verified session; clients only send title +
 * optional stakes + optional target date.
 */
export interface CreateGoalInput {
    title: string;
    stakes?: string;
    target_date?: string;
}

/**
 * Payload shape for POST /api/goals/[id]/checkin.
 */
export interface CreateCheckinInput {
    status?: CheckinStatus;
    note?: string;
    /** Defaults to today (server time) if absent. ISO yyyy-mm-dd. */
    checkin_date?: string;
}

/**
 * What the dashboard renders per goal. Includes the current streak and
 * the most recent check-ins so the UI does not have to call two
 * endpoints to render a row.
 */
export interface GoalWithMetrics extends Goal {
    /** Current consecutive-day streak ending today or yesterday. */
    streak: number;
    /** Last 7 check-ins, newest first. */
    recent_checkins: GoalCheckin[];
}
