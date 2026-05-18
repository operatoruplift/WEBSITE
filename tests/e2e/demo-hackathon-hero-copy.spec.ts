import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the /demo/hackathon hero copy.
 *
 * The /demo/hackathon page is the judge's first stop after clicking
 * the hackathon submission link. demo-hackathon-judge-links.spec.ts
 * already locks the VerifyCard hrefs (so a judge clicks "View
 * receipt" and lands on the right route). This spec locks the
 * hero copy — the framing a judge reads BEFORE clicking anything.
 *
 * If the eyebrow drifts from "x402 + 0G + Filecoin" to something
 * generic, or the h1 trades the specific "Verifiable AI for Gmail
 * and Calendar" framing for a stock pitch, the judge's first
 * impression on the hackathon page collapses silently.
 *
 * Companion to:
 *   - demo-hackathon-judge-links.spec.ts (VerifyCard href lock)
 *   - truth-table-honest.spec.ts (Real/Simulated claims doc lock)
 *   - hackathon-gate2-honest.spec.ts (verifier-cookbook coherence)
 *   - positioning-tagline-coherence.spec.ts (canonical one-liner)
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const page = fs.readFileSync(path.join(repoRoot, 'app', 'demo', 'hackathon', 'page.tsx'), 'utf-8');

test('/demo/hackathon eyebrow names the three trust-stack primitives', () => {
    // The eyebrow is the judge's first cue. It must name all three
    // primitives in canonical order: x402 (payment), 0G (storage +
    // identity), Filecoin (mirror). A future trim that drops 0G or
    // re-orders would tell a different story than the page body.
    expect(page).toContain('Trust-stack demo · x402 + 0G + Filecoin');
});

test('/demo/hackathon h1 names Gmail + Calendar + verifiable', () => {
    // The h1 promises the specific user-visible surface area
    // (Gmail + Calendar) and the trust posture (Verifiable). A
    // generic "Hackathon demo" h1 loses the specificity that
    // motivates judges to keep reading.
    expect(page).toMatch(/Verifiable AI for Gmail and Calendar/);
});

test('/demo/hackathon body claims dual-mirror over Filecoin + 0G testnet', () => {
    // The body paragraph below the h1 is the elevator pitch. It
    // must claim three things a judge can independently verify:
    // (1) ed25519-signed receipts, (2) mirrored to TWO public
    // storage networks (Filecoin + 0G testnet), (3) Solana Merkle
    // root publication. Dropping any of the three weakens the
    // verification narrative.
    expect(page).toMatch(/ed25519-signed receipt/);
    expect(page).toContain('two');
    expect(page).toContain('Filecoin and 0G testnet');
    expect(page).toMatch(/Merkle root on Solana/i);
});

test('/demo/hackathon visible JSX never reverts to the old Loops House framing', () => {
    // PR #594 swapped the old "Loops House Challenge 02" eyebrow for
    // the current trust-stack framing. If a future edit reverts to
    // Loops House inside any JSX node (eyebrow, h1, body, or pill),
    // the page reads as if the project is still pitching the earlier
    // (now-completed) hackathon, not the 0G APAC submission this
    // page actually anchors. The header docstring is allowed to keep
    // the historical note; the spec only fires on Loops House
    // appearing inside a JSX tag (i.e. user-visible text).
    const insideJsx = page.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(insideJsx).not.toMatch(/Loops House Challenge/);
});

test('/demo/hackathon sequence diagram section header is locked', () => {
    // The "Request sequence" diagram is the visual proof of the
    // x402 retry-with-proof flow. Its section header (and the
    // matching aria-label on the SVG) are the cues a judge uses
    // to ground "what am I looking at?".
    expect(page).toContain('Request sequence');
    expect(page).toMatch(/client → server 402 → pay → retry with proof → signed receipt/);
});
