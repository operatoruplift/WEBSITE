import { NextResponse } from 'next/server';
import { listEvents, findFreeSlots, createEvent } from '@/lib/google/calendar';
import { isGoogleConnected } from '@/lib/google/oauth';
import { verifySession } from '@/lib/auth';
import { x402Gate } from '@/lib/x402/middleware';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Calendar tool endpoint — called by the chat / swarm tool runner.
 *
 * Body: { action: 'list' | 'free_slots' | 'create', params: {...} }
 *
 * Gated actions (require X-Payment-Proof header):
 *   create — $0.01 USDC on Solana devnet
 * Free actions:
 *   list, free_slots
 *
 * Every response (success or error) carries X-Request-Id. Errors follow
 * the shared envelope so the chat UI shows calm copy + Ref + Copy.
 * x402 + receipt semantics are unchanged.
 */
export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'tools.calendar');
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
                'Re-send with one of: list, free_slots, create.',
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
                    message: 'Google Calendar is not connected to this account.',
                    nextAction: 'Go to Integrations and connect Google to use Calendar tools.',
                    requires_action: 'connect_google',
                },
                { status: 403, headers: meta.headers },
            );
        }

        // x402 gate — unchanged semantics. Only the response envelope is
        // standardized, not the gating logic.
        const gate = await x402Gate({ request, tool: 'calendar', action, params, user_id });
        if (gate.type === '402') {
            const res = gate.response as NextResponse;
            res.headers.set('X-Request-Id', meta.requestId);
            return res;
        }

        switch (action) {
            case 'list': {
                const events = await listEvents(
                    user_id,
                    params?.days_ahead ?? 7,
                    params?.max_results ?? 20,
                );
                return NextResponse.json({ action: 'list', events }, { headers: meta.headers });
            }

            case 'free_slots': {
                const slots = await findFreeSlots(
                    user_id,
                    params?.duration_minutes ?? 30,
                    params?.days_ahead ?? 7,
                    params?.max_slots ?? 5,
                    params?.start_day_offset ?? 0,
                    params?.local_date ?? undefined,
                );
                return NextResponse.json({ action: 'free_slots', slots }, { headers: meta.headers });
            }

            case 'create': {
                if (!params?.summary || !params?.start || !params?.end) {
                    return validationError(
                        'Creating an event needs `summary`, `start`, and `end`.',
                        'Ask the assistant to fill in the missing fields, then retry.',
                        meta,
                        { missing: ['summary', 'start', 'end'].filter(f => !params?.[f]) },
                    );
                }
                const event = await createEvent(user_id, {
                    summary: params.summary,
                    start: params.start,
                    end: params.end,
                    description: params.description,
                    location: params.location,
                    attendees: params.attendees,
                });
                const payload: { action: string; event: unknown; receipt?: unknown } = { action: 'create', event };
                if (gate.type === 'paid') {
                    payload.receipt = await gate.createReceipt(event, { agent_id });
                }
                return NextResponse.json(payload, { headers: meta.headers });
            }

            default:
                return validationError(
                    `Unknown calendar action: ${action}.`,
                    'Supported actions: list, free_slots, create.',
                    meta,
                );
        }
    } catch (err) {
        return errorResponse(err, meta);
    }
}
