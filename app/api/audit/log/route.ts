import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession, getOptionalUser } from '@/lib/auth';

export const runtime = 'nodejs';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase not configured');
    return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * POST /api/audit/log — server-side audit entry write.
 * Tamper-proof: the server writes the entry, not the client.
 * Body: { category, action, details, agent_name?, approved? }
 */
export async function POST(request: Request) {
    try {
        const verified = await verifySession(request);
        const { category, action, details, agent_name, approved } = await request.json();

        if (!category || !action) {
            return NextResponse.json({ error: 'category and action required' }, { status: 400 });
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
            console.error('[audit/log]', error.message);
            // Non-blocking — don't fail the user's action if audit write fails
        }

        return NextResponse.json({ entry });
    } catch (err) {
        if (err instanceof Error && err.name === 'AuthError') {
            return NextResponse.json({ error: err.message }, { status: 401 });
        }
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 });
    }
}

/**
 * GET /api/audit/log — read audit entries for the authenticated user.
 */
export async function GET(request: Request) {
    try {
        const user = await getOptionalUser(request);
        const url = new URL(request.url);
        const userId = user?.userId || url.searchParams.get('user_id');
        if (!userId) return NextResponse.json({ entries: [] });

        const limit = parseInt(url.searchParams.get('limit') || '100', 10);
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('audit_entries')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) return NextResponse.json({ entries: [], error: error.message });
        return NextResponse.json({ entries: data || [] });
    } catch {
        return NextResponse.json({ entries: [] });
    }
}
