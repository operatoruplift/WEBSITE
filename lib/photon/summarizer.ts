/**
 * Per-user iMessage chat summarizer.
 *
 * Compresses a verified user's recent inbound + reply messages into
 * a 2-3 sentence summary focused on stable facts the agent can use
 * to personalize replies (preferences, ongoing topics, context).
 *
 * Stored in imessage_users.summary; the agent's getSystem() folds
 * it into the system prompt as "prior context: ..." so Claude Haiku
 * can reference earlier conversations even when the 5-turn rolling
 * history doesn't reach back that far.
 *
 * Why a separate summary column instead of just longer history:
 *   - The webhook already loads up to 5 prior turns. Pushing that
 *     to 50 doubles the token cost of every reply.
 *   - A summary is small (a few hundred chars) and stays useful
 *     across many days of chat.
 *   - The summary writer can run on its own cadence (cron / manual)
 *     instead of synchronously per inbound message.
 */
import Anthropic from '@anthropic-ai/sdk';
import { safeWarn } from '@/lib/safeLog';

export interface Turn {
    user: string;
    assistant: string;
}

export interface SummarizeResult {
    ok: true;
    summary: string;
    turnsUsed: number;
}

export interface SummarizeFailure {
    ok: false;
    reason: 'no_api_key' | 'too_few_turns' | 'empty_response' | 'llm_failed';
    message: string;
}

const MIN_TURNS = 3;
const MAX_SUMMARY_TOKENS = 200;
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const DEFAULT_LLM_TIMEOUT_MS = 15_000;

const SYSTEM_PROMPT = [
    'You are summarizing an iMessage chat between a user and an AI agent.',
    'Output 2-3 sentences capturing stable facts that help the agent personalize future replies:',
    'preferences (location, model, tone), ongoing topics, decisions made, things the user is working on.',
    'Skip greetings, status checks ("ping/help/stop"), and one-off questions that have already been answered.',
    'Plain text. No markdown. No quotes. Speak about the user in third person ("the user").',
].join(' ');

/**
 * Compress turns into a 2-3 sentence summary via Claude Haiku.
 * Returns typed failure when the model is unavailable or refuses.
 */
export async function summarizeChat(
    turns: Turn[],
    requestId?: string,
): Promise<SummarizeResult | SummarizeFailure> {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) return failure('no_api_key', 'ANTHROPIC_API_KEY missing');

    const usable = turns.filter(t => t.user?.trim() || t.assistant?.trim());
    if (usable.length < MIN_TURNS) {
        return failure('too_few_turns', `Need at least ${MIN_TURNS} turns; got ${usable.length}`);
    }

    const transcript = usable
        .slice(-25)
        .map((t, i) => `Turn ${i + 1}\nUser: ${(t.user ?? '').slice(0, 500)}\nAgent: ${(t.assistant ?? '').slice(0, 500)}`)
        .join('\n\n');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_LLM_TIMEOUT_MS);
    try {
        const anthropic = new Anthropic({ apiKey });
        const response = await anthropic.messages.create(
            {
                model: process.env.PHOTON_SUMMARY_MODEL?.trim() || DEFAULT_MODEL,
                max_tokens: MAX_SUMMARY_TOKENS,
                system: SYSTEM_PROMPT,
                messages: [{ role: 'user', content: transcript }],
            },
            { signal: controller.signal },
        );
        const summary = response.content
            .filter((b): b is Anthropic.TextBlock => b.type === 'text')
            .map(b => b.text)
            .join(' ')
            .trim();
        if (!summary) return failure('empty_response', 'Model returned no text');
        return { ok: true, summary, turnsUsed: usable.length };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        safeWarn({
            at: 'photon.summarizer',
            event: 'llm_failed',
            requestId,
            error: message.slice(0, 240),
        });
        return failure('llm_failed', message);
    } finally {
        clearTimeout(timer);
    }
}

function failure(reason: SummarizeFailure['reason'], message: string): SummarizeFailure {
    return { ok: false, reason, message };
}
