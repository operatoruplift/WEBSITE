import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-server';
import { withRequestMeta } from '@/lib/apiHelpers';

export async function GET(request: Request) {
  const meta = withRequestMeta(request, 'dashboard.stats');
  try {
    const { supabase } = await requireAuth(request);

    // Run all counts in parallel
    const [agents, sessions, memory, events] = await Promise.all([
      supabase.from('agents').select('id', { count: 'exact', head: true }),
      supabase.from('chat_sessions').select('id', { count: 'exact', head: true }),
      supabase.from('memory_nodes').select('id', { count: 'exact', head: true }),
      supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('event_type', 'security_block'),
    ]);

    return NextResponse.json({
      activeAgents: agents.count || 0,
      chatSessions: sessions.count || 0,
      memoryNodes: memory.count || 0,
      securityBlocks: events.count || 0,
    }, { headers: meta.headers });
  } catch {
    // Unauthenticated. Return zeros, never the fabricated 14/12400/47
    // values this route used to return as "demo data" (the same
    // numbers PR #164 removed from the rendered dashboard, this route
    // was the last place they lived).
    return NextResponse.json({
      activeAgents: 0,
      chatSessions: 0,
      memoryNodes: 0,
      securityBlocks: 0,
    }, { headers: meta.headers });
  }
}
