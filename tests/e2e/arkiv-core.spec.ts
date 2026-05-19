import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the Arkiv layer's load-bearing constants + entrant
 * requirements. The Arkiv challenge requires:
 *
 *   1. A unique PROJECT_ATTRIBUTE used on every entity + query.
 *   2. At least 2 entity types.
 *   3. Open-source repo + working demo link + README setup.
 *
 * This spec asserts (1) and (2) at the lib level and that the public
 * /arkiv demo page + /api/arkiv route surfaces exist. The README
 * coherence is covered by truth-table-honest + the README itself.
 *
 * Companion to:
 *   - truth-table-honest.spec.ts (Arkiv row in TRUTH_TABLE)
 *   - positioning-tagline-coherence.spec.ts (canonical tagline)
 */

const repoRoot = path.resolve(__dirname, '..', '..');

test('lib/arkiv/constants.ts defines a non-empty PROJECT_ATTRIBUTE', () => {
    const src = fs.readFileSync(path.join(repoRoot, 'lib', 'arkiv', 'constants.ts'), 'utf-8');
    const match = src.match(/PROJECT_ATTRIBUTE\s*=\s*\{\s*key:\s*'project'\s*,\s*value:\s*'([^']+)'/);
    expect(match, 'PROJECT_ATTRIBUTE must export { key: "project", value: "<non-empty>" }').not.toBeNull();
    expect(match![1].length).toBeGreaterThan(8);
});

test('lib/arkiv exports the two required entity-type discriminators', () => {
    const src = fs.readFileSync(path.join(repoRoot, 'lib', 'arkiv', 'constants.ts'), 'utf-8');
    expect(src).toMatch(/AGENT:\s*'agent'/);
    expect(src).toMatch(/MEMORY_EVENT:\s*'memory-event'/);
});

test('Arkiv challenge entry points exist on disk', () => {
    const expected = [
        'lib/arkiv/index.ts',
        'lib/arkiv/client.ts',
        'lib/arkiv/agent.ts',
        'lib/arkiv/memory.ts',
        'app/api/arkiv/agents/route.ts',
        'app/api/arkiv/memories/route.ts',
        'app/arkiv/page.tsx',
        'scripts/arkiv/publish-agents.mjs',
    ];
    for (const rel of expected) {
        expect(fs.existsSync(path.join(repoRoot, rel)), `${rel} must exist`).toBe(true);
    }
});

test('every Arkiv entity write call carries PROJECT_ATTRIBUTE', () => {
    // Arkiv best practice #1 is the load-bearing claim of the entrant
    // requirements. If a new write path is added that forgets to
    // include PROJECT_ATTRIBUTE, this spec fires.
    const writePaths = [
        path.join(repoRoot, 'lib', 'arkiv', 'agent.ts'),
        path.join(repoRoot, 'lib', 'arkiv', 'memory.ts'),
        path.join(repoRoot, 'scripts', 'arkiv', 'publish-agents.mjs'),
    ];
    for (const file of writePaths) {
        const src = fs.readFileSync(file, 'utf-8');
        if (/createEntity\s*\(/.test(src)) {
            expect(src, `${path.relative(repoRoot, file)} calls createEntity without PROJECT_ATTRIBUTE`).toMatch(/PROJECT_ATTRIBUTE/);
        }
    }
});

test('every Arkiv read query filters by PROJECT_ATTRIBUTE', () => {
    // Read-side counterpart: every buildQuery() chain must filter by
    // our project attribute so we don't accidentally surface data
    // from other Arkiv projects.
    const readPaths = [
        path.join(repoRoot, 'lib', 'arkiv', 'agent.ts'),
        path.join(repoRoot, 'lib', 'arkiv', 'memory.ts'),
    ];
    for (const file of readPaths) {
        const src = fs.readFileSync(file, 'utf-8');
        if (/buildQuery\s*\(/.test(src)) {
            expect(src, `${path.relative(repoRoot, file)} calls buildQuery without filtering by PROJECT_ATTRIBUTE`).toMatch(/PROJECT_ATTRIBUTE\.key/);
        }
    }
});

test('Arkiv demo page references the Braga testnet explorer', () => {
    // The /arkiv page is the working demo link required by the Arkiv
    // challenge submission form. It must point readers at the Braga
    // explorer so they can verify the entities live on-chain. The
    // explorer URL lives in lib/arkiv/constants.ts::BRAGA_TESTNET.explorer
    // so the page satisfies this either by importing the constant
    // (preferred, DRY) or by hard-coding the URL.
    const page = fs.readFileSync(path.join(repoRoot, 'app', 'arkiv', 'page.tsx'), 'utf-8');
    const constants = fs.readFileSync(path.join(repoRoot, 'lib', 'arkiv', 'constants.ts'), 'utf-8');
    const literalInPage = page.includes('explorer.braga.hoodi.arkiv.network');
    const importsConstant = /BRAGA_TESTNET/.test(page);
    const constantHasUrl = constants.includes('explorer.braga.hoodi.arkiv.network');
    expect(literalInPage || (importsConstant && constantHasUrl)).toBe(true);
});

test('Arkiv API routes are public (no auth-gated middleware)', () => {
    // Judges must be able to GET /api/arkiv/agents and /api/arkiv/memories
    // without a sign-in. The routes themselves don't import verifySession,
    // so they fall through any middleware that gates on auth. If a
    // future change wires verifySession in here, judges hit 401 and
    // the demo dies.
    for (const route of ['app/api/arkiv/agents/route.ts', 'app/api/arkiv/memories/route.ts']) {
        const src = fs.readFileSync(path.join(repoRoot, route), 'utf-8');
        expect(src, `${route} must not auth-gate`).not.toMatch(/verifySession/);
    }
});
