import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * x402 tool endpoint — proxy for premium API calls that may require payment.
 *
 * When an agent emits a tool_use block with tool: "x402", this route:
 * 1. Fetches the target URL
 * 2. If 402, returns the payment request for the UI to show approval
 * 3. After payment, retries with the X-Payment-Proof header
 *
 * This is the server-side bridge. The full x402 implementation lives
 * in /workspaces/x402-agent/biarritz/.
 */
export async function POST(request: Request) {
    try {
        const { action, params } = await request.json();

        if (action === 'fetch') {
            const url = params?.url;
            if (!url || typeof url !== 'string') {
                return NextResponse.json({ error: 'url required' }, { status: 400 });
            }

            // Fetch the target URL
            const res = await fetch(url, {
                method: params?.method || 'GET',
                headers: params?.headers || {},
                ...(params?.body ? { body: JSON.stringify(params.body) } : {}),
            });

            // If 402, return the payment request
            if (res.status === 402) {
                const paymentHeader = res.headers.get('X-Payment-Required');
                return NextResponse.json({
                    action: 'payment_required',
                    status: 402,
                    payment: paymentHeader ? JSON.parse(paymentHeader) : null,
                    url,
                }, { status: 402 });
            }

            // Otherwise return the response data
            let data: unknown;
            try { data = await res.json(); } catch { data = { raw: await res.text() }; }
            return NextResponse.json({ action: 'fetch', status: res.status, data });
        }

        if (action === 'retry_with_proof') {
            const { url, tx_signature, method, headers: reqHeaders, body } = params || {};
            if (!url || !tx_signature) {
                return NextResponse.json({ error: 'url and tx_signature required' }, { status: 400 });
            }

            const res = await fetch(url, {
                method: method || 'GET',
                headers: { ...reqHeaders, 'X-Payment-Proof': tx_signature },
                ...(body ? { body: JSON.stringify(body) } : {}),
            });

            let data: unknown;
            try { data = await res.json(); } catch { data = { raw: await res.text() }; }
            return NextResponse.json({ action: 'retry_with_proof', status: res.status, data });
        }

        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
