#!/usr/bin/env node
/**
 * capability-check — grep-level auth guard for tool routes.
 *
 * Rule: every `app/api/tools/<tool>/**\/route.ts` must either
 *   (a) call one of: getCapabilities, verifySession, requireAuth
 *   (b) carry an explicit opt-out comment:
 *         // capability-check-exempt: <reason>
 *
 * Missing both is a FAIL — the route can be reached anonymously and
 * emit a side effect without any auth check. That's the biggest class
 * of security regression we can prevent with a cheap grep.
 *
 * Run:
 *   node scripts/capability-check.mjs          # scan app/api/tools
 *   pnpm capability-check                      # via package.json
 *   node scripts/capability-check.mjs <dir>    # scan a custom dir
 *
 * Exit codes:
 *   0 — all route files either call an auth fn or are explicitly exempt
 *   1 — at least one route is missing both
 *
 * The check runs on ANY file named `route.ts` (or `route.tsx`) under
 * `app/api/tools/`. Other API routes (audit, agents, capabilities,
 * subscription, chat, etc.) are NOT in scope; they have their own
 * dedicated auth rules. This script is tool-routes-only.
 *
 * v2 (future): AST-aware so nested calls through local wrappers are
 * detected. Current v1 is a grep — good enough for the demo-day
 * invariant that tools routes always auth.
 */

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_ROOT = 'app/api/tools';
const ROUTE_NAMES = new Set(['route.ts', 'route.tsx']);
const AUTH_PATTERNS = [
    /\bgetCapabilities\s*\(/,
    /\bverifySession\s*\(/,
    /\brequireAuth\s*\(/,
];
const EXEMPT_PATTERN = /\/\/\s*capability-check-exempt\b/;

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
    const hasAuth = AUTH_PATTERNS.some(rx => rx.test(content));
    const hasExempt = EXEMPT_PATTERN.test(content);
    return { hasAuth, hasExempt };
}

/**
 * Programmatic entry for tests.
 *
 * @param {string[]} roots  Directories to scan (default: ['app/api/tools'])
 * @param {object}   opts   { silent?: boolean }
 * @returns {{ files: number, failures: Array<{ file: string }> }}
 */
export function runCapabilityCheck(roots, { silent = false } = {}) {
    const files = [];
    for (const root of roots) walk(root, files);
    const failures = [];
    for (const file of files) {
        const { hasAuth, hasExempt } = analyze(file);
        if (!hasAuth && !hasExempt) {
            if (!silent) {
                console.error(`  ${file}  [no-auth-call]  neither getCapabilities/verifySession/requireAuth, nor capability-check-exempt`);
            }
            failures.push({ file });
        }
    }
    return { files: files.length, failures };
}

const isDirectRun =
    import.meta.url.startsWith('file:') &&
    path.resolve(process.argv[1] ?? '') === path.resolve(new URL(import.meta.url).pathname);

if (isDirectRun) {
    const cliRoots = process.argv.slice(2).length > 0 ? process.argv.slice(2) : [DEFAULT_ROOT];
    const { files, failures } = runCapabilityCheck(cliRoots);
    if (failures.length === 0) {
        console.log(`capability-check: clean. Scanned ${files} route file${files === 1 ? '' : 's'} under ${cliRoots.join(', ')}.`);
        process.exit(0);
    }
    console.error(`\ncapability-check: FAIL. ${failures.length} route${failures.length === 1 ? '' : 's'} missing an auth check.`);
    console.error('Add getCapabilities / verifySession / requireAuth, OR a `// capability-check-exempt: <reason>` comment.');
    process.exit(1);
}
