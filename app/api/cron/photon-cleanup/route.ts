import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withRequestMeta, errorResponse } from '@/lib/apiHelpers';
import { safeLog } from '@/lib/safeLog';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * GET /api/cron/photon-cleanup
 *
 * Manually-triggered (or external-cron triggered) cleanup route to
 * scrub expired iMessage agent state. NOT added to vercel.json
 * crons because the Hobby plan caps at 2 cron jobs and the existing
 * daily-briefing + morning-briefing slots are taken.
 *
 * Operator can curl this on demand:
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *        https://www.operatoruplift.com/api/cron/photon-cleanup
 *
 * Or wire it to an external scheduler (cron-job.org, GitHub Actions
 * schedule, etc.) without changing the route. Either way the auth
 * shape matches the existing daily-briefing cron, so promoting this
 * to a scheduled Vercel run later (after a plan upgrade) needs only
 * a vercel.json edit, no code change.
 *
 * Scrubs:
 *
 *   - imessage_pending_actions: rows past expires_at. The 5-minute
 *     TTL means stale rows are deleted on demand by getPending(),
 *     but a row whose user never replies (didn't YES, didn't NO)
 *     would otherwise sit forever. This sweep keeps the table small.
 *   - imessage_verifications: rows past their 10-minute expiry that
 *     never got confirmed.
 *
 * Auth: shared CRON_SECRET via Authorization: Bearer header (matches
 * the existing daily-briefing cron pattern).
 *
 * Honest-status:
 *   - 401 unauthorized when CRON_SECRET is missing or doesn't match.
 *   - 503 when CRON_SECRET or Supabase env is unset (operator hasn't
 *     finished setup; nothing to do).
 *   - Tolerates missing tables (returns the per-table counts as null
 *     so the response stays parseable through the migration window).
 *   - 200 with `{ deleted: { pending, verifications } }` so the
 *     operator can see how much was cleaned per run.
 */

const TABLE_MISSING_RE = /relation .* does not exist|Could not find the table/i;

export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'cron.photon-cleanup');
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

        const now = new Date().toISOString();
        const [pendingResult, verifyResult] = await Promise.all([
            supabase
                .from('imessage_pending_actions')
                .delete({ count: 'exact' })
                .lt('expires_at', now),
            supabase
                .from('imessage_verifications')
                .delete({ count: 'exact' })
                .lt('expires_at', now),
        ]);

        const pendingCount = countOrNull(pendingResult);
        const verifyCount = countOrNull(verifyResult);

        safeLog({
            at: meta.route,
            event: 'cleanup',
            requestId: meta.requestId,
            pending: pendingCount,
            verifications: verifyCount,
        });

        return NextResponse.json(
            {
                ok: true,
                deleted: { pending: pendingCount, verifications: verifyCount },
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { status: 200, headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}

function countOrNull(result: { error: { message?: string } | null; count: number | null }): number | null {
    if (result.error) {
        if (TABLE_MISSING_RE.test(result.error.message || '')) return null;
        // Other errors get counted as null so the operator sees the
        // table is present but the sweep failed; safeLog above carries
        // the error context.
        return null;
    }
    return result.count ?? 0;
}
