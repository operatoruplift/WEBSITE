/**
 * Per-sender chat history loader for the iMessage agent.
 *
 * Returns the last N completed turns (rows where both inbound text
 * and reply_text are non-null) so runAgentReply can hand multi-turn
 * context to Claude Haiku. Rows with a missing reply_text (the agent
 * couldn't respond, or the row predates the reply_text column) are
 * skipped so the resulting array is guaranteed alternating
 * user/assistant.
 *
 * Tolerant of the legacy schema: if the SELECT errors with
 * "column reply_text does not exist", returns an empty history so
 * the agent falls back to one-shot mode.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { safeWarn } from '@/lib/safeLog';

export interface ChatTurn {
    user: string;
    assistant: string;
}

const MAX_TEXT_LEN = 2000;

export async function loadHistory(
    supabase: SupabaseClient | null,
    sender: string,
    limit: number,
    requestId?: string,
): Promise<ChatTurn[]> {
    if (!supabase) return [];
    const trimmed = sender.trim();
    if (!trimmed || limit <= 0) return [];

    const { data, error } = await supabase
        .from('inbound_messages')
        .select('text, reply_text, received_at')
        .eq('sender', trimmed)
        .not('processed_at', 'is', null)
        .order('received_at', { ascending: false })
        .limit(limit);

    if (error) {
        const tableMissing = /relation .* does not exist|Could not find the table/i.test(error.message || '');
        const columnMissing = /column .*reply_text.* does not exist|Could not find the column .*reply_text/i.test(error.message || '');
        if (!tableMissing && !columnMissing) {
            safeWarn({
                at: 'photon.history',
                event: 'loadHistory_failed',
                requestId,
                error: error.message?.slice(0, 240),
            });
        }
        return [];
    }

    const rows = (data ?? []) as Array<{ text?: string | null; reply_text?: string | null }>;
    const turns: ChatTurn[] = [];
    for (const r of rows) {
        const userText = typeof r.text === 'string' ? r.text.trim() : '';
        const assistantText = typeof r.reply_text === 'string' ? r.reply_text.trim() : '';
        if (!userText || !assistantText) continue;
        turns.push({
            user: userText.slice(0, MAX_TEXT_LEN),
            assistant: assistantText.slice(0, MAX_TEXT_LEN),
        });
    }
    // The query returns most-recent-first, but Anthropic expects
    // chronological order so reverse before returning.
    turns.reverse();
    return turns;
}
