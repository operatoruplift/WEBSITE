import { NextResponse } from 'next/server';
import { verifySession, getUserEmail } from '@/lib/auth';
import { isEmailBypassed, isUserIdBypassed } from '@/lib/subscription';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function newRequestId(): string {
    return `req_${crypto.randomUUID()}`;
}

/**
 * Admin-gated provider-timeout simulator. Used by /dev/reliability to
 * prove the calm-copy error path renders correctly when an upstream
 * hangs. Sleeps `delayMs` (default 6000) then returns HTTP 504 with the
 * standard {requestId, timestamp, message, nextAction} shape.
 *
 * Gated identically to /api/debug/subscription and /api/whoami, the
 * caller must be a bypass-listed email / userId, or pass X-Debug-Key.
 */
export async function POST(request: Request) {
    const requestId = newRequestId();
    const startedAt = new Date().toISOString();

    const debugKey = request.headers.get('x-debug-key');
    const adminKey = process.env.DEBUG_ADMIN_KEY;

    let sessionEmail: string | null = null;
    let privyUserId: string | null = null;
    try {
        const verified = await verifySession(request);
        privyUserId = verified.userId;
        sessionEmail = await getUserEmail(verified.userId);
    } catch { /* no session is fine if they bring DEBUG_ADMIN_KEY */ }

    const isAdmin =
        (!!adminKey && debugKey === adminKey)
        || (sessionEmail && isEmailBypassed(sessionEmail))
        || (privyUserId && isUserIdBypassed(privyUserId));
    if (!isAdmin) {
        return NextResponse.json(
            { error: 'forbidden', hint: 'Admin-gated. Bypass-listed session email OR X-Debug-Key header required.' },
            { status: 403 },
        );
    }

    let delayMs = 6_000;
    try {
        const body = await request.json().catch(() => ({}));
        if (typeof body?.delayMs === 'number' && body.delayMs >= 100 && body.delayMs <= 25_000) {
            delayMs = body.delayMs;
        }
    } catch { /* default delay */ }

    await new Promise(resolve => setTimeout(resolve, delayMs));

    console.log(JSON.stringify({ at: 'dev.reliability.timeout', event: 'simulated-timeout', requestId, ts: startedAt, delayMs }));
    return NextResponse.json(
        {
            error: 'provider_timeout',
            errorClass: 'provider_unavailable',
            message: 'Simulated upstream timeout.',
            nextAction: 'Try again in a moment, this is a harness check, not a real outage.',
            requestId,
            timestamp: startedAt,
            delayMs,
        },
        { status: 504, headers: { 'X-Request-Id': requestId } },
    );
}
