import { test, expect } from '@playwright/test';
import { parseQuestline, FALLBACK_QUESTLINE } from '@/lib/goals/questline';

test.describe.configure({ timeout: 15_000 });

/**
 * Pure-function tests for the AI questline parser. No network.
 *
 * The parser is the trust boundary between the LLM and the database;
 * if it accepts garbage, garbage lands in JSONB and the dashboard
 * renders nonsense. If it rejects valid output, the fallback fires
 * and we never see the AI personalization the user paid for.
 */

test('parseQuestline accepts a clean JSON object', () => {
    const json = JSON.stringify({
        steps: [
            { day: 1, action: '20 minutes easy run', notes: 'Aim for conversational pace.' },
            { day: 2, action: 'Strength: bodyweight 20 minutes' },
        ],
    });
    const out = parseQuestline(json);
    expect(out).toHaveLength(2);
    expect(out[0].day).toBe(1);
    expect(out[0].notes).toContain('conversational');
    expect(out[1].notes).toBeUndefined();
});

test('parseQuestline strips a ```json code fence', () => {
    const fenced = '```json\n{"steps":[{"day":1,"action":"Walk 15 min"}]}\n```';
    const out = parseQuestline(fenced);
    expect(out).toHaveLength(1);
    expect(out[0].action).toBe('Walk 15 min');
});

test('parseQuestline strips a bare ``` code fence', () => {
    const fenced = '```\n{"steps":[{"day":2,"action":"Read 20 pages"}]}\n```';
    const out = parseQuestline(fenced);
    expect(out).toHaveLength(1);
    expect(out[0].action).toBe('Read 20 pages');
});

test('parseQuestline returns [] for unparseable JSON', () => {
    expect(parseQuestline('not json at all')).toEqual([]);
    expect(parseQuestline('{"steps": [oops]}')).toEqual([]);
});

test('parseQuestline returns [] for a top-level array (wrong shape)', () => {
    // The contract is {"steps": [...]} so the model can be extended
    // with siblings later (e.g. {"summary": "..."}). A bare array
    // breaks that contract; better to reject and let fallback fire.
    expect(parseQuestline('[{"day":1,"action":"x"}]')).toEqual([]);
});

test('parseQuestline rejects steps missing day', () => {
    const json = JSON.stringify({
        steps: [
            { action: 'no day' },
            { day: 2, action: 'has day' },
        ],
    });
    const out = parseQuestline(json);
    expect(out).toHaveLength(1);
    expect(out[0].day).toBe(2);
});

test('parseQuestline rejects steps with non-positive day', () => {
    const json = JSON.stringify({
        steps: [
            { day: 0, action: 'day zero' },
            { day: -1, action: 'negative day' },
            { day: 1.5, action: 'fractional day' },
            { day: 1, action: 'valid' },
        ],
    });
    const out = parseQuestline(json);
    expect(out).toHaveLength(1);
});

test('parseQuestline rejects steps with empty or absurdly long action', () => {
    const json = JSON.stringify({
        steps: [
            { day: 1, action: '' },
            { day: 2, action: '   ' },
            { day: 3, action: 'x'.repeat(250) },
            { day: 4, action: 'valid' },
        ],
    });
    const out = parseQuestline(json);
    expect(out).toHaveLength(1);
    expect(out[0].day).toBe(4);
});

test('parseQuestline caps the questline at MAX_STEPS', () => {
    const big = {
        steps: Array.from({ length: 20 }, (_, i) => ({ day: i + 1, action: `Day ${i + 1}` })),
    };
    const out = parseQuestline(JSON.stringify(big));
    expect(out.length).toBeLessThanOrEqual(8);
});

test('parseQuestline trims and bounds notes', () => {
    const json = JSON.stringify({
        steps: [
            { day: 1, action: 'a', notes: '  short  ' },
            { day: 2, action: 'b', notes: 'y'.repeat(500) },
            { day: 3, action: 'c', notes: '' },
        ],
    });
    const out = parseQuestline(json);
    expect(out[0].notes).toBe('short');
    expect(out[1].notes!.length).toBeLessThanOrEqual(200);
    expect(out[2].notes).toBeUndefined();
});

test('FALLBACK_QUESTLINE exists and has at least three steps', () => {
    expect(FALLBACK_QUESTLINE.length).toBeGreaterThanOrEqual(3);
    for (const step of FALLBACK_QUESTLINE) {
        expect(step.day).toBeGreaterThanOrEqual(1);
        expect(typeof step.action).toBe('string');
        expect(step.action.length).toBeGreaterThan(0);
    }
});
