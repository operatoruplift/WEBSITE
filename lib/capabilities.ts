/**
 * Capability gating — the routing primitive for the May 14 demo.
 *
 * Every /api/* route that can produce a side-effect (tool execution,
 * receipt, Supabase write) must check `capability_real` before acting.
 *
 * Three booleans resolved server-side per request:
 *   capability_google — authenticated AND Google OAuth row in user_integrations
 *   capability_key    — authenticated AND an LLM provider key is available
 *                       (server env key OR user-supplied BYOK when implemented)
 *   capability_real   — capability_google || capability_key
 *
 * The user-visible UI collapses this to two states: Demo (any not-real
 * case) or Real. Do not surface the individual flags to users.
 */
import { getOptionalUser, type VerifiedUser } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export interface Capabilities {
    capability_google: boolean;
    capability_key: boolean;
    capability_real: boolean;
    /** Verified Privy user ID, or null if unauthenticated */
    userId: string | null;
}

/**
 * Checks whether the server has at least one working LLM provider key.
 * Used both for the capability check and the /api/chat routing branch.
 */
export function hasServerLLMKey(): boolean {
    return Boolean(
        process.env.ANTHROPIC_API_KEY
        || process.env.OPENAI_API_KEY
        || process.env.GOOGLE_AI_API_KEY
        || process.env.GROQ_API_KEY,
    );
}

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Check whether a user has a Google OAuth row in user_integrations.
 * Returns false on any failure — the safe default is Demo mode.
 */
async function hasGoogleIntegration(userId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;
    try {
        const { data } = await supabase
            .from('user_integrations')
            .select('refresh_token')
            .eq('user_id', userId)
            .eq('provider', 'google')
            .maybeSingle();
        return !!data?.refresh_token;
    } catch {
        return false;
    }
}

/**
 * Resolve capabilities for the current request.
 * Never throws — on any failure returns all-false (safe Demo default).
 */
export async function getCapabilities(request: Request): Promise<Capabilities> {
    const demo: Capabilities = {
        capability_google: false,
        capability_key: false,
        capability_real: false,
        userId: null,
    };

    const user: VerifiedUser | null = await getOptionalUser(request);
    if (!user?.userId) return demo;

    const serverKey = hasServerLLMKey();
    const googleConnected = await hasGoogleIntegration(user.userId);

    return {
        capability_google: googleConnected,
        capability_key: serverKey,
        capability_real: googleConnected || serverKey,
        userId: user.userId,
    };
}
