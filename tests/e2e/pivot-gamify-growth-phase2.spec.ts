import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock Phase 2 of the Gamify Your Growth pivot: the rewritten
 * HowItWorks (four-step ambition-to-action questline) and the
 * repurposed LocalFirst (Problem + Solution / Motivation Cliff).
 *
 * Pivot source of truth: docs/PIVOT_GAMIFY_GROWTH.md.
 *
 * This spec is file-scope only; it scans the React source rather
 * than booting Next.js. A failure here means a future copy edit
 * has reverted Phase 2 of the pivot.
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const howItWorksSrc = fs.readFileSync(
    path.join(repoRoot, 'src', 'sections', 'HowItWorks.tsx'),
    'utf-8',
);
const localFirstSrc = fs.readFileSync(
    path.join(repoRoot, 'src', 'sections', 'LocalFirst.tsx'),
    'utf-8',
);

test('HowItWorks step 01 names "Set your goal" (not "Sign in with Google")', () => {
    expect(howItWorksSrc).toContain("title: 'Set your goal'");
    expect(howItWorksSrc).not.toContain("title: 'Sign in with Google'");
});

test('HowItWorks step 02 names "AI breaks it down" (not "Ask in plain English")', () => {
    expect(howItWorksSrc).toContain("title: 'AI breaks it down'");
    expect(howItWorksSrc).not.toContain("title: 'Ask in plain English'");
});

test('HowItWorks step 03 names "Show up daily" (not "Tap to approve")', () => {
    expect(howItWorksSrc).toContain("title: 'Show up daily'");
    expect(howItWorksSrc).not.toContain("title: 'Tap to approve'");
});

test('HowItWorks step 04 names "Adapt and achieve" (not "It runs in your real Gmail")', () => {
    expect(howItWorksSrc).toContain("title: 'Adapt and achieve'");
    expect(howItWorksSrc).not.toContain("title: 'It runs in your real Gmail'");
});

test('HowItWorks section heading reframes around ambition + habits', () => {
    expect(howItWorksSrc).toContain('Turn your ambition into a daily habit');
    expect(howItWorksSrc).not.toContain('From sign-in to first action');
});

test('HowItWorks step bodies drop the retired Gmail/Calendar vocabulary', () => {
    // Scope the assertion to the STEPS array literal so a mention in
    // a top-of-file comment (which is allowed; it documents the pivot
    // history) does not trip the guard. The substantive risk is the
    // user-visible body / title strings inside STEPS.
    const stepsMatch = howItWorksSrc.match(/const STEPS:[\s\S]+?];/);
    expect(stepsMatch).not.toBeNull();
    const stepsBlock = stepsMatch![0];
    expect(stepsBlock).not.toMatch(/Gmail/);
    expect(stepsBlock).not.toMatch(/Calendar/);
    expect(stepsBlock).not.toMatch(/OAuth/);
    expect(stepsBlock).not.toMatch(/signed receipt/i);
});

test('LocalFirst frames the problem as the motivation cliff', () => {
    expect(localFirstSrc).toContain('The motivation cliff is real');
    expect(localFirstSrc).toContain('Most goals die in week two');
});

test('LocalFirst frames the solution as an AI co-pilot', () => {
    expect(localFirstSrc).toContain('An AI co-pilot that adapts to you');
    expect(localFirstSrc).toContain('Built for the ambitious');
});

test('LocalFirst eyebrow + heading reflect the problem-and-fix structure', () => {
    expect(localFirstSrc).toMatch(/eyebrow="The problem and the fix"/);
    // Old eyebrow + heading from the trust-stack version must be gone.
    expect(localFirstSrc).not.toMatch(/eyebrow="Local-first"/);
    expect(localFirstSrc).not.toMatch(/Your data, your keys, your audit log/);
});

test('LocalFirst no longer carries the retired Built On infra strip', () => {
    // The trust-stack section used to render a "Built on" row with
    // Solana, Vercel, Filecoin, 0G, Arkiv, ElevenLabs etc. Those
    // belong on /security or a dedicated infra surface, not on the
    // pivot Problem/Solution slot. Lock the row out of this file.
    expect(localFirstSrc).not.toMatch(/Built on/);
    expect(localFirstSrc).not.toMatch(/ElevenLabs/);
    expect(localFirstSrc).not.toMatch(/Lighthouse|LIGHTHOUSE_API_KEY/);
});

test('LocalFirst names the three problem realities and three solution mechanisms', () => {
    // Six concrete behavior cards is the deck v7 shape; if a future
    // edit collapses them to fewer cards, the editorial structure
    // changes and the spec should fire so we re-review intent.
    expect(localFirstSrc).toContain('Motivation fades fast');
    expect(localFirstSrc).toContain('Goals stay too big');
    expect(localFirstSrc).toContain('Generic apps do not adapt');
    expect(localFirstSrc).toContain('AI that learns your patterns');
    expect(localFirstSrc).toContain('Stakes you actually feel');
    expect(localFirstSrc).toContain('A community that pulls you back');
});
