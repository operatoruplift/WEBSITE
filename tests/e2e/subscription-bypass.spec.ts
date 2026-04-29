import { test, expect } from '@playwright/test';
import {
    isBypassAllEnabled,
    isEmailBypassed,
    isUserIdBypassed,
} from '@/lib/subscription';

/**
 * Unit tests for the paywall-bypass helpers in lib/subscription.
 *
 * The bypass helpers control who skips paywall enforcement in dev /
 * staging without an active subscription row. Three sources are
 * checked, in order of preference:
 *
 *   1. NEXT_PUBLIC_PAYWALL_BYPASS=1                  -> everybody Pro
 *   2. PAYWALL_BYPASS_USER_IDS (comma-separated DIDs) -> per-user
 *   3. PAYWALL_BYPASS_EMAILS  (comma-separated mails) -> per-email
 *
 * A regression here could either accidentally grant Pro access to
 * everyone (#1 left on in production) or revoke access from an admin
 * during testing. Both have happened in similar codebases, so we lock
 * the behavior here.
 *
 * These tests mutate process.env, so the describe block is serial.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/subscription-bypass.spec.ts --reporter=list
 */

// process.env mutations break parallel runs — force sequential.
test.describe.configure({ mode: 'serial' });

const ORIGINAL_BYPASS_ALL = process.env.NEXT_PUBLIC_PAYWALL_BYPASS;
const ORIGINAL_BYPASS_EMAILS = process.env.PAYWALL_BYPASS_EMAILS;
const ORIGINAL_BYPASS_USER_IDS = process.env.PAYWALL_BYPASS_USER_IDS;

function restoreEnv() {
    if (ORIGINAL_BYPASS_ALL === undefined) {
        delete process.env.NEXT_PUBLIC_PAYWALL_BYPASS;
    } else {
        process.env.NEXT_PUBLIC_PAYWALL_BYPASS = ORIGINAL_BYPASS_ALL;
    }
    if (ORIGINAL_BYPASS_EMAILS === undefined) {
        delete process.env.PAYWALL_BYPASS_EMAILS;
    } else {
        process.env.PAYWALL_BYPASS_EMAILS = ORIGINAL_BYPASS_EMAILS;
    }
    if (ORIGINAL_BYPASS_USER_IDS === undefined) {
        delete process.env.PAYWALL_BYPASS_USER_IDS;
    } else {
        process.env.PAYWALL_BYPASS_USER_IDS = ORIGINAL_BYPASS_USER_IDS;
    }
}

test.afterEach(() => {
    restoreEnv();
});

test.describe('isBypassAllEnabled', () => {
    test('true only when NEXT_PUBLIC_PAYWALL_BYPASS=1 exactly', () => {
        process.env.NEXT_PUBLIC_PAYWALL_BYPASS = '1';
        expect(isBypassAllEnabled()).toBe(true);
    });

    test('false when set to 0', () => {
        process.env.NEXT_PUBLIC_PAYWALL_BYPASS = '0';
        expect(isBypassAllEnabled()).toBe(false);
    });

    test('false when set to "true" (must be exactly "1")', () => {
        process.env.NEXT_PUBLIC_PAYWALL_BYPASS = 'true';
        expect(isBypassAllEnabled()).toBe(false);
    });

    test('false when unset', () => {
        delete process.env.NEXT_PUBLIC_PAYWALL_BYPASS;
        expect(isBypassAllEnabled()).toBe(false);
    });

    test('false when empty string', () => {
        process.env.NEXT_PUBLIC_PAYWALL_BYPASS = '';
        expect(isBypassAllEnabled()).toBe(false);
    });
});

test.describe('isEmailBypassed', () => {
    test('matches an email in PAYWALL_BYPASS_EMAILS exactly', () => {
        process.env.PAYWALL_BYPASS_EMAILS = 'admin@example.com,beta@example.com';
        expect(isEmailBypassed('admin@example.com')).toBe(true);
        expect(isEmailBypassed('beta@example.com')).toBe(true);
    });

    test('matches case-insensitively', () => {
        process.env.PAYWALL_BYPASS_EMAILS = 'ADMIN@EXAMPLE.COM';
        expect(isEmailBypassed('admin@example.com')).toBe(true);
        expect(isEmailBypassed('Admin@Example.com')).toBe(true);
    });

    test('rejects unrelated email', () => {
        process.env.PAYWALL_BYPASS_EMAILS = 'admin@example.com';
        expect(isEmailBypassed('user@example.com')).toBe(false);
    });

    test('rejects null / undefined / empty input', () => {
        process.env.PAYWALL_BYPASS_EMAILS = 'admin@example.com';
        expect(isEmailBypassed(null)).toBe(false);
        expect(isEmailBypassed(undefined)).toBe(false);
        expect(isEmailBypassed('')).toBe(false);
    });

    test('returns false when PAYWALL_BYPASS_EMAILS is unset', () => {
        delete process.env.PAYWALL_BYPASS_EMAILS;
        expect(isEmailBypassed('admin@example.com')).toBe(false);
    });

    test('handles whitespace and empty entries in the comma list', () => {
        process.env.PAYWALL_BYPASS_EMAILS = '  admin@example.com , , beta@example.com ,';
        expect(isEmailBypassed('admin@example.com')).toBe(true);
        expect(isEmailBypassed('beta@example.com')).toBe(true);
        // Empty entries shouldn't match the empty string
        expect(isEmailBypassed('')).toBe(false);
    });
});

test.describe('isUserIdBypassed', () => {
    test('matches a Privy DID in PAYWALL_BYPASS_USER_IDS exactly', () => {
        process.env.PAYWALL_BYPASS_USER_IDS = 'did:privy:abc123,did:privy:def456';
        expect(isUserIdBypassed('did:privy:abc123')).toBe(true);
        expect(isUserIdBypassed('did:privy:def456')).toBe(true);
    });

    test('user-id matching is case-sensitive (DIDs are)', () => {
        process.env.PAYWALL_BYPASS_USER_IDS = 'did:privy:abc123';
        expect(isUserIdBypassed('did:privy:abc123')).toBe(true);
        expect(isUserIdBypassed('did:privy:ABC123')).toBe(false);
    });

    test('rejects unrelated user id', () => {
        process.env.PAYWALL_BYPASS_USER_IDS = 'did:privy:abc123';
        expect(isUserIdBypassed('did:privy:other')).toBe(false);
    });

    test('rejects null / undefined / empty input', () => {
        process.env.PAYWALL_BYPASS_USER_IDS = 'did:privy:abc123';
        expect(isUserIdBypassed(null)).toBe(false);
        expect(isUserIdBypassed(undefined)).toBe(false);
        expect(isUserIdBypassed('')).toBe(false);
    });

    test('returns false when PAYWALL_BYPASS_USER_IDS is unset', () => {
        delete process.env.PAYWALL_BYPASS_USER_IDS;
        expect(isUserIdBypassed('did:privy:abc123')).toBe(false);
    });

    test('handles whitespace and empty entries in the comma list', () => {
        process.env.PAYWALL_BYPASS_USER_IDS = '  did:privy:abc , ,did:privy:def , ';
        expect(isUserIdBypassed('did:privy:abc')).toBe(true);
        expect(isUserIdBypassed('did:privy:def')).toBe(true);
    });
});

test.describe('runtime evaluation (no build-cache)', () => {
    test('isBypassAllEnabled re-evaluates env on every call', () => {
        process.env.NEXT_PUBLIC_PAYWALL_BYPASS = '1';
        expect(isBypassAllEnabled()).toBe(true);
        process.env.NEXT_PUBLIC_PAYWALL_BYPASS = '0';
        expect(isBypassAllEnabled()).toBe(false);
        process.env.NEXT_PUBLIC_PAYWALL_BYPASS = '1';
        expect(isBypassAllEnabled()).toBe(true);
    });

    test('isEmailBypassed re-evaluates env on every call', () => {
        process.env.PAYWALL_BYPASS_EMAILS = 'a@b.com';
        expect(isEmailBypassed('a@b.com')).toBe(true);
        process.env.PAYWALL_BYPASS_EMAILS = 'c@d.com';
        expect(isEmailBypassed('a@b.com')).toBe(false);
        expect(isEmailBypassed('c@d.com')).toBe(true);
    });
});
