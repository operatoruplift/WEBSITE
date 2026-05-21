import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 15_000 });

/**
 * Lock the optional journal note on daily check-ins.
 *
 * The check-in API has always accepted an optional `note` field
 * (see app/api/goals/[id]/checkin/route.ts); this spec locks the
 * UI half so the dashboard surfaces it and the recent-checkins
 * list shows it back.
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const pageSrc = fs.readFileSync(
    path.join(repoRoot, 'app', '(dashboard)', 'goals', '[id]', 'page.tsx'),
    'utf-8',
);

test('Detail page renders a note input next to the Check-in button', () => {
    expect(pageSrc).toContain('Today\'s note (optional)');
    expect(pageSrc).toContain('id="checkin-note"');
});

test('Detail page check-in sends the note (when non-empty) to the API', () => {
    // The API tolerates an empty body and defaults to status=done,
    // but if the operator typed a note we have to include it.
    expect(pageSrc).toMatch(/if \(note\.length > 0\) body\.note = note/);
});

test('Detail page clears the note input after a successful check-in', () => {
    // Otherwise the next day's check-in pre-fills with yesterday's
    // note, which is misleading.
    expect(pageSrc).toMatch(/setCheckinNote\(''\)/);
});

test('Detail page bounds the note input to 300 characters', () => {
    // The DB column has no length constraint, but a maxLength on
    // the input avoids accidental pastes of multi-page text. The
    // edit-stakes field already uses 300; reuse it here.
    expect(pageSrc).toMatch(/id="checkin-note"[\s\S]+?maxLength=\{300\}/);
});

test('Detail page check-in row is hidden when goal is not active', () => {
    // Don't show the check-in affordance on paused/completed/abandoned
    // goals; the action would silently no-op (paused) or fail
    // depending on future status enforcement, and either way the UX
    // is confusing.
    expect(pageSrc).toMatch(/\{isActive && \(\s*<div className="mb-6 rounded-xl/);
});

test('Detail page recent-checkins list renders the note when present', () => {
    expect(pageSrc).toMatch(/c\.note &&/);
    expect(pageSrc).toMatch(/\{c\.note\}/);
});
