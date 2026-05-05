#!/usr/bin/env node
/**
 * photon-smoke — verify the iMessage agent setup before relying on it.
 *
 * Runs five checks in order and prints a colored pass/fail report:
 *
 *   1. Webhook URL is reachable (GET /api/webhooks/photon → 200).
 *   2. Webhook accepts a POST without a signed secret (sanity).
 *   3. Optional signed POST against PHOTON_WEBHOOK_SECRET if set.
 *   4. Adapter env vars (PHOTON_PROJECT_ID, PHOTON_API_KEY) present.
 *   5. ANTHROPIC_API_KEY present, otherwise the agent falls back to
 *      a fixed-string ack instead of producing a Claude Haiku reply.
 *
 * Run:
 *   node scripts/photon-smoke.mjs                       # default base = production
 *   PHOTON_SMOKE_BASE=https://preview-...vercel.app \
 *     node scripts/photon-smoke.mjs                     # smoke a preview
 *
 * Exit codes:
 *   0 — every required check passed (warnings are non-fatal)
 *   1 — at least one required check failed
 *
 * "Required" = anything that would prevent the bot from replying to
 * a real iMessage. PHOTON_WEBHOOK_SECRET is optional (warn-only).
 */

import { setTimeout as wait } from 'node:timers/promises';
import { createHmac } from 'node:crypto';

const BASE = process.env.PHOTON_SMOKE_BASE || 'https://www.operatoruplift.com';

const FG = {
    red: (s) => `\x1b[31m${s}\x1b[0m`,
    green: (s) => `\x1b[32m${s}\x1b[0m`,
    yellow: (s) => `\x1b[33m${s}\x1b[0m`,
    dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

let failures = 0;
let warnings = 0;

function pass(label, detail) {
    console.log(`  ${FG.green('PASS')}  ${label}${detail ? FG.dim(' — ' + detail) : ''}`);
}

function fail(label, detail) {
    failures += 1;
    console.log(`  ${FG.red('FAIL')}  ${label}${detail ? FG.dim(' — ' + detail) : ''}`);
}

function warn(label, detail) {
    warnings += 1;
    console.log(`  ${FG.yellow('WARN')}  ${label}${detail ? FG.dim(' — ' + detail) : ''}`);
}

async function fetchWithTimeout(url, init, timeoutMs = 10_000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

async function checkLiveness() {
    console.log(`\n${FG.dim('1)')} GET ${BASE}/api/webhooks/photon`);
    try {
        const res = await fetchWithTimeout(`${BASE}/api/webhooks/photon`);
        if (res.status !== 200) return fail('liveness GET', `status ${res.status}`);
        const body = await res.json().catch(() => null);
        if (!body || body.ok !== true) return fail('liveness GET', 'unexpected body shape');
        return pass('liveness GET', 'route alive');
    } catch (err) {
        return fail('liveness GET', err.message || String(err));
    }
}

async function checkUnsignedPost() {
    console.log(`\n${FG.dim('2)')} POST ${BASE}/api/webhooks/photon (unsigned)`);
    try {
        const res = await fetchWithTimeout(
            `${BASE}/api/webhooks/photon`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender: '+15550100100', text: 'smoke', platform: 'imessage' }),
            },
            15_000,
        );
        if (res.status === 401) return warn('unsigned POST', 'route requires a signature; run check 3');
        if (res.status !== 200) return fail('unsigned POST', `status ${res.status}`);
        const body = await res.json().catch(() => ({}));
        const detail = body.logged === false && body.reason
            ? `200 + logged:false (${String(body.reason).slice(0, 80)})`
            : '200';
        return pass('unsigned POST', detail);
    } catch (err) {
        return fail('unsigned POST', err.message || String(err));
    }
}

async function checkSignedPost() {
    const secret = process.env.PHOTON_WEBHOOK_SECRET;
    console.log(`\n${FG.dim('3)')} POST ${BASE}/api/webhooks/photon (signed)`);
    if (!secret) {
        return warn('signed POST', 'PHOTON_WEBHOOK_SECRET not set in this shell; skipping');
    }
    const body = JSON.stringify({ sender: '+15550100200', text: 'smoke', platform: 'imessage' });
    const sig = createHmac('sha256', secret).update(body).digest('hex');
    try {
        const res = await fetchWithTimeout(
            `${BASE}/api/webhooks/photon`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Photon-Signature': `sha256=${sig}`,
                },
                body,
            },
            15_000,
        );
        if (res.status !== 200) return fail('signed POST', `status ${res.status}`);
        return pass('signed POST', 'webhook accepted the HMAC');
    } catch (err) {
        return fail('signed POST', err.message || String(err));
    }
}

function checkLocalAdapterEnv() {
    console.log(`\n${FG.dim('4)')} Photon adapter env (local shell)`);
    const projectId = process.env.PHOTON_PROJECT_ID?.trim();
    const apiKey = process.env.PHOTON_API_KEY?.trim() || process.env.PHOTON_TOKEN?.trim();
    if (!projectId) {
        return warn('PHOTON_PROJECT_ID', 'unset locally — set in Vercel env if not already');
    }
    if (!apiKey) {
        return warn('PHOTON_API_KEY', 'unset locally — set in Vercel env if not already');
    }
    return pass('Photon adapter env', 'PHOTON_PROJECT_ID + PHOTON_API_KEY present');
}

function checkLocalAnthropicEnv() {
    console.log(`\n${FG.dim('5)')} Anthropic agent env (local shell)`);
    const key = process.env.ANTHROPIC_API_KEY?.trim();
    if (!key) {
        return warn('ANTHROPIC_API_KEY', 'unset locally — Vercel env must have it or the agent falls back to a fixed-string ack');
    }
    if (!key.startsWith('sk-ant-')) {
        return warn('ANTHROPIC_API_KEY', 'present but does not look like an Anthropic key');
    }
    return pass('Anthropic key', 'present and well-formed');
}

(async function main() {
    console.log(`\nPhoton iMessage agent smoke test against ${FG.dim(BASE)}\n`);
    await checkLiveness();
    await wait(150);
    await checkUnsignedPost();
    await wait(150);
    await checkSignedPost();
    checkLocalAdapterEnv();
    checkLocalAnthropicEnv();

    console.log('');
    if (failures > 0) {
        console.log(`${FG.red('✘')} ${failures} required check(s) failed${warnings ? `, ${warnings} warning(s)` : ''}`);
        process.exit(1);
    }
    if (warnings > 0) {
        console.log(`${FG.yellow('!')} ${warnings} warning(s); see docs/imessage-agent-runbook.md`);
        process.exit(0);
    }
    console.log(`${FG.green('✔')} All checks passed`);
    process.exit(0);
})().catch((err) => {
    console.error('photon-smoke crashed:', err);
    process.exit(2);
});
