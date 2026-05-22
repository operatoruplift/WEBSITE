import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the commitment-infrastructure v2-canvas landing copy.
 *
 * History: this spec started as `pivot-gamify-growth-hero.spec.ts`
 * for the 2026-05-21 LevelUp pivot ("AI-powered personal development
 * for Gen Z and Millennials"). The 2026-05-22 brand re-frame swapped
 * that audience pitch for **commitment infrastructure**, and the
 * 2026-05-22 v2-canvas pass tightened the homepage copy further to
 * match the founder's design board:
 *
 *   - Hero subhead "Operator Uplift is a commitment layer for your
 *     life. Declare what you'll do. Set the stakes. Get daily
 *     follow-up. See progress you can't fake."
 *   - FinalCta headline "You said you'd do the thing. Do the thing."
 *     closing with an inline email form + "Get in line" submit
 *     instead of a single Join-the-waitlist pill.
 *
 * The filename stays for git-history continuity but the assertions
 * lock the v2-canvas copy. A future PR can rename the file to
 * `v2-canvas-hero.spec.ts` with a `git mv` + this comment block as
 * the migration receipt.
 *
 * File-scope only (no webserver). Pure regex/source-string matching.
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const dataServiceSrc = fs.readFileSync(
    path.join(repoRoot, 'src', 'services', 'dataService.ts'),
    'utf-8',
);
const heroSrc = fs.readFileSync(path.join(repoRoot, 'src', 'sections', 'Hero.tsx'), 'utf-8');
const finalCtaSrc = fs.readFileSync(
    path.join(repoRoot, 'src', 'sections', 'FinalCta.tsx'),
    'utf-8',
);
const layoutSrc = fs.readFileSync(path.join(repoRoot, 'app', 'layout.tsx'), 'utf-8');
const pivotDocPath = path.join(repoRoot, 'docs', 'PIVOT_GAMIFY_GROWTH.md');
const brandDocPath = path.join(repoRoot, 'docs', 'BRAND_COMMITMENT_INFRASTRUCTURE.md');

test('Hero headline is "Keep your word. Bet on yourself."', () => {
    expect(dataServiceSrc).toMatch(/headline:\s*"Keep your word\. Bet on yourself\."/);
});

test('Hero subhead leads with the v2 commitment-layer one-liner', () => {
    // 2026-05-22 v2-canvas pass: the verbose pooled-stakes mechanic
    // ("Stake money on your commitments. Upload proof. AI verifies
    // follow-through. If you fail, your stake is redistributed...")
    // was replaced with the tighter v2 line. Lock the canonical
    // phrases so a future revert is caught.
    expect(dataServiceSrc).toMatch(/commitment layer for your life/);
    expect(dataServiceSrc).toMatch(/Declare what you'll do/);
    expect(dataServiceSrc).toMatch(/Set the stakes/);
    expect(dataServiceSrc).not.toMatch(/redistributed to operators who kept theirs/);
});

test('Hero vision tag is // COMMITMENT INFRASTRUCTURE', () => {
    expect(dataServiceSrc).toMatch(/visionTag:\s*"\/\/ COMMITMENT INFRASTRUCTURE"/);
});

test('Hero primary CTA points at /waitlist (not /login or /paywall)', () => {
    expect(heroSrc).toMatch(/href="\/waitlist"/);
    expect(heroSrc).toContain('Join the waitlist');
});

test('Hero no longer ships the retired AI-assistant CTAs', () => {
    // These are the explicit Gmail / Watch-demo CTAs from the pre-pivot
    // hero. If any future edit revives them, the marketing surface has
    // regressed to the old AI-assistant framing.
    expect(heroSrc).not.toContain('Sign in and connect Gmail');
    expect(heroSrc).not.toContain('Watch 90s demo');
});

test('FinalCta closes with the v2 "Do the thing." headline', () => {
    // 2026-05-22 v2-canvas: was "Declare. Stake. Honor. Watch." The
    // four-verb acronym leaned protocol-y. The new closer is a direct
    // conversational ask that matches the v2 design board.
    expect(finalCtaSrc).toContain('You said you');
    expect(finalCtaSrc).toContain('do the thing');
    expect(finalCtaSrc).toContain('Do the thing.');
    expect(finalCtaSrc).not.toContain('Declare. Stake. Honor. Watch.');
    expect(finalCtaSrc).not.toContain('AI that runs on your terms.');
    expect(finalCtaSrc).not.toContain('Where ambition finally wins.');
});

test('FinalCta surfaces the inline email form + "Get in line" submit', () => {
    // The closer is now an inline form, not a single pill. Lock the
    // submit label + the noscript fallback link to /waitlist so the
    // closer remains reachable with JS disabled.
    expect(finalCtaSrc).toContain('Get in line');
    expect(finalCtaSrc).toMatch(/href="\/waitlist"/);
    expect(finalCtaSrc).not.toContain('Start free');
});

test('Root metadata leads with "commitment infrastructure"', () => {
    expect(layoutSrc).toMatch(/Operator Uplift, commitment infrastructure/);
    expect(layoutSrc).toContain('Keep your word');
    expect(layoutSrc).not.toMatch(/gamify your growth/);
});

test('Root metadata description drops the retired Gmail/Calendar framing', () => {
    expect(layoutSrc).not.toMatch(/An AI assistant that drafts your email/);
    expect(layoutSrc).not.toMatch(/AI that drafts your email and schedules your meetings/);
});

test('docs/PIVOT_GAMIFY_GROWTH.md is preserved as a SUPERSEDED historical artifact', () => {
    // The pivot doc itself was marked SUPERSEDED 2026-05-22 (PR #687)
    // when the brand re-framed to commitment infrastructure. The doc
    // stays in the tree as a historical artifact; this spec locks the
    // SUPERSEDED banner + the forward pointer to the new canonical
    // brand doc so a revert that quietly drops the banner is caught.
    expect(fs.existsSync(pivotDocPath)).toBe(true);
    const doc = fs.readFileSync(pivotDocPath, 'utf-8');
    expect(doc).toMatch(/SUPERSEDED 2026-05-22/);
    expect(doc).toContain('BRAND_COMMITMENT_INFRASTRUCTURE.md');
});

test('docs/BRAND_COMMITMENT_INFRASTRUCTURE.md exists and names the canonical tagline', () => {
    expect(fs.existsSync(brandDocPath)).toBe(true);
    const doc = fs.readFileSync(brandDocPath, 'utf-8');
    expect(doc).toContain('Keep your word. Bet on yourself.');
    expect(doc).toContain('Commitment infrastructure');
});
