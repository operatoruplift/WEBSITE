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
 * GET /api/agents — list all published agents from Supabase.
 * No auth required for browsing the marketplace.
 */
export async function GET(request: Request) {
    try {
        const supabase = getSupabase();
        const url = new URL(request.url);
        const category = url.searchParams.get('category');

        let query = supabase
            .from('agents')
            .select('*')
            .order('featured', { ascending: false })
            .order('installs', { ascending: false });

        if (category && category !== 'All') {
            query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ agents: data || [] });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 });
    }
}

/**
 * POST /api/agents — publish a new agent manifest.
 * Requires auth. Stores in Supabase agents table.
 */
export async function POST(request: Request) {
    try {
        const verified = await verifySession(request);
        const body = await request.json();

        if (!body.name) {
            return NextResponse.json({ error: 'name required' }, { status: 400 });
        }

        const supabase = getSupabase();
        const agent = {
            id: body.id || `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: body.name,
            description: body.description || '',
            version: body.version || '1.0.0',
            author: body.author || 'Community',
            author_id: verified.userId,
            category: body.category || 'General',
            model: body.model || 'claude-sonnet-4-6',
            system_prompt: body.systemPrompt || body.system_prompt || '',
            tools: body.tools || [],
            permissions: body.permissions || [],
            price: body.price || 'free',
            avatar: body.avatar || '',
            tags: body.tags || [],
        };

        const { data, error } = await supabase
            .from('agents')
            .upsert(agent, { onConflict: 'id' })
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ agent: data }, { status: 201 });
    } catch (err) {
        if (err instanceof Error && err.name === 'AuthError') {
            return NextResponse.json({ error: err.message }, { status: 401 });
        }
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 });
    }
}
