import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * GET /api/receipts, returns all signed receipts for the current user.
 * Newest first, up to ?limit= (default 50).
 */
export async function GET(request: Request) {
    try {
        const verified = await verifySession(request);
        const url = new URL(request.url);
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ receipts: [], warning: 'supabase_not_configured' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
        const { data, error } = await supabase
            .from('tool_receipts')
            .select('*')
            .eq('user_id', verified.userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) return NextResponse.json({ receipts: [], error: error.message }, { status: 500 });
        return NextResponse.json({ receipts: data || [] });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ receipts: [], error: msg }, { status: 401 });
    }
}
