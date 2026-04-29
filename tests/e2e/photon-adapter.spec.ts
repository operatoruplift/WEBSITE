import { test, expect } from '@playwright/test';
import { getPhotonAdapter, photonStatus } from '@/lib/photon/adapter';

/**
 * Unit tests for the Photon Spectrum adapter env-var sniffing.
 *
 * The adapter is the only thing standing between /api/tools/imessage
 * and either:
 *   a) returning 503 with action_required (env not configured), or
 *   b) attempting to call Spectrum's HTTP API
 *
 * The honest-status rule from the module docstring is:
 *   "if the adapter isn't configured, /api/tools/imessage returns 503
 *    with action_required. Never produce a fake message id."
 *
 * A regression in the env-var sniffing here would either:
 * - Mark the adapter active without credentials → 401/403 from Spectrum
 *   surfaces to the user as a confusing "Spectrum returned 401" error
 *   instead of the clean "503 + Set PHOTON_PROJECT_ID..." message
 * - Mark the adapter inactive even with credentials → /imessage tools
 *   silently drop into the 503 branch even though the user has
 *   configured them
 *
 * Tests mutate process.env so the describe block is serial.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/photon-adapter.spec.ts --reporter=list
 */

test.describe.configure({ mode: 'serial' });

const ORIG_PROJECT = process.env.PHOTON_PROJECT_ID;
const ORIG_API_KEY = process.env.PHOTON_API_KEY;
const ORIG_TOKEN = process.env.PHOTON_TOKEN;
const ORIG_BASE = process.env.PHOTON_API_BASE;
const ORIG_PATH = process.env.PHOTON_SEND_PATH;

function clearAll() {
    delete process.env.PHOTON_PROJECT_ID;
    delete process.env.PHOTON_API_KEY;
    delete process.env.PHOTON_TOKEN;
    delete process.env.PHOTON_API_BASE;
    delete process.env.PHOTON_SEND_PATH;
}

function restoreEnv() {
    if (ORIG_PROJECT === undefined) delete process.env.PHOTON_PROJECT_ID;
    else process.env.PHOTON_PROJECT_ID = ORIG_PROJECT;
    if (ORIG_API_KEY === undefined) delete process.env.PHOTON_API_KEY;
    else process.env.PHOTON_API_KEY = ORIG_API_KEY;
    if (ORIG_TOKEN === undefined) delete process.env.PHOTON_TOKEN;
    else process.env.PHOTON_TOKEN = ORIG_TOKEN;
    if (ORIG_BASE === undefined) delete process.env.PHOTON_API_BASE;
    else process.env.PHOTON_API_BASE = ORIG_BASE;
    if (ORIG_PATH === undefined) delete process.env.PHOTON_SEND_PATH;
    else process.env.PHOTON_SEND_PATH = ORIG_PATH;
}

test.beforeEach(() => {
    clearAll();
});

test.afterEach(() => {
    restoreEnv();
});

test.describe('isActive()', () => {
    test('false when nothing is set', () => {
        expect(getPhotonAdapter().isActive()).toBe(false);
    });

    test('false with only PHOTON_PROJECT_ID', () => {
        process.env.PHOTON_PROJECT_ID = 'proj-1';
        expect(getPhotonAdapter().isActive()).toBe(false);
    });

    test('false with only PHOTON_API_KEY', () => {
        process.env.PHOTON_API_KEY = 'sk-test';
        expect(getPhotonAdapter().isActive()).toBe(false);
    });

    test('true when PHOTON_PROJECT_ID + PHOTON_API_KEY are both set', () => {
        process.env.PHOTON_PROJECT_ID = 'proj-1';
        process.env.PHOTON_API_KEY = 'sk-test';
        expect(getPhotonAdapter().isActive()).toBe(true);
    });

    test('PHOTON_TOKEN is accepted as a PHOTON_API_KEY alias (legacy setups)', () => {
        // The module docstring documents PHOTON_TOKEN as a legacy alias.
        process.env.PHOTON_PROJECT_ID = 'proj-1';
        process.env.PHOTON_TOKEN = 'tok-legacy';
        expect(getPhotonAdapter().isActive()).toBe(true);
    });

    test('PHOTON_API_KEY wins over PHOTON_TOKEN when both are set', () => {
        // The module reads API_KEY first, falls back to TOKEN. We can't
        // observe which one was used from the public interface, but we
        // verify the active flag is true when either is present.
        process.env.PHOTON_PROJECT_ID = 'proj-1';
        process.env.PHOTON_API_KEY = 'sk-primary';
        process.env.PHOTON_TOKEN = 'tok-fallback';
        expect(getPhotonAdapter().isActive()).toBe(true);
    });

    test('whitespace-only env values are treated as unset', () => {
        process.env.PHOTON_PROJECT_ID = '   ';
        process.env.PHOTON_API_KEY = 'sk-test';
        expect(getPhotonAdapter().isActive()).toBe(false);

        process.env.PHOTON_PROJECT_ID = 'proj-1';
        process.env.PHOTON_API_KEY = '\t  \n';
        expect(getPhotonAdapter().isActive()).toBe(false);
    });

    test('empty-string env values are treated as unset', () => {
        process.env.PHOTON_PROJECT_ID = '';
        process.env.PHOTON_API_KEY = 'sk-test';
        expect(getPhotonAdapter().isActive()).toBe(false);
    });

    test('isActive() re-evaluates env on every call (no caching)', () => {
        process.env.PHOTON_PROJECT_ID = 'proj-1';
        process.env.PHOTON_API_KEY = 'sk-test';
        expect(getPhotonAdapter().isActive()).toBe(true);
        delete process.env.PHOTON_API_KEY;
        expect(getPhotonAdapter().isActive()).toBe(false);
        process.env.PHOTON_API_KEY = 'sk-restored';
        expect(getPhotonAdapter().isActive()).toBe(true);
    });
});

test.describe('photonStatus()', () => {
    test('inactive when no env is set', () => {
        const status = photonStatus();
        expect(status.active).toBe(false);
        expect(status.projectId).toBeNull();
        expect(status.reason).toContain('PHOTON_PROJECT_ID');
        expect(status.reason).toContain('503');
    });

    test('active with both env vars; reason describes target endpoint', () => {
        process.env.PHOTON_PROJECT_ID = 'proj-1';
        process.env.PHOTON_API_KEY = 'sk-test';
        const status = photonStatus();
        expect(status.active).toBe(true);
        expect(status.projectId).toBe('proj-1');
        expect(status.reason).toContain('Spectrum adapter wired');
        expect(status.reason).toContain(status.base);
        expect(status.reason).toContain(status.path);
    });

    test('default base + path when env overrides not set', () => {
        process.env.PHOTON_PROJECT_ID = 'proj-1';
        process.env.PHOTON_API_KEY = 'sk-test';
        const status = photonStatus();
        expect(status.base).toBe('https://api.photon.codes');
        expect(status.path).toBe('/v1/spectrum/messages');
    });

    test('PHOTON_API_BASE override flows into status.base', () => {
        process.env.PHOTON_PROJECT_ID = 'proj-1';
        process.env.PHOTON_API_KEY = 'sk-test';
        process.env.PHOTON_API_BASE = 'https://custom.example.test';
        const status = photonStatus();
        expect(status.base).toBe('https://custom.example.test');
    });

    test('PHOTON_SEND_PATH override flows into status.path', () => {
        process.env.PHOTON_PROJECT_ID = 'proj-1';
        process.env.PHOTON_API_KEY = 'sk-test';
        process.env.PHOTON_SEND_PATH = '/v2/messages';
        const status = photonStatus();
        expect(status.path).toBe('/v2/messages');
    });
});

test.describe('honest-status contract', () => {
    test('inactive adapter send() returns ok:false reason:not_configured', async () => {
        // The module docstring: "if the adapter isn't configured,
        // /api/tools/imessage returns 503 with action_required. Never
        // produce a fake message id."
        const res = await getPhotonAdapter().send({ to: '+15551234567', text: 'hello' });
        expect(res.ok).toBe(false);
        if (res.ok === false) {
            expect(res.reason).toBe('not_configured');
            expect(res.message).toContain('PHOTON_PROJECT_ID');
        }
    });

    test('inactive adapter never returns ok:true (no fake message id)', async () => {
        const res = await getPhotonAdapter().send({ to: '+15551234567', text: 'hello' });
        // Force the type narrowing
        expect(res.ok).not.toBe(true);
        // Negative form: there must NOT be a messageId field on the
        // result, since that would imply we minted a fake.
        expect((res as { messageId?: unknown }).messageId).toBeUndefined();
    });
});
