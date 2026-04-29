import { test, expect } from '@playwright/test';
import { getConsentUrl } from '@/lib/google/oauth';

/**
 * Unit tests for the Google consent URL builder.
 *
 * /api/integrations/google/start calls getConsentUrl(signedState)
 * and redirects the browser to it. A regression in the URL shape
 * could:
 * - Drop the offline access type → no refresh token returned, the
 *   integration breaks the next time we try to use Calendar/Gmail
 * - Drop a scope → silent permission gap (Gmail scope missing means
 *   draft+send won't work, but the Calendar half does)
 * - Wrong state encoding → the callback fails to verify, the user
 *   sees an "invalid_state" error
 *
 * Tests mutate process.env.GOOGLE_OAUTH_* so the describe block is
 * serial.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/google-oauth-consent.spec.ts --reporter=list
 */

test.describe.configure({ mode: 'serial' });

const ORIG_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const ORIG_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const ORIG_REDIRECT = process.env.GOOGLE_OAUTH_REDIRECT_URI;

const TEST_CLIENT_ID = '123-test.apps.googleusercontent.com';
const TEST_CLIENT_SECRET = 'GOCSPX-test-secret';
const TEST_REDIRECT = 'https://example.test/api/integrations/google/callback';

test.beforeEach(() => {
    process.env.GOOGLE_OAUTH_CLIENT_ID = TEST_CLIENT_ID;
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = TEST_CLIENT_SECRET;
    process.env.GOOGLE_OAUTH_REDIRECT_URI = TEST_REDIRECT;
});

test.afterEach(() => {
    if (ORIG_CLIENT_ID === undefined) delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    else process.env.GOOGLE_OAUTH_CLIENT_ID = ORIG_CLIENT_ID;
    if (ORIG_CLIENT_SECRET === undefined) delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    else process.env.GOOGLE_OAUTH_CLIENT_SECRET = ORIG_CLIENT_SECRET;
    if (ORIG_REDIRECT === undefined) delete process.env.GOOGLE_OAUTH_REDIRECT_URI;
    else process.env.GOOGLE_OAUTH_REDIRECT_URI = ORIG_REDIRECT;
});

test.describe('getConsentUrl', () => {
    test('returns a Google accounts.google.com OAuth URL', () => {
        const url = getConsentUrl('signed-state-abc.sig');
        expect(url.startsWith('https://accounts.google.com/o/oauth2/v2/auth')).toBe(true);
    });

    test('includes the client_id from env', () => {
        const url = new URL(getConsentUrl('signed-state-abc.sig'));
        expect(url.searchParams.get('client_id')).toBe(TEST_CLIENT_ID);
    });

    test('includes the redirect_uri from env', () => {
        const url = new URL(getConsentUrl('signed-state-abc.sig'));
        expect(url.searchParams.get('redirect_uri')).toBe(TEST_REDIRECT);
    });

    test('includes the signed state verbatim (no double-encoding)', () => {
        const state = 'signed-state-abc-123.signature.value';
        const url = new URL(getConsentUrl(state));
        expect(url.searchParams.get('state')).toBe(state);
    });

    test('uses access_type=offline (so we get a refresh_token back)', () => {
        const url = new URL(getConsentUrl('s'));
        expect(url.searchParams.get('access_type')).toBe('offline');
    });

    test('uses prompt=consent (forces refresh-token issuance even on re-auth)', () => {
        const url = new URL(getConsentUrl('s'));
        expect(url.searchParams.get('prompt')).toBe('consent');
    });

    test('includes all 5 documented scopes', () => {
        const url = new URL(getConsentUrl('s'));
        const scope = url.searchParams.get('scope') || '';
        const scopes = scope.split(' ').sort();
        expect(scopes).toContain('https://www.googleapis.com/auth/calendar.readonly');
        expect(scopes).toContain('https://www.googleapis.com/auth/calendar.events');
        expect(scopes).toContain('https://www.googleapis.com/auth/gmail.readonly');
        expect(scopes).toContain('https://www.googleapis.com/auth/gmail.compose');
        expect(scopes).toContain('https://www.googleapis.com/auth/gmail.send');
    });

    test('does NOT include broader Gmail scopes than needed', () => {
        // We deliberately ask for gmail.readonly + .compose + .send
        // and NOT gmail.modify (move to trash, change labels) or
        // gmail.metadata (label-only access). A regression here
        // would over-grant.
        const url = new URL(getConsentUrl('s'));
        const scope = url.searchParams.get('scope') || '';
        expect(scope).not.toContain('gmail.modify');
        expect(scope).not.toContain('gmail.metadata');
        expect(scope).not.toContain('gmail.labels');
        expect(scope).not.toContain('mail.google.com');
    });

    test('does NOT include broader Calendar scopes than needed', () => {
        // calendar.readonly + calendar.events; NOT the master `calendar`
        // scope which would let us delete other users' invites.
        const url = new URL(getConsentUrl('s'));
        const scope = url.searchParams.get('scope') || '';
        // The master scope is just `/auth/calendar` (no `.events` /
        // `.readonly` suffix). Asserting that exact full string is
        // not a substring of the scope param.
        expect(scope.split(' ')).not.toContain('https://www.googleapis.com/auth/calendar');
    });

    test('does not include other Google scopes (Drive, Photos, etc)', () => {
        const url = new URL(getConsentUrl('s'));
        const scope = url.searchParams.get('scope') || '';
        expect(scope).not.toContain('drive');
        expect(scope).not.toContain('photoslibrary');
        expect(scope).not.toContain('youtube');
        expect(scope).not.toContain('contacts');
    });

    test('different state values produce different URLs', () => {
        const a = getConsentUrl('state-one');
        const b = getConsentUrl('state-two');
        expect(a).not.toBe(b);
    });

    test('identical state values produce identical URLs (deterministic)', () => {
        const a = getConsentUrl('same-state');
        const b = getConsentUrl('same-state');
        expect(a).toBe(b);
    });
});
