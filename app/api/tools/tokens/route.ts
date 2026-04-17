import { NextResponse } from 'next/server';
import { getCapabilities } from '@/lib/capabilities';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * POST /api/tools/tokens
 * Body: { action: 'search' | 'resolve' | 'asset' | 'price' | 'risk' | 'markets', params: {...} }
 *
 * Tier 1 tool backed by the Tokens API at https://api.tokens.xyz/v1
 * (docs.tokens.xyz). Auth is server-held via x-api-key — the user
 * never sees the key and the client can't call Tokens directly.
 *
 * Demo-mode callers are routed through executeMock client-side, so
 * this handler only runs when capability_real is true. The guard
 * below is belt-and-braces: without it, a handcrafted POST from an
 * unauth caller would still produce mock data, but we'd rather
 * refuse than pretend.
 */

const BASE = process.env.TOKENS_API_BASE || 'https://api.tokens.xyz';

function headers(): HeadersInit {
    const key = process.env.TOKENS_API_KEY;
    if (!key) throw new Error('tokens_not_configured');
    return {
        'x-api-key': key,
        'Accept': 'application/json',
    };
}

async function tokensGet(path: string, query?: Record<string, string | number | undefined>) {
    const url = new URL(`${BASE}/v1${path}`);
    if (query) {
        for (const [k, v] of Object.entries(query)) {
            if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
        }
    }
    const res = await fetch(url.toString(), { headers: headers(), cache: 'no-store' });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`tokens_api_${res.status}: ${body.slice(0, 200)}`);
    }
    return res.json();
}

async function tokensPost(path: string, body: unknown) {
    const res = await fetch(`${BASE}/v1${path}`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`tokens_api_${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
}

export async function POST(request: Request) {
    const caps = await getCapabilities(request);
    if (!caps.capability_real) {
        return NextResponse.json(
            { error: 'demo_mode', simulated: true, message: 'Sign in to run real token lookups.' },
            { status: 403 },
        );
    }

    if (!process.env.TOKENS_API_KEY) {
        return NextResponse.json(
            { error: 'tokens_not_configured', message: 'TOKENS_API_KEY not set on the server.' },
            { status: 503 },
        );
    }

    const { action, params } = (await request.json()) as {
        action?: string;
        params?: Record<string, string | number | string[]>;
    };

    try {
        switch (action) {
            case 'search': {
                const query = String(params?.query ?? '').trim();
                if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 });
                const data = await tokensGet('/assets/search', { q: query, limit: Number(params?.limit ?? 10) });
                return NextResponse.json({ action, ...data });
            }
            case 'resolve': {
                const ref = String(params?.ref ?? params?.mint ?? params?.alias ?? '').trim();
                if (!ref) return NextResponse.json({ error: 'ref|mint|alias required' }, { status: 400 });
                const data = await tokensGet('/assets/resolve', { ref });
                return NextResponse.json({ action, ...data });
            }
            case 'asset': {
                const id = String(params?.assetId ?? params?.id ?? '').trim();
                if (!id) return NextResponse.json({ error: 'assetId required' }, { status: 400 });
                const data = await tokensGet(`/assets/${encodeURIComponent(id)}`, {
                    includes: params?.includes as string | undefined,
                    mint: params?.mint as string | undefined,
                });
                return NextResponse.json({ action, ...data });
            }
            case 'price': {
                const id = String(params?.assetId ?? '').trim();
                if (!id) return NextResponse.json({ error: 'assetId required' }, { status: 400 });
                // price-chart returns OHLCV candles we can pull the latest close from
                const data = await tokensGet(`/assets/${encodeURIComponent(id)}/price-chart`, {
                    interval: (params?.interval as string) || '1h',
                    from: params?.from as string | undefined,
                    to: params?.to as string | undefined,
                });
                return NextResponse.json({ action, ...data });
            }
            case 'risk': {
                const mint = String(params?.mint ?? '').trim();
                if (!mint) return NextResponse.json({ error: 'mint required' }, { status: 400 });
                const data = await tokensGet('/assets/risk-summary', { mint });
                return NextResponse.json({ action, ...data });
            }
            case 'markets': {
                const id = String(params?.assetId ?? '').trim();
                const mint = String(params?.mint ?? '').trim();
                if (!id) return NextResponse.json({ error: 'assetId required' }, { status: 400 });
                const data = await tokensGet(`/assets/${encodeURIComponent(id)}/markets`, { mint });
                return NextResponse.json({ action, ...data });
            }
            case 'market_snapshots': {
                const refs = (params?.refs as string[] | undefined) ?? [];
                if (!Array.isArray(refs) || refs.length === 0) {
                    return NextResponse.json({ error: 'refs[] required' }, { status: 400 });
                }
                const data = await tokensPost('/assets/market-snapshots', { refs });
                return NextResponse.json({ action, snapshots: data });
            }
            default:
                return NextResponse.json(
                    { error: `unknown_action:${action}. Supported: search, resolve, asset, price, risk, markets, market_snapshots` },
                    { status: 400 },
                );
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'tokens_call_failed';
        return NextResponse.json({ error: msg }, { status: 502 });
    }
}
