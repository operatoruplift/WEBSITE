import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession, getOptionalUser } from '@/lib/auth';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';
import { safeLog } from '@/lib/safeLog';

export const runtime = 'nodejs';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase not configured');
    return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * POST /api/audit/log, server-side audit entry write.
 * Tamper-proof: the server writes the entry, not the client.
 * Body: { category, action, details, agent_name?, approved? }
 */
export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'audit.log.write');
    try {
        let verified;
        try {
            verified = await verifySession(request);
        } catch (authErr) {
            return errorResponse(authErr, meta, { httpHint: 401 });
        }
        const { category, action, details, agent_name, approved } = await request.json();

        if (!category || !action) {
            return validationError(
                'Audit write needs `category` and `action`.',
                'Include both and retry.',
                meta,
                { missing: ['category', 'action'].filter(f => !({ category, action } as Record<string, unknown>)[f]) },
            );
        }

        const supabase = getSupabase();
        const entry = {
            id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            user_id: verified.userId,
            category,
            action,
            details: details || '',
            agent_name: agent_name || null,
            approved: approved ?? null,
            created_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('audit_entries').insert(entry);
        if (error) {
            safeLog({
                at: meta.route,
                event: 'insert-failed',
                requestId: meta.requestId,
                reason: error.message.slice(0, 240),
            });
            // Non-blocking, don't fail the user's action if audit write fails
        }

        return NextResponse.json({ entry, requestId: meta.requestId, timestamp: meta.startedAt }, { headers: meta.headers });
    } catch (err) {
        return errorResponse(err, meta);
    }
}

/**
 * GET /api/audit/log, read audit entries for the authenticated user.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'audit.log.list');
    try {
        const user = await getOptionalUser(request);
        const url = new URL(request.url);
        const userId = user?.userId || url.searchParams.get('user_id');
        if (!userId) return NextResponse.json({ entries: [] }, { headers: meta.headers });

        const limit = parseInt(url.searchParams.get('limit') || '100', 10);
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('audit_entries')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) return errorResponse(new Error(error.message), meta, { httpHint: 500 });
        return NextResponse.json({ entries: data || [] }, { headers: meta.headers });
    } catch (err) {
        return errorResponse(err, meta);
    }
}
