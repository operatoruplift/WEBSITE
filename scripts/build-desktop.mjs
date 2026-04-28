#!/usr/bin/env node
/**
 * Desktop build script.
 *
 * Why this exists:
 * The bucharest app has 10 server-side API routes under app/api/ plus 5
 * Next.js convention files at app/ root (sitemap, robots, icon, apple-icon,
 * opengraph-image). Those routes use dynamic IO or generate dynamic routes
 * that cannot be statically pre-rendered, and none are reachable from a
 * desktop DMG. The cleanest fix is to physically hide them from the
 * Next.js app router during `next build`, then put them back.
 *
 * Recovery if this script crashes hard mid-run:
 *   mv app/__api_disabled__ app/api
 *   for f in sitemap.ts robots.ts icon.tsx apple-icon.tsx opengraph-image.tsx; do
 *     mv "app/$f.skip" "app/$f" 2>/dev/null
 *   done
 *
 * Web build (`npm run build`) is unaffected — it never runs this script.
 */
import { renameSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const API_DIR = resolve(ROOT, 'app', 'api');
const HIDDEN_DIR = resolve(ROOT, 'app', '__api_disabled__');

// Convention files at app/ root that generate dynamic routes incompatible
// with `output: export` and have no purpose inside a desktop DMG.
const CONVENTION_FILES = [
    'sitemap.ts',
    'robots.ts',
    'icon.tsx',
    'apple-icon.tsx',
    'opengraph-image.tsx',
];

const conventionPaths = CONVENTION_FILES.map((name) => ({
    real: resolve(ROOT, 'app', name),
    hidden: resolve(ROOT, 'app', `${name}.skip`),
}));

let restored = false;
function restore() {
    if (restored) return;
    if (existsSync(HIDDEN_DIR)) {
        renameSync(HIDDEN_DIR, API_DIR);
        console.log('[build-desktop] restored app/api');
    }
    for (const { real, hidden } of conventionPaths) {
        if (existsSync(hidden)) {
            renameSync(hidden, real);
        }
    }
    restored = true;
}

// Make sure we restore on every exit path, including signals.
process.on('exit', restore);
process.on('SIGINT', () => { restore(); process.exit(130); });
process.on('SIGTERM', () => { restore(); process.exit(143); });
process.on('uncaughtException', (err) => {
    console.error('[build-desktop] uncaught:', err);
    restore();
    process.exit(1);
});

// Refuse to run if a stale __api_disabled__ exists from a previous crashed run.
if (existsSync(HIDDEN_DIR)) {
    console.error(
        '[build-desktop] ERROR: app/__api_disabled__ already exists from a ' +
        'previous run. Recover with:\n  mv app/__api_disabled__ app/api',
    );
    process.exit(1);
}

if (!existsSync(API_DIR)) {
    console.error('[build-desktop] ERROR: app/api not found, nothing to hide');
    process.exit(1);
}

// Refuse to run if any convention file has a stale .skip from a prior crash.
for (const { hidden } of conventionPaths) {
    if (existsSync(hidden)) {
        console.error(
            `[build-desktop] ERROR: ${hidden} already exists from a previous run.`,
        );
        process.exit(1);
    }
}

console.log('[build-desktop] hiding app/api -> app/__api_disabled__');
renameSync(API_DIR, HIDDEN_DIR);

for (const { real, hidden } of conventionPaths) {
    if (existsSync(real)) {
        renameSync(real, hidden);
        console.log(`[build-desktop] hiding ${real.split('/').slice(-2).join('/')}`);
    }
}

const env = { ...process.env, NEXT_PUBLIC_DESKTOP: '1' };
const result = spawnSync('npx', ['next', 'build'], {
    cwd: ROOT,
    env,
    stdio: 'inherit',
});

restore();
process.exit(result.status ?? 1);
