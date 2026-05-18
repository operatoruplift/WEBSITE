import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock doc/code coherence for docs/HACKATHON_GATE2.md.
 *
 * HACKATHON_GATE2.md is the judge-facing verifier cookbook. The
 * README points readers at it for the full "verify this is real"
 * walkthrough. Every API path referenced in the cookbook needs to
 * exist as a Next.js route file — if a judge follows a curl example
 * and the route 404s, the trust pitch collapses on a paragraph that
 * promised hands-on verification.
 *
 * Companion to truth-table-honest.spec.ts (PR #608) which locks the
 * Real/Simulated/Stub claims. This one locks the verifier-cookbook
 * curl recipes.
 *
 * If a route gets renamed or removed without updating the cookbook,
 * this spec catches the drift before a judge does.
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const doc = fs.readFileSync(path.join(repoRoot, 'docs', 'HACKATHON_GATE2.md'), 'utf-8');

/**
 * Maps an /api/<...> reference from the doc to the Next.js route file
 * the cookbook walkthrough depends on. Dynamic segments (`[tokenId]`,
 * `[rootHash]`) need explicit mapping because the doc uses the
 * `/api/og/agent-id/<token>` form, not `[tokenId]`.
 */
const COOKBOOK_PATHS: Record<string, string> = {
    '/api/cron/filecoin-anchor': 'app/api/cron/filecoin-anchor/route.ts',
    '/api/cron/og-anchor': 'app/api/cron/og-anchor/route.ts',
    '/api/debug/solana-wallet': 'app/api/debug/solana-wallet/route.ts',
    '/api/og/agent-id/': 'app/api/og/agent-id/[tokenId]/route.ts',
    '/api/og/storage/': 'app/api/og/storage/[rootHash]/route.ts',
    '/api/receipts': 'app/api/receipts/route.ts',
    '/api/receipts/public-key': 'app/api/receipts/public-key/route.ts',
    '/api/sns/resolve': 'app/api/sns/resolve/route.ts',
    '/api/tools/calendar': 'app/api/tools/calendar/route.ts',
    '/api/tools/gmail': 'app/api/tools/gmail/route.ts',
    '/api/tools/x402/pay': 'app/api/tools/x402/pay/route.ts',
};

for (const [docPath, routeFile] of Object.entries(COOKBOOK_PATHS)) {
    test(`HACKATHON_GATE2 references ${docPath} and the route file exists`, () => {
        // First: the doc must actually still reference the path. If a
        // future edit drops the reference, the spec should fail rather
        // than silently pass — that signals the cookbook surface area
        // shrunk and the COOKBOOK_PATHS map needs pruning.
        expect(doc, `${docPath} must appear in HACKATHON_GATE2.md`).toContain(docPath);

        // Second: the route file must exist. The cookbook tells judges
        // to curl these endpoints; missing files mean a 404 mid-walkthrough.
        const abs = path.join(repoRoot, routeFile);
        expect(fs.existsSync(abs), `${routeFile} must exist (referenced by ${docPath} in HACKATHON_GATE2.md)`).toBe(true);
    });
}

test('HACKATHON_GATE2 references the deployed AgenticID contract', () => {
    // The cookbook surfaces the deployed 0G AgenticID contract address
    // so a judge can verify on-chain identity. If it drifts from the
    // lib/og/agent-id.ts DEFAULT_CONTRACT constant, the cookbook curl
    // points at the wrong contract.
    const DEPLOYED = '0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F';
    expect(doc, `Cookbook must reference the deployed AgenticID contract ${DEPLOYED}`).toContain(DEPLOYED);
});

test('HACKATHON_GATE2 surfaces all four verifier-step pillars', () => {
    // The cookbook must reference all four trust pillars somewhere
    // in the document. The exact ordering varies (the cookbook
    // introduces ed25519 in the intro before getting to the public-key
    // fetch step) so the spec only asserts presence, not order.
    expect(doc).toMatch(/public-key/);
    expect(doc).toMatch(/ed25519/i);
    expect(doc).toMatch(/Filecoin/);
    expect(doc).toMatch(/0G Storage/);
});
