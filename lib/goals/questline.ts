import Anthropic from '@anthropic-ai/sdk';
import { safeLog, safeWarn } from '@/lib/safeLog';
import type { QuestlineStep } from './types';

/**
 * Questline generation.
 *
 * Given an operator's free-text goal, build a list of small daily
 * actions. The AI path uses Claude Haiku for cost + speed (questline
 * generation is a write-once, read-many pattern, but a goal page can
 * still be created in front of a user and the latency matters).
 *
 * Fail-soft: if no API key is present, or the model returns something
 * unparseable, we return the fallback questline so the dashboard
 * always renders a sensible plan. We never claim to use AI when we
 * cannot, and we never block a goal creation on the model.
 */

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1024;
const TIMEOUT_MS = 10_000;
const MAX_STEPS = 8;

const SYSTEM_PROMPT = [
    'You design daily questlines for an accountability product called Operator Uplift.',
    'You receive a goal in plain English and produce 4 to 7 dated micro-actions.',
    'Rules:',
    '- Each action is one short imperative sentence (under 90 characters).',
    '- Each action is the smallest possible step the operator will actually do.',
    '- Day 1 is the day of goal creation. Day numbers are 1-indexed integers.',
    '- The first action should be doable in 10 to 20 minutes; later actions can ramp.',
    '- Never include calendar invites, emails, or admin chores. Just behavior.',
    '- Never include vague filler like "stay motivated" or "keep at it".',
    '- Notes (optional) explain the why or the form. Keep them under 120 characters.',
    'Output a strict JSON object with shape {"steps": [{"day": number, "action": string, "notes"?: string}, ...]}.',
    'Do not wrap in markdown. Do not include any prose outside the JSON.',
].join('\n');

/** What lib/goals/db.ts uses when the AI path is unavailable. */
export const FALLBACK_QUESTLINE: QuestlineStep[] = [
    { day: 1, action: 'Take the smallest possible first step', notes: '10 minutes is enough on day one.' },
    { day: 2, action: 'Repeat day 1, slightly longer', notes: 'Consistency beats intensity here.' },
    { day: 3, action: 'Tell one person what you are doing', notes: 'Public commitments stick better.' },
    { day: 7, action: 'Review your first week', notes: 'What worked, what stalled, one tweak.' },
];

/**
 * Generate a questline. Never throws: on any error or missing key,
 * returns FALLBACK_QUESTLINE so the caller can always persist a goal.
 */
export async function generateQuestline(goal: string): Promise<QuestlineStep[]> {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return FALLBACK_QUESTLINE;

    const goalText = goal.trim();
    if (goalText.length === 0) return FALLBACK_QUESTLINE;

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const anthropic = new Anthropic({ apiKey: key });
        const response = await anthropic.messages.create(
            {
                model: MODEL,
                max_tokens: MAX_TOKENS,
                system: SYSTEM_PROMPT,
                messages: [
                    {
                        role: 'user',
                        content: `Goal: ${goalText}\n\nProduce the JSON now.`,
                    },
                ],
            },
            { signal: controller.signal },
        );

        const text = response.content
            .filter((b) => b.type === 'text')
            .map((b) => (b as { type: 'text'; text: string }).text)
            .join('');
        const parsed = parseQuestline(text);
        if (parsed.length === 0) {
            safeWarn({ at: 'goals.questline', event: 'empty_parse', length: text.length });
            return FALLBACK_QUESTLINE;
        }
        safeLog({ at: 'goals.questline', event: 'generated', steps: parsed.length });
        return parsed;
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown';
        safeWarn({ at: 'goals.questline', event: 'generation_failed', err: msg });
        return FALLBACK_QUESTLINE;
    } finally {
        clearTimeout(t);
    }
}

/**
 * Strict JSON parser for the model output. Tolerates markdown fences
 * the model sometimes adds despite instructions; rejects anything
 * else. Pure, no IO; exported for unit testing.
 */
export function parseQuestline(raw: string): QuestlineStep[] {
    const stripped = stripCodeFence(raw).trim();
    if (!stripped) return [];

    let parsed: unknown;
    try {
        parsed = JSON.parse(stripped);
    } catch {
        return [];
    }

    if (!parsed || typeof parsed !== 'object') return [];
    const steps = (parsed as { steps?: unknown }).steps;
    if (!Array.isArray(steps)) return [];

    const cleaned: QuestlineStep[] = [];
    for (const s of steps) {
        if (!s || typeof s !== 'object') continue;
        const candidate = s as { day?: unknown; action?: unknown; notes?: unknown };
        if (typeof candidate.day !== 'number' || !Number.isInteger(candidate.day) || candidate.day < 1) continue;
        if (typeof candidate.action !== 'string') continue;
        const action = candidate.action.trim();
        if (action.length === 0 || action.length > 200) continue;
        const step: QuestlineStep = { day: candidate.day, action };
        if (typeof candidate.notes === 'string' && candidate.notes.trim().length > 0) {
            step.notes = candidate.notes.trim().slice(0, 200);
        }
        cleaned.push(step);
        if (cleaned.length >= MAX_STEPS) break;
    }
    return cleaned;
}

function stripCodeFence(s: string): string {
    // Match either ```json\n...\n``` or ```\n...\n```; tolerant of
    // trailing whitespace before the closing fence.
    const fenced = s.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/);
    return fenced ? fenced[1] : s;
}
