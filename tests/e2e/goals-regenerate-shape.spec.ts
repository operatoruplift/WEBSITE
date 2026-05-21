import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the regenerate-questline route + the dashboard button that
 * calls it.
 *
 *   POST /api/goals/[id]/regenerate
 *     Auth-gated, ownership-checked. Reads the goal's title from
 *     the verified row (never from the request body) and calls
 *     generateQuestline. Stores the result in goals.questline.
 *
 *   /goals/[id]  "Regenerate" button next to the Questline heading.
 *     Confirms before firing so a stray click does not blow away
 *     the current plan.
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const routeSrc = fs.readFileSync(
    path.join(repoRoot, 'app', 'api', 'goals', '[id]', 'regenerate', 'route.ts'),
    'utf-8',
);
const pageSrc = fs.readFileSync(
    path.join(repoRoot, 'app', '(dashboard)', 'goals', '[id]', 'page.tsx'),
    'utf-8',
);

test('Regenerate route verifies session before reading the goal', () => {
    const verifyIdx = routeSrc.indexOf('verifySession');
    const dbIdx = routeSrc.indexOf("from('goals')");
    expect(verifyIdx).toBeGreaterThanOrEqual(0);
    expect(dbIdx).toBeGreaterThan(verifyIdx);
});

test('Regenerate route does not trust a client-supplied title', () => {
    // The route must read the title from the DB row, not the request
    // body. If a future edit accepts a body.title, a malicious client
    // could ask the AI to plan a goal they do not own (and burn our
    // Claude quota on it).
    expect(routeSrc).toContain("select('id, privy_id, title')");
    expect(routeSrc).toMatch(/goal\.title/);
    expect(routeSrc).not.toMatch(/body\.title/);
});

test('Regenerate route enforces ownership before updating', () => {
    expect(routeSrc).toMatch(/goal\.privy_id !== userId/);
    expect(routeSrc).toMatch(/goal_not_found/);
    expect(routeSrc).toMatch(/status:\s*404/);
});

test('Regenerate route awaits Next 15 params', () => {
    expect(routeSrc).toMatch(/await params/);
});

test('Detail page Regenerate button calls POST /api/goals/[id]/regenerate', () => {
    expect(pageSrc).toMatch(/\/api\/goals\/\$\{id\}\/regenerate/);
    expect(pageSrc).toMatch(/method:\s*'POST'/);
});

test('Detail page Regenerate confirms before destroying the plan', () => {
    // confirm() prevents a stray click from blowing away a questline
    // the operator already started using. If a future refactor drops
    // the confirm, surface area expands for accidental data loss.
    expect(pageSrc).toMatch(/confirm\('Ask the AI for a different questline\?[\s\S]*?'\)/);
});

test('Detail page hides Regenerate when the goal is closed', () => {
    // After complete/abandon, regenerating the questline makes no
    // sense; the button should be gated on !isClosed.
    expect(pageSrc).toMatch(/\{!isClosed && \(/);
    expect(pageSrc).toContain('Regenerate');
});
