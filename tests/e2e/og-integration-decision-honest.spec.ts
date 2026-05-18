import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock doc/code coherence for docs/0g-integration-decision.md.
 *
 * The doc records which 0G modules ship, which we skip, and why.
 * Its module-verdict table is what a 0G judge reads when asking
 * "what did you integrate and why those specific modules?" If the
 * verdicts drift from the code (e.g. Storage gets removed but the
 * doc still says Ship, or Compute gets re-evaluated but the doc
 * stays Skip), the judge gets a different story than the codebase.
 *
 * Companion to:
 *   - truth-table-honest.spec.ts (Real/Simulated claims)
 *   - hackathon-gate2-honest.spec.ts (verifier-cookbook paths)
 *   - positioning-tagline-coherence.spec.ts (canonical one-liner)
 *   - deck-pricing-honest.spec.ts (deck monetization)
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const doc = fs.readFileSync(path.join(repoRoot, 'docs', '0g-integration-decision.md'), 'utf-8');

interface Verdict {
    /** Module name as it appears in the table. */
    module: string;
    /** Expected verdict label. */
    verdict: string;
    /** Code paths the verdict references. All must exist (or none, for Skip/Watch). */
    requiredPaths: string[];
    /** Paths that must NOT exist (e.g. Skip modules should not be wired). */
    forbiddenPaths?: string[];
}

const VERDICTS: Verdict[] = [
    {
        module: 'Storage',
        verdict: 'Ship (testnet)',
        requiredPaths: [
            'lib/og/storage.ts',
            'app/api/cron/og-anchor/route.ts',
            'lib/og-storage-migration.sql',
        ],
    },
    {
        module: 'Agent ID',
        verdict: 'Ship (testnet)',
        requiredPaths: [
            'lib/og/agent-id.ts',
            'scripts/og-agent-id-mint.mjs',
            'data/og-agent-ids.json',
        ],
    },
    {
        module: 'Persistent Memory',
        verdict: 'Watch',
        requiredPaths: [
            // Watch verdict explicitly says "our lib/memoryEngine works for now."
            // If memoryEngine gets removed, the doc's "we have our own" reasoning
            // collapses and the verdict needs to flip to Ship or Skip.
            'lib/memoryEngine.ts',
        ],
    },
];

for (const claim of VERDICTS) {
    test(`0g-integration-decision row "${claim.module}" claims "${claim.verdict}"`, () => {
        // Find a table row containing the module name. The verdict
        // appears as a markdown table cell — match a row whose first
        // cell mentions the module and whose second cell mentions
        // the expected verdict.
        const rowPattern = new RegExp(
            `\\|\\s*\\*\\*${claim.module}\\*\\*\\s*\\|[^|]*?${claim.verdict.replace(/[()]/g, '\\$&')}`,
            'i',
        );
        expect(doc, `Row for "${claim.module}" must claim "${claim.verdict}"`).toMatch(rowPattern);
    });

    for (const p of claim.requiredPaths) {
        test(`0g-integration-decision "${claim.module}" still has its code path: ${p}`, () => {
            const abs = path.join(repoRoot, p);
            expect(fs.existsSync(abs), `${p} must exist (referenced by ${claim.module} verdict "${claim.verdict}")`).toBe(true);
        });
    }
}

test('0g-integration-decision still lists Compute Network as Skip', () => {
    // The Skip verdict is meaningful: it tells judges WHY we didn't
    // wire decentralized GPU. The reasoning ("breaks BYOK") is the
    // founder's positioning. If a future edit silently flips Compute
    // from Skip to Ship without wiring it, the doc overclaims.
    expect(doc).toMatch(/\|\s*\*\*Compute Network\*\*\s*\|\s*Skip/);
    // No 0G Compute integration should exist; if anyone adds one
    // without flipping the verdict in the doc, this assertion catches
    // the surface contradiction.
    expect(fs.existsSync(path.join(repoRoot, 'lib', 'og', 'compute.ts')), 'Compute is Skip; lib/og/compute.ts must not exist').toBe(false);
});

test('0g-integration-decision still lists TEE Privacy as Skip', () => {
    // Same logic as Compute. TEE Skip reasoning ("we do not run
    // inference") is the founder's positioning. Lock it.
    expect(doc).toMatch(/\|\s*\*\*TEE Privacy\*\*\s*\|\s*Skip/);
    expect(fs.existsSync(path.join(repoRoot, 'lib', 'og', 'tee.ts')), 'TEE is Skip; lib/og/tee.ts must not exist').toBe(false);
});

test('0g-integration-decision header announces the reversal date', () => {
    // The doc opens with "Status: Reversed on 2026-05-14 from
    // deferred to partial ship." If someone trims that line, the
    // history of the decision evaporates — judges who ask "wait,
    // didn't you say defer all earlier?" lose the audit trail of
    // the founder's explicit reversal.
    expect(doc).toMatch(/Reversed on 2026-05-14 from deferred to partial ship/);
});
