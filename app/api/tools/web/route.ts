import { NextResponse } from 'next/server';
import { getCapabilities } from '@/lib/capabilities';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * POST /api/tools/web
 * Body: { action: 'search' | 'fetch', params: { query?: string; url?: string } }
 *
 * Tier 1 tool. No OAuth required. Demo callers never reach this route
 * (they go through executeMock client-side), but the capability guard
 * here is belt-and-braces: capability_real = false → 403.
 */
export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'tools.web');
    try {
        const caps = await getCapabilities(request);
        if (!caps.capability_real) {
            return NextResponse.json(
                { error: 'demo_mode', simulated: true, message: 'Sign in to run real web tools.', requestId: meta.requestId },
                { status: 403, headers: meta.headers },
            );
        }

        const { action, params } = (await request.json()) as {
            action?: string;
            params?: { query?: string; url?: string };
        };

        if (action === 'search') {
            const query = String(params?.query ?? '').trim();
            if (!query) {
                return validationError('query required', 'Send params.query in the JSON payload.', meta, { missing: ['query'] });
            }
            const key = process.env.SERPER_API_KEY || process.env.BRAVE_SEARCH_API_KEY;
            if (!key) {
                return errorResponse(new Error('Server-held search key (SERPER_API_KEY or BRAVE_SEARCH_API_KEY) not configured.'), meta, {
                    errorClass: 'provider_unavailable',
                });
            }
            try {
                if (process.env.SERPER_API_KEY) {
                    const res = await fetch('https://google.serper.dev/search', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-API-KEY': process.env.SERPER_API_KEY,
                        },
                        body: JSON.stringify({ q: query, num: 6 }),
                    });
                    const data = await res.json();
                    return NextResponse.json({ action, query, results: data.organic ?? [] }, { headers: meta.headers });
                }
                // Brave fallback
                const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=6`, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY!,
                    },
                });
                const data = await res.json();
                return NextResponse.json({ action, query, results: data.web?.results ?? [] }, { headers: meta.headers });
            } catch (err) {
                return errorResponse(err, meta, { httpHint: 502 });
            }
        }

        if (action === 'fetch') {
            const url = String(params?.url ?? '').trim();
            if (!url) {
                return validationError('url required', 'Send params.url in the JSON payload.', meta, { missing: ['url'] });
            }
            if (!/^https?:\/\//i.test(url)) {
                return validationError('invalid_url', 'Pass an http or https URL.', meta, { url });
            }
            try {
                const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'OperatorUpliftBot/1.0' } });
                if (!res.ok) {
                    return errorResponse(new Error(`fetch_failed_${res.status}`), meta, { httpHint: 502 });
                }
                const ct = res.headers.get('content-type') || '';
                if (!ct.includes('text/') && !ct.includes('json') && !ct.includes('xml')) {
                    return NextResponse.json(
                        { error: 'unsupported_content_type', contentType: ct, requestId: meta.requestId },
                        { status: 415, headers: meta.headers },
                    );
                }
                const text = await res.text();
                // Strip scripts/styles, keep the text body. Real implementation
                // should use @mozilla/readability, this is the minimal version
                // that works for the demo beats.
                const stripped = text
                    .replace(/<script[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .slice(0, 8000);
                return NextResponse.json({ action, url, text: stripped }, { headers: meta.headers });
            } catch (err) {
                return errorResponse(err, meta, { httpHint: 502 });
            }
        }

        return validationError(`unknown_action:${action}`, 'Use action="search" or action="fetch".', meta, { action });
    } catch (err) {
        return errorResponse(err, meta);
    }
}
