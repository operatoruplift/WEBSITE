#!/usr/bin/env node
/**
 * check — unified runner for all W1B grep-guards.
 *
 * Executes each check in sequence. If a check's script file is missing
 * (e.g. before PR #138/#139/#142 land), it's skipped with a note
 * rather than a failure. When all dependencies are merged this runs
 * the full suite in one shot — the shape a single CI step expects.
 *
 * Ordering is deliberate: copy-check is fastest (pure text scan),
 * capability-check is next (per-route scan of one folder), trust-gate
 * reads through every route.ts in app/api/. Fail-fast by default so a
 * bad copy edit doesn't wait on slower checks.
 *
 * Run:
 *   node scripts/check.mjs           # fail-fast (default)
 *   node scripts/check.mjs --all     # run every check, then report
 *   pnpm check
 *
 * Exit codes:
 *   0 — every check that was present and runnable passed
 *   1 — at least one check exited non-zero, OR a required script
 *       file was expected but unreadable
 *
 * Skipping a missing script prints a SKIP line and is NOT a failure.
 * That keeps this orchestrator safe to merge before its dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const CHECKS = [
    { name: 'copy-check', script: 'scripts/copy-check.mjs' },
    { name: 'capability-check', script: 'scripts/capability-check.mjs' },
    { name: 'trust-gate', script: 'scripts/trust-gate.mjs' },
    { name: 'fabrication-rot', script: 'scripts/fabrication-rot-check.mjs' },
];

const failFast = !process.argv.includes('--all');

function runOne({ name, script }) {
    const abs = path.resolve(script);
    if (!fs.existsSync(abs)) {
        console.log(`[${name}] SKIP  (script not present at ${script})`);
        return { name, status: 'skipped' };
    }
    const res = spawnSync('node', [abs], { stdio: 'inherit' });
    if (res.status === 0) {
        return { name, status: 'pass' };
    }
    return { name, status: 'fail', code: res.status };
}

const results = [];
for (const check of CHECKS) {
    const r = runOne(check);
    results.push(r);
    if (r.status === 'fail' && failFast) break;
}

const passed = results.filter(r => r.status === 'pass').length;
const failed = results.filter(r => r.status === 'fail').length;
const skipped = results.filter(r => r.status === 'skipped').length;
const notRun = CHECKS.length - results.length;

console.log('');
console.log(`check: ${passed} passed, ${failed} failed, ${skipped} skipped${notRun ? `, ${notRun} not run (fail-fast)` : ''}`);
process.exit(failed > 0 ? 1 : 0);
