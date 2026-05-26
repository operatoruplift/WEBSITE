#!/usr/bin/env node
/**
 * centering-guard — locks the homepage centering contract.
 *
 * Founder feedback escalated over 7 PRs (#717-#723) about the
 * homepage and marketing pages reading as left-flush instead of
 * centered. The fix shape was three layers:
 *
 *   1. Remove SlideHeader/SlideFooter/CallOut deck-style chrome
 *      from every src/sections/* file (the left-flush brand-mark
 *      + right-flush page-number bars were the real visual
 *      "left-alignment" the founder kept seeing).
 *   2. Use SectionHeader with align="center" only on every
 *      marketing surface (homepage sections, /pricing, /team).
 *   3. Cap heading font-size clamps at 64px h2 / 104px h1 so
 *      headlines don't read as deck-scale at 1440px+.
 *
 * This guard is a grep-style assertion that none of those
 * regressions sneaks back in. Each rule is small and anchored to
 * the exact pattern we agreed to keep out.
 *
 * Adding new rules:
 *   - Keep patterns specific (literal strings or anchored regex).
 *   - Tag the PR where the original cleanup landed so a reviewer
 *     can see prior context.
 *   - This file is run via `pnpm check` (scripts/check.mjs adds it
 *     after the existing copy/capability/trust/fabrication checks).
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SECTION_DIRS = ['src/sections'];
const MARKETING_FILES = [
    'app/page.tsx',
    'app/pricing/page.tsx',
    'app/team/page.tsx',
    'app/press-kit/page.tsx',
];
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const SKIP_FILE_PATTERNS = [/\.test\./, /\.spec\./, /\.stories\./];

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full, out);
        } else if (EXTS.has(path.extname(entry.name))) {
            if (SKIP_FILE_PATTERNS.some(rx => rx.test(entry.name))) continue;
            out.push(full);
        }
    }
    return out;
}

const violations = [];

// Rule 1: No SlideHeader / SlideFooter / CallOut in src/sections/*.
// These chrome elements use justify-between which pushes brand mark
// LEFT and page number RIGHT, reading as left-aligned even when the
// section's actual content is centered. Removed across the board in
// PR #721.
const sectionFiles = SECTION_DIRS.flatMap(d => walk(path.join(ROOT, d)));
for (const file of sectionFiles) {
    const rel = path.relative(ROOT, file);
    const text = fs.readFileSync(file, 'utf8');
    for (const symbol of ['SlideHeader', 'SlideFooter', 'CallOut']) {
        // Skip pure imports of the SlideChrome module itself.
        if (rel.endsWith('SlideChrome.tsx')) continue;
        // Allow comments to mention the names (history references).
        const re = new RegExp(`<${symbol}[\\s>]|${symbol}\\s*\\(|import[^;]*\\b${symbol}\\b`, 'g');
        const matches = [...text.matchAll(re)];
        for (const m of matches) {
            // Get line number of the match.
            const before = text.slice(0, m.index);
            const line = before.split('\n').length;
            violations.push({
                file: rel,
                line,
                pattern: symbol,
                retiredIn: 'PR#721',
                message: `${symbol} was removed from every src/sections/* file in PR #721 because its justify-between layout pushed brand-mark/page-number to opposite edges and read as "left-aligned" to the founder. Use a centered eyebrow + h2 + body block instead, or extend SectionHeader.`,
            });
        }
    }
}

// Rule 2: SectionHeader must use align="center" on marketing pages.
// The "left" variant exists for editorial layouts but every
// marketing surface (/, /pricing, /team, /press-kit) ships
// align="center" after PRs #717/#718/#722.
for (const rel of MARKETING_FILES) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, 'utf8');
    const re = /align=["']left["']/g;
    const matches = [...text.matchAll(re)];
    for (const m of matches) {
        const before = text.slice(0, m.index);
        const line = before.split('\n').length;
        violations.push({
            file: rel,
            line,
            pattern: 'align="left"',
            retiredIn: 'PR#717-722',
            message: `${rel} is a marketing surface. SectionHeader align="left" was retired across these pages in PRs #717/#718/#722 because the founder kept flagging "everything left-aligned". Use align="center" or omit the prop (center is the default).`,
        });
    }
}

// Rule 3: FadeIn wrappers in src/sections/* must pass the `block`
// prop. The FadeIn component defaults to display:inline-block,
// which collapses to its child's natural width. A child div with
// text-center inside still centers its text, but the inline-block
// box itself sits left-anchored against the parent column. This
// caused 8+ rounds of "section hugs left of page" feedback before
// PR #738 fixed every section-wrapper FadeIn. See the inline-block
// trap memory note + tests/e2e/homepage-section-centering.spec.ts.
// Hero is exempt: its section wrapper is `flex flex-col items-center`
// which centers all children along the cross-axis (horizontally) by
// flex layout, not by text-align. inline-block FadeIns inside that
// flex parent still appear centered, and the badge pill + mono
// eyebrow rely on inline-block to size their borders to content.
const FADEIN_BLOCK_EXEMPT = new Set(['src/sections/Hero.tsx']);

for (const file of sectionFiles) {
    const rel = path.relative(ROOT, file);
    if (FADEIN_BLOCK_EXEMPT.has(rel)) continue;
    const text = fs.readFileSync(file, 'utf8');
    // Match `<FadeIn` followed by attribute list, capture the
    // attribute list to check for the `block` token. The closing
    // `>` ends the start tag.
    const re = /<FadeIn\b([^>]*)>/g;
    let m;
    while ((m = re.exec(text)) !== null) {
        const attrs = m[1];
        if (/\bblock\b/.test(attrs)) continue;
        const before = text.slice(0, m.index);
        const line = before.split('\n').length;
        violations.push({
            file: rel,
            line,
            pattern: '<FadeIn> without block',
            retiredIn: 'PR#738',
            message: `<FadeIn> in src/sections/* defaults to display:inline-block, which collapses to the child's natural width and centers content inside a left-anchored box. Pass the \`block\` prop on every section-wrapper FadeIn so it fills the parent column. If this specific FadeIn is wrapping a single inline element (text span, badge pill with its own border) that should size to content, move it out of src/sections/ or add an inline-block exception here.`,
        });
    }
}

if (violations.length === 0) {
    console.log('[centering-guard] OK (no violations)');
    process.exit(0);
}

console.error('[centering-guard] FAIL — ' + violations.length + ' violation(s):');
for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.pattern}  (retired in ${v.retiredIn})`);
    console.error(`     ${v.message}`);
}
process.exit(1);
