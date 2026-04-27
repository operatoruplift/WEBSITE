import { NextResponse } from 'next/server';
import { probeAllProviders } from '@/lib/llmHealth';
import { withRequestMeta } from '@/lib/apiHelpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'health.llm');
    const started = Date.now();
    const providers = await probeAllProviders();
    const anyOk = providers.some(p => p.configured && p.ok);
    const configured = providers.filter(p => p.configured);
    const up = configured.filter(p => p.ok).length;
    return NextResponse.json(
        {
            ok: anyOk,
            configuredCount: configured.length,
            upCount: up,
            providers,
            probedInMs: Date.now() - started,
            timestamp: new Date().toISOString(),
        },
        {
            status: anyOk ? 200 : 503,
            headers: { 'Cache-Control': 'no-store', ...meta.headers },
        },
    );
}
