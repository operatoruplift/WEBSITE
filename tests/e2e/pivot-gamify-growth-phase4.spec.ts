import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock Phase 4 of the Gamify Your Growth pivot: retire the
 * AI-assistant model marquee from the Hero and rewrite the Hero
 * chat mockup scenarios to match the questline + check-in loop.
 *
 * Source of truth: docs/PIVOT_GAMIFY_GROWTH.md Phase 4.
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const heroSrc = fs.readFileSync(path.join(repoRoot, 'src', 'sections', 'Hero.tsx'), 'utf-8');
const heroMessagesSrc = fs.readFileSync(
    path.join(repoRoot, 'src', 'components', 'HeroMessages.tsx'),
    'utf-8',
);

test('Hero no longer renders the AI-model marquee', () => {
    // The retired marquee (src/components/TrustedBy.tsx) sold "Built
    // on the model you already pay for" with logos for Claude / GPT /
    // Gemini / Grok / DeepSeek. That credibility signal was tied to
    // the AI-assistant pitch and does not apply to a personal
    // development product.
    expect(heroSrc).not.toMatch(/import\s+TrustedBy\s+from/);
    expect(heroSrc).not.toMatch(/<TrustedBy\s*\/>/);
});

test('Hero chat mockup uses the pivot questline scenarios', () => {
    // First scenario opens with the goal-setting interaction; if the
    // title or first line drift back to "Morning" + calendar text,
    // the Hero mockup has reverted to the AI-assistant pitch.
    expect(heroMessagesSrc).toContain("title: 'Set a goal'");
    expect(heroMessagesSrc).toContain('I want to run a half marathon in 12 weeks.');
});

test('Hero chat mockup includes a daily check-in scenario with a streak', () => {
    expect(heroMessagesSrc).toContain("title: 'Daily check-in'");
    expect(heroMessagesSrc).toMatch(/Day 14 streak/);
});

test('Hero chat mockup carries the low-day / squad accountability beat', () => {
    expect(heroMessagesSrc).toContain("title: 'Low day'");
    expect(heroMessagesSrc).toContain('Two of your squad already hit theirs');
});

test('Hero chat mockup drops the retired AI-assistant scenarios', () => {
    // Scope the scan to the SCENARIOS array literal so docstrings or
    // comments mentioning the retired vocabulary (which is fine — they
    // document the pivot history) do not trip the guard.
    const scenarioMatch = heroMessagesSrc.match(/const SCENARIOS:[\s\S]+?];/);
    expect(scenarioMatch).not.toBeNull();
    const scenarios = scenarioMatch![0];
    expect(scenarios).not.toMatch(/Morning/);
    expect(scenarios).not.toMatch(/Inbox/);
    expect(scenarios).not.toMatch(/calendar today\?/);
    expect(scenarios).not.toMatch(/Sunday dinner/);
    expect(scenarios).not.toMatch(/Reply to mom/);
});
