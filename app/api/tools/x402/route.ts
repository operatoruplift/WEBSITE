import { NextResponse } from 'next/server';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export const runtime = 'nodejs';

// capability-check-exempt: x402 proxy. Auth is proof-of-payment via
// X-Payment-Proof on retry, not a Privy session. No user-bound state
// is read or written here; the route only forwards the outbound fetch.

/**
 * x402 tool endpoint, proxy for premium API calls that may require payment.
 *
 * When an agent emits a tool_use block with tool: "x402", this route:
 * 1. Fetches the target URL
 * 2. If 402, returns the payment request for the UI to show approval
 * 3. After payment, retries with the X-Payment-Proof header
 *
 * Real payment settlement lives in /api/tools/x402/pay (signs a real
 * ed25519 receipt and broadcasts the on-chain tx). This route only
 * forwards outbound fetches and surfaces 402 challenges back to the
 * client.
 */
export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'tools.x402');
    try {
        const { action, params } = await request.json();

        if (action === 'fetch') {
            const url = params?.url;
            if (!url || typeof url !== 'string') {
                return validationError('url required', 'Send params.url in the JSON body.', meta, { missing: ['url'] });
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
                    requestId: meta.requestId,
                }, { status: 402, headers: meta.headers });
            }

            // Otherwise return the response data
            let data: unknown;
            try { data = await res.json(); } catch { data = { raw: await res.text() }; }
            return NextResponse.json(
                { action: 'fetch', status: res.status, data },
                { headers: meta.headers },
            );
        }

        if (action === 'charge') {
            // The legacy "charge" action used to log a payment intent and
            // return a fabricated `tx_signature: x402-devnet-${Date.now()}`,
            // which violated the honesty rule (PR #147). Real settlement
            // lives in /api/tools/x402/pay where a genuine ed25519 receipt
            // is produced. Returning 410 Gone with a clear nextAction so
            // any stale caller is pointed at the real endpoint.
            return NextResponse.json({
                error: 'gone',
                errorClass: 'unknown',
                requestId: meta.requestId,
                timestamp: meta.startedAt,
                message: 'The "charge" action is deprecated.',
                nextAction: 'Use POST /api/tools/x402/pay with the invoice_reference. That route signs a real ed25519 receipt and submits the on-chain tx.',
            }, { status: 410, headers: meta.headers });
        }

        if (action === 'retry_with_proof') {
            const { url, tx_signature, method, headers: reqHeaders, body } = params || {};
            if (!url || !tx_signature) {
                return validationError('url and tx_signature required', 'Send both params.url and params.tx_signature in the JSON body.', meta, {
                    missing: [!url && 'url', !tx_signature && 'tx_signature'].filter(Boolean),
                });
            }

            const res = await fetch(url, {
                method: method || 'GET',
                headers: { ...reqHeaders, 'X-Payment-Proof': tx_signature },
                ...(body ? { body: JSON.stringify(body) } : {}),
            });

            let data: unknown;
            try { data = await res.json(); } catch { data = { raw: await res.text() }; }
            return NextResponse.json(
                { action: 'retry_with_proof', status: res.status, data },
                { headers: meta.headers },
            );
        }

        return validationError(`Unknown action: ${action}`, 'Use action="fetch" or action="retry_with_proof".', meta, { action });
    } catch (err) {
        return errorResponse(err, meta);
    }
}
