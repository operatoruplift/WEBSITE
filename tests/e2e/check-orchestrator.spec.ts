import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Acceptance spec for scripts/check.mjs — the unified W1B check runner.
 *
 * Tests build a tmp directory with fake check scripts (passing + failing
 * combinations) and run the orchestrator against them. Keeps the
 * acceptance hermetic regardless of which W1B grep-guards are present
 * on the current branch.
 *
 * Design note: the orchestrator hard-codes its CHECKS list + paths.
 * These tests copy scripts/check.mjs into a tmp workspace and place
 * fake check scripts at the expected paths so the CHECKS array resolves
 * them. This proves the orchestrator's contract (run, skip-if-missing,
 * fail-propagate, fail-fast) without coupling to the real scripts.
 */

const SCRIPT_SRC = path.resolve(__dirname, '..', '..', 'scripts', 'check.mjs');

interface Scenario {
    scripts: Record<string, { exitCode: number }>;
    args?: string[];
}

function runInTmp({ scripts, args = [] }: Scenario): { code: number | null; stdout: string; stderr: string } {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check-orch-'));
    try {
        const scriptsDir = path.join(tmp, 'scripts');
        fs.mkdirSync(scriptsDir);
        // Copy the real orchestrator in so it resolves relative paths inside tmp.
        fs.copyFileSync(SCRIPT_SRC, path.join(scriptsDir, 'check.mjs'));
        // Write each fake check script to the expected path.
        for (const [name, spec] of Object.entries(scripts)) {
            fs.writeFileSync(
                path.join(scriptsDir, `${name}.mjs`),
                `process.exit(${spec.exitCode});\n`,
            );
        }
        const res = spawnSync('node', [path.join(scriptsDir, 'check.mjs'), ...args], {
            cwd: tmp,
            encoding: 'utf8',
        });
        return { code: res.status, stdout: res.stdout || '', stderr: res.stderr || '' };
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
}

test('skips missing scripts with exit 0', () => {
    // No scripts present — orchestrator should report 3 SKIPs and exit 0.
    const { code, stdout } = runInTmp({ scripts: {} });
    expect(code).toBe(0);
    expect(stdout).toContain('[copy-check] SKIP');
    expect(stdout).toContain('[capability-check] SKIP');
    expect(stdout).toContain('[trust-gate] SKIP');
    expect(stdout).toContain('0 passed, 0 failed, 3 skipped');
});

test('passes when every present check exits 0', () => {
    const { code, stdout } = runInTmp({
        scripts: {
            'copy-check': { exitCode: 0 },
            'capability-check': { exitCode: 0 },
            'trust-gate': { exitCode: 0 },
        },
    });
    expect(code).toBe(0);
    expect(stdout).toContain('3 passed, 0 failed');
});

test('fail-fast: stops after the first failing check', () => {
    const { code, stdout } = runInTmp({
        scripts: {
            'copy-check': { exitCode: 1 },
            'capability-check': { exitCode: 0 },
            'trust-gate': { exitCode: 0 },
        },
    });
    expect(code).toBe(1);
    // Default fail-fast: only copy-check ran before the bail.
    expect(stdout).toContain('0 passed, 1 failed');
    expect(stdout).toContain('2 not run (fail-fast)');
});

test('--all runs every check even after a failure', () => {
    const { code, stdout } = runInTmp({
        scripts: {
            'copy-check': { exitCode: 1 },
            'capability-check': { exitCode: 0 },
            'trust-gate': { exitCode: 1 },
        },
        args: ['--all'],
    });
    expect(code).toBe(1);
    expect(stdout).toContain('1 passed, 2 failed');
    expect(stdout).not.toContain('not run');
});

test('mix of skipped + passing + failing reports accurately', () => {
    const { code, stdout } = runInTmp({
        scripts: {
            'copy-check': { exitCode: 0 },
            // capability-check intentionally missing
            'trust-gate': { exitCode: 1 },
        },
        args: ['--all'],
    });
    expect(code).toBe(1);
    expect(stdout).toContain('1 passed, 1 failed, 1 skipped');
});
