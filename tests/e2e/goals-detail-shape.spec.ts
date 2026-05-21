import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * File-scope locks for the goal detail surface.
 *
 *   GET   /api/goals/[id]     single goal with streak + all check-ins
 *   PATCH /api/goals/[id]     status change (active/paused/completed/abandoned)
 *   /goals/[id]               detail page with questline + check-ins + actions
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const routeSrc = fs.readFileSync(
    path.join(repoRoot, 'app', 'api', 'goals', '[id]', 'route.ts'),
    'utf-8',
);
const pageSrc = fs.readFileSync(
    path.join(repoRoot, 'app', '(dashboard)', 'goals', '[id]', 'page.tsx'),
    'utf-8',
);
const listPageSrc = fs.readFileSync(
    path.join(repoRoot, 'app', '(dashboard)', 'goals', 'page.tsx'),
    'utf-8',
);

test('GET /api/goals/[id] verifies session before reading', () => {
    const verifyIdx = routeSrc.indexOf('verifySession');
    const selectIdx = routeSrc.indexOf("from('goals')");
    expect(verifyIdx).toBeGreaterThanOrEqual(0);
    expect(selectIdx).toBeGreaterThan(verifyIdx);
});

test('GET /api/goals/[id] returns 404 (not 403) on ownership mismatch', () => {
    // Returning 403 leaks whether a given id exists. 404 is uniformly
    // applied to "does not exist" and "not yours" so the response
    // body never reveals which case fired.
    expect(routeSrc).toMatch(/privy_id !== userId/);
    expect(routeSrc).toMatch(/goal_not_found/);
    expect(routeSrc).toMatch(/status:\s*404/);
});

test('PATCH /api/goals/[id] validates the status enum', () => {
    expect(routeSrc).toMatch(/'active',\s*'paused',\s*'completed',\s*'abandoned'/);
    expect(routeSrc).toMatch(/VALID_STATUSES/);
});

test('PATCH /api/goals/[id] checks goal ownership before updating', () => {
    // The service role bypasses RLS; if PATCH ever updated by id
    // without the ownership check, a stranger could pause your goal.
    expect(routeSrc).toMatch(/existing\.privy_id !== userId/);
});

test('PATCH /api/goals/[id] awaits route params (Next 15)', () => {
    // Two routes (GET + PATCH) share the file; both must await params.
    const awaits = routeSrc.match(/await params/g) || [];
    expect(awaits.length).toBeGreaterThanOrEqual(2);
});

test('Detail page fetches the goal by id from the API', () => {
    expect(pageSrc).toMatch(/fetch\(`\/api\/goals\/\$\{id\}`\)/);
    expect(pageSrc).toContain('Back to goals');
});

test('Detail page renders streak + questline + check-ins', () => {
    expect(pageSrc).toContain('Streak');
    expect(pageSrc).toContain('Questline');
    expect(pageSrc).toContain('Recent check-ins');
});

test('Detail page exposes the four status transitions', () => {
    // Pause/resume/complete/abandon. Status transitions are the
    // operator's only escape hatch when a goal stops fitting; if a
    // future refactor drops one, the operator gets stuck.
    expect(pageSrc).toContain('Pause');
    expect(pageSrc).toContain('Resume');
    expect(pageSrc).toContain('Mark complete');
    expect(pageSrc).toContain('Abandon');
});

test('Detail page PATCH call uses the correct method + body', () => {
    expect(pageSrc).toMatch(/method:\s*'PATCH'/);
    expect(pageSrc).toMatch(/JSON\.stringify\(\{\s*status\s*\}\)/);
});

test('Goal list links each row to the detail page', () => {
    // List row title becomes a <Link href={`/goals/${g.id}`}> so the
    // operator can drill into a goal. If a future trim flattens this
    // back to a plain heading, the list becomes a dead end.
    expect(listPageSrc).toMatch(/href=\{`\/goals\/\$\{g\.id\}`\}/);
});
