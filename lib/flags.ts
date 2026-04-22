/**
 * Feature flags.
 *
 * Flags are additive. All UI shell swaps must gate on DEC_UI so we can
 * roll out the Dec-style reface in staging without touching prod UX.
 *
 * Env vars:
 *   DEC_UI=1              , server-side checks (API routes, middleware)
 *   NEXT_PUBLIC_DEC_UI=1  , client-side checks (React components)
 *
 * Both default to OFF in production until the shell is ready.
 */

/**
 * Server-side: is the Dec UI shell enabled for this request?
 * Use in API routes, server components, and redirect logic.
 */
export function isDecUiEnabledServer(): boolean {
    return process.env.DEC_UI === '1';
}

/**
 * Client-side: is the Dec UI shell enabled in this browser?
 * Use in 'use client' components. NEXT_PUBLIC_DEC_UI is inlined at
 * build time, same bundle per deploy.
 */
export function isDecUiEnabled(): boolean {
    return process.env.NEXT_PUBLIC_DEC_UI === '1';
}
