import { NextResponse } from 'next/server';
import { getProviderStatus } from '@/lib/llm';
import { withRequestMeta } from '@/lib/apiHelpers';

export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'providers');
    return NextResponse.json(getProviderStatus(), { headers: meta.headers });
}
