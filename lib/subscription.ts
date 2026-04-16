/**
 * Subscription check — server-side.
 *
 * Checks Supabase for an active subscription for the given user.
 * Returns the tier ('free' | 'pro') and whether the user can access gated routes.
 *
 * Bypass logic is evaluated on every request (never build-cached).
 */
import { createClient } from '@supabase/supabase-js';

export interface SubscriptionStatus {
    tier: 'free' | 'pro' | 'enterprise';
    active: boolean;
    expiresAt: string | null;
    /** Machine-readable reason when active=false — used by /api/debug/subscription */
    reason?: string;
    /** Why this check returned its current state — for debugging */
    source?: 'bypass_all' | 'bypass_email' | 'no_backend' | 'supabase_active' | 'supabase_expired' | 'supabase_none';
}

const FREE_STATUS: SubscriptionStatus = { tier: 'free', active: false, expiresAt: null, reason: 'no_active_subscription', source: 'supabase_none' };

/**
 * Emails allowed to bypass the paywall (comma-separated in PAYWALL_BYPASS_EMAILS).
 * Works at runtime — no build-time caching. Safe in production if the env var
 * is only set on staging / for specific accounts.
 */
function bypassEmails(): string[] {
    const raw = process.env.PAYWALL_BYPASS_EMAILS || '';
    return raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

export function isBypassAllEnabled(): boolean {
    return process.env.NEXT_PUBLIC_PAYWALL_BYPASS === '1';
}

export function isEmailBypassed(email: string | null | undefined): boolean {
    if (!email) return false;
    const allowed = bypassEmails();
    return allowed.includes(email.toLowerCase());
}

export async function checkSubscription(userId: string, email?: string): Promise<SubscriptionStatus> {
    // 1. Global bypass (staging/dev) — evaluated at request time
    if (isBypassAllEnabled()) {
        return { tier: 'pro', active: true, expiresAt: null, source: 'bypass_all' };
    }

    // 2. Per-email bypass (specific testers/admins)
    if (email && isEmailBypassed(email)) {
        return { tier: 'pro', active: true, expiresAt: null, source: 'bypass_email' };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        // No Supabase — dev mode, grant pro access
        return { tier: 'pro', active: true, expiresAt: null, source: 'no_backend' };
    }

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const { data } = await supabase
        .from('subscriptions')
        .select('tier, status, expires_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

    if (!data) return { ...FREE_STATUS, reason: 'no_subscription_row', source: 'supabase_none' };

    // Check expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
        // Expired — update status
        await supabase
            .from('subscriptions')
            .update({ status: 'expired', updated_at: new Date().toISOString() })
            .eq('user_id', userId);
        return { ...FREE_STATUS, reason: 'subscription_expired', source: 'supabase_expired' };
    }

    return {
        tier: data.tier as 'pro' | 'enterprise',
        active: true,
        expiresAt: data.expires_at,
        source: 'supabase_active',
    };
}

/** Routes that require Pro subscription */
export const GATED_ROUTES = ['/chat', '/swarm', '/security', '/app', '/agents', '/workflows', '/memory', '/integrations', '/analytics', '/notifications', '/profile'];

/** Routes accessible on free tier (read-only marketplace) */
export const FREE_ROUTES = ['/marketplace', '/settings', '/onboarding'];

export function isGatedRoute(pathname: string): boolean {
    return GATED_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
}

export function isFreeRoute(pathname: string): boolean {
    return FREE_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
}
