import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession } from '@/lib/auth';
import { withRequestMeta, errorResponse } from '@/lib/apiHelpers';

export const runtime = 'nodejs';

/**
 * GET /api/receipts — returns all signed receipts for the current user.
 * Newest first, up to ?limit= (default 50).
 *
 * Wraps every response in the shared envelope so callers get a
 * consistent `X-Request-Id` header and `requestId` in the JSON body.
 * Receipt signing / ed25519 logic is untouched — only observability.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'receipts.list');
    try {
        let verified;
        try {
            verified = await verifySession(request);
        } catch (authErr) {
            return errorResponse(authErr, meta, { httpHint: 401 });
        }

        const url = new URL(request.url);
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json(
                { receipts: [], warning: 'supabase_not_configured', requestId: meta.requestId, timestamp: meta.startedAt },
                { headers: meta.headers },
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
        const { data, error } = await supabase
            .from('tool_receipts')
            .select('*')
            .eq('user_id', verified.userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            return errorResponse(new Error(error.message), meta, { httpHint: 500 });
        }
        return NextResponse.json(
            { receipts: data || [], requestId: meta.requestId, timestamp: meta.startedAt },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}
