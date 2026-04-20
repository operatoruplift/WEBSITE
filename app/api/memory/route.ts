import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-server';
import { generateEmbedding } from '@/lib/llm';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export async function GET(request: Request) {
  const meta = withRequestMeta(request, 'memory.list');
  try {
    const { supabase } = await requireAuth(request);
    const { data, error } = await supabase
      .from('memory_nodes')
      .select('id, title, type, source, tags, size_bytes, chunk_count, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) return errorResponse(new Error(error.message), meta, { httpHint: 500 });
    return NextResponse.json(data, { headers: meta.headers });
  } catch (err) {
    return errorResponse(err, meta, { httpHint: 401 });
  }
}

export async function POST(request: Request) {
  const meta = withRequestMeta(request, 'memory.create');
  try {
    let user, supabase;
    try {
      ({ user, supabase } = await requireAuth(request));
    } catch (authErr) {
      return errorResponse(authErr, meta, { httpHint: 401 });
    }
    const { title, type, content, tags, source } = await request.json();

    if (!title || !content) {
      return validationError(
        'A memory entry needs both a title and content.',
        'Fill both fields and retry.',
        meta,
      );
    }

    // Chunk content into ~500 token pieces
    const chunks = chunkText(content, 2000); // ~500 tokens ≈ 2000 chars

    // Generate embeddings for each chunk
    const embeddings: number[][] = [];
    for (const chunk of chunks) {
      if (process.env.OPENAI_API_KEY) {
        const emb = await generateEmbedding(chunk);
        embeddings.push(emb);
      }
    }

    // Insert memory node
    const { data: node, error: nodeError } = await supabase
      .from('memory_nodes')
      .insert({
        user_id: user.id,
        title,
        type: type || 'note',
        source: source || 'Manual entry',
        content,
        tags: tags || [],
        size_bytes: new TextEncoder().encode(content).length,
        chunk_count: chunks.length,
      })
      .select()
      .single();

    if (nodeError) return errorResponse(new Error(nodeError.message), meta, { httpHint: 500 });

    // Insert chunks with embeddings
    if (chunks.length > 0) {
      const chunkRows = chunks.map((c, i) => ({
        node_id: node.id,
        user_id: user.id,
        content: c,
        chunk_index: i,
        ...(embeddings[i] ? { embedding: embeddings[i] } : {}),
      }));

      await supabase.from('memory_chunks').insert(chunkRows);
    }

    return NextResponse.json(node, { status: 201, headers: meta.headers });
  } catch (err) {
    return errorResponse(err, meta);
  }
}

function chunkText(text: string, maxChars: number): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let current = '';

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > maxChars && current) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? current + '\n\n' + para : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [text];
}
