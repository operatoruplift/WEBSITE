#!/usr/bin/env node
/**
 * fabrication-rot-check — guards against regression of fabrication
 * patterns we've explicitly retired.
 *
 * Each rule below is a tuple of (pattern, retired-in-PR, message). If
 * any matches in src/ or app/, the build fails with a clear pointer to
 * the original cleanup PR so a reviewer can see the prior agreement.
 *
 * Why a separate guard from copy-check?
 *   - copy-check enforces stylistic rules (em-dash, banned phrases).
 *   - fabrication-rot enforces honesty contracts: the EXACT values,
 *     formats, or function names that we agreed to never produce again.
 *
 * Adding new rules:
 *   When you ship a PR that retires a fabrication, add the most-
 *   distinctive evidence string here so a future PR can't silently
 *   reintroduce it. Keep patterns SPECIFIC to avoid false positives;
 *   prefer literal strings or well-anchored regexes.
 *
 * Run:
 *   node scripts/fabrication-rot-check.mjs
 *   pnpm fabrication-rot-check
 *
 * Hooked into pnpm check via scripts/check.mjs.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['src', 'app', 'lib'];
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'build', 'test-results']);
const SKIP_FILE_PATTERNS = [/\.test\./, /\.spec\./, /\.stories\./];

/**
 * Each rule = { pattern: RegExp, retiredIn: 'PR#XXX', message: string }.
 * Patterns are anchored where possible to keep false-positive rates low.
 */
const RULES = [
    // Gold Agent fabrication retired in #209 (lib/oro-grail.ts deleted)
    {
        pattern: /balanceOz\s*:\s*0\.0847/,
        retiredIn: 'PR#209 (honesty: retire /api/risk + /api/gold)',
        message: 'Gold Agent fake balance (0.0847 oz) was retired. Do not reintroduce hardcoded gold balances; the API now returns 410 Gone.',
    },
    {
        pattern: /balanceUsd\s*:\s*278\.24/,
        retiredIn: 'PR#209',
        message: 'Gold Agent fake USD balance ($278.24) was retired with /api/gold returning 410 Gone.',
    },
    {
        pattern: /pricePerOz\s*:\s*3284\.50/,
        retiredIn: 'PR#209',
        message: 'Gold Agent fake spot price ($3284.50) was retired.',
    },
    // Webacy fake risk grades retired in #209 (lib/webacy-risk.ts deleted)
    {
        pattern: /grade:\s*['"]A['"][^,]*,\s*flagged:\s*false[^,]*,\s*sanctions:\s*false/,
        retiredIn: 'PR#209',
        message: 'Webacy fake "wallet grade A, not flagged, not sanctioned" fabrication was retired. /api/risk now returns 410 Gone.',
    },
    // Fake x402 tx signature pattern retired in #173
    {
        pattern: /x402-devnet-\$\{Date\.now\(\)\}/,
        retiredIn: 'PR#173 (x402 charge action retired)',
        message: 'Fabricated x402 tx signature (`x402-devnet-${Date.now()}`) was retired. The /api/tools/x402 charge action returns 410 Gone; real settlement lives in /api/tools/x402/pay.',
    },
    // Random-vector fake from /memory page retired in #210
    {
        pattern: /Math\.floor\(Math\.random\(\)\s*\*\s*2000\)\s*\+\s*100/,
        retiredIn: 'PR#210 (memory page no fake seed)',
        message: 'Random fake "vector count" (Math.random()*2000 + 100) on /memory was retired. New nodes use vectors: 0 + lastIndexed: "Pending" until the indexer is connected.',
    },
    // Fake-Pro fall-through in /api/subscription retired in #182
    {
        pattern: /tx_signature:\s*[`'"]x402-devnet-/,
        retiredIn: 'PR#182',
        message: 'Fake-Pro confirm fall-through used a fabricated x402-devnet-* signature. That path was closed; real verification goes through /api/access/verify-payment.',
    },
    // Pre-seeded fake memory titles retired in #210
    {
        pattern: /['"]Operator Uplift Architecture['"][^}]*1240/,
        retiredIn: 'PR#210',
        message: 'Pre-seeded fake "Operator Uplift Architecture" memory node (1240 vectors) was retired. /memory starts empty.',
    },
    // Fake "expires in 30 days" toast retired in #212
    {
        pattern: /API key generated \(expires in 30 days\)/,
        retiredIn: 'PR#212',
        message: 'Settings → API Keys lied about a 30-day expiry. The toast now explains the demo key will not authenticate against /api/* until the auth backend ships.',
    },
    // Fake-install setTimeout retired in #216
    {
        pattern: /alert\(`\$\{agent\.name\}\s+installed\.`\)/,
        retiredIn: 'PR#216',
        message: 'The 2-second setTimeout fake-install on /store was retired. The store now deeplinks into /chat with the agent\'s testPrompt seeded.',
    },
];

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

// A line is treated as a comment if its first non-whitespace content
// is `//`, `*`, `/*`, or `<!--`. Comments referencing retired
// fabrication patterns (audit trail of what we retired and why) are
// allowed; live code that revives the pattern is what fails.
const COMMENT_LINE_RE = /^\s*(\/\/|\/\*|\*|<!--)/;

function scanFile(file) {
    const hits = [];
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    for (const rule of RULES) {
        for (let i = 0; i < lines.length; i += 1) {
            const line = lines[i];
            if (COMMENT_LINE_RE.test(line)) continue;
            if (rule.pattern.test(line)) {
                hits.push({
                    rule: rule.retiredIn,
                    message: rule.message,
                    line: i + 1,
                    text: line.trim(),
                });
            }
        }
    }
    return hits;
}

export function runFabricationRotCheck(roots, { silent = false } = {}) {
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
                console.error(`  ${file}:${h.line}  [${h.rule}]  ${h.text.slice(0, 100)}`);
                console.error(`    why: ${h.message}`);
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
    const { files, totalHits } = runFabricationRotCheck(cliRoots);
    if (totalHits === 0) {
        console.log(`fabrication-rot-check: clean. Scanned ${files} files across ${cliRoots.join(', ')}, ${RULES.length} rules.`);
        process.exit(0);
    }
    console.error(`\nfabrication-rot-check: FAIL. ${totalHits} regression${totalHits === 1 ? '' : 's'}.`);
    console.error('Each match points to the original cleanup PR. Read it, then either remove the pattern or update the rule with a justification.');
    process.exit(1);
}
