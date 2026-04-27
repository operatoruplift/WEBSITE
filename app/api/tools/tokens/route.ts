import { NextResponse } from 'next/server';
import { getCapabilities } from '@/lib/capabilities';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * POST /api/tools/tokens
 * Body: { action: 'search' | 'resolve' | 'asset' | 'price' | 'risk' | 'markets', params: {...} }
 *
 * Tier 1 tool backed by the Tokens API at https://api.tokens.xyz/v1
 * (docs.tokens.xyz). Auth is server-held via x-api-key, the user
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
    const meta = withRequestMeta(request, 'tools.tokens');
    const caps = await getCapabilities(request);
    if (!caps.capability_real) {
        return NextResponse.json(
            { error: 'demo_mode', simulated: true, message: 'Sign in to run real token lookups.', requestId: meta.requestId },
            { status: 403, headers: meta.headers },
        );
    }

    if (!process.env.TOKENS_API_KEY) {
        return errorResponse(new Error('TOKENS_API_KEY not set on the server.'), meta, { errorClass: 'provider_unavailable' });
    }

    const { action, params } = (await request.json()) as {
        action?: string;
        params?: Record<string, string | number | string[]>;
    };

    try {
        switch (action) {
            case 'search': {
                const query = String(params?.query ?? '').trim();
                if (!query) return validationError('query required', 'Send params.query in the JSON body.', meta, { missing: ['query'] });
                const data = await tokensGet('/assets/search', { q: query, limit: Number(params?.limit ?? 10) });
                return NextResponse.json({ action, ...data }, { headers: meta.headers });
            }
            case 'resolve': {
                const ref = String(params?.ref ?? params?.mint ?? params?.alias ?? '').trim();
                if (!ref) return validationError('ref|mint|alias required', 'Send one of ref, mint, or alias in params.', meta, { missing: ['ref'] });
                const data = await tokensGet('/assets/resolve', { ref });
                return NextResponse.json({ action, ...data }, { headers: meta.headers });
            }
            case 'asset': {
                const id = String(params?.assetId ?? params?.id ?? '').trim();
                if (!id) return validationError('assetId required', 'Send params.assetId.', meta, { missing: ['assetId'] });
                const data = await tokensGet(`/assets/${encodeURIComponent(id)}`, {
                    includes: params?.includes as string | undefined,
                    mint: params?.mint as string | undefined,
                });
                return NextResponse.json({ action, ...data }, { headers: meta.headers });
            }
            case 'price': {
                const id = String(params?.assetId ?? '').trim();
                if (!id) return validationError('assetId required', 'Send params.assetId.', meta, { missing: ['assetId'] });
                // price-chart returns OHLCV candles we can pull the latest close from
                const data = await tokensGet(`/assets/${encodeURIComponent(id)}/price-chart`, {
                    interval: (params?.interval as string) || '1h',
                    from: params?.from as string | undefined,
                    to: params?.to as string | undefined,
                });
                return NextResponse.json({ action, ...data }, { headers: meta.headers });
            }
            case 'risk': {
                const mint = String(params?.mint ?? '').trim();
                if (!mint) return validationError('mint required', 'Send params.mint.', meta, { missing: ['mint'] });
                const data = await tokensGet('/assets/risk-summary', { mint });
                return NextResponse.json({ action, ...data }, { headers: meta.headers });
            }
            case 'markets': {
                const id = String(params?.assetId ?? '').trim();
                const mint = String(params?.mint ?? '').trim();
                if (!id) return validationError('assetId required', 'Send params.assetId.', meta, { missing: ['assetId'] });
                const data = await tokensGet(`/assets/${encodeURIComponent(id)}/markets`, { mint });
                return NextResponse.json({ action, ...data }, { headers: meta.headers });
            }
            case 'market_snapshots': {
                const refs = (params?.refs as string[] | undefined) ?? [];
                if (!Array.isArray(refs) || refs.length === 0) {
                    return validationError('refs[] required', 'Send params.refs as a non-empty array.', meta, { missing: ['refs'] });
                }
                const data = await tokensPost('/assets/market-snapshots', { refs });
                return NextResponse.json({ action, snapshots: data }, { headers: meta.headers });
            }
            default:
                return validationError(
                    `unknown_action:${action}`,
                    'Use action="search" | "resolve" | "asset" | "price" | "risk" | "markets" | "market_snapshots".',
                    meta,
                    { action },
                );
        }
    } catch (err) {
        return errorResponse(err, meta, { httpHint: 502 });
    }
}
