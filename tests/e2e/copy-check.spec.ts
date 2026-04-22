import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Acceptance spec for scripts/copy-check.mjs.
 *
 * Runs the script as a CLI against temporary fixture dirs so we
 * don't depend on the state of src/ or app/ on master (which still
 * has 263 em-dashes pre-PR-#133).
 *
 * Each test creates an isolated tmp dir, writes a fixture, spawns
 * node on the script, and asserts exit code + stdout/stderr.
 */

const SCRIPT = path.resolve(__dirname, '..', '..', 'scripts', 'copy-check.mjs');

function run(args: string[]): { code: number | null; stdout: string; stderr: string } {
    const res = spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' });
    return { code: res.status, stdout: res.stdout || '', stderr: res.stderr || '' };
}

function mkTmp(prefix: string): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), `copy-check-${prefix}-`));
}

test('exits 0 on a clean fixture', () => {
    const tmp = mkTmp('clean');
    try {
        fs.writeFileSync(path.join(tmp, 'a.tsx'), 'export const x = "hello";\n');
        fs.writeFileSync(path.join(tmp, 'b.ts'), 'export const y = 1;\n');
        const { code, stdout } = run([tmp]);
        expect(code).toBe(0);
        expect(stdout).toContain('copy-check: clean');
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});

test('exits 1 on an em-dash fixture + prints the offending line', () => {
    const tmp = mkTmp('dash');
    try {
        fs.writeFileSync(
            path.join(tmp, 'bad.tsx'),
            'export const line1 = "no dashes";\nexport const line2 = "bad \u2014 em-dash";\n',
        );
        const { code, stderr } = run([tmp]);
        expect(code).toBe(1);
        expect(stderr).toContain('bad.tsx:2');
        expect(stderr).toContain('[em-dash]');
        expect(stderr).toContain('copy-check: FAIL');
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});

test('exits 1 on an en-dash fixture', () => {
    const tmp = mkTmp('endash');
    try {
        fs.writeFileSync(path.join(tmp, 'bad.tsx'), 'export const x = "bad \u2013 en-dash";\n');
        const { code, stderr } = run([tmp]);
        expect(code).toBe(1);
        expect(stderr).toContain('[em-dash]');
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});

test('skips *.test.* / *.spec.* / *.stories.* files by convention', () => {
    const tmp = mkTmp('skip');
    try {
        fs.writeFileSync(path.join(tmp, 'thing.test.tsx'), 'const x = "em \u2014 dash";\n');
        fs.writeFileSync(path.join(tmp, 'thing.spec.tsx'), 'const x = "em \u2014 dash";\n');
        fs.writeFileSync(path.join(tmp, 'thing.stories.tsx'), 'const x = "em \u2014 dash";\n');
        const { code, stdout } = run([tmp]);
        // All three files match skip patterns → scan sees zero files in scope
        expect(code).toBe(0);
        expect(stdout).toContain('copy-check: clean');
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});

test('skips node_modules / .next / dist directories', () => {
    const tmp = mkTmp('skipdir');
    try {
        fs.mkdirSync(path.join(tmp, 'node_modules'));
        fs.mkdirSync(path.join(tmp, '.next'));
        fs.mkdirSync(path.join(tmp, 'dist'));
        fs.writeFileSync(path.join(tmp, 'node_modules', 'x.tsx'), 'const x = "\u2014";\n');
        fs.writeFileSync(path.join(tmp, '.next', 'x.tsx'), 'const x = "\u2014";\n');
        fs.writeFileSync(path.join(tmp, 'dist', 'x.tsx'), 'const x = "\u2014";\n');
        // Root file is NOT skipped and has a dash
        fs.writeFileSync(path.join(tmp, 'root.tsx'), 'const y = "\u2014";\n');
        const { code, stderr } = run([tmp]);
        expect(code).toBe(1);
        // Only the root file should show up, not the skipped dirs
        expect(stderr).toContain('root.tsx');
        expect(stderr).not.toContain('node_modules');
        expect(stderr).not.toContain('.next');
        expect(stderr).not.toContain('dist/');
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});
