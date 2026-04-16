import { NextResponse } from 'next/server';
import { listMessages, readMessage, createDraft, sendDraft, sendEmail } from '@/lib/google/gmail';
import { isGoogleConnected } from '@/lib/google/oauth';
import { verifySession } from '@/lib/auth';
import { x402Gate } from '@/lib/x402/middleware';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Gmail tool endpoint — server-verified auth, not client-supplied user_id.
 *
 * Gated actions (require X-Payment-Proof header, $0.01 USDC each on devnet):
 *   draft, send_draft, send
 * Free actions:
 *   list, read
 */
export async function POST(request: Request) {
    try {
        const verified = await verifySession(request);
        const { action, params, agent_id } = await request.json();
        const user_id = verified.userId;

        if (!action) {
            return NextResponse.json({ error: 'action required' }, { status: 400 });
        }

        const connected = await isGoogleConnected(user_id);
        if (!connected) {
            return NextResponse.json(
                {
                    error: 'google_not_connected',
                    message: 'Gmail not connected. Go to Integrations to connect.',
                    requires_action: 'connect_google',
                },
                { status: 403 },
            );
        }

        // x402 gate — returns 402 on first call to gated actions, 'paid' on retry with proof
        const gate = await x402Gate({ request, tool: 'gmail', action, params, user_id });
        if (gate.type === '402') return gate.response;

        switch (action) {
            case 'list': {
                const messages = await listMessages(
                    user_id,
                    params?.query ?? 'in:inbox',
                    params?.max_results ?? 20,
                );
                return NextResponse.json({ action: 'list', messages });
            }

            case 'read': {
                if (!params?.message_id) {
                    return NextResponse.json({ error: 'message_id required' }, { status: 400 });
                }
                const message = await readMessage(user_id, params.message_id);
                return NextResponse.json({ action: 'read', message });
            }

            case 'draft': {
                if (!params?.to || !params?.subject || !params?.body) {
                    return NextResponse.json(
                        { error: 'to, subject, and body required for draft' },
                        { status: 400 },
                    );
                }
                const draft = await createDraft(user_id, {
                    to: params.to,
                    subject: params.subject,
                    body: params.body,
                    cc: params.cc,
                    bcc: params.bcc,
                });
                const payload: { action: string; draft: unknown; receipt?: unknown } = { action: 'draft', draft };
                if (gate.type === 'paid') {
                    payload.receipt = await gate.createReceipt(draft, { agent_id });
                }
                return NextResponse.json(payload);
            }

            case 'send_draft': {
                if (!params?.draft_id) {
                    return NextResponse.json({ error: 'draft_id required' }, { status: 400 });
                }
                const result = await sendDraft(user_id, params.draft_id);
                const payload: { action: string; result: unknown; receipt?: unknown } = { action: 'send_draft', result };
                if (gate.type === 'paid') {
                    payload.receipt = await gate.createReceipt(result, { agent_id });
                }
                return NextResponse.json(payload);
            }

            case 'send': {
                if (!params?.to || !params?.subject || !params?.body) {
                    return NextResponse.json(
                        { error: 'to, subject, and body required for send' },
                        { status: 400 },
                    );
                }
                const result = await sendEmail(user_id, {
                    to: params.to,
                    subject: params.subject,
                    body: params.body,
                    cc: params.cc,
                    bcc: params.bcc,
                });
                const payload: { action: string; result: unknown; receipt?: unknown } = { action: 'send', result };
                if (gate.type === 'paid') {
                    payload.receipt = await gate.createReceipt(result, { agent_id });
                }
                return NextResponse.json(payload);
            }

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}. Supported: list, read, draft, send_draft, send` },
                    { status: 400 },
                );
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[tools/gmail]', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
