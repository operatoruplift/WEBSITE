import { NextResponse } from 'next/server';
import { listMessages, readMessage, createDraft, sendDraft, sendEmail } from '@/lib/google/gmail';
import { isGoogleConnected } from '@/lib/google/oauth';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Gmail tool endpoint — called by the swarm/chat agent runner
 * when an agent emits a Gmail tool call.
 *
 * POST /api/tools/gmail
 * Body: { action: 'list' | 'read' | 'draft' | 'send_draft' | 'send', params: {...}, user_id: string }
 */
export async function POST(request: Request) {
    try {
        const { action, params, user_id } = await request.json();

        if (!user_id) {
            return NextResponse.json({ error: 'user_id required' }, { status: 400 });
        }

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
                return NextResponse.json({ action: 'draft', draft });
            }

            case 'send_draft': {
                if (!params?.draft_id) {
                    return NextResponse.json({ error: 'draft_id required' }, { status: 400 });
                }
                const result = await sendDraft(user_id, params.draft_id);
                return NextResponse.json({ action: 'send_draft', result });
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
                return NextResponse.json({ action: 'send', result });
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
