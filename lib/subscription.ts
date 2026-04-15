/**
 * Subscription check — server-side.
 *
 * Checks Supabase for an active subscription for the given user.
 * Returns the tier ('free' | 'pro') and whether the user can access gated routes.
 */
import { createClient } from '@supabase/supabase-js';

export interface SubscriptionStatus {
    tier: 'free' | 'pro' | 'enterprise';
    active: boolean;
    expiresAt: string | null;
}

const FREE_STATUS: SubscriptionStatus = { tier: 'free', active: false, expiresAt: null };

export async function checkSubscription(userId: string): Promise<SubscriptionStatus> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        // No Supabase — dev mode, grant pro access
        return { tier: 'pro', active: true, expiresAt: null };
    }

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const { data } = await supabase
        .from('subscriptions')
        .select('tier, status, expires_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

    if (!data) return FREE_STATUS;

    // Check expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
        // Expired — update status
        await supabase
            .from('subscriptions')
            .update({ status: 'expired', updated_at: new Date().toISOString() })
            .eq('user_id', userId);
        return FREE_STATUS;
    }

    return {
        tier: data.tier as 'pro' | 'enterprise',
        active: true,
        expiresAt: data.expires_at,
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
