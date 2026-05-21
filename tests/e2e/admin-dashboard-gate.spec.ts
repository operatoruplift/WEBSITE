import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the /admin dashboard gate.
 *
 * /admin surfaces operator-only data (waitlist sign-ups, blog drafts,
 * analytics). The layout must:
 *
 *  1. Verify the Privy session via PrivyClient.verifyAuthToken.
 *  2. Look up the user's email and confirm it appears in
 *     PAYWALL_BYPASS_EMAILS via lib/admin.ts::isAdmin.
 *  3. Call notFound() on any negative result so the admin surface is
 *     not even confirmed to exist for non-admins (404, not 403).
 *
 * If a future refactor drops one of those checks, this spec fails
 * before a production deploy leaks the admin surface.
 *
 * Companion to:
 *   - robots-hackathon-allow.spec.ts (Disallow list)
 *   - dev/reliability + part2-runner (same PAYWALL_BYPASS_EMAILS gate)
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const layoutSrc = fs.readFileSync(path.join(repoRoot, 'app', 'admin', 'layout.tsx'), 'utf-8');
const adminLib = fs.readFileSync(path.join(repoRoot, 'lib', 'admin.ts'), 'utf-8');
const robotsSrc = fs.readFileSync(path.join(repoRoot, 'app', 'robots.ts'), 'utf-8');

test('admin layout calls notFound() on missing Privy token', () => {
    expect(layoutSrc).toMatch(/privy-token|privy-id-token/);
    expect(layoutSrc).toMatch(/notFound\(\)/);
});

test('admin layout verifies the Privy token cryptographically', () => {
    expect(layoutSrc).toMatch(/verifyAuthToken/);
});

test('admin layout calls isAdmin() before rendering children', () => {
    expect(layoutSrc).toMatch(/import \{ isAdmin \} from '@\/lib\/admin'/);
    expect(layoutSrc).toMatch(/await isAdmin\(/);
});

test('lib/admin.ts reads PAYWALL_BYPASS_EMAILS', () => {
    // Reuses the same allowlist as /dev/reliability and
    // /settings/part2-runner. Locks the env var name so a refactor
    // that introduces a separate ADMIN_EMAILS list still trips a
    // spec.
    expect(adminLib).toMatch(/PAYWALL_BYPASS_EMAILS/);
});

test('lib/admin.ts returns false for an empty allowlist', () => {
    // Defensive: an empty PAYWALL_BYPASS_EMAILS must lock /admin
    // out completely, not allow everyone through.
    expect(adminLib).toMatch(/if \(allowed\.length === 0\) return false/);
});

test('robots.ts disallows /admin so search engines cannot index it', () => {
    expect(robotsSrc).toMatch(/['"]\/admin['"]/);
});
