import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * File-scope checks for the goals API routes.
 *
 * Locks the shape of:
 *   - GET /api/goals       (list)
 *   - POST /api/goals       (create)
 *   - POST /api/goals/[id]/checkin (daily check-in)
 *
 * The integration tests against a real Supabase live elsewhere; this
 * spec catches the regressions that show up before the request hits
 * the database (auth gate present, input validation present, error
 * envelope present, no privy_id trust from the client).
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const listRouteSrc = fs.readFileSync(
    path.join(repoRoot, 'app', 'api', 'goals', 'route.ts'),
    'utf-8',
);
const checkinRouteSrc = fs.readFileSync(
    path.join(repoRoot, 'app', 'api', 'goals', '[id]', 'checkin', 'route.ts'),
    'utf-8',
);
const dbSrc = fs.readFileSync(path.join(repoRoot, 'lib', 'goals', 'db.ts'), 'utf-8');
const pageSrc = fs.readFileSync(
    path.join(repoRoot, 'app', '(dashboard)', 'goals', 'page.tsx'),
    'utf-8',
);

test('GET /api/goals calls verifySession before reading goals', () => {
    // The order matters: an unauthenticated request must never reach
    // listGoalsWithMetrics, or RLS bypass via service role becomes a
    // data-exfiltration vector.
    const verifyIdx = listRouteSrc.indexOf('verifySession');
    const listIdx = listRouteSrc.indexOf('listGoalsWithMetrics');
    expect(verifyIdx).toBeGreaterThanOrEqual(0);
    expect(listIdx).toBeGreaterThan(verifyIdx);
});

test('POST /api/goals validates the title before writing', () => {
    expect(listRouteSrc).toMatch(/!body\.title/);
    expect(listRouteSrc).toMatch(/validationError/);
});

test('POST /api/goals does not trust client-supplied privy_id', () => {
    // The route must derive userId from verifySession, never from the
    // request body. If a future edit lets a client-provided privy_id
    // through, the impersonation vector is open.
    expect(listRouteSrc).toMatch(/await verifySession/);
    // Privy id must come from the verifySession destructure, not from
    // anywhere a client could supply it.
    expect(listRouteSrc).not.toMatch(/body\.privy_id/);
    expect(listRouteSrc).not.toMatch(/body\.userId/);
});

test('POST /api/goals validates target_date as YYYY-MM-DD when present', () => {
    expect(listRouteSrc).toMatch(/isYmd/);
    expect(listRouteSrc).toMatch(/\\d\{4\}-\\d\{2\}-\\d\{2\}/);
});

test('POST /api/goals/[id]/checkin awaits the route params', () => {
    // Next 15 made params a Promise. A direct destructure of params
    // without await is a runtime error.
    expect(checkinRouteSrc).toMatch(/await params/);
});

test('POST /api/goals/[id]/checkin validates the status enum', () => {
    expect(checkinRouteSrc).toContain('VALID_STATUSES');
    expect(checkinRouteSrc).toMatch(/'done',\s*'partial',\s*'skipped'/);
});

test('POST /api/goals/[id]/checkin tolerates an empty body', () => {
    // The minimum-friction default is "check in today, status=done"
    // with no body at all. The route must accept this without 400.
    expect(checkinRouteSrc).toMatch(/text\.trim\(\)\.length > 0/);
});

test('POST /api/goals/[id]/checkin returns 404 for a stranger\'s goal', () => {
    // recordCheckin throws 'goal_not_found' when privy_id mismatches.
    // The route must map that to a 404 response (not a 500).
    expect(checkinRouteSrc).toMatch(/goal_not_found/);
    expect(checkinRouteSrc).toMatch(/status:\s*404/);
});

test('db.recordCheckin verifies goal ownership before inserting', () => {
    // The service-role client bypasses RLS. The only thing standing
    // between a stranger's check-in and another user's data is this
    // ownership check. If a future refactor removes it, the spec
    // catches it before the leak ships.
    expect(dbSrc).toMatch(/goal\.privy_id !== privyId/);
    expect(dbSrc).toMatch(/throw new Error\('goal_not_found'\)/);
});

test('db.recordCheckin upserts on the unique (goal_id, checkin_date) constraint', () => {
    // Idempotency: a double-tap on the same day must not inflate the
    // streak. The DB enforces this with a unique index; the upsert
    // here must reference that same constraint.
    expect(dbSrc).toMatch(/onConflict:\s*'goal_id,checkin_date'/);
});

test('Dashboard /goals page fetches from /api/goals (no local-only state)', () => {
    // Pre-wire-up, the form held goals in component state only and
    // never called the API. Lock the wire-up so a future copy edit
    // does not revert.
    expect(pageSrc).toContain("fetch('/api/goals'");
    expect(pageSrc).toMatch(/method:\s*'POST'/);
});

test('Dashboard /goals page records check-ins via POST /api/goals/[id]/checkin', () => {
    expect(pageSrc).toMatch(/\/api\/goals\/\$\{goalId\}\/checkin/);
    expect(pageSrc).toContain("Check in today");
});

test('Dashboard /goals page renders the streak badge for each goal', () => {
    // The streak badge ("X days" with a flame icon) is the key
    // affordance for the gamified loop. If a future trim removes it,
    // the dashboard stops communicating progress.
    expect(pageSrc).toMatch(/\{g\.streak\} day/);
});
