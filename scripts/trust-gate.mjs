#!/usr/bin/env node
/**
 * trust-gate — request-meta enforcement for API routes.
 *
 * Rule: when a file imports from `@/lib/apiHelpers`, it must call
 * `withRequestMeta(...)` in the same file. Missing means the route
 * propagates no X-Request-Id and no correlated log line, which
 * silently regresses Pattern 7 (error envelope + requestId).
 *
 * This check is a soft gate — it reports violations but doesn't fail
 * existing non-adopters. Master currently has 40 route.ts files that
 * predate the apiHelpers helper. Flipping the rule to block today
 * would require a 40-file retrofit PR (out of scope here). The gate
 * catches the next new-route author who imports from apiHelpers but
 * forgets to call withRequestMeta — the common failure mode.
 *
 * Run:
 *   node scripts/trust-gate.mjs
 *   pnpm trust-gate
 *   node scripts/trust-gate.mjs <dir> [dir...]
 *
 * Exit codes:
 *   0 — every file importing apiHelpers also calls withRequestMeta
 *   1 — at least one file imports apiHelpers but never calls it
 *
 * v2 (future, separate PR):
 *   - Retrofit the 40 routes to adopt withRequestMeta
 *   - Flip this script's default scope from "importers only" to
 *     "every route.ts under app/api/" (blocking)
 *   - Move the rule into eslint.config.mjs as a `no-restricted-syntax`
 *     rule so editors surface it inline
 */

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_ROOT = 'app/api';
const ROUTE_NAMES = new Set(['route.ts', 'route.tsx']);
// Matches: import { withRequestMeta, ... } from '@/lib/apiHelpers' (any quote, any spacing)
const IMPORT_RE = /from\s+['"]@\/lib\/apiHelpers['"]/;
const CALL_RE = /\bwithRequestMeta\s*\(/;

function walk(dir, out) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full, out);
        } else if (entry.isFile() && ROUTE_NAMES.has(entry.name)) {
            out.push(full);
        }
    }
}

function analyze(file) {
    const content = fs.readFileSync(file, 'utf8');
    const importsApiHelpers = IMPORT_RE.test(content);
    const callsWithRequestMeta = CALL_RE.test(content);
    return { importsApiHelpers, callsWithRequestMeta };
}

/**
 * Programmatic entry for tests.
 *
 * @param {string[]} roots
 * @param {object} opts { silent?: boolean }
 * @returns {{ files: number, importers: number, failures: Array<{ file: string }> }}
 */
export function runTrustGate(roots, { silent = false } = {}) {
    const files = [];
    for (const root of roots) walk(root, files);
    let importers = 0;
    const failures = [];
    for (const file of files) {
        const { importsApiHelpers, callsWithRequestMeta } = analyze(file);
        if (!importsApiHelpers) continue;
        importers += 1;
        if (!callsWithRequestMeta) {
            if (!silent) {
                console.error(`  ${file}  [missing-withRequestMeta]  imports @/lib/apiHelpers but never calls withRequestMeta()`);
            }
            failures.push({ file });
        }
    }
    return { files: files.length, importers, failures };
}

const isDirectRun =
    import.meta.url.startsWith('file:') &&
    path.resolve(process.argv[1] ?? '') === path.resolve(new URL(import.meta.url).pathname);

if (isDirectRun) {
    const cliRoots = process.argv.slice(2).length > 0 ? process.argv.slice(2) : [DEFAULT_ROOT];
    const { files, importers, failures } = runTrustGate(cliRoots);
    if (failures.length === 0) {
        console.log(`trust-gate: clean. ${importers}/${files} route file${files === 1 ? '' : 's'} import @/lib/apiHelpers and all call withRequestMeta.`);
        process.exit(0);
    }
    console.error(`\ntrust-gate: FAIL. ${failures.length} route${failures.length === 1 ? '' : 's'} import @/lib/apiHelpers but never call withRequestMeta().`);
    console.error('Add `const meta = withRequestMeta(request, "<route.name>")` at the top of the handler.');
    process.exit(1);
}
