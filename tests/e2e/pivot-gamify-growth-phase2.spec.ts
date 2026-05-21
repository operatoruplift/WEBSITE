import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Phase 2 of the Gamify Your Growth pivot, updated for v10
 * (Commitment Infrastructure reframe).
 *
 * Source of truth: docs/PIVOT_GAMIFY_GROWTH.md (v10 reframe section).
 *
 * v10 protocol: DECLARE / STAKE / HONOR / WATCH. LocalFirst frames
 * the problem as "users starving for enforcement" and the solution
 * as "we don't sell motivation, we sell consequences."
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

test('HowItWorks step 01 names "Declare"', () => {
    expect(howItWorksSrc).toContain("title: 'Declare'");
});

test('HowItWorks step 02 names "Stake"', () => {
    expect(howItWorksSrc).toContain("title: 'Stake'");
});

test('HowItWorks step 03 names "Honor"', () => {
    expect(howItWorksSrc).toContain("title: 'Honor'");
});

test('HowItWorks step 04 names "Watch"', () => {
    expect(howItWorksSrc).toContain("title: 'Watch'");
});

test('HowItWorks section heading is "Declare. Stake. Honor. Watch."', () => {
    expect(howItWorksSrc).toContain('Declare. Stake. Honor. Watch.');
    expect(howItWorksSrc).not.toContain('Turn your ambition into a daily habit');
});

test('HowItWorks step bodies drop the retired Gmail/Calendar vocabulary', () => {
    const stepsMatch = howItWorksSrc.match(/const STEPS:[\s\S]+?];/);
    expect(stepsMatch).not.toBeNull();
    const stepsBlock = stepsMatch![0];
    expect(stepsBlock).not.toMatch(/Gmail/);
    expect(stepsBlock).not.toMatch(/Calendar/);
    expect(stepsBlock).not.toMatch(/OAuth/);
    expect(stepsBlock).not.toMatch(/signed receipt/i);
});

test('LocalFirst frames the problem as the honor system collapse', () => {
    expect(localFirstSrc).toContain('The honor system is dead');
    expect(localFirstSrc).toContain('starving for enforcement');
});

test('LocalFirst frames the solution as consequences, not motivation', () => {
    expect(localFirstSrc).toContain("We don't sell motivation. We sell consequences.");
});

test('LocalFirst eyebrow + heading reflect the post-willpower framing', () => {
    expect(localFirstSrc).toMatch(/eyebrow="\/\/ Post-willpower era"/);
    expect(localFirstSrc).not.toMatch(/eyebrow="Local-first"/);
    expect(localFirstSrc).not.toMatch(/eyebrow="The problem and the fix"/);
});

test('LocalFirst no longer carries the retired Built On infra strip', () => {
    expect(localFirstSrc).not.toMatch(/Built on/);
    expect(localFirstSrc).not.toMatch(/ElevenLabs/);
    expect(localFirstSrc).not.toMatch(/Lighthouse|LIGHTHOUSE_API_KEY/);
});

test('LocalFirst names the three problem realities and three solution mechanisms', () => {
    expect(localFirstSrc).toContain('Motivation is a leaky bucket');
    expect(localFirstSrc).toContain('Apps trust the honor system');
    expect(localFirstSrc).toContain('No skin, no game');
    expect(localFirstSrc).toContain('Financial loss aversion');
    expect(localFirstSrc).toContain('AI Game Master adjudicates');
    expect(localFirstSrc).toContain('Verifiable, on-chain settlement');
});
