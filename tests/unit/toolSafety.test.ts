import { test, expect } from '@playwright/test';
import { classifyToolAction, isKnownAction } from '@/lib/toolSafety';

/**
 * W1A-trust-1 acceptance — the approval UI behaves differently for SAFE
 * vs RISKY actions and flags UNKNOWN actions so the stronger-confirmation
 * copy renders. Locks in the fail-closed default.
 *
 * Run: pnpm exec playwright test tests/unit/toolSafety.test.ts
 */

test('SAFE: read-only calendar and gmail actions', () => {
    expect(classifyToolAction({ toolName: 'calendar', operation: 'list' })).toBe('SAFE');
    expect(classifyToolAction({ toolName: 'calendar', operation: 'free_slots' })).toBe('SAFE');
    expect(classifyToolAction({ toolName: 'gmail', operation: 'list' })).toBe('SAFE');
    expect(classifyToolAction({ toolName: 'gmail', operation: 'read' })).toBe('SAFE');
    expect(classifyToolAction({ toolName: 'tokens', operation: 'price' })).toBe('SAFE');
    expect(classifyToolAction({ toolName: 'web', operation: 'fetch' })).toBe('SAFE');
});

test('RISKY: writes, sends, and payments', () => {
    expect(classifyToolAction({ toolName: 'calendar', operation: 'create' })).toBe('RISKY');
    expect(classifyToolAction({ toolName: 'gmail', operation: 'send' })).toBe('RISKY');
    expect(classifyToolAction({ toolName: 'gmail', operation: 'send_draft' })).toBe('RISKY');
    expect(classifyToolAction({ toolName: 'imessage', operation: 'send' })).toBe('RISKY');
    expect(classifyToolAction({ toolName: 'x402', operation: 'pay' })).toBe('RISKY');
});

test('UNKNOWN: unclassified tool falls back to RISKY', () => {
    // The exact acceptance test from the brief: mysteryTool → RISKY.
    expect(classifyToolAction({ toolName: 'mysteryTool' })).toBe('RISKY');
    expect(classifyToolAction({ toolName: 'mysteryTool', operation: 'doStuff' })).toBe('RISKY');
});

test('UNKNOWN: typo in known toolName falls back to RISKY', () => {
    expect(classifyToolAction({ toolName: 'gmaill', operation: 'list' })).toBe('RISKY');
    expect(classifyToolAction({ toolName: 'calender', operation: 'list' })).toBe('RISKY');
});

test('UNKNOWN: unmapped operation on a known tool falls back to RISKY', () => {
    expect(classifyToolAction({ toolName: 'calendar', operation: 'decline' })).toBe('RISKY');
    expect(classifyToolAction({ toolName: 'gmail', operation: 'archive' })).toBe('RISKY');
});

test('isKnownAction distinguishes mapped vs fallback RISKY', () => {
    expect(isKnownAction({ toolName: 'calendar', operation: 'list' })).toBe(true);
    expect(isKnownAction({ toolName: 'gmail', operation: 'send' })).toBe(true);
    expect(isKnownAction({ toolName: 'mysteryTool' })).toBe(false);
    expect(isKnownAction({ toolName: 'calendar', operation: 'decline' })).toBe(false);
});

test('malformed input: empty or missing toolName defaults to RISKY', () => {
    expect(classifyToolAction({ toolName: '' })).toBe('RISKY');
    // @ts-expect-error deliberate bad input to exercise the guard
    expect(classifyToolAction(undefined)).toBe('RISKY');
    // @ts-expect-error deliberate bad input to exercise the guard
    expect(classifyToolAction(null)).toBe('RISKY');
});
