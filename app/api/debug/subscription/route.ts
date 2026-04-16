import { NextResponse } from 'next/server';
import { verifySession, getUserEmail } from '@/lib/auth';
import {
    checkSubscription,
    isBypassAllEnabled,
    isEmailBypassed,
    isGatedRoute,
} from '@/lib/subscription';

export const runtime = 'nodejs';

/**
 * GET /api/debug/subscription
 *
 * Admin-only diagnostics for the paywall. Returns userId, email, bypass
 * status, subscription state, and the exact reason a redirect would have
 * happened on the given pathname.
 *
 * Admins: anyone whose email is in PAYWALL_BYPASS_EMAILS, OR any request
 * with the admin debug header (X-Debug-Key matching DEBUG_ADMIN_KEY env).
 */
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const debugKey = request.headers.get('x-debug-key');
        const adminKey = process.env.DEBUG_ADMIN_KEY;

        let userId: string | null = null;
        let email: string | null = null;
        let authError: string | null = null;

        try {
            const verified = await verifySession(request);
            userId = verified.userId;
            email = await getUserEmail(verified.userId);
        } catch (err) {
            authError = err instanceof Error ? err.message : 'auth failed';
        }

        // Access control: must have valid session OR matching debug key
        const isAdmin = (email && isEmailBypassed(email)) || (!!adminKey && debugKey === adminKey);
        if (!isAdmin) {
            return NextResponse.json({
                error: 'unauthorized',
                hint: 'Must be authenticated as a bypass-listed email, OR provide X-Debug-Key header matching DEBUG_ADMIN_KEY.',
                authError,
            }, { status: 403 });
        }

        const pathname = url.searchParams.get('pathname') || '/chat';
        const bypassEnabled = isBypassAllEnabled();
        const emailBypass = email ? isEmailBypassed(email) : false;

        const status = userId ? await checkSubscription(userId, email || undefined) : null;

        let redirectReason: string | null = null;
        if (!userId) {
            redirectReason = 'no_session';
        } else if (status?.active) {
            redirectReason = null; // Would not redirect
        } else if (!isGatedRoute(pathname)) {
            redirectReason = null; // Free route
        } else {
            redirectReason = status?.reason || 'no_active_subscription';
        }

        return NextResponse.json({
            userId,
            email,
            authError,
            bypass: {
                globalBypassEnabled: bypassEnabled,
                emailBypassActive: emailBypass,
                bypassEmails: (process.env.PAYWALL_BYPASS_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean),
            },
            subscription: status,
            redirect: {
                pathname,
                wouldRedirect: redirectReason !== null && isGatedRoute(pathname),
                reason: redirectReason,
            },
            environment: {
                nodeEnv: process.env.NODE_ENV,
                hasSupabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
                hasPrivy: !!process.env.PRIVY_APP_SECRET,
                simulatorEnabled: process.env.PAYMENT_SIMULATOR_ENABLED === '1',
            },
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
