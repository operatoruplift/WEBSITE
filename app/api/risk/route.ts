import { NextResponse } from 'next/server';
import { preflight } from '@/lib/webacy-risk';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, params } = body;

    if (!type || !params) {
      return NextResponse.json({ error: 'type and params required' }, { status: 400 });
    }

    const result = await preflight({ type, params });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
