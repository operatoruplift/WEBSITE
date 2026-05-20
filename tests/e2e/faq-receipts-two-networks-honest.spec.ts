import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the FAQ "signed receipt" answer to match the shipped reality:
 * every receipt lives on TWO independent public storage networks
 * (Filecoin + 0G testnet), not "a public storage network" singular.
 *
 * PR #564 added the original FAQ entry when only Filecoin was wired.
 * PR #570 added the 0G Storage mirror; the FAQ answer went stale that
 * week but was never updated. This spec catches both directions of
 * future drift:
 *
 *  - If somebody downgrades the answer back to "a public storage
 *    network" (singular), the spec fails.
 *  - If somebody upgrades it to claim a third receipt mirror, the
 *    spec fails. Arkiv stores agent identity cards + session
 *    memories, NOT receipts. /security renders exactly two mirror
 *    links per receipt; the FAQ must mirror that.
 *
 * Companion to:
 *   - localfirst-built-on-honest.spec.ts
 *   - docs-arkiv-mention.spec.ts (also enforces the
 *     two-mirror boundary in /docs)
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const faqSrc = fs.readFileSync(path.join(repoRoot, 'src', 'sections', 'FAQ.tsx'), 'utf-8');

test('homepage FAQ receipts answer says two independent storage networks', () => {
    expect(faqSrc).toMatch(/two independent public storage networks/);
});

test('homepage FAQ receipts answer names both Filecoin and 0G by name', () => {
    expect(faqSrc).toMatch(/Filecoin and 0G testnet/);
});

test('homepage FAQ receipts answer does not regress to singular', () => {
    // Old wording: "a public storage network" (PR #564, pre-PR #570).
    // After 0G Storage shipped this became stale. Lock against
    // accidental revert.
    expect(faqSrc).not.toMatch(/a public storage network/);
});

test('homepage FAQ receipts answer does not falsely claim a third mirror', () => {
    // Arkiv stores agent identity + memory, NOT receipts. The
    // receipt-mirror count has to stay at two. Catches a future
    // edit that conflates the trust stack into "three public
    // storage networks for receipts".
    expect(faqSrc).not.toMatch(/three .* public storage networks/i);
    expect(faqSrc).not.toMatch(/Filecoin,\s*0G,? and Arkiv/i);
});
