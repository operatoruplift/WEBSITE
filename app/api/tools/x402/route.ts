import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * x402 tool endpoint, proxy for premium API calls that may require payment.
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

        if (action === 'charge') {
            // x402 per-query charge, records the payment intent.
            // In production this would trigger a Solana Pay USDC transfer.
            // For devnet/demo, we log and approve immediately.
            const { amount, currency, memo, userId: chargeUserId } = params || {};
            if (!amount || amount <= 0) {
                return NextResponse.json({ error: 'amount required' }, { status: 400 });
            }

            // TODO: In production, build a Solana Pay transfer URL for USDC
            // and wait for on-chain confirmation before returning success.
            // For now, log the charge and return success (devnet mode).
            const chargeRecord = {
                amount,
                currency: currency || 'USDC',
                memo: memo || 'x402 query charge',
                userId: chargeUserId,
                timestamp: new Date().toISOString(),
                status: 'approved', // devnet: auto-approve
                tx_signature: `x402-devnet-${Date.now()}`,
            };

            console.log('[x402/charge]', chargeRecord);

            return NextResponse.json({
                action: 'charge',
                ...chargeRecord,
            });
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
