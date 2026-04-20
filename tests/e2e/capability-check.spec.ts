import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Acceptance spec for scripts/capability-check.mjs.
 *
 * Runs the CLI against tmp fixture dirs so the result doesn't depend
 * on the current state of app/api/tools/ on any given branch.
 *
 * What we verify:
 *   - A route file that calls getCapabilities / verifySession /
 *     requireAuth → pass.
 *   - A route file with an explicit `// capability-check-exempt`
 *     comment → pass.
 *   - A route file with neither → fail with a clear diagnostic.
 *   - Files NOT named route.ts/route.tsx are ignored (subfolders
 *     like `lib.ts` in the same dir don't count).
 */

const SCRIPT = path.resolve(__dirname, '..', '..', 'scripts', 'capability-check.mjs');

function run(args: string[]): { code: number | null; stdout: string; stderr: string } {
    const res = spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' });
    return { code: res.status, stdout: res.stdout || '', stderr: res.stderr || '' };
}

function mkTmp(prefix: string): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), `cap-check-${prefix}-`));
}

test('passes when the route calls getCapabilities', () => {
    const tmp = mkTmp('caps');
    try {
        const dir = path.join(tmp, 'a');
        fs.mkdirSync(dir);
        fs.writeFileSync(
            path.join(dir, 'route.ts'),
            [
                "import { getCapabilities } from '@/lib/capabilities';",
                'export async function POST(request: Request) {',
                '  const caps = await getCapabilities(request);',
                '  return new Response(JSON.stringify({ ok: true }));',
                '}',
            ].join('\n'),
        );
        const { code, stdout } = run([tmp]);
        expect(code).toBe(0);
        expect(stdout).toContain('capability-check: clean');
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});

test('passes when the route calls verifySession', () => {
    const tmp = mkTmp('verify');
    try {
        const dir = path.join(tmp, 'a');
        fs.mkdirSync(dir);
        fs.writeFileSync(
            path.join(dir, 'route.ts'),
            "import { verifySession } from '@/lib/auth';\nexport async function POST(request: Request) {\n  await verifySession(request);\n}\n",
        );
        const { code } = run([tmp]);
        expect(code).toBe(0);
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});

test('passes when the route has capability-check-exempt comment', () => {
    const tmp = mkTmp('exempt');
    try {
        const dir = path.join(tmp, 'a');
        fs.mkdirSync(dir);
        fs.writeFileSync(
            path.join(dir, 'route.ts'),
            '// capability-check-exempt: internal health probe, no user data\nexport async function GET() { return new Response("ok"); }\n',
        );
        const { code } = run([tmp]);
        expect(code).toBe(0);
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});

test('fails when a route has neither auth call nor exempt comment', () => {
    const tmp = mkTmp('fail');
    try {
        const dir = path.join(tmp, 'a');
        fs.mkdirSync(dir);
        fs.writeFileSync(
            path.join(dir, 'route.ts'),
            'export async function POST() { return new Response("oops"); }\n',
        );
        const { code, stderr } = run([tmp]);
        expect(code).toBe(1);
        expect(stderr).toContain('route.ts');
        expect(stderr).toContain('[no-auth-call]');
        expect(stderr).toContain('capability-check: FAIL');
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});

test('ignores non-route files in the same directory', () => {
    const tmp = mkTmp('nonroute');
    try {
        const dir = path.join(tmp, 'a');
        fs.mkdirSync(dir);
        // Helper file without auth; must not trip the check because it's not route.ts.
        fs.writeFileSync(
            path.join(dir, 'helper.ts'),
            'export function foo() { return 1; }\n',
        );
        fs.writeFileSync(
            path.join(dir, 'route.ts'),
            "import { getCapabilities } from '@/lib/capabilities';\nexport async function POST(r: Request) { await getCapabilities(r); }\n",
        );
        const { code, stdout } = run([tmp]);
        expect(code).toBe(0);
        // Only the route.ts file is counted.
        expect(stdout).toContain('Scanned 1 route file');
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});
