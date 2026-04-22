import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOptionalUser } from '@/lib/auth';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

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
    const meta = withRequestMeta(request, 'memory.entries.list');
    try {
        const user = await getOptionalUser(request);
        const url = new URL(request.url);
        const userId = user?.userId || url.searchParams.get('user_id');
        if (!userId) return validationError('`user_id` required (query param or session).', 'Sign in or pass ?user_id=.', meta);

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
        if (error) return errorResponse(new Error(error.message), meta, { httpHint: 500 });

        return NextResponse.json({ entries: data || [] }, { headers: meta.headers });
    } catch (err) {
        return errorResponse(err, meta);
    }
}

/**
 * POST /api/memory/entries
 * Create or update a memory entry.
 * Body: { user_id, id?, name, description, type, content, tags }
 */
export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'memory.entries.upsert');
    try {
        const body = await request.json();
        const { user_id, name, description, type, content, tags } = body;

        if (!user_id || !name || !type || !content) {
            return validationError(
                'Memory entry needs `user_id`, `name`, `type`, and `content`.',
                'Include the missing fields and retry.',
                meta,
                { missing: ['user_id', 'name', 'type', 'content'].filter(f => !body?.[f]) },
            );
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

        if (error) return errorResponse(new Error(error.message), meta, { httpHint: 500 });
        return NextResponse.json({ entry: data }, { headers: meta.headers });
    } catch (err) {
        return errorResponse(err, meta);
    }
}

/**
 * DELETE /api/memory/entries
 * Body: { user_id, id }
 */
export async function DELETE(request: Request) {
    const meta = withRequestMeta(request, 'memory.entries.delete');
    try {
        const { user_id, id } = await request.json();
        if (!user_id || !id) return validationError('Both `user_id` and `id` are required.', 'Include both and retry.', meta);

        const supabase = getSupabase();
        const { error } = await supabase
            .from('memory_entries')
            .delete()
            .eq('id', id)
            .eq('user_id', user_id);

        if (error) return errorResponse(new Error(error.message), meta, { httpHint: 500 });
        return NextResponse.json({ deleted: true }, { headers: meta.headers });
    } catch (err) {
        return errorResponse(err, meta);
    }
}
