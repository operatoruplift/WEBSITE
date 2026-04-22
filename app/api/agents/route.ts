import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession } from '@/lib/auth';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export const runtime = 'nodejs';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase not configured');
    return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * GET /api/agents, list all published agents from Supabase.
 * No auth required for browsing the marketplace.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'agents.list');
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
        if (error) return errorResponse(new Error(error.message), meta, { httpHint: 500 });
        return NextResponse.json({ agents: data || [] }, { headers: meta.headers });
    } catch (err) {
        return errorResponse(err, meta);
    }
}

/**
 * POST /api/agents, publish a new agent manifest.
 * Requires auth. Stores in Supabase agents table.
 */
export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'agents.publish');
    try {
        let verified;
        try {
            verified = await verifySession(request);
        } catch (authErr) {
            return errorResponse(authErr, meta, { httpHint: 401 });
        }
        const body = await request.json();

        if (!body.name) {
            return validationError('Agent publish needs a `name`.', 'Include a non-empty name and retry.', meta);
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

        if (error) return errorResponse(new Error(error.message), meta, { httpHint: 500 });
        return NextResponse.json({ agent: data }, { status: 201, headers: meta.headers });
    } catch (err) {
        return errorResponse(err, meta);
    }
}
