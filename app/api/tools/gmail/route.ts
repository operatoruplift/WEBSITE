import { NextResponse } from 'next/server';
import { listMessages, readMessage, createDraft, sendDraft, sendEmail } from '@/lib/google/gmail';
import { isGoogleConnected } from '@/lib/google/oauth';
import { verifySession } from '@/lib/auth';
import { x402Gate } from '@/lib/x402/middleware';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Gmail tool endpoint — server-verified auth, not client-supplied user_id.
 *
 * Gated actions (require X-Payment-Proof header, $0.01 USDC each on devnet):
 *   draft, send_draft, send
 * Free actions:
 *   list, read
 *
 * Every error response follows the shared envelope
 * ({ errorClass, message, nextAction, requestId, timestamp, details? })
 * and every response carries X-Request-Id so the chat UI can render a
 * calm copy + Ref + Copy button. x402 + receipt semantics are unchanged.
 */
export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'tools.gmail');
    try {
        let verified;
        try {
            verified = await verifySession(request);
        } catch (authErr) {
            return errorResponse(authErr, meta, { httpHint: 401 });
        }

        const { action, params, agent_id } = await request.json();
        const user_id = verified.userId;

        if (!action) {
            return validationError(
                'Tool call is missing the `action` field.',
                'Re-send with one of: list, read, draft, send_draft, send.',
                meta,
            );
        }

        const connected = await isGoogleConnected(user_id);
        if (!connected) {
            console.log(JSON.stringify({
                at: meta.route, event: 'google_not_connected', requestId: meta.requestId, ts: meta.startedAt,
            }));
            return NextResponse.json(
                {
                    error: 'google_not_connected',
                    errorClass: 'reauth_required',
                    reason: 'google_not_connected',
                    recovery: 'reauth',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    message: 'Gmail is not connected to this account.',
                    nextAction: 'Go to Integrations and connect Google to use Gmail tools.',
                    requires_action: 'connect_google',
                },
                { status: 403, headers: meta.headers },
            );
        }

        // x402 gate — returns 402 on first call to gated actions, 'paid' on retry with proof.
        // x402 semantics unchanged; we only standardize the UI surface on failures.
        const gate = await x402Gate({ request, tool: 'gmail', action, params, user_id });
        if (gate.type === '402') {
            // Pass through the x402 response body but guarantee X-Request-Id
            // is propagated so the chat UI has a reference for the challenge.
            const res = gate.response as NextResponse;
            res.headers.set('X-Request-Id', meta.requestId);
            return res;
        }

        switch (action) {
            case 'list': {
                const messages = await listMessages(
                    user_id,
                    params?.query ?? 'in:inbox',
                    params?.max_results ?? 20,
                );
                return NextResponse.json({ action: 'list', messages }, { headers: meta.headers });
            }

            case 'read': {
                if (!params?.message_id) {
                    return validationError('A `message_id` is required to read an email.', 'Supply a valid Gmail message ID.', meta);
                }
                const message = await readMessage(user_id, params.message_id);
                return NextResponse.json({ action: 'read', message }, { headers: meta.headers });
            }

            case 'draft': {
                if (!params?.to || !params?.subject || !params?.body) {
                    return validationError(
                        'Drafting an email needs `to`, `subject`, and `body`.',
                        'Ask the assistant to fill in the missing fields, then retry.',
                        meta,
                        { missing: ['to', 'subject', 'body'].filter(f => !params?.[f]) },
                    );
                }
                const draft = await createDraft(user_id, {
                    to: params.to,
                    subject: params.subject,
                    body: params.body,
                    html: params.html,
                    cc: params.cc,
                    bcc: params.bcc,
                });
                const payload: { action: string; draft: unknown; receipt?: unknown } = { action: 'draft', draft };
                if (gate.type === 'paid') {
                    payload.receipt = await gate.createReceipt(draft, { agent_id });
                }
                return NextResponse.json(payload, { headers: meta.headers });
            }

            case 'send_draft': {
                if (!params?.draft_id) {
                    return validationError('Sending a draft needs a `draft_id`.', 'Draft the email first, then retry with the returned id.', meta);
                }
                const result = await sendDraft(user_id, params.draft_id);
                const payload: { action: string; result: unknown; receipt?: unknown } = { action: 'send_draft', result };
                if (gate.type === 'paid') {
                    payload.receipt = await gate.createReceipt(result, { agent_id });
                }
                return NextResponse.json(payload, { headers: meta.headers });
            }

            case 'send': {
                if (!params?.to || !params?.subject || !params?.body) {
                    return validationError(
                        'Sending an email needs `to`, `subject`, and `body`.',
                        'Ask the assistant to fill in the missing fields, then retry.',
                        meta,
                        { missing: ['to', 'subject', 'body'].filter(f => !params?.[f]) },
                    );
                }
                const result = await sendEmail(user_id, {
                    to: params.to,
                    subject: params.subject,
                    body: params.body,
                    html: params.html,
                    cc: params.cc,
                    bcc: params.bcc,
                });
                const payload: { action: string; result: unknown; receipt?: unknown } = { action: 'send', result };
                if (gate.type === 'paid') {
                    payload.receipt = await gate.createReceipt(result, { agent_id });
                }
                return NextResponse.json(payload, { headers: meta.headers });
            }

            default:
                return validationError(
                    `Unknown gmail action: ${action}.`,
                    'Supported actions: list, read, draft, send_draft, send.',
                    meta,
                );
        }
    } catch (err) {
        return errorResponse(err, meta);
    }
}
