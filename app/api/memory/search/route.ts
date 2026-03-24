import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-server';
import { generateEmbedding } from '@/lib/llm';

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAuth(request);
    const { query, limit = 5 } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Embeddings not configured' }, { status: 503 });
    }

    // Embed the query
    const embedding = await generateEmbedding(query);

    // Vector similarity search using pgvector
    const { data, error } = await supabase.rpc('match_memory_chunks', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit,
    });

    if (error) {
      // Fallback to text search if RPC not available
      const { data: textResults } = await supabase
        .from('memory_chunks')
        .select('content, chunk_index, node_id')
        .ilike('content', `%${query}%`)
        .limit(limit);
      return NextResponse.json(textResults || []);
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
