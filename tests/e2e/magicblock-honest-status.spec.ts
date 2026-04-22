import { test, expect } from '@playwright/test';
import {
    MagicBlockPaymentsClient,
    isNotConfiguredError,
    notConfiguredEnvelope,
    paymentsEnabled,
} from '../../lib/magicblock/payments';

/**
 * W1B-adapter-503 acceptance spec. Proves Pattern 10 (honest-status
 * rule) holds for the MagicBlock adapter: when the token env var is
 * unset, a library call returns an `ok: false` result that route
 * handlers can turn into a 503 + action_required envelope via
 * `notConfiguredEnvelope(meta)`.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/magicblock-honest-status.spec.ts
 *
 * No network hits. No route handlers invoked. This is a library-
 * contract test; routes that consume the library get the correct
 * Pattern-10 behaviour for free.
 */

test('isReady() returns false when MAGICBLOCK_PAYMENTS_TOKEN is unset', () => {
    const original = process.env.MAGICBLOCK_PAYMENTS_TOKEN;
    delete process.env.MAGICBLOCK_PAYMENTS_TOKEN;
    try {
        const client = new MagicBlockPaymentsClient();
        expect(client.isReady()).toBe(false);
    } finally {
        if (original !== undefined) process.env.MAGICBLOCK_PAYMENTS_TOKEN = original;
    }
});

test('call() with no token returns ok:false + not configured message', async () => {
    const original = process.env.MAGICBLOCK_PAYMENTS_TOKEN;
    delete process.env.MAGICBLOCK_PAYMENTS_TOKEN;
    try {
        const client = new MagicBlockPaymentsClient();
        const result = await client.call('GET', '/health');
        expect(result.ok).toBe(false);
        expect(isNotConfiguredError(result)).toBe(true);
    } finally {
        if (original !== undefined) process.env.MAGICBLOCK_PAYMENTS_TOKEN = original;
    }
});

test('isNotConfiguredError returns false for network errors', () => {
    const networkResult = { ok: false, body: { error: 'ECONNREFUSED 127.0.0.1:4321' } };
    expect(isNotConfiguredError(networkResult)).toBe(false);
});

test('isNotConfiguredError returns false for ok:true results', () => {
    expect(isNotConfiguredError({ ok: true, status: 200, body: { balance: 0 } })).toBe(false);
});

test('notConfiguredEnvelope produces the Pattern-10 shape', () => {
    const meta = { requestId: 'req_test_abc123', startedAt: '2026-04-20T00:00:00.000Z' };
    const env = notConfiguredEnvelope(meta);
    expect(env.error).toBe('magicblock_not_configured');
    expect(env.errorClass).toBe('provider_unavailable');
    expect(env.recovery).toBe('retry');
    expect(env.requestId).toBe(meta.requestId);
    expect(env.timestamp).toBe(meta.startedAt);
    // action_required is a runbook string — it must contain the env var name
    // so ops can act without reading the source.
    expect(env.action_required).toContain('MAGICBLOCK_PAYMENTS_TOKEN');
    // message + nextAction are user-facing; must not leak env var names.
    expect(env.message).not.toContain('MAGICBLOCK_PAYMENTS_TOKEN');
    expect(env.nextAction).not.toContain('MAGICBLOCK_PAYMENTS_TOKEN');
});

test('paymentsEnabled() returns false unless both flag and token are set', () => {
    const origFlag = process.env.MAGICBLOCK_PAYMENTS_ENABLED;
    const origToken = process.env.MAGICBLOCK_PAYMENTS_TOKEN;
    try {
        delete process.env.MAGICBLOCK_PAYMENTS_ENABLED;
        delete process.env.MAGICBLOCK_PAYMENTS_TOKEN;
        expect(paymentsEnabled()).toBe(false);

        process.env.MAGICBLOCK_PAYMENTS_ENABLED = '1';
        // token still unset
        expect(paymentsEnabled()).toBe(false);

        process.env.MAGICBLOCK_PAYMENTS_TOKEN = 'test-token';
        expect(paymentsEnabled()).toBe(true);

        // flag unset, token set
        delete process.env.MAGICBLOCK_PAYMENTS_ENABLED;
        expect(paymentsEnabled()).toBe(false);
    } finally {
        if (origFlag !== undefined) process.env.MAGICBLOCK_PAYMENTS_ENABLED = origFlag;
        else delete process.env.MAGICBLOCK_PAYMENTS_ENABLED;
        if (origToken !== undefined) process.env.MAGICBLOCK_PAYMENTS_TOKEN = origToken;
        else delete process.env.MAGICBLOCK_PAYMENTS_TOKEN;
    }
});
