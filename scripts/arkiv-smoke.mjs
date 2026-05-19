#!/usr/bin/env node
/**
 * arkiv-smoke, verify the Arkiv Braga testnet integration end to end.
 *
 * Runs five checks in order and prints a colored pass/fail report:
 *
 *   1. Braga RPC is reachable (HTTP GET to the rpc endpoint).
 *   2. /api/arkiv/agents responds 200 with the documented envelope
 *      (no auth required; honest empty state when nothing published).
 *   3. /api/arkiv/memories?agent=calendar responds 200 with the
 *      sessions index envelope.
 *   4. PROJECT_ATTRIBUTE in lib/arkiv/constants.ts matches the value
 *      the publish script + spec use (a misalignment would orphan
 *      every published entity from our queries).
 *   5. ARKIV_PRIVATE_KEY present (skipped check; warns if absent
 *      since reads work without it).
 *
 * Run:
 *   node scripts/arkiv-smoke.mjs                       # default base = production
 *   ARKIV_SMOKE_BASE=https://preview-...vercel.app \
 *     node scripts/arkiv-smoke.mjs                     # smoke a preview
 *
 * Required env (for the full round-trip):
 *   None for read-only checks. ARKIV_PRIVATE_KEY warns when absent
 *   since the publish script needs it but the dashboard works without.
 *
 * Exit codes:
 *   0  every required check passed (warnings are non-fatal)
 *   1  at least one required check failed
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');

const BASE = process.env.ARKIV_SMOKE_BASE || 'https://www.operatoruplift.com';
const BRAGA_RPC = 'https://braga.hoodi.arkiv.network/rpc';

const FG = {
    red: (s) => `\x1b[31m${s}\x1b[0m`,
    green: (s) => `\x1b[32m${s}\x1b[0m`,
    yellow: (s) => `\x1b[33m${s}\x1b[0m`,
    dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

let failures = 0;
let warnings = 0;

function pass(label, detail) {
    console.log(`  ${FG.green('PASS')}  ${label}${detail ? FG.dim(', ' + detail) : ''}`);
}
function fail(label, detail) {
    failures += 1;
    console.log(`  ${FG.red('FAIL')}  ${label}${detail ? FG.dim(', ' + detail) : ''}`);
}
function warn(label, detail) {
    warnings += 1;
    console.log(`  ${FG.yellow('WARN')}  ${label}${detail ? FG.dim(', ' + detail) : ''}`);
}

console.log(`\narkiv-smoke against ${BASE}\n`);

// 1. Braga RPC reachability
console.log(FG.dim('1. Braga testnet RPC'));
try {
    const res = await fetch(BRAGA_RPC, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_chainId',
            params: [],
            id: 1,
        }),
    });
    if (!res.ok) {
        fail(`POST ${BRAGA_RPC}`, `status ${res.status}`);
    } else {
        const body = await res.json();
        const chainIdHex = body.result;
        const chainId = parseInt(chainIdHex, 16);
        if (chainId === 60138453102) {
            pass('Braga RPC reachable', `chainId ${chainId} matches Braga`);
        } else {
            fail('Braga RPC reachable', `chainId ${chainId} does not match Braga (60138453102)`);
        }
    }
} catch (err) {
    fail('Braga RPC reachable', err.message);
}

// 2. /api/arkiv/agents envelope
console.log(`\n${FG.dim('2. /api/arkiv/agents envelope')}`);
try {
    const res = await fetch(`${BASE}/api/arkiv/agents`);
    if (res.status !== 200) {
        fail(`GET /api/arkiv/agents`, `status ${res.status}`);
    } else {
        const body = await res.json();
        if (!Array.isArray(body.agents)) {
            fail('agents envelope', 'agents is not an array');
        } else if (typeof body.count !== 'number') {
            fail('agents envelope', 'count missing');
        } else if (!body.requestId || !body.requestId.startsWith('req_')) {
            fail('agents envelope', 'requestId missing or malformed');
        } else if (!body.explorer || !body.explorer.includes('explorer.braga.hoodi.arkiv.network')) {
            fail('agents envelope', 'explorer URL missing');
        } else {
            pass('agents envelope', `count=${body.count}, requestId ${body.requestId.slice(0, 12)}...`);
            if (body.count === 0) {
                warn(
                    'no agents published yet',
                    'expected before operator funds ARKIV_PRIVATE_KEY and runs scripts/arkiv/publish-agents.mjs',
                );
            }
        }
    }
} catch (err) {
    fail('GET /api/arkiv/agents', err.message);
}

// 3. /api/arkiv/memories index envelope
console.log(`\n${FG.dim('3. /api/arkiv/memories index envelope')}`);
try {
    const res = await fetch(`${BASE}/api/arkiv/memories?agent=calendar`);
    if (res.status !== 200) {
        fail('GET /api/arkiv/memories?agent=calendar', `status ${res.status}`);
    } else {
        const body = await res.json();
        if (body.mode !== 'index') {
            fail('memories envelope', `mode ${body.mode}, expected index`);
        } else if (body.agentSlug !== 'calendar') {
            fail('memories envelope', `agentSlug ${body.agentSlug}`);
        } else if (!Array.isArray(body.sessions)) {
            fail('memories envelope', 'sessions is not an array');
        } else {
            pass('memories index envelope', `mode=${body.mode}, sessions=${body.sessions.length}`);
        }
    }
} catch (err) {
    fail('GET /api/arkiv/memories', err.message);
}

// 4. PROJECT_ATTRIBUTE coherence (lib vs publish script)
console.log(`\n${FG.dim('4. PROJECT_ATTRIBUTE coherence')}`);
try {
    const constantsSrc = fs.readFileSync(
        path.join(repoRoot, 'lib', 'arkiv', 'constants.ts'),
        'utf-8',
    );
    const constantsMatch = constantsSrc.match(/value:\s*'([^']+)'/);
    const constantValue = constantsMatch ? constantsMatch[1] : null;

    const publishSrc = fs.readFileSync(
        path.join(repoRoot, 'scripts', 'arkiv', 'publish-agents.mjs'),
        'utf-8',
    );
    const publishMatch = publishSrc.match(/value:\s*'([^']+)'/);
    const publishValue = publishMatch ? publishMatch[1] : null;

    if (!constantValue) {
        fail('PROJECT_ATTRIBUTE value', 'lib/arkiv/constants.ts has no value');
    } else if (!publishValue) {
        fail('PROJECT_ATTRIBUTE value', 'scripts/arkiv/publish-agents.mjs has no value');
    } else if (constantValue !== publishValue) {
        fail(
            'PROJECT_ATTRIBUTE coherence',
            `lib=${constantValue}, script=${publishValue} (mismatch orphans entities from queries)`,
        );
    } else {
        pass('PROJECT_ATTRIBUTE coherence', `both use ${constantValue}`);
    }
} catch (err) {
    fail('PROJECT_ATTRIBUTE coherence', err.message);
}

// 5. ARKIV_PRIVATE_KEY presence (operator-side warning)
console.log(`\n${FG.dim('5. ARKIV_PRIVATE_KEY for writes')}`);
if (!process.env.ARKIV_PRIVATE_KEY) {
    warn(
        'ARKIV_PRIVATE_KEY not set in local env',
        'read paths work without it; publish-agents.mjs needs it. Fund a wallet at https://braga.hoodi.arkiv.network/faucet/',
    );
} else {
    if (!process.env.ARKIV_PRIVATE_KEY.match(/^(0x)?[a-fA-F0-9]{64}$/)) {
        fail('ARKIV_PRIVATE_KEY format', 'expected 64 hex chars optionally prefixed with 0x');
    } else {
        pass('ARKIV_PRIVATE_KEY format');
    }
}

console.log(
    `\n${failures === 0 ? FG.green('arkiv-smoke green') : FG.red(`arkiv-smoke FAILED, ${failures} required check(s)`)}` +
        (warnings ? FG.yellow(`, ${warnings} warning(s)`) : ''),
);

process.exit(failures === 0 ? 0 : 1);
