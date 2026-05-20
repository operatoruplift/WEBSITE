import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the Arkiv adapter on /api/health/adapters.
 *
 * After PR #515 (filecoin), PR #570 (0G storage) and PR #571 (0G
 * agent id), the adapters route became the canonical operator view
 * of "which external networks are wired today." This spec adds the
 * Arkiv adapter to that list and locks two contracts:
 *
 *  1. arkivStatus() is a public export from lib/arkiv/client.ts and
 *     mirrors the shape of filecoinStatus() + og0Status() (active,
 *     reason, details with non-sensitive config only).
 *  2. The /api/health/adapters route imports + emits the Arkiv entry
 *     alongside the existing adapters. If a future refactor drops
 *     the import, the operator silently loses the Arkiv view.
 *  3. arkivStatus() never returns the ARKIV_PRIVATE_KEY value in the
 *     details block. Mirrors the secret-leak guard pattern from
 *     PR #499 (Google OAuth) and PR #603 (filecoin) error envelopes.
 *
 * Companion to:
 *   - arkiv-routes.spec.ts (HTTP envelope contract)
 *   - arkiv-core.spec.ts (file existence + PROJECT_ATTRIBUTE)
 *   - prod-env-checklist.md (ARKIV_PRIVATE_KEY env var row)
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const clientSrc = fs.readFileSync(path.join(repoRoot, 'lib', 'arkiv', 'client.ts'), 'utf-8');
const routeSrc = fs.readFileSync(
    path.join(repoRoot, 'app', 'api', 'health', 'adapters', 'route.ts'),
    'utf-8',
);

test('lib/arkiv/client.ts exports arkivStatus()', () => {
    expect(clientSrc).toMatch(/export function arkivStatus/);
});

test('arkivStatus details block only carries non-sensitive config', () => {
    // The details block is allowed to expose RPC URL, explorer,
    // project key, and optional public creator address. It must
    // never read or surface ARKIV_PRIVATE_KEY directly. The function
    // reads process.env.ARKIV_PRIVATE_KEY only through hasArkivWriteKey
    // (which returns a boolean, not the value).
    const fn = clientSrc.slice(
        clientSrc.indexOf('export function arkivStatus'),
        clientSrc.length,
    );
    expect(fn).not.toMatch(/process\.env\.ARKIV_PRIVATE_KEY/);
    // Public creator address may be surfaced via NEXT_PUBLIC_ env var.
    expect(fn).toMatch(/NEXT_PUBLIC_ARKIV_CREATOR_ADDRESS/);
});

test('/api/health/adapters imports arkivStatus + emits an arkiv adapter entry', () => {
    expect(routeSrc).toMatch(/import \{ arkivStatus \} from '@\/lib\/arkiv\/client'/);
    expect(routeSrc).toMatch(/name: 'arkiv'/);
});

test('/api/health/adapters Arkiv entry references the Braga faucet in the not_configured reason', () => {
    // Operator-friendly: the reason string for the inactive state
    // tells the operator exactly where to fund the wallet, mirroring
    // the pattern set by the filecoin + 0G entries.
    expect(routeSrc).toMatch(/braga\.hoodi\.arkiv\.network\/faucet\//);
});
