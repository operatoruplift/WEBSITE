import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the Gamify Your Growth pivot landing copy.
 *
 * 2026-05-21 pivot from "AI assistant for Gmail and Calendar" to
 * "AI-powered personal development for Gen Z and Millennials." The
 * canonical source of truth for this pivot is docs/PIVOT_GAMIFY_GROWTH.md.
 *
 * This spec locks the three high-traffic surfaces a new visitor sees:
 *   - The hero copy (headline + subhead + vision tag)
 *   - The bottom-of-page FinalCta
 *   - The HTML title + OpenGraph + Twitter card
 *
 * If a future copy edit reverts to the AI-assistant framing
 * ("AI that runs on your terms", "drafts your email", "Sign in and
 * connect Gmail"), this spec fires before the regression lands.
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

test('Hero headline is "Keep your word. Bet on yourself."', () => {
    expect(dataServiceSrc).toMatch(/headline:\s*"Keep your word\. Bet on yourself\."/);
});

test('Hero subhead names the commitment-infrastructure protocol', () => {
    // v10 reframe: was "AI-powered personal development for Gen Z and
    // Millennials." Now leads with the post-willpower thesis and the
    // four-step protocol primitives.
    expect(dataServiceSrc).toMatch(/The honor system is dead/);
    expect(dataServiceSrc).toMatch(/AI Game Master/);
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

test('FinalCta headline reads "Declare. Stake. Honor. Watch."', () => {
    expect(finalCtaSrc).toContain('Declare. Stake. Honor. Watch.');
    expect(finalCtaSrc).not.toContain('AI that runs on your terms.');
    expect(finalCtaSrc).not.toContain('Where ambition finally wins.');
});

test('FinalCta primary CTA points at /waitlist', () => {
    expect(finalCtaSrc).toMatch(/href="\/waitlist"/);
    expect(finalCtaSrc).toContain('Join the waitlist');
    expect(finalCtaSrc).not.toContain('Start free');
});

test('Root metadata leads with "commitment infrastructure"', () => {
    // v10 reframe: was "gamify your growth with AI". Now the
    // canonical short-form one-liner is "commitment infrastructure".
    expect(layoutSrc).toMatch(/Operator Uplift, commitment infrastructure/);
    expect(layoutSrc).toContain('Keep your word');
    expect(layoutSrc).not.toMatch(/gamify your growth/);
});

test('Root metadata description drops the retired Gmail/Calendar framing', () => {
    // Catches a partial revert where the title flips back but the
    // description stays on the old copy.
    expect(layoutSrc).not.toMatch(/An AI assistant that drafts your email/);
    expect(layoutSrc).not.toMatch(/AI that drafts your email and schedules your meetings/);
});

test('docs/PIVOT_GAMIFY_GROWTH.md exists and names the canonical tagline', () => {
    expect(fs.existsSync(pivotDocPath)).toBe(true);
    const doc = fs.readFileSync(pivotDocPath, 'utf-8');
    expect(doc).toContain('Keep your word. Bet on yourself.');
    expect(doc).toContain('Gamify Your Growth with AI');
});

test('pivot doc carries the numbers-honesty rule', () => {
    // The deck cites 78% completion, 7,500 waitlist, 50 enterprise.
    // Per the founder these are aspirational and MUST NOT ship on the
    // live site. Lock the rule so a future contributor cannot quietly
    // copy the deck numbers onto a marketing surface.
    const doc = fs.readFileSync(pivotDocPath, 'utf-8');
    expect(doc).toMatch(/aspirational|MUST NOT publish/i);
});
