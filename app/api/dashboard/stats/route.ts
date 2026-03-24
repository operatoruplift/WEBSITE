import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-server';

export async function GET(request: Request) {
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
    });
  } catch {
    // Return demo data if not authenticated
    return NextResponse.json({
      activeAgents: 14,
      chatSessions: 8,
      memoryNodes: 12400,
      securityBlocks: 47,
    });
  }
}
