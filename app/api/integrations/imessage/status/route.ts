import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession } from '@/lib/auth';
import { withRequestMeta } from '@/lib/apiHelpers';
import { safeWarn } from '@/lib/safeLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 5;

/**
 * GET /api/integrations/imessage/status
 *
 * Returns the verified phone(s) bound to the signed-in Privy account.
 * Used by the dashboard /integrations IMessageVerifyCard to seed its
 * verified state on mount instead of always starting at enter_phone
 * after a reload.
 *
 * Response (200):
 *   {
 *     verified: boolean,
 *     phones: Array<{ phone: string, verified_at: string }>,
 *     requestId, timestamp
 *   }
 *
 * Honest-status:
 *   - 401 with `errorClass: 'reauth_required'` when the Privy token is
 *     missing/invalid (matches the start/confirm routes' shape).
 *   - 503 with the migration filename when imessage_users doesn't exist.
 *   - Empty `phones: []` when no row is bound, never a fabricated entry.
 */

interface PhoneRow {
    sender: string;
    verified_at: string | null;
    zodiac: string | null;
    location: string | null;
    model_pref: string | null;
    timezone: string | null;
    system_prompt_override: string | null;
}

const TABLE_MISSING_RE = /relation .* does not exist|Could not find the table/i;

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'integrations.imessage.status');
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
                    verified: false,
                    phones: [],
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to enable phone status.',
                },
                { status: 200, headers: meta.headers },
            );
        }

        const { data, error } = await supabase
            .from('imessage_users')
            .select('sender, verified_at, zodiac, location, model_pref, timezone, system_prompt_override')
            .eq('privy_user_id', verified.userId)
            .not('verified_at', 'is', null);

        if (error) {
            const tableMissing = TABLE_MISSING_RE.test(error.message || '');
            if (tableMissing) {
                return NextResponse.json(
                    {
                        error: 'table_missing',
                        errorClass: 'provider_unavailable',
                        requestId: meta.requestId,
                        timestamp: meta.startedAt,
                        nextAction: 'Run lib/photon-imessage-users-migration.sql against your Supabase project.',
                    },
                    { status: 503, headers: meta.headers },
                );
            }
            safeWarn({
                at: meta.route,
                event: 'status_query_failed',
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

        const rows = (data ?? []) as PhoneRow[];
        const phones = rows
            .filter(r => typeof r.sender === 'string' && r.sender.length > 0 && r.verified_at)
            .map(r => ({
                phone: r.sender,
                verified_at: r.verified_at as string,
                zodiac: r.zodiac,
                location: r.location,
                model_pref: r.model_pref,
                timezone: r.timezone,
                system_prompt_override: r.system_prompt_override,
            }));

        return NextResponse.json(
            {
                verified: phones.length > 0,
                phones,
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { status: 200, headers: meta.headers },
        );
    } catch (err) {
        safeWarn({
            at: meta.route,
            event: 'status_unexpected',
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
