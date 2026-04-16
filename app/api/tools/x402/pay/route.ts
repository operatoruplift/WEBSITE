import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { getInvoice, markInvoicePaid } from '@/lib/x402/invoices';
import crypto from 'crypto';

export const runtime = 'nodejs';

/**
 * POST /api/tools/x402/pay
 *
 * Mark an invoice paid so the client can retry the gated tool call
 * with `X-Payment-Proof: <invoice_reference>`.
 *
 * Devnet demo flow: we simulate the Solana Pay transfer and return a
 * synthetic tx signature. Production would verify the on-chain tx
 * targeting the TREASURY_WALLET for the invoice's amount.
 *
 * Body:
 *   { invoice_reference: string, tx_signature?: string }
 *
 * Returns:
 *   { status: 'paid', invoice_reference, tx_signature, chain }
 */
export async function POST(request: Request) {
    try {
        const verified = await verifySession(request);
        const { invoice_reference, tx_signature } = await request.json();

        if (!invoice_reference) {
            return NextResponse.json({ error: 'invoice_reference required' }, { status: 400 });
        }

        const invoice = await getInvoice(invoice_reference);
        if (!invoice) {
            return NextResponse.json({ error: 'invoice_not_found' }, { status: 404 });
        }
        if (invoice.user_id !== verified.userId) {
            return NextResponse.json({ error: 'forbidden' }, { status: 403 });
        }
        if (invoice.status === 'paid' || invoice.status === 'consumed') {
            // Idempotent — return success so retries don't fail
            return NextResponse.json({
                status: invoice.status,
                invoice_reference: invoice.invoice_reference,
                tx_signature: invoice.tx_signature,
                chain: invoice.chain,
            });
        }
        if (new Date(invoice.expires_at) < new Date()) {
            return NextResponse.json({ error: 'invoice_expired' }, { status: 410 });
        }

        // Devnet: simulate the payment.
        // Production (mainnet): verify tx on-chain before marking paid.
        const sig = tx_signature || `devnet_sim_${crypto.randomBytes(16).toString('hex')}`;
        const ok = await markInvoicePaid(invoice_reference, sig);
        if (!ok) {
            return NextResponse.json({ error: 'mark_paid_failed' }, { status: 500 });
        }

        return NextResponse.json({
            status: 'paid',
            invoice_reference: invoice.invoice_reference,
            tx_signature: sig,
            chain: invoice.chain,
            amount: invoice.amount_usdc,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
