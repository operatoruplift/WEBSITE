import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withRequestMeta, errorResponse } from '@/lib/apiHelpers';
import { summarizeChat } from '@/lib/photon/summarizer';
import { safeLog, safeWarn } from '@/lib/safeLog';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/cron/photon-summary?limit=20
 *
 * Manually-triggered (or external-cron triggered) route that walks
 * verified imessage_users rows, loads each user's recent inbound +
 * reply pairs, and writes a 2-3 sentence summary to
 * imessage_users.summary via Claude Haiku.
 *
 * Not in vercel.json crons because the Hobby tier caps at 2 cron
 * jobs and the existing daily-briefing + morning-briefing slots
 * are taken (same constraint as photon-cleanup, see PR #449).
 *
 * Operator can curl this on demand:
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *        https://www.operatoruplift.com/api/cron/photon-summary
 *
 * Auth: shared CRON_SECRET via Authorization: Bearer header (matches
 * the existing daily-briefing cron pattern).
 *
 * Honest-status:
 *   - 401 unauthorized when CRON_SECRET is missing or doesn't match.
 *   - 503 when CRON_SECRET, Supabase env, or Anthropic env is unset.
 *   - 200 with { updated, skipped, errors } so the operator sees how
 *     many users got fresh summaries vs. were skipped (too few
 *     turns, model failure, etc).
 *   - Each user processed sequentially with a per-user budget cap
 *     to keep the function under maxDuration. Limit param caps the
 *     total users touched per call.
 */

const TURNS_LOOKBACK_DAYS = 7;
const MAX_USERS_PER_RUN = 20;

interface UserRow {
    sender: string;
    privy_user_id: string | null;
    verified_at: string | null;
}

interface MessageRow {
    text: string | null;
    reply_text?: string | null;
    received_at: string;
}

export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'cron.photon-summary');
    try {
        const expected = process.env.CRON_SECRET;
        if (!expected) {
            return errorResponse(
                new Error('CRON_SECRET not configured'),
                meta,
                { errorClass: 'provider_unavailable' },
            );
        }
        const auth = request.headers.get('authorization');
        if (auth !== `Bearer ${expected}`) {
            return NextResponse.json(
                { error: 'unauthorized', requestId: meta.requestId, timestamp: meta.startedAt },
                { status: 401, headers: meta.headers },
            );
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            return errorResponse(
                new Error('ANTHROPIC_API_KEY not configured'),
                meta,
                { errorClass: 'provider_unavailable' },
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            return errorResponse(
                new Error('supabase_not_configured'),
                meta,
                { errorClass: 'provider_unavailable' },
            );
        }
        const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

        const limitParam = new URL(request.url).searchParams.get('limit');
        const limit = Math.max(1, Math.min(MAX_USERS_PER_RUN, Number(limitParam) || MAX_USERS_PER_RUN));
        const since = new Date(Date.now() - TURNS_LOOKBACK_DAYS * 24 * 3600 * 1000).toISOString();

        // Verified users with at least one prior turn worth summarizing.
        // The summarizer itself rejects too-few-turn cases, but capping
        // by `verified_at IS NOT NULL` here keeps the iteration count
        // sane on cold tables.
        const { data: users, error: usersErr } = await supabase
            .from('imessage_users')
            .select('sender, privy_user_id, verified_at')
            .not('verified_at', 'is', null)
            .order('verified_at', { ascending: false })
            .limit(limit);

        if (usersErr) {
            const tableMissing = /relation .* does not exist|Could not find the table/i.test(usersErr.message || '');
            return NextResponse.json(
                {
                    error: tableMissing ? 'imessage_users_table_missing' : 'database_error',
                    errorClass: 'provider_unavailable',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    detail: usersErr.message?.slice(0, 240),
                },
                { status: 503, headers: meta.headers },
            );
        }

        const rows = (users ?? []) as UserRow[];
        let updated = 0;
        let skipped = 0;
        let errors = 0;

        for (const user of rows) {
            if (!user.sender) { skipped += 1; continue; }
            try {
                const { data: msgs, error: msgsErr } = await supabase
                    .from('inbound_messages')
                    .select('text, reply_text, received_at')
                    .eq('sender', user.sender)
                    .gte('received_at', since)
                    .order('received_at', { ascending: true });
                if (msgsErr) {
                    errors += 1;
                    continue;
                }
                const turns = ((msgs ?? []) as MessageRow[])
                    .filter(m => (m.text ?? '').trim() && (m.reply_text ?? '').trim())
                    .map(m => ({ user: m.text ?? '', assistant: m.reply_text ?? '' }));

                const result = await summarizeChat(turns, meta.requestId);
                if (!result.ok) {
                    if (result.reason === 'too_few_turns') {
                        skipped += 1;
                        continue;
                    }
                    errors += 1;
                    continue;
                }

                const { error: updErr } = await supabase
                    .from('imessage_users')
                    .update({
                        summary: result.summary,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('sender', user.sender);
                if (updErr) {
                    errors += 1;
                    continue;
                }
                updated += 1;
            } catch (err) {
                safeWarn({
                    at: meta.route,
                    event: 'per_user_failed',
                    requestId: meta.requestId,
                    sender: user.sender,
                    error: err instanceof Error ? err.message.slice(0, 240) : String(err),
                });
                errors += 1;
            }
        }

        safeLog({
            at: meta.route,
            event: 'summary_run',
            requestId: meta.requestId,
            scanned: rows.length,
            updated,
            skipped,
            errors,
        });

        return NextResponse.json(
            {
                ok: true,
                scanned: rows.length,
                updated,
                skipped,
                errors,
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { status: 200, headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}
