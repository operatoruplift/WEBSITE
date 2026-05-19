import { NextResponse } from 'next/server';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';
import { recallSession, listSessions } from '@/lib/arkiv';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * GET /api/arkiv/memories?agent=<slug>&session=<id>
 *
 * Reads memory events from Arkiv Braga. Two modes:
 *
 *   - session mode: ?agent=<slug>&session=<id> returns every memory
 *     event for one agent + session, newest first. Drops straight into
 *     an LLM chat-completions array on the client.
 *
 *   - index mode: ?agent=<slug> (no session) returns the list of
 *     sessions that have at least one memory event for the agent.
 *     Used by the /arkiv demo session picker.
 *
 * Public, no auth: any judge can read the on-Arkiv memory of the
 * Calendar/Gmail demo agents without prior credentials. The query is
 * always scoped by PROJECT_ATTRIBUTE so we don't leak data from other
 * Arkiv projects.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'arkiv.memories.read');
    try {
        const url = new URL(request.url);
        const agentSlug = url.searchParams.get('agent');
        const sessionId = url.searchParams.get('session');

        if (!agentSlug) {
            return validationError(
                'agent required',
                'Pass ?agent=<slug> in the query string. Optionally add ?session=<id> for the messages of one session.',
                meta,
                { missing: ['agent'] },
            );
        }

        if (sessionId) {
            const memories = await recallSession(agentSlug, sessionId);
            return NextResponse.json(
                {
                    mode: 'session',
                    agentSlug,
                    sessionId,
                    memories,
                    count: memories.length,
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                },
                { headers: meta.headers },
            );
        }

        const sessions = await listSessions(agentSlug);
        return NextResponse.json(
            {
                mode: 'index',
                agentSlug,
                sessions,
                count: sessions.length,
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta, { errorClass: 'provider_unavailable' });
    }
}
