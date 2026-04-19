import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession, getUserEmail } from '@/lib/auth';
import { isEmailBypassed, isUserIdBypassed } from '@/lib/subscription';
import { withRequestMeta, errorResponse } from '@/lib/apiHelpers';

export const runtime = 'nodejs';

/**
 * Admin-only. Returns the last N inbound + outbound Photon messages so
 * the /dev/imessage harness can render them.
 *
 * GET /api/photon/imessage/replay?limit=20
 *
 * Does NOT re-post to the webhook. If ops needs to replay an inbound
 * event, they copy the raw JSON from the row and curl it back to the
 * webhook URL with the appropriate signature — the runbook shows how.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'photon.imessage.replay');
    try {
        let verified;
        try {
            verified = await verifySession(request);
        } catch (authErr) {
            return errorResponse(authErr, meta, { httpHint: 401 });
        }
        const sessionEmail = await getUserEmail(verified.userId);
        const isAdmin = (sessionEmail && isEmailBypassed(sessionEmail)) || isUserIdBypassed(verified.userId);
        if (!isAdmin) {
            return NextResponse.json(
                {
                    error: 'forbidden',
                    errorClass: 'reauth_required',
                    reason: 'not_admin',
                    recovery: 'none',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    message: 'Admin-only endpoint.',
                    nextAction: 'Contact ops if you need access.',
                },
                { status: 403, headers: meta.headers },
            );
        }

        const url = new URL(request.url);
        const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '20', 10) || 20));

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json(
                { inbound: [], outbound: [], warning: 'supabase_not_configured', requestId: meta.requestId, timestamp: meta.startedAt },
                { headers: meta.headers },
            );
        }
        const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

        const [inbound, outbound] = await Promise.all([
            supabase.from('inbound_messages').select('*').order('received_at', { ascending: false }).limit(limit),
            supabase.from('outbound_messages').select('*').order('sent_at', { ascending: false }).limit(limit),
        ]);

        return NextResponse.json(
            {
                inbound: inbound.data || [],
                inboundError: inbound.error?.message || null,
                outbound: outbound.data || [],
                outboundError: outbound.error?.message || null,
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}
