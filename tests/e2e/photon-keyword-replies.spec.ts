import { test, expect } from '@playwright/test';
import { matchKeyword } from '@/lib/photon/keyword-replies';

/**
 * Acceptance spec for the keyword-triggered canned-reply table.
 *
 * Pins:
 *   - Each documented trigger maps to its expected keyword + reply.
 *   - Plain text that contains a keyword as a substring (e.g.
 *     "stop the timer") does NOT match, so the agent still LLM-routes
 *     real requests.
 *   - Long messages (over 32 chars) never match a keyword.
 *   - Empty / whitespace input returns null.
 *   - The opt-out flag fires only on STOP-family triggers.
 */

test('STOP family triggers match and flag opt-out', () => {
    for (const t of ['stop', 'STOP', 'Stop', 'stop please', 'unsubscribe', 'opt out', 'cancel']) {
        const m = matchKeyword(t);
        expect(m, `expected match for "${t}"`).not.toBeNull();
        expect(m?.keyword).toBe('stop');
        expect(m?.optOut).toBe(true);
        expect(m?.reply).toMatch(/no more replies/i);
    }
});

test('START family resumes', () => {
    const m = matchKeyword('start');
    expect(m?.keyword).toBe('start');
    expect(m?.optOut).toBe(false);
});

test('HELP variants return the help reply', () => {
    for (const t of ['help', 'HELP', '?', 'who is this']) {
        const m = matchKeyword(t);
        expect(m?.keyword, `expected help for "${t}"`).toBe('help');
        expect(m?.reply).toContain('Operator Uplift');
    }
});

test('PING variants return the are-you-there reply', () => {
    for (const t of ['ping', 'test', 'are you there', 'hi', 'hello']) {
        const m = matchKeyword(t);
        expect(m?.keyword, `expected ping for "${t}"`).toBe('ping');
    }
});

test('STATUS variants', () => {
    expect(matchKeyword('status')?.keyword).toBe('status');
    expect(matchKeyword('health')?.keyword).toBe('status');
});

test('substring of a keyword does NOT match (real requests still LLM-route)', () => {
    expect(matchKeyword('stop the timer at 9pm')).toBeNull();
    expect(matchKeyword('please help me reschedule')).toBeNull();
    expect(matchKeyword('what is the status of my flight to LAX')).toBeNull();
});

test('messages longer than 32 chars never match', () => {
    const long = 'help'.repeat(20); // 80 chars
    expect(matchKeyword(long)).toBeNull();
});

test('empty / whitespace input returns null', () => {
    expect(matchKeyword('')).toBeNull();
    expect(matchKeyword('   ')).toBeNull();
    expect(matchKeyword(null)).toBeNull();
    expect(matchKeyword(undefined)).toBeNull();
});

test('trailing punctuation is tolerated', () => {
    expect(matchKeyword('help!')?.keyword).toBe('help');
    expect(matchKeyword('help?')?.keyword).toBe('help');
    expect(matchKeyword('STOP.')?.keyword).toBe('stop');
});
