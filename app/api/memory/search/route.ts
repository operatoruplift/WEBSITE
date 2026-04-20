import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-server';
import { generateEmbedding } from '@/lib/llm';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export async function POST(request: Request) {
  const meta = withRequestMeta(request, 'memory.search');
  try {
    let supabase;
    try {
      ({ supabase } = await requireAuth(request));
    } catch (authErr) {
      return errorResponse(authErr, meta, { httpHint: 401 });
    }
    const { query, limit = 5 } = await request.json();

    if (!query) {
      return validationError(
        'A memory search needs a `query` string.',
        'Include a query and retry.',
        meta,
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return errorResponse(
        new Error('Embeddings not configured (OPENAI_API_KEY missing).'),
        meta,
        { errorClass: 'provider_unavailable', httpHint: 503 },
      );
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
      return NextResponse.json(textResults || [], { headers: meta.headers });
    }

    return NextResponse.json(data, { headers: meta.headers });
  } catch (err) {
    return errorResponse(err, meta);
  }
}
