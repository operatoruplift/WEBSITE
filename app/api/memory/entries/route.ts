import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase not configured');
    return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * GET /api/memory/entries?user_id=X&type=Y&search=Z
 * List memory entries for a user, with optional type filter and search.
 */
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('user_id');
        if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

        const type = url.searchParams.get('type');
        const search = url.searchParams.get('search');
        const limit = parseInt(url.searchParams.get('limit') || '100', 10);

        const supabase = getSupabase();
        let query = supabase
            .from('memory_entries')
            .select('*')
            .eq('user_id', userId)
            .order('last_accessed', { ascending: false })
            .limit(limit);

        if (type) query = query.eq('type', type);
        if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,content.ilike.%${search}%`);

        const { data, error } = await query;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ entries: data || [] });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 });
    }
}

/**
 * POST /api/memory/entries
 * Create or update a memory entry.
 * Body: { user_id, id?, name, description, type, content, tags }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user_id, name, description, type, content, tags } = body;

        if (!user_id || !name || !type || !content) {
            return NextResponse.json({ error: 'user_id, name, type, content required' }, { status: 400 });
        }

        const id = body.id || `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const supabase = getSupabase();

        const { data, error } = await supabase.from('memory_entries').upsert({
            id,
            user_id,
            name,
            description: description || '',
            type,
            content,
            tags: tags || [],
            access_count: 0,
            last_accessed: new Date().toISOString(),
        }, { onConflict: 'id' }).select().single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ entry: data });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 });
    }
}

/**
 * DELETE /api/memory/entries
 * Body: { user_id, id }
 */
export async function DELETE(request: Request) {
    try {
        const { user_id, id } = await request.json();
        if (!user_id || !id) return NextResponse.json({ error: 'user_id and id required' }, { status: 400 });

        const supabase = getSupabase();
        const { error } = await supabase
            .from('memory_entries')
            .delete()
            .eq('id', id)
            .eq('user_id', user_id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ deleted: true });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 });
    }
}
