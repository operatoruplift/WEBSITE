import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the waitlist position-tracking contract.
 *
 * The product pivoted from "freemium with paywall" to "waitlist +
 * skip-the-line payment" (this PR). The new contract:
 *
 *  - Positions start at 301 (300 is reserved as an operator bookmark)
 *  - Skip tiers are exactly: $25 = +50, $50 = +200, $100 = jump to top
 *  - Tier amounts are locked in lib/waitlist.ts::SKIP_TIERS; the API
 *    rejects any tier/amount mismatch
 *  - The /api/waitlist POST returns { position, alreadyExisted, count }
 *  - /api/waitlist/lookup returns { position, onWaitlist, count }
 *  - /api/waitlist/skip returns { oldPosition, newPosition, tier, amountUsdc }
 *
 * File-scope only (no webserver). Locks the source of truth so a
 * future refactor can't silently drift the tier prices or the base
 * position.
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const libSrc = fs.readFileSync(path.join(repoRoot, 'lib', 'waitlist.ts'), 'utf-8');
const migrationSrc = fs.readFileSync(
    path.join(repoRoot, 'lib', 'waitlist-position-migration.sql'),
    'utf-8',
);
const joinRouteSrc = fs.readFileSync(
    path.join(repoRoot, 'app', 'api', 'waitlist', 'route.ts'),
    'utf-8',
);
const lookupRouteSrc = fs.readFileSync(
    path.join(repoRoot, 'app', 'api', 'waitlist', 'lookup', 'route.ts'),
    'utf-8',
);
const skipRouteSrc = fs.readFileSync(
    path.join(repoRoot, 'app', 'api', 'waitlist', 'skip', 'route.ts'),
    'utf-8',
);

test('WAITLIST_BASE_POSITION is exactly 300', () => {
    expect(libSrc).toMatch(/WAITLIST_BASE_POSITION\s*=\s*300/);
});

test('skip tiers are locked at $25 / $50 / $100', () => {
    expect(libSrc).toMatch(/boost_50:\s*\{[\s\S]*?amountUsdc:\s*25/);
    expect(libSrc).toMatch(/boost_200:\s*\{[\s\S]*?amountUsdc:\s*50/);
    expect(libSrc).toMatch(/jump_top:\s*\{[\s\S]*?amountUsdc:\s*100/);
});

test('boost tiers move you 50 or 200 spots', () => {
    expect(libSrc).toMatch(/boost_50:\s*\{[\s\S]*?bumpSpots:\s*50/);
    expect(libSrc).toMatch(/boost_200:\s*\{[\s\S]*?bumpSpots:\s*200/);
});

test('migration starts the sequence at 301', () => {
    expect(migrationSrc).toMatch(/START WITH 301/);
});

test('migration backfills existing rows starting at 301 in created_at order', () => {
    expect(migrationSrc).toMatch(/ORDER BY created_at ASC/);
    expect(migrationSrc).toMatch(/300 \+ ordered\.rn/);
});

test('migration is idempotent (re-runnable)', () => {
    // Idempotency comes from the IF NOT EXISTS guards on every ADD
    // COLUMN + the "WHERE position IS NULL" filter on the backfill.
    expect(migrationSrc).toMatch(/IF NOT EXISTS/);
    expect(migrationSrc).toMatch(/WHERE position IS NULL/);
});

test('/api/waitlist POST returns position + alreadyExisted + count', () => {
    expect(joinRouteSrc).toMatch(/position:/);
    expect(joinRouteSrc).toMatch(/alreadyExisted:/);
    expect(joinRouteSrc).toMatch(/count,/);
});

test('/api/waitlist/lookup returns onWaitlist + position + count', () => {
    expect(lookupRouteSrc).toMatch(/onWaitlist:/);
    expect(lookupRouteSrc).toMatch(/position:/);
    expect(lookupRouteSrc).toMatch(/count,/);
});

test('/api/waitlist/lookup never returns wallet_address or created_at', () => {
    // Email-enumeration defense: the JSON response body must not leak
    // metadata that would let a stranger correlate addresses to people.
    // Scope the check to the NextResponse.json({...}) literal so that
    // import paths or unused destructuring don't trip a false positive.
    const responseStart = lookupRouteSrc.indexOf('NextResponse.json(');
    expect(responseStart).toBeGreaterThan(-1);
    const responseBody = lookupRouteSrc.slice(responseStart, responseStart + 600);
    expect(responseBody).not.toMatch(/wallet_address/);
    expect(responseBody).not.toMatch(/created_at/);
});

test('/api/waitlist/skip validates tier matches amountUsdc', () => {
    // A UI bug or a hostile client must not be able to pay $25 and
    // claim tier=jump_top. The route uses skipTierByAmount() as the
    // source of truth.
    expect(skipRouteSrc).toMatch(/skipTierByAmount/);
    expect(skipRouteSrc).toMatch(/tier_amount_mismatch/);
});

test('/api/waitlist/skip requires txSignature + walletAddress', () => {
    // No skip happens without an on-chain proof. The route's tx
    // signature is recorded as the audit trail for the payment.
    expect(skipRouteSrc).toMatch(/txSignature required/);
    expect(skipRouteSrc).toMatch(/walletAddress required/);
});
