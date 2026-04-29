import { test, expect } from '@playwright/test';
import { mockSolDomain, resolveSolDomain } from '@/lib/sns';

/**
 * Unit tests for the pure paths in lib/sns.
 *
 * mockSolDomain is the Demo-mode fallback used when /api/sns/resolve
 * gets a request with capability_real = false. The contract: it must
 * always carry simulated: true and verified: false so the UI's
 * Simulated chip renders correctly.
 *
 * resolveSolDomain has one pure branch (not_a_sol_domain rejection)
 * that's testable without network. The rest hits Bonfida's proxy.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/sns.spec.ts --reporter=list
 */

test.describe('mockSolDomain', () => {
    test('returns simulated:true and verified:false for any name', () => {
        const r = mockSolDomain('alice.sol');
        expect(r.simulated).toBe(true);
        expect(r.verified).toBe(false);
    });

    test('preserves the normalized name (lowercases + trims)', () => {
        expect(mockSolDomain('  ALICE.SOL  ').name).toBe('alice.sol');
    });

    test('strips .sol.site browser alias to .sol for the name field', () => {
        expect(mockSolDomain('alice.sol.site').name).toBe('alice.sol');
    });

    test('owner is a "Demo*" prefixed placeholder, never a real mainnet pubkey', () => {
        const r = mockSolDomain('any.sol');
        expect(r.owner).toBeTruthy();
        expect(r.owner!.startsWith('Demo')).toBe(true);
    });

    test('records carry the documented demo set (twitter / url / github)', () => {
        const r = mockSolDomain('any.sol');
        const types = r.records.map(rec => rec.type).sort();
        expect(types).toEqual(['github', 'twitter', 'url']);
    });

    test('cachedAt is a recent Unix timestamp in ms', () => {
        const before = Date.now();
        const r = mockSolDomain('any.sol');
        const after = Date.now();
        expect(r.cachedAt).toBeGreaterThanOrEqual(before);
        expect(r.cachedAt).toBeLessThanOrEqual(after);
    });

    test('error field is undefined (mock never reports an error)', () => {
        expect(mockSolDomain('any.sol').error).toBeUndefined();
    });
});

test.describe('resolveSolDomain (pure not_a_sol_domain branch)', () => {
    test('returns error:not_a_sol_domain for non-.sol input', async () => {
        const r = await resolveSolDomain('alice.eth');
        expect(r.error).toBe('not_a_sol_domain');
        expect(r.owner).toBeNull();
        expect(r.records).toEqual([]);
        expect(r.verified).toBe(false);
    });

    test('returns error:not_a_sol_domain for bare name without TLD', async () => {
        const r = await resolveSolDomain('alice');
        expect(r.error).toBe('not_a_sol_domain');
    });

    test('preserves the original input under .name when rejected', async () => {
        const r = await resolveSolDomain('alice.eth');
        // The not_a_sol_domain branch returns the rawName under .name
        // (not normalized) so the UI can show what the user typed.
        expect(r.name).toBe('alice.eth');
    });
});

test.describe('honest-status contract', () => {
    test('mock and resolve never claim verified:true without an owner', () => {
        // The resolver only sets verified:true if owner === SNS_EXPECTED_OWNER,
        // which requires both env var and live lookup. The mock can never
        // claim verified.
        const m = mockSolDomain('alice.sol');
        expect(m.verified).toBe(false);
    });

    test('mock owner is recognizably a placeholder (starts with Demo)', () => {
        // The fabrication-rot check + DEMO_TOOL_MOCKS spec requires
        // demo-mode payloads use clearly-fake placeholders. The
        // string 'Demo1111111111111111111111111111111111111111' is
        // the canonical Operator Uplift demo address.
        const owner = mockSolDomain('any.sol').owner!;
        expect(/^Demo[0-9]+$/.test(owner)).toBe(true);
    });
});
