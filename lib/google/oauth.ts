/**
 * Google OAuth 2.0 helpers.
 *
 * Server-only — reads credentials from process.env at call time.
 * Refresh tokens are stored encrypted in Supabase `user_integrations`.
 */
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.send',
];

function getOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_OAUTH_CLIENT_ID,
        process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        process.env.GOOGLE_OAUTH_REDIRECT_URI,
    );
}

/** Build the Google consent URL. `state` carries the user ID through the redirect. */
export function getConsentUrl(userId: string): string {
    const client = getOAuth2Client();
    return client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: SCOPES,
        state: userId,
    });
}

/** Exchange the authorization code for tokens and persist the refresh token. */
export async function exchangeCode(code: string, userId: string): Promise<void> {
    const client = getOAuth2Client();
    const { tokens } = await client.getToken(code);

    if (!tokens.refresh_token) {
        throw new Error('No refresh token returned — user may need to re-consent with prompt=consent');
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('user_integrations').upsert(
        {
            user_id: userId,
            provider: 'google',
            refresh_token: tokens.refresh_token,
            access_token: tokens.access_token ?? null,
            token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
            scopes: SCOPES.join(' '),
            connected_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' },
    );

    if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
}

/** Get an authenticated OAuth2 client for a user. Auto-refreshes if needed. */
export async function getAuthenticatedClient(userId: string) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('user_integrations')
        .select('refresh_token, access_token, token_expiry')
        .eq('user_id', userId)
        .eq('provider', 'google')
        .single();

    if (error || !data?.refresh_token) {
        throw new Error('Google not connected — user must complete OAuth first');
    }

    const client = getOAuth2Client();
    client.setCredentials({
        refresh_token: data.refresh_token,
        access_token: data.access_token ?? undefined,
        expiry_date: data.token_expiry ? new Date(data.token_expiry).getTime() : undefined,
    });

    // If the access token is expired or about to expire, refresh it
    const tokenInfo = client.credentials;
    const isExpired = tokenInfo.expiry_date && tokenInfo.expiry_date < Date.now() + 60_000;
    if (isExpired || !tokenInfo.access_token) {
        const { credentials } = await client.refreshAccessToken();
        client.setCredentials(credentials);

        // Persist the refreshed access token
        await supabase
            .from('user_integrations')
            .update({
                access_token: credentials.access_token,
                token_expiry: credentials.expiry_date
                    ? new Date(credentials.expiry_date).toISOString()
                    : null,
            })
            .eq('user_id', userId)
            .eq('provider', 'google');
    }

    return client;
}

/** Check whether a user has connected Google. */
export async function isGoogleConnected(userId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
        .from('user_integrations')
        .select('refresh_token')
        .eq('user_id', userId)
        .eq('provider', 'google')
        .single();

    return !!data?.refresh_token;
}

/** Disconnect Google for a user (revoke + delete row). */
export async function disconnectGoogle(userId: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
        .from('user_integrations')
        .select('access_token')
        .eq('user_id', userId)
        .eq('provider', 'google')
        .single();

    // Best-effort revoke
    if (data?.access_token) {
        try {
            const client = getOAuth2Client();
            await client.revokeToken(data.access_token);
        } catch { /* revoke failure is non-fatal */ }
    }

    await supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', userId)
        .eq('provider', 'google');
}

// ---- Supabase admin client (server-only, service role key) ----

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing SUPABASE_URL or SERVICE_ROLE_KEY env vars');
    return createClient(url, key, { auth: { persistSession: false } });
}
