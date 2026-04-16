import { NextResponse } from 'next/server';
import { listEvents, findFreeSlots, createEvent } from '@/lib/google/calendar';
import { isGoogleConnected } from '@/lib/google/oauth';
import { verifySession } from '@/lib/auth';
import { x402Gate } from '@/lib/x402/middleware';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Calendar tool endpoint — called by the swarm/chat agent runner
 * when an agent emits a calendar tool call.
 *
 * POST /api/tools/calendar
 * Body: { action: 'list' | 'free_slots' | 'create', params: {...} }
 *
 * Gated actions (requires X-Payment-Proof header):
 *   create — charges $0.01 USDC on Solana devnet
 * Free actions:
 *   list, free_slots
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
                    message: 'Google Calendar not connected. Go to Integrations to connect.',
                    requires_action: 'connect_google',
                },
                { status: 403 },
            );
        }

        // x402 gate — returns 402 on first call, 'paid' on retry with proof
        const gate = await x402Gate({ request, tool: 'calendar', action, params, user_id });
        if (gate.type === '402') return gate.response;

        switch (action) {
            case 'list': {
                const events = await listEvents(
                    user_id,
                    params?.days_ahead ?? 7,
                    params?.max_results ?? 20,
                );
                return NextResponse.json({ action: 'list', events });
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
                return NextResponse.json({ action: 'free_slots', slots });
            }

            case 'create': {
                if (!params?.summary || !params?.start || !params?.end) {
                    return NextResponse.json(
                        { error: 'summary, start, and end are required for create' },
                        { status: 400 },
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
                return NextResponse.json(payload);
            }

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}. Supported: list, free_slots, create` },
                    { status: 400 },
                );
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[tools/calendar]', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
