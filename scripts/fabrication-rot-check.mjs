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

const ROOTS = ['src', 'app', 'lib', 'public'];
// .json catches user-facing JSON like public/manifest.json, where a
// retired marketing claim slipped through (PRs #339/#340) because the
// scanner only walked source code. Don't add .md broadly: docs/research
// has historical patterns that legitimately reference removed phrases
// for archaeology.
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json']);
const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'build', 'test-results']);
const SKIP_FILE_PATTERNS = [/\.test\./, /\.spec\./, /\.stories\./, /package(-lock)?\.json$/, /pnpm-lock\.yaml$/, /tsconfig.*\.json$/];

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
    // Local-only marketing claims retired across the homepage and
    // dashboard in #227-#234. The web app is Vercel-hosted and
    // routes prompts through Anthropic / OpenAI / Google / xAI /
    // DeepSeek per user selection per turn. The desktop+Ollama path
    // is roadmap-only.
    {
        pattern: /on your machine instead of theirs/i,
        retiredIn: 'PR#232 (MarketOpportunity narrative honesty)',
        message: 'Marketing claim "putting it on your machine instead of theirs" was retired. The web app is cloud-routed; the desktop+Ollama path is roadmap-only.',
    },
    {
        pattern: /Everything lives on your computer/i,
        retiredIn: 'PR#231 (dataService product card honesty)',
        message: 'Product copy "Everything lives on your computer" was retired. Use the export/erase + named third-party providers framing instead.',
    },
    {
        pattern: /AES-256 encrypted local storage/i,
        retiredIn: 'PR#231 (security section honesty)',
        message: '"AES-256 encrypted local storage" was retired. encrypt/decrypt callers from chat session and memory persistence are absent; do not advertise encryption that no production code path uses.',
    },
    {
        pattern: /your data never leaves your environment/i,
        retiredIn: 'PR#231 (security section honesty)',
        message: '"Your data never leaves your environment" was retired. Prompts are sent to whichever provider the user selects per turn, do not reintroduce this claim.',
    },
    // Hero canvas + dashboard + auth + demo + Security badge claims
    // retired in #233, #235, #238, #239. The web app does not encrypt
    // chat sessions or memory at rest (no secureStore callers from
    // those flows), the demo flows through the same cloud pipeline as
    // the rest of the app, and the agent runtime is cloud-backed not
    // local.
    {
        pattern: /vault sealed[^a-zA-Z]+memory encrypted/i,
        retiredIn: 'PR#235 (HeroAnimation canvas honesty)',
        message: 'Hero canvas "vault sealed memory encrypted" text was retired. Memory is not encrypted at rest. New text: "session closed receipt anchored".',
    },
    {
        pattern: /Encrypted on your computer/i,
        retiredIn: 'PR#238 (/security page header honesty)',
        message: 'Dashboard /security page header "Encrypted on your computer Tamper-proof receipts Nothing in the cloud" was retired. The page already discloses lower down that encryption is "Configured" not "Active".',
    },
    {
        pattern: /Your agent ran locally\. Zero cloud\. Zero surveillance/i,
        retiredIn: 'PR#238 (/demo page honesty)',
        message: '/demo step-6 success message "Your agent ran locally. Zero cloud. Zero surveillance." was retired. The demo runs through the same cloud-routed pipeline as the rest of the app.',
    },
    {
        pattern: /\$\{[^}]+\}\s+deployed locally/,
        retiredIn: 'PR#238 (/agents/builder toast honesty)',
        message: '/agents/builder save toast `Agent "${name}" deployed locally!` was retired. The builder writes to localStorage; the agent runtime is cloud-backed.',
    },
    {
        pattern: /AES-256-GCM Encrypted/,
        retiredIn: 'PR#239 (Security card badge honesty)',
        message: 'Security card badge "AES-256-GCM Encrypted" was retired. The card is now about ed25519-signed receipts on Solana, the badge should describe that, not encryption that no production code path uses.',
    },
    {
        pattern: /change:\s*['"]Local,\s+encrypted['"]|change:\s*['"]On your computer['"]/,
        retiredIn: 'PR#233 (/app dashboard stat tile honesty)',
        message: 'Dashboard stat-tile sublabels "Local, encrypted" and "On your computer" were retired. localStorage is browser-scoped, but no encryption is applied. Use "In this browser" instead.',
    },
    {
        pattern: /Local-first AI agents/i,
        retiredIn: 'PR#339 (PWA manifest honesty)',
        message: '"Local-first AI agents" was the old PWA manifest description. The web app is Vercel-routed and not local-first today. Use the consumer pitch: "AI assistant that drafts your email, schedules your meetings..."',
    },
    {
        pattern: /no cloud required/i,
        retiredIn: 'PR#339',
        message: '"no cloud required" is false: the web app routes through Vercel and the AI provider you pick (Anthropic/OpenAI/etc.). Use the upcoming "desktop app routes through Ollama on your machine" framing for that path instead.',
    },
    {
        pattern: /monetize\s+(autonomous\s+)?agents/i,
        retiredIn: 'PR#339',
        message: '"monetize autonomous agents on Solana" is not the consumer pitch any more. The product is an AI assistant for inbox + calendar with signed receipts; agent monetization is not the lead.',
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
