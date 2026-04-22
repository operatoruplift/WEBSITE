/**
 * x402 Payment Client, Bridge for bucharest.
 *
 * Wraps fetch() to handle HTTP 402 responses from premium MCP tool APIs.
 * When a tool returns 402 with an X-Payment-Required header, this client
 * parses the payment request, shows it to the user for approval via the
 * ToolApprovalModal, executes the Solana payment, and retries the request
 * with proof of payment.
 *
 * Architecture: This is a lightweight client-side bridge. The full x402
 * implementation lives in /workspaces/x402-agent/biarritz/. This module
 * replicates the core fetch-intercept pattern without importing the
 * biarritz workspace directly (they're separate repos).
 */

export interface X402PaymentRequest {
    recipient: string;   // Solana pubkey
    amount: number;      // SOL
    currency: string;    // 'SOL' | 'USDC'
    chain: string;       // 'solana'
    memo?: string;
}

export interface X402FetchResult {
    response: Response;
    paymentMade: boolean;
    txSignature?: string;
    amountPaid?: number;
}

/**
 * Fetch with x402 payment handling.
 *
 * If the server returns 402 with X-Payment-Required, this returns the
 * parsed payment request so the UI can show an approval modal. After
 * approval and payment, call `retryWithProof()` to complete the request.
 */
export async function x402Fetch(
    url: string,
    init?: RequestInit,
): Promise<{ ok: true; response: Response } | { ok: false; paymentRequired: X402PaymentRequest; originalUrl: string }> {
    const response = await fetch(url, init);

    if (response.status !== 402) {
        return { ok: true, response };
    }

    const header = response.headers.get('X-Payment-Required');
    if (!header) {
        throw new Error('402 response missing X-Payment-Required header');
    }

    const payment: X402PaymentRequest = JSON.parse(header);
    return { ok: false, paymentRequired: payment, originalUrl: url };
}

/**
 * Retry a request after payment, including proof of payment in the header.
 */
export async function retryWithProof(
    url: string,
    txSignature: string,
    init?: RequestInit,
): Promise<Response> {
    const headers = new Headers(init?.headers);
    headers.set('X-Payment-Proof', txSignature);

    return fetch(url, { ...init, headers });
}

/**
 * Check if a response is an x402 payment-required response.
 */
export function isPaymentRequired(response: Response): boolean {
    return response.status === 402 && response.headers.has('X-Payment-Required');
}

/**
 * Parse the payment request from a 402 response.
 */
export function parsePaymentRequest(response: Response): X402PaymentRequest | null {
    const header = response.headers.get('X-Payment-Required');
    if (!header) return null;
    try {
        return JSON.parse(header);
    } catch {
        return null;
    }
}
