'use client';

/**
 * Keeps localStorage.token in sync with the current Privy access token.
 *
 * Privy JWTs expire (typically 1 hour). Without refresh, cached
 * localStorage tokens become stale and cause "Invalid Compact JWS" or
 * "jwt expired" errors on server-side verification.
 *
 * Strategy:
 *   - On mount (after Privy ready + authenticated), fetch the latest
 *     access token and write it to localStorage.
 *   - Refresh every 10 minutes while the tab is open.
 *   - On logout / de-auth, clear the token.
 *
 * Mount this once, high in the tree. The /paywall page already reads
 * localStorage.token so no other changes needed.
 */
import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export function PrivyTokenSync() {
    const { ready, authenticated, getAccessToken } = usePrivy();

    useEffect(() => {
        if (!ready) return;

        if (!authenticated) {
            // Sign-out — ensure stale token is cleared
            const existing = localStorage.getItem('token');
            // Only clear if it looks like a JWT (three dot-separated segments)
            // so we don't trample other pages' session state unexpectedly
            if (existing && existing.split('.').length === 3) {
                localStorage.removeItem('token');
            }
            return;
        }

        let cancelled = false;
        const refresh = async () => {
            try {
                const token = await getAccessToken();
                if (cancelled) return;
                if (token) {
                    localStorage.setItem('token', token);
                } else {
                    console.warn('[PrivyTokenSync] getAccessToken returned null');
                }
            } catch (err) {
                console.error('[PrivyTokenSync] refresh failed:', err);
            }
        };

        refresh();
        const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [ready, authenticated, getAccessToken]);

    return null;
}
