import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the deployed 0G AgenticID contract address across every surface
 * that references it.
 *
 * `lib/og/agent-id.ts::DEFAULT_CONTRACT` is the code source of truth.
 * If a future deploy points at a different contract (e.g. our own
 * deployment instead of the 0G Foundation reference), every doc and
 * page that hard-codes the address goes stale silently.
 *
 * This spec extracts the source-of-truth address from the lib and
 * asserts every other surface still references the same one. If a
 * surface drifts, the spec fires with a list of files needing update.
 *
 * Companion to existing specs that already assert specific addresses:
 *   - og-agent-id.spec.ts (lib-level helper tests)
 *   - og-agent-id-route.spec.ts (/api/og/agent-id route envelope)
 *   - hackathon-gate2-honest.spec.ts (HACKATHON_GATE2.md doc lock)
 *   - demo-hackathon-judge-links.spec.ts (VerifyCard href shape)
 *
 * Those each lock against a hardcoded string. This spec locks the
 * RELATIONSHIP — that every surface uses the SAME hardcoded string,
 * which is the value of the code constant.
 */

const repoRoot = path.resolve(__dirname, '..', '..');

const agentIdLib = fs.readFileSync(path.join(repoRoot, 'lib', 'og', 'agent-id.ts'), 'utf-8');

const SOURCE_OF_TRUTH_MATCH = agentIdLib.match(/const DEFAULT_CONTRACT = '(0x[a-fA-F0-9]{40})'/);

test('lib/og/agent-id.ts defines DEFAULT_CONTRACT as a 0x-prefixed 40-hex address', () => {
    // Sanity guard: the source-of-truth itself must look like a
    // contract address. If a refactor moves the constant or renames
    // it, every downstream assertion breaks; fail loudly here.
    expect(SOURCE_OF_TRUTH_MATCH, 'lib/og/agent-id.ts must define const DEFAULT_CONTRACT = "0x..."').not.toBeNull();
});

const SOURCE_OF_TRUTH = SOURCE_OF_TRUTH_MATCH ? SOURCE_OF_TRUTH_MATCH[1] : '';

interface ContractReference {
    /** File path relative to repo root. */
    file: string;
    /** Human-readable label for the assertion message. */
    label: string;
}

// 2026-06-05: dropped HACKATHON_GATE2.md + LOOPS_HOUSE_SUBMISSION.md
// from the cohort. Both docs were retired with the post-pivot maybe
// prune. The remaining references continue to lock the contract
// address against drift across the surfaces that judges + operators
// still hit.
const REFERENCES: ContractReference[] = [
    { file: 'README.md', label: 'README hackathon submission section' },
    { file: 'app/demo/hackathon/page.tsx', label: 'demo hackathon page chainscan link' },
    { file: 'docs/prod-env-checklist.md', label: 'prod-env-checklist mint instructions' },
    { file: 'docs/pitch-video-script.md', label: 'pitch-video script chainscan cut' },
];

for (const ref of REFERENCES) {
    test(`${ref.label} references the same contract address as lib/og/agent-id.ts`, () => {
        const content = fs.readFileSync(path.join(repoRoot, ref.file), 'utf-8');
        expect(content, `${ref.file} must reference DEFAULT_CONTRACT (${SOURCE_OF_TRUTH})`).toContain(SOURCE_OF_TRUTH);
    });
}

test('no surface references a different 0G AgenticID contract address', () => {
    // Defensive: if a typo introduces a different 0x address in any
    // of the surfaces (e.g. a copy-paste truncation), the file might
    // still contain the right address elsewhere AND a wrong one. Scan
    // every surface for any 0x address that ISN'T the source of truth
    // and fail if we find one that looks like a contract.
    const wrongAddresses: string[] = [];
    for (const ref of REFERENCES) {
        const content = fs.readFileSync(path.join(repoRoot, ref.file), 'utf-8');
        const matches = content.matchAll(/0x[a-fA-F0-9]{40}\b/g);
        for (const m of matches) {
            const addr = m[0].toLowerCase();
            if (addr !== SOURCE_OF_TRUTH.toLowerCase()) {
                wrongAddresses.push(`${ref.file}: ${m[0]}`);
            }
        }
    }
    expect(wrongAddresses, `Found 0G contract addresses that don't match the source of truth (${SOURCE_OF_TRUTH}):\n${wrongAddresses.join('\n')}`).toEqual([]);
});
