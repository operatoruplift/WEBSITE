import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the honest empty state for Logos hackathon tracks.
 *
 * docs/LOGOS_TRACKS_SCOPING.md captures the truth: 0 of 7 Logos LP
 * prizes have any code or doc artifact in this repo. The Arkiv
 * Network School track is the only hackathon entry we have shipped.
 *
 * The marketing-honesty net needs to prevent two failure modes:
 *
 *  1. A future session quietly adding "Logos track entrant" or
 *     "LP-0002 submission" copy to a marketing surface without
 *     also landing the underlying code. The user-facing deck would
 *     then claim 8 hackathon entries while the codebase has 1.
 *  2. The scoping doc itself disappearing while the marketing
 *     surfaces still don't mention Logos. The truth would no longer
 *     be written down anywhere.
 *
 * This spec checks both directions.
 *
 * Once Logos work actually ships (per the recommended path in
 * docs/LOGOS_TRACKS_SCOPING.md), update this spec to assert the
 * real surface coherence instead of the empty-state contract.
 */

const repoRoot = path.resolve(__dirname, '..', '..');

const MARKETING_SURFACES = [
    'app/demo/hackathon/page.tsx',
    'docs/deck-objections.md',
    'docs/distribution-kit.md',
    'README.md',
];

const SCOPING_DOC = 'docs/LOGOS_TRACKS_SCOPING.md';

// 2026-06-05: LP-0017 dropped from the track list. Its per-track
// design doc (docs/LOGOS/LP-0017.md) was retired with the post-pivot
// maybe-prune (#799) because it pitched the wedge as "consumer AI
// assistant" in present tense. The remaining six tracks still lock
// the honest "nothing shipped" empty state.
const LOGOS_TERMS = [
    'LP-0002',
    'LP-0005',
    'LP-0008',
    'LP-0012',
    'LP-0013',
    'LP-0016',
];

test('Logos scoping doc exists at docs/LOGOS_TRACKS_SCOPING.md', () => {
    const exists = fs.existsSync(path.join(repoRoot, SCOPING_DOC));
    expect(exists).toBe(true);
});

test('Logos scoping doc names the honest "0 of 7" state', () => {
    const src = fs.readFileSync(path.join(repoRoot, SCOPING_DOC), 'utf-8');
    // Catches a future edit that quietly claims Logos tracks shipped
    // by changing this count. After 2026-05-21 the doc shifted from
    // "prize text not in repo" to "design doc per track + still 0
    // shipping" — either honest framing is acceptable.
    expect(src).toMatch(/0 of 7|nothing built|none of them|no shipping code|none of the tracks has shipping/i);
});

test('Each LP-XXXX track has a per-track design doc', () => {
    const tracks = ['LP-0002', 'LP-0005', 'LP-0008', 'LP-0012', 'LP-0013', 'LP-0016'];
    for (const t of tracks) {
        const p = path.join(repoRoot, 'docs', 'LOGOS', `${t}.md`);
        expect(fs.existsSync(p), `${p} should exist`).toBe(true);
    }
});

test('Each LP-XXXX design doc declares Status: Not entered', () => {
    // The per-track docs must state explicitly that the track has
    // not shipped. If a future edit silently flips one to "Status:
    // Entered" without code shipping, this catches it. To allow a
    // real ship, replace this assertion AFTER the corresponding
    // sibling LEZ project lands.
    const tracks = ['LP-0002', 'LP-0005', 'LP-0008', 'LP-0012', 'LP-0013', 'LP-0016'];
    for (const t of tracks) {
        const src = fs.readFileSync(path.join(repoRoot, 'docs', 'LOGOS', `${t}.md`), 'utf-8');
        expect(src, `${t} must declare Status: Not entered`).toMatch(/Status\*?\*?:\s*Not entered/i);
    }
});

test('marketing surfaces do not mention LP-XXXX codes (yet)', () => {
    // Each LP-XXXX code only belongs on a marketing surface once the
    // corresponding prize text has been pasted into the scoping doc
    // and engineering has shipped at least one PR for that track.
    // Until then, marketing surfaces must stay silent on Logos.
    for (const surface of MARKETING_SURFACES) {
        const src = fs.readFileSync(path.join(repoRoot, surface), 'utf-8');
        for (const code of LOGOS_TERMS) {
            expect(src, `${surface} unexpectedly mentions ${code}`).not.toContain(code);
        }
    }
});

test('marketing surfaces do not claim Logos track entries (yet)', () => {
    // Catches phrasings like "Logos track entrant" or "Logos Press
    // submission" appearing on marketing surfaces before code lands.
    const claims = [
        /Logos\s+track\s+entrant/i,
        /Logos\s+Press\s+submission/i,
        /Logos\s+challenge\s+entrant/i,
    ];
    for (const surface of MARKETING_SURFACES) {
        const src = fs.readFileSync(path.join(repoRoot, surface), 'utf-8');
        for (const claim of claims) {
            expect(src, `${surface} matches Logos claim ${claim}`).not.toMatch(claim);
        }
    }
});
