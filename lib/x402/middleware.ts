/**
 * x402 payment middleware for tool endpoints.
 *
 * Usage (in /api/tools/calendar/route.ts and /api/tools/gmail/route.ts):
 *
 *   export async function POST(request: Request) {
 *     const verified = await verifySession(request);
 *     const { action, params } = await request.json();
 *     const user_id = verified.userId;
 *
 *     const gate = await x402Gate({ request, tool: 'calendar', action, params, user_id });
 *     if (gate.type === '402') return gate.response;
 *
 *     // ...execute the tool and return result...
 *     const result = await doTheThing();
 *
 *     if (gate.type === 'paid') {
 *       return NextResponse.json({
 *         ...result,
 *         receipt: await gate.createReceipt(result),
 *       });
 *     }
 *     return NextResponse.json(result); // free action
 *   }
 */
import { NextResponse } from 'next/server';
import { getToolPrice, TREASURY_WALLET } from './pricing';
import {
    createInvoice,
    hashParams,
    markInvoiceConsumed,
    validateInvoiceForConsumption,
    type Invoice,
} from './invoices';
import { createAndStoreReceipt, type SignedReceipt } from './receipts';

/**
 * Result of checking the x402 gate for a request.
 *
 *   'free', action is not gated, caller just executes
 *   '402' , first call with no proof; caller returns this response
 *   'paid', valid proof attached; caller executes, then calls createReceipt()
 */
export type GateResult =
    | { type: 'free' }
    | { type: '402'; response: NextResponse }
    | {
          type: 'paid';
          invoice: Invoice;
          paramsHash: string;
          createReceipt: (result: unknown, opts?: { agent_id?: string | null }) => Promise<SignedReceipt>;
      };

export async function x402Gate(args: {
    request: Request;
    tool: string;
    action: string;
    params: unknown;
    user_id: string;
}): Promise<GateResult> {
    const price = getToolPrice(args.tool, args.action);
    if (!price) {
        // Free action, no gate
        return { type: 'free' };
    }

    const paramsHash = hashParams(args.params ?? {});

    // Check for X-Payment-Proof header (the invoice reference the client
    // paid for and is now retrying against).
    const proofRef = args.request.headers.get('x-payment-proof');

    if (proofRef) {
        const invoice = await validateInvoiceForConsumption(
            proofRef,
            args.user_id,
            args.tool,
            args.action,
            paramsHash,
        );
        if (!invoice) {
            return {
                type: '402',
                response: NextResponse.json(
                    {
                        error: 'invalid_payment_proof',
                        message: 'Payment proof is invalid, expired, or does not match this request',
                    },
                    { status: 402 },
                ),
            };
        }

        return {
            type: 'paid',
            invoice,
            paramsHash,
            createReceipt: async (result, opts) => {
                const signed = await createAndStoreReceipt({
                    user_id: args.user_id,
                    agent_id: opts?.agent_id ?? null,
                    tool: args.tool,
                    action: args.action,
                    params_hash: paramsHash,
                    result,
                    invoice_reference: invoice.invoice_reference,
                    amount_usdc: invoice.amount_usdc,
                    chain: invoice.chain,
                    payment_tx: invoice.tx_signature || 'devnet-sim',
                });
                await markInvoiceConsumed(invoice.invoice_reference);
                return signed;
            },
        };
    }

    // No proof, mint an invoice and return 402
    const invoice = await createInvoice({
        user_id: args.user_id,
        tool: args.tool,
        action: args.action,
        amount_usdc: price.amount,
        chain: price.chain,
        params_hash: paramsHash,
    });

    const response = NextResponse.json(
        {
            error: 'payment_required',
            accepts: [
                {
                    scheme: 'solana-pay',
                    chain: price.chain,
                    amount: price.amount,
                    currency: price.currency,
                    recipient: TREASURY_WALLET,
                    description: price.description,
                    invoice_reference: invoice?.invoice_reference,
                },
            ],
            invoice_reference: invoice?.invoice_reference,
            amount: price.amount,
            currency: price.currency,
            chain: price.chain,
            description: price.description,
            pay_endpoint: '/api/tools/x402/pay',
            retry_header: 'X-Payment-Proof',
        },
        { status: 402 },
    );

    if (invoice?.invoice_reference) {
        response.headers.set(
            'X-Payment-Required',
            JSON.stringify({
                recipient: TREASURY_WALLET,
                amount: price.amount,
                currency: price.currency,
                chain: price.chain,
                memo: `OU ${args.tool}.${args.action}`,
            }),
        );
        response.headers.set('X-Invoice-Reference', invoice.invoice_reference);
    }

    return { type: '402', response };
}
