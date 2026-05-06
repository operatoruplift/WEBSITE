import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession } from '@/lib/auth';
import { withRequestMeta } from '@/lib/apiHelpers';
import { safeWarn } from '@/lib/safeLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 5;

/**
 * GET /api/integrations/imessage/recent?limit=20
 *
 * Returns the calling Privy user's OWN recent iMessage agent rows
 * (inbound + outbound text + reply text) so the dashboard can show
 * a personal version of the /dev/photon recent panel without
 * exposing other users' senders.
 *
 * Always scoped by privy_user_id -> imessage_users.sender. A user
 * with no verified phone gets `{ rows: [] }`. Never returns rows
 * from senders the caller doesn't own.
 *
 * Honest-status:
 *   - 401 reauth_required when Privy token is missing/invalid.
 *   - 503 with the migration filename when imessage_users or
 *     inbound_messages doesn't exist.
 *   - Empty rows: [] when no verified phone or no traffic.
 *   - reply_text comes from the inbound_messages.reply_text column
 *     (PR #416 added it). Older rows return null.
 */

const TABLE_MISSING_RE = /relation .* does not exist|Could not find the table/i;

interface InboundRow {
    id: string;
    sender: string;
    platform: string;
    text: string | null;
    received_at: string;
    processed_at: string | null;
    reply_message_id: string | null;
    reply_text?: string | null;
    acked_at: string | null;
}

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'integrations.imessage.recent');
    try {
        const verified = await verifySession(request).catch(() => null);
        if (!verified?.userId) {
            return NextResponse.json(
                {
                    error: 'unauthorized',
                    errorClass: 'reauth_required',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Sign in with Privy and retry.',
                },
                { status: 401, headers: meta.headers },
            );
        }

        const supabase = getSupabase();
        if (!supabase) {
            return NextResponse.json(
                {
                    rows: [],
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.',
                },
                { status: 200, headers: meta.headers },
            );
        }

        const limitParam = new URL(request.url).searchParams.get('limit');
        const limit = Math.max(1, Math.min(50, Number(limitParam) || 20));

        // Find verified senders owned by this Privy user.
        const { data: phones, error: usersErr } = await supabase
            .from('imessage_users')
            .select('sender')
            .eq('privy_user_id', verified.userId)
            .not('verified_at', 'is', null);

        if (usersErr) {
            const tableMissing = TABLE_MISSING_RE.test(usersErr.message || '');
            return NextResponse.json(
                {
                    error: tableMissing ? 'imessage_users_table_missing' : 'database_error',
                    errorClass: 'provider_unavailable',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: tableMissing
                        ? 'Run lib/photon-imessage-users-migration.sql against your Supabase project.'
                        : 'Check Supabase connectivity and retry.',
                },
                { status: 503, headers: meta.headers },
            );
        }

        const senders = (phones ?? []).map(r => r.sender as string).filter(Boolean);
        if (senders.length === 0) {
            return NextResponse.json(
                {
                    rows: [],
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                },
                { status: 200, headers: meta.headers },
            );
        }

        // Fetch the inbound rows. Try with reply_text; fall back if
        // the column doesn't exist yet (pre-PR-#416 schema).
        const fullSelect = 'id, sender, platform, text, received_at, processed_at, reply_message_id, reply_text, acked_at';
        const legacySelect = 'id, sender, platform, text, received_at, processed_at, reply_message_id, acked_at';

        const initial = await supabase
            .from('inbound_messages')
            .select(fullSelect)
            .in('sender', senders)
            .order('received_at', { ascending: false })
            .limit(limit);
        let data: Array<Record<string, unknown>> | null = initial.data as Array<Record<string, unknown>> | null;
        let error: { message?: string } | null = initial.error;

        if (error && /column .*reply_text.* does not exist|Could not find the column .*reply_text/i.test(error.message || '')) {
            const fallback = await supabase
                .from('inbound_messages')
                .select(legacySelect)
                .in('sender', senders)
                .order('received_at', { ascending: false })
                .limit(limit);
            data = fallback.data as Array<Record<string, unknown>> | null;
            error = fallback.error;
        }

        if (error) {
            const tableMissing = TABLE_MISSING_RE.test(error.message || '');
            if (tableMissing) {
                return NextResponse.json(
                    {
                        error: 'inbound_messages_table_missing',
                        errorClass: 'provider_unavailable',
                        requestId: meta.requestId,
                        timestamp: meta.startedAt,
                        nextAction: 'Run lib/photon-webhook-migration.sql against your Supabase project.',
                    },
                    { status: 503, headers: meta.headers },
                );
            }
            safeWarn({
                at: meta.route,
                event: 'recent_query_failed',
                requestId: meta.requestId,
                error: error.message?.slice(0, 240),
            });
            return NextResponse.json(
                {
                    error: 'database_error',
                    errorClass: 'provider_unavailable',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Check Supabase connectivity and retry.',
                },
                { status: 503, headers: meta.headers },
            );
        }

        const rows = (data ?? []).map(raw => {
            const r = raw as Partial<InboundRow>;
            return {
                id: r.id ?? '',
                sender: r.sender ?? '',
                platform: r.platform ?? 'imessage',
                text: r.text ?? null,
                received_at: r.received_at ?? '',
                processed_at: r.processed_at ?? null,
                reply_message_id: r.reply_message_id ?? null,
                reply_text: r.reply_text ?? null,
                acked_at: r.acked_at ?? null,
                status: r.processed_at ? 'replied' as const : 'pending' as const,
            };
        });

        return NextResponse.json(
            {
                rows,
                count: rows.length,
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { status: 200, headers: meta.headers },
        );
    } catch (err) {
        safeWarn({
            at: meta.route,
            event: 'recent_unexpected',
            requestId: meta.requestId,
            error: err instanceof Error ? err.message.slice(0, 240) : String(err),
        });
        return NextResponse.json(
            {
                error: 'unexpected',
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { status: 500, headers: meta.headers },
        );
    }
}
