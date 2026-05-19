import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock doc/code coherence for docs/TRUTH_TABLE.md.
 *
 * The truth table is the authoritative "what is Real, Simulated, or
 * Stub" reference that judges use during Demo Day and that the README
 * sends readers to. Three rows make load-bearing "Real" claims about
 * the hackathon trust-stack primitives:
 *
 *   - Filecoin mirror (lib/filecoin/anchor.ts + /api/cron/filecoin-anchor)
 *   - 0G Storage mirror (lib/og/storage.ts + /api/cron/og-anchor +
 *     /api/og/storage/[rootHash])
 *   - ElevenLabs voiceover (lib/elevenlabs/synth.ts + /api/voice/synth)
 *
 * If a future refactor removes any of these paths without updating
 * the table, the doc silently overclaims and a judge reading the
 * table is misled. If the table row gets reworded ("Simulated" instead
 * of "Real") without a corresponding code change, the opposite is
 * true: we'd be UNDER-claiming what actually ships.
 *
 * This spec is the regression net that catches either direction.
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const truthTable = fs.readFileSync(path.join(repoRoot, 'docs', 'TRUTH_TABLE.md'), 'utf-8');

interface RealClaim {
    /** Row description used to locate the line. Substring match. */
    rowSubstring: string;
    /** Files/dirs the row's "Real" claim depends on. All must exist. */
    requiredPaths: string[];
}

const REAL_CLAIMS: RealClaim[] = [
    {
        rowSubstring: 'Filecoin mirror of every receipt',
        requiredPaths: [
            'lib/filecoin/anchor.ts',
            'app/api/cron/filecoin-anchor/route.ts',
        ],
    },
    {
        rowSubstring: '0G Storage mirror of every receipt',
        requiredPaths: [
            'lib/og/storage.ts',
            'app/api/cron/og-anchor/route.ts',
            'app/api/og/storage/[rootHash]/route.ts',
        ],
    },
    {
        rowSubstring: 'ElevenLabs voiceover',
        requiredPaths: [
            'lib/elevenlabs/synth.ts',
            'app/api/voice/synth/route.ts',
        ],
    },
    {
        rowSubstring: 'Arkiv on-chain agent identity',
        requiredPaths: [
            'lib/arkiv/constants.ts',
            'lib/arkiv/client.ts',
            'lib/arkiv/agent.ts',
            'lib/arkiv/memory.ts',
            'app/api/arkiv/agents/route.ts',
            'app/api/arkiv/memories/route.ts',
            'app/arkiv/page.tsx',
            'scripts/arkiv/publish-agents.mjs',
        ],
    },
];

for (const claim of REAL_CLAIMS) {
    test(`TRUTH_TABLE row "${claim.rowSubstring}" is still labelled Real`, () => {
        // Find the line containing the row substring.
        const lines = truthTable.split('\n');
        const row = lines.find(l => l.includes(claim.rowSubstring));
        expect(row, `Row containing "${claim.rowSubstring}" must exist in TRUTH_TABLE.md`).toBeDefined();
        // Truth-table rows are markdown table cells separated by `|`.
        // The second cell is the State column. Match "Real" as a
        // whole word — "Real" must appear, "Simulated" or "Stub" must not.
        expect(row, `Row "${claim.rowSubstring}" must claim Real`).toMatch(/\|\s*Real\s*\|/);
    });

    for (const p of claim.requiredPaths) {
        test(`TRUTH_TABLE Real claim "${claim.rowSubstring}" still has its code path: ${p}`, () => {
            const abs = path.join(repoRoot, p);
            expect(fs.existsSync(abs), `${p} must exist (referenced by Real claim "${claim.rowSubstring}")`).toBe(true);
        });
    }
}

test('TRUTH_TABLE introduces the Real/Simulated/Stub legend in the same order', () => {
    // The legend ordering controls reader interpretation — Real is the
    // strongest claim and appears first. If a future edit moves
    // "Simulated" above "Real", the table reads as if the default is
    // simulated state, which would be a documentation regression that
    // misleads judges. Lock the order.
    const realIdx = truthTable.indexOf('**Real**');
    const simIdx = truthTable.indexOf('**Simulated**');
    const stubIdx = truthTable.indexOf('**Stub**');
    expect(realIdx).toBeGreaterThan(-1);
    expect(simIdx).toBeGreaterThan(realIdx);
    expect(stubIdx).toBeGreaterThan(simIdx);
});
