/**
 * Unified subscription + auth error taxonomy.
 *
 * Any /api route that can fail for auth/subscription reasons maps its
 * underlying error into one of these five classes. The UI copy layer
 * reads only the `class` — never the free-form detail message.
 *
 * Adding a new class requires updating the UI copy templates in the
 * paywall and Diagnostics surfaces.
 */

export type ErrorClass =
    | 'malformed_token'
    | 'expired_token'
    | 'reauth_required'
    | 'provider_unavailable'
    | 'unknown';

/** UI copy template per class. Paywall + chat consume these verbatim. */
export interface ErrorCopy {
    title: string;
    nextAction: string;
    shouldReauth: boolean;
}

export const ERROR_COPY: Record<ErrorClass, ErrorCopy> = {
    malformed_token: {
        title: 'Your session token is invalid.',
        nextAction: 'Re-login to continue.',
        shouldReauth: true,
    },
    expired_token: {
        title: 'Your session expired.',
        nextAction: 'Re-login to continue.',
        shouldReauth: true,
    },
    reauth_required: {
        title: 'Authentication required.',
        nextAction: 'Re-login to continue.',
        shouldReauth: true,
    },
    provider_unavailable: {
        title: 'Service is having a moment.',
        nextAction: 'Try again in a moment, or switch models from the selector.',
        shouldReauth: false,
    },
    unknown: {
        title: 'Something didn\u2019t complete.',
        nextAction: 'Try again, or contact support with the reference below.',
        shouldReauth: false,
    },
};

/**
 * Map a free-form error message (usually the Error.message thrown by
 * verifySession or an SDK client) into a taxonomy class.
 */
export function classifyError(raw: unknown): ErrorClass {
    const msg = (raw instanceof Error ? raw.message : String(raw || '')).toLowerCase();
    if (!msg) return 'unknown';
    if (msg.includes('token_expired') || msg.includes('expired')) return 'expired_token';
    if (msg.includes('malformed') || msg.includes('invalid compact jws') || msg.includes('not_a_jws')) return 'malformed_token';
    if (msg.includes('unauthenticated') || msg.includes('auth required') || msg.includes('no_session')) return 'reauth_required';
    if (
        msg.includes('supabase')
        || msg.includes('privy')
        || msg.includes('upstream')
        || /\b(502|503|504)\b/.test(msg)
        || msg.includes('fetch failed')
        || msg.includes('timeout')
    ) return 'provider_unavailable';
    return 'unknown';
}

export interface StandardErrorEnvelope {
    error: string;
    errorClass: ErrorClass;
    reason: string;
    recovery: 'reauth' | 'retry' | 'none';
    requestId: string;
    timestamp: string;
    /** UI consumes these directly so every surface reads identically. */
    message: string;
    nextAction: string;
}

export function envelope(
    errorClass: ErrorClass,
    detail: string,
    requestId: string,
    timestamp: string,
): StandardErrorEnvelope {
    const copy = ERROR_COPY[errorClass];
    return {
        error: detail.slice(0, 240),
        errorClass,
        reason: errorClass,
        recovery: copy.shouldReauth ? 'reauth' : 'retry',
        requestId,
        timestamp,
        message: copy.title,
        nextAction: copy.nextAction,
    };
}
