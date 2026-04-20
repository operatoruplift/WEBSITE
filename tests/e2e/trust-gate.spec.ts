import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Acceptance spec for scripts/trust-gate.mjs.
 *
 * The gate catches the common regression: a new author imports
 * `@/lib/apiHelpers` but forgets to call `withRequestMeta()`. Every
 * test spins up a tmp route.ts fixture to keep the acceptance
 * independent of the current state of app/api/.
 */

const SCRIPT = path.resolve(__dirname, '..', '..', 'scripts', 'trust-gate.mjs');

function run(args: string[]): { code: number | null; stdout: string; stderr: string } {
    const res = spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' });
    return { code: res.status, stdout: res.stdout || '', stderr: res.stderr || '' };
}

function mkTmp(prefix: string): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), `trust-gate-${prefix}-`));
}

test('passes when a route imports apiHelpers and calls withRequestMeta', () => {
    const tmp = mkTmp('ok');
    try {
        const dir = path.join(tmp, 'a');
        fs.mkdirSync(dir);
        fs.writeFileSync(
            path.join(dir, 'route.ts'),
            [
                "import { withRequestMeta, errorResponse } from '@/lib/apiHelpers';",
                'export async function POST(request: Request) {',
                "  const meta = withRequestMeta(request, 'test');",
                '  return new Response(JSON.stringify({ ok: true }), { headers: meta.headers });',
                '}',
            ].join('\n'),
        );
        const { code, stdout } = run([tmp]);
        expect(code).toBe(0);
        expect(stdout).toContain('trust-gate: clean');
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});

test('fails when a route imports apiHelpers but never calls withRequestMeta', () => {
    const tmp = mkTmp('fail');
    try {
        const dir = path.join(tmp, 'a');
        fs.mkdirSync(dir);
        fs.writeFileSync(
            path.join(dir, 'route.ts'),
            [
                "import { errorResponse } from '@/lib/apiHelpers';",
                "export async function POST() { return new Response('no meta'); }",
            ].join('\n'),
        );
        const { code, stderr } = run([tmp]);
        expect(code).toBe(1);
        expect(stderr).toContain('route.ts');
        expect(stderr).toContain('[missing-withRequestMeta]');
        expect(stderr).toContain('trust-gate: FAIL');
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});

test('passes when a route does not import apiHelpers at all', () => {
    // Non-importers are outside the rule's scope — predate the helper.
    const tmp = mkTmp('noimport');
    try {
        const dir = path.join(tmp, 'a');
        fs.mkdirSync(dir);
        fs.writeFileSync(
            path.join(dir, 'route.ts'),
            'export async function POST() { return new Response("ok"); }\n',
        );
        const { code, stdout } = run([tmp]);
        expect(code).toBe(0);
        // 0 importers, not flagged
        expect(stdout).toContain('0/1 route file');
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});

test('catches withRequestMeta imported-but-not-called', () => {
    // Rare but real regression: author imports the symbol, removes the
    // call during a refactor, doesn't clean up the import.
    const tmp = mkTmp('dead-import');
    try {
        const dir = path.join(tmp, 'a');
        fs.mkdirSync(dir);
        fs.writeFileSync(
            path.join(dir, 'route.ts'),
            [
                "import { withRequestMeta, errorResponse } from '@/lib/apiHelpers';",
                '// withRequestMeta is imported here but never invoked',
                "export async function POST() { return new Response('ok'); }",
            ].join('\n'),
        );
        const { code } = run([tmp]);
        expect(code).toBe(1);
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});

test('ignores non-route.ts files in the same directory', () => {
    const tmp = mkTmp('nonroute');
    try {
        const dir = path.join(tmp, 'a');
        fs.mkdirSync(dir);
        // helper.ts imports apiHelpers but doesn't call withRequestMeta —
        // fine, it's not a route.
        fs.writeFileSync(
            path.join(dir, 'helper.ts'),
            "import { errorResponse } from '@/lib/apiHelpers';\nexport const x = 1;\n",
        );
        fs.writeFileSync(
            path.join(dir, 'route.ts'),
            [
                "import { withRequestMeta } from '@/lib/apiHelpers';",
                'export async function POST(r: Request) {',
                "  const meta = withRequestMeta(r, 'test');",
                '  return new Response(JSON.stringify(meta));',
                '}',
            ].join('\n'),
        );
        const { code, stdout } = run([tmp]);
        expect(code).toBe(0);
        expect(stdout).toContain('1/1 route file');
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});
