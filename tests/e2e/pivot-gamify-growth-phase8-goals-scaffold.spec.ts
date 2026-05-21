import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the scaffold for Phase 8 of the Gamify Your Growth pivot.
 *
 * This PR ships the data model design (SQL + TypeScript types), the
 * pure-function streak helper (covered by tests/e2e/goals-streak.spec.ts),
 * and the first dashboard surface at /goals. The API routes and the
 * Supabase wire-up are explicit Not Done; the dashboard page honestly
 * says so.
 *
 * Source of truth: docs/PIVOT_GAMIFY_GROWTH.md Phase 8.
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const sqlSrc = fs.readFileSync(path.join(repoRoot, 'lib', 'goals-migration.sql'), 'utf-8');
const typesSrc = fs.readFileSync(path.join(repoRoot, 'lib', 'goals', 'types.ts'), 'utf-8');
const streakSrc = fs.readFileSync(path.join(repoRoot, 'lib', 'goals', 'streak.ts'), 'utf-8');
const pageSrc = fs.readFileSync(
    path.join(repoRoot, 'app', '(dashboard)', 'goals', 'page.tsx'),
    'utf-8',
);

test('Migration creates both goals and goal_checkins tables', () => {
    expect(sqlSrc).toMatch(/CREATE TABLE IF NOT EXISTS goals/);
    expect(sqlSrc).toMatch(/CREATE TABLE IF NOT EXISTS goal_checkins/);
});

test('Migration enforces a unique check-in per (goal, date)', () => {
    // The unique index is the only thing standing between a double-tap
    // and an inflated streak. If a future edit relaxes it to a plain
    // index, this fires.
    expect(sqlSrc).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS goal_checkins_unique_per_day/);
    expect(sqlSrc).toMatch(/ON goal_checkins \(goal_id, checkin_date\)/);
});

test('Migration enables RLS on both tables', () => {
    // RLS-off on a privy_id-keyed table is a critical data-leak risk.
    expect(sqlSrc).toMatch(/ALTER TABLE goals\s+ENABLE ROW LEVEL SECURITY/);
    expect(sqlSrc).toMatch(/ALTER TABLE goal_checkins\s+ENABLE ROW LEVEL SECURITY/);
});

test('Types file exports the canonical interfaces', () => {
    expect(typesSrc).toMatch(/export interface Goal\b/);
    expect(typesSrc).toMatch(/export interface GoalCheckin\b/);
    expect(typesSrc).toMatch(/export interface QuestlineStep\b/);
    expect(typesSrc).toMatch(/export interface CreateGoalInput\b/);
    expect(typesSrc).toMatch(/export interface CreateCheckinInput\b/);
    expect(typesSrc).toMatch(/export interface GoalWithMetrics\b/);
});

test('GoalStatus + CheckinStatus unions match the SQL defaults + comments', () => {
    expect(typesSrc).toContain("'active' | 'paused' | 'completed' | 'abandoned'");
    expect(typesSrc).toContain("'done' | 'partial' | 'skipped'");
});

test('Streak helper exports computeStreak + addDays', () => {
    expect(streakSrc).toMatch(/export function computeStreak/);
    expect(streakSrc).toMatch(/export function addDays/);
});

test('/goals page renders the dashboard scaffold copy', () => {
    expect(pageSrc).toContain('Keep your word. Bet on yourself.');
    expect(pageSrc).toContain('Name a goal');
    expect(pageSrc).toContain('No goals yet');
});

test('/goals page is honest about what does not ship yet', () => {
    // The page must explicitly call out that the API + check-ins are
    // not live yet. If a future edit removes the disclaimer, the
    // page implies a feature exists that does not.
    expect(pageSrc).toMatch(/Private beta/);
    expect(pageSrc).toMatch(/lands in the next release/);
});

test('/goals page form field names match CreateGoalInput', () => {
    // Form binds: title (required), stakes (optional), target_date
    // (optional). The shape matches lib/goals/types.ts::CreateGoalInput
    // so the next-iteration POST /api/goals wire-up is a one-line
    // change to fetch instead of setState.
    expect(pageSrc).toMatch(/htmlFor="goal-title"/);
    expect(pageSrc).toMatch(/htmlFor="goal-stakes"/);
    expect(pageSrc).toMatch(/htmlFor="goal-target"/);
});
