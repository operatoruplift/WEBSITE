import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-server';
import { generateEmbedding } from '@/lib/llm';

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAuth(request);
    const { data, error } = await supabase
      .from('memory_nodes')
      .select('id, title, type, source, tags, size_bytes, chunk_count, created_at, updated_at')
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
    const { title, type, content, tags, source } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content required' }, { status: 400 });
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

    if (nodeError) return NextResponse.json({ error: nodeError.message }, { status: 500 });

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

    return NextResponse.json(node, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
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
