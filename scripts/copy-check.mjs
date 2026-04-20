#!/usr/bin/env node
/**
 * copy-check — v1 enforces the em-dash rule from docs/research/COPY_RULES.md.
 *
 * Rule (v1): no em-dash (—) or en-dash (–) anywhere in src/ or app/.
 * Exits 0 when clean, 1 on violations with per-file line output.
 *
 * Run:
 *   node scripts/copy-check.mjs
 *   pnpm copy-check       # via package.json script
 *
 * Wiring into CI:
 *   Add a step `pnpm copy-check` to whatever workflow runs on PR.
 *   The script prints a one-line summary + offending lines so the CI
 *   log stays readable.
 *
 * Scope:
 *   Recursive under src/ and app/
 *   Extensions: .ts, .tsx, .js, .jsx
 *   Skips: node_modules, .next, dist, build, test-results, *.test.*,
 *          *.spec.*, *.stories.*
 *
 * v2 (future): add a "Demo" word check inside JSX text nodes only. The
 * naive `/Demo/` grep is too noisy on comments, variable names, and
 * type names; an AST-aware check lives in a follow-up PR.
 *
 * Why Node (not bash):
 *   Cross-platform. Future Windows/CI runners won't need bash.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['src', 'app'];
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'build', 'test-results']);
const SKIP_FILE_PATTERNS = [/\.test\./, /\.spec\./, /\.stories\./];

const DASH_RE = /[—–]/;

function walk(dir, out) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name)) continue;
            walk(full, out);
        } else if (entry.isFile()) {
            if (SKIP_FILE_PATTERNS.some(rx => rx.test(entry.name))) continue;
            if (EXTS.has(path.extname(entry.name))) out.push(full);
        }
    }
}

function scanFile(file) {
    const hits = [];
    const content = fs.readFileSync(file, 'utf8');
    content.split('\n').forEach((line, i) => {
        if (DASH_RE.test(line)) hits.push({ rule: 'em-dash', line: i + 1, text: line.trim() });
    });
    return hits;
}

/**
 * Programmatic entry for tests and future AST-aware rules.
 *
 * @param {string[]} roots  Directories to scan
 * @param {object}   opts   { silent?: boolean }
 * @returns {{ files: number, totalHits: number, hits: Array }}
 */
export function runCopyCheck(roots, { silent = false } = {}) {
    const files = [];
    for (const root of roots) {
        if (fs.existsSync(root)) walk(root, files);
    }
    let totalHits = 0;
    const allHits = [];
    for (const file of files) {
        const hits = scanFile(file);
        for (const h of hits) {
            if (!silent) {
                console.error(`  ${file}:${h.line}  [${h.rule}]  ${h.text.slice(0, 120)}`);
            }
            totalHits += 1;
            allHits.push({ file, ...h });
        }
    }
    return { files: files.length, totalHits, hits: allHits };
}

const isDirectRun =
    import.meta.url.startsWith('file:') &&
    path.resolve(process.argv[1] ?? '') === path.resolve(new URL(import.meta.url).pathname);

if (isDirectRun) {
    const cliRoots = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ROOTS;
    const { files, totalHits } = runCopyCheck(cliRoots);
    if (totalHits === 0) {
        console.log(`copy-check: clean. Scanned ${files} files across ${cliRoots.join(', ')}.`);
        process.exit(0);
    }
    console.error(`\ncopy-check: FAIL. ${totalHits} em-dash violation${totalHits === 1 ? '' : 's'}.`);
    console.error('Replace with commas or periods. See docs/research/COPY_RULES.md.');
    process.exit(1);
}
