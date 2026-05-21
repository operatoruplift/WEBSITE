import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the goal-edit affordance.
 *
 * PATCH /api/goals/[id] now accepts any subset of:
 *   - status      enum
 *   - title       non-empty string, max 200 chars
 *   - stakes      string or null (null clears)
 *   - target_date YYYY-MM-DD or null (null clears)
 *
 * The goal detail page renders an inline edit form behind a Pencil
 * button. The form binds to draft state and submits a single PATCH.
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

test('PATCH validates title length (non-empty, <=200)', () => {
    expect(routeSrc).toMatch(/body\.title\.trim\(\)\.length === 0/);
    expect(routeSrc).toMatch(/body\.title\.length > 200/);
});

test('PATCH accepts stakes=null and trims string stakes (max 300)', () => {
    // null explicitly clears the stakes; string is trimmed and
    // bounded so a 10k-char paste does not blow up the row.
    expect(routeSrc).toMatch(/body\.stakes === null/);
    expect(routeSrc).toMatch(/trimmed\.slice\(0, 300\)/);
});

test('PATCH accepts target_date=null and validates YYYY-MM-DD', () => {
    expect(routeSrc).toMatch(/body\.target_date === null/);
    expect(routeSrc).toMatch(/\\d\{4\}-\\d\{2\}-\\d\{2\}/);
});

test('PATCH rejects an empty body (no editable fields)', () => {
    // Without this guard, a PATCH with no fields would issue an empty
    // UPDATE (no-op but a wasted DB round-trip + 200 response that
    // implies success).
    expect(routeSrc).toMatch(/No editable fields supplied/);
});

test('PATCH still enforces ownership before updating', () => {
    expect(routeSrc).toMatch(/existing\.privy_id !== userId/);
});

test('Detail page renders an Edit button when goal is not closed', () => {
    expect(pageSrc).toContain('aria-label="Edit goal"');
    expect(pageSrc).toMatch(/!isClosed && !editing/);
});

test('Detail page edit form binds to draft state and submits PATCH', () => {
    expect(pageSrc).toMatch(/setDraftTitle/);
    expect(pageSrc).toMatch(/setDraftStakes/);
    expect(pageSrc).toMatch(/setDraftTarget/);
    expect(pageSrc).toMatch(/method:\s*'PATCH'/);
});

test('Detail page edit clears stakes/target via null', () => {
    // Empty string in the form means "clear it"; the page must send
    // null (not "") so the API maps to NULL in the DB instead of
    // storing an empty string.
    expect(pageSrc).toMatch(/payload\.stakes = stakes\.length === 0 \? null : stakes/);
    expect(pageSrc).toMatch(/payload\.target_date = draftTarget\.length === 0 \? null : draftTarget/);
});

test('Detail page hides Edit when goal is closed', () => {
    // After complete/abandon, editing makes no sense. Guard ensures
    // the affordance disappears so the operator does not get the
    // false impression they can still mutate the goal.
    const editGuard = pageSrc.match(/\{!isClosed && !editing && \(/);
    expect(editGuard).not.toBeNull();
});
