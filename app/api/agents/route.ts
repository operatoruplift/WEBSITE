import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAuth(request);
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireAuth(request);
    const body = await request.json();

    const { data, error } = await supabase
      .from('agents')
      .insert({
        user_id: user.id,
        name: body.name,
        description: body.description || '',
        template: body.template || 'general',
        model: body.model || 'claude-sonnet-4-6',
        system_prompt: body.systemPrompt || '',
        source: body.source || 'builder',
        config: body.config || {},
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
