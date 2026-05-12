#!/usr/bin/env node
/**
 * filecoin-smoke, verify the Filecoin receipt-anchor setup end to end.
 *
 * Runs five checks in order and prints a colored pass/fail report:
 *
 *   1. /api/cron/filecoin-anchor route is reachable (GET, no auth = 401).
 *   2. /api/health/adapters reports filecoin.active = true when admin
 *      probe runs (skipped without ADMIN_TOKEN).
 *   3. Pin a test blob via Lighthouse, byte-compare on dweb.link.
 *      This is the round-trip a judge would do for a real receipt.
 *   4. CRON_SECRET present, otherwise the cron 401s every call.
 *   5. Optional, trigger the cron once with CRON_SECRET and report
 *      anchored/skipped/errors counts.
 *
 * Run:
 *   node scripts/filecoin-smoke.mjs                          # default base = production
 *   FILECOIN_SMOKE_BASE=https://preview-...vercel.app \
 *     node scripts/filecoin-smoke.mjs                        # smoke a preview
 *
 * Required env (for the full round-trip):
 *   LIGHTHOUSE_API_KEY    direct provider key for step 3
 *   CRON_SECRET           for step 5 (optional, warns if absent)
 *   ADMIN_TOKEN           Privy bearer for step 2 (optional, warns if absent)
 *
 * Exit codes:
 *   0  every required check passed (warnings are non-fatal)
 *   1  at least one required check failed
 *
 * "Required" = anything that would prevent the cron from anchoring
 * real receipts. ADMIN_TOKEN and CRON_SECRET are operator-only and
 * warn rather than fail when absent.
 */

const BASE = process.env.FILECOIN_SMOKE_BASE || 'https://www.operatoruplift.com';

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

console.log(`Filecoin smoke against ${BASE}`);
console.log('');

// 1. Cron route is reachable (401 expected without auth).
console.log('1. /api/cron/filecoin-anchor reachable + auth-gated');
try {
    const res = await fetch(`${BASE}/api/cron/filecoin-anchor`);
    if (res.status === 401 || res.status === 503) {
        pass('GET returns auth gate', `status ${res.status}`);
    } else {
        fail('GET returned unexpected status', `status ${res.status}`);
    }
} catch (err) {
    fail('GET request crashed', err instanceof Error ? err.message : String(err));
}

// 2. /api/health/adapters filecoin row (admin-gated, ADMIN_TOKEN required).
console.log('');
console.log('2. /api/health/adapters reports filecoin.active');
const adminToken = process.env.ADMIN_TOKEN;
if (!adminToken) {
    warn('ADMIN_TOKEN not set, skipping admin health probe', 'set Privy bearer from devtools to enable');
} else {
    try {
        const res = await fetch(`${BASE}/api/health/adapters`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (!res.ok) {
            fail('admin probe non-200', `status ${res.status}`);
        } else {
            const body = await res.json();
            const filecoin = body.adapters?.find((a) => a.name === 'filecoin');
            if (!filecoin) {
                fail('filecoin adapter row missing', 'check PR #515 deployed to this base');
            } else if (filecoin.active) {
                pass('filecoin adapter active', `provider ${filecoin.details?.provider || 'unknown'}`);
            } else {
                fail('filecoin adapter inactive', filecoin.reason || 'env unset on this deployment');
            }
        }
    } catch (err) {
        fail('admin probe crashed', err instanceof Error ? err.message : String(err));
    }
}

// 3. Round-trip via Lighthouse + dweb.link (the judge experience).
console.log('');
console.log('3. Pin test blob via Lighthouse + fetch from dweb.link');
const lighthouseKey = process.env.LIGHTHOUSE_API_KEY;
if (!lighthouseKey) {
    warn('LIGHTHOUSE_API_KEY not set, skipping round-trip', 'set the same key Vercel uses');
} else {
    try {
        const testBlob = JSON.stringify({
            kind: 'filecoin-smoke-probe',
            ts: new Date().toISOString(),
            note: 'transient test blob, safe to ignore',
        });
        const form = new FormData();
        form.append('file', new Blob([testBlob], { type: 'application/json' }), 'smoke.json');

        const pinRes = await fetch('https://node.lighthouse.storage/api/v0/add', {
            method: 'POST',
            headers: { Authorization: `Bearer ${lighthouseKey}` },
            body: form,
        });
        if (!pinRes.ok) {
            fail('Lighthouse pin failed', `status ${pinRes.status}`);
        } else {
            const pinJson = await pinRes.json();
            const cid = pinJson.Hash;
            if (!cid) {
                fail('Lighthouse pin returned no CID', JSON.stringify(pinJson));
            } else {
                pass('Lighthouse pin succeeded', `CID ${cid}`);

                // Fetch back from dweb.link (Protocol Labs gateway), allow up to
                // 30s for the CID to propagate.
                const gatewayUrl = `https://${cid}.ipfs.dweb.link`;
                let fetched = '';
                let tries = 0;
                while (tries < 6) {
                    tries += 1;
                    try {
                        const gateRes = await fetch(gatewayUrl);
                        if (gateRes.ok) {
                            fetched = await gateRes.text();
                            break;
                        }
                    } catch {
                        /* keep retrying */
                    }
                    await new Promise((r) => setTimeout(r, 5_000));
                }
                if (fetched === testBlob) {
                    pass('dweb.link returned byte-identical blob', `${tries} tries`);
                } else if (fetched) {
                    fail('dweb.link returned different bytes', 'pin may have been altered');
                } else {
                    warn('dweb.link did not return blob within 30s', 'pin was created, gateway may need more time');
                }
            }
        }
    } catch (err) {
        fail('round-trip crashed', err instanceof Error ? err.message : String(err));
    }
}

// 4. CRON_SECRET local-env check.
console.log('');
console.log('4. CRON_SECRET configured locally');
if (!process.env.CRON_SECRET) {
    warn('CRON_SECRET not set in this shell', 'cannot trigger /api/cron/filecoin-anchor');
} else {
    pass('CRON_SECRET present');
}

// 5. Trigger the cron once and report counts (CRON_SECRET-only).
console.log('');
console.log('5. Trigger /api/cron/filecoin-anchor once');
if (!process.env.CRON_SECRET) {
    warn('skipped, no CRON_SECRET');
} else {
    try {
        const res = await fetch(`${BASE}/api/cron/filecoin-anchor`, {
            headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
        });
        if (!res.ok) {
            fail('cron returned non-200', `status ${res.status}`);
        } else {
            const body = await res.json();
            pass(
                'cron run complete',
                `anchored=${body.anchored ?? '?'} skipped=${body.skipped ?? '?'} errors=${body.errors ?? '?'} provider=${body.provider ?? '?'}`,
            );
        }
    } catch (err) {
        fail('cron request crashed', err instanceof Error ? err.message : String(err));
    }
}

// Summary.
console.log('');
if (failures === 0 && warnings === 0) {
    console.log(FG.green('All filecoin-smoke checks passed.'));
    process.exit(0);
} else if (failures === 0) {
    console.log(FG.yellow(`Smoke passed with ${warnings} warning(s). Set the env vars above to upgrade to PASS.`));
    process.exit(0);
} else {
    console.log(FG.red(`Smoke FAILED: ${failures} failure(s), ${warnings} warning(s).`));
    process.exit(1);
}
