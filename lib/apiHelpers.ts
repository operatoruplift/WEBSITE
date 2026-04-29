/**
 * Shared helpers for API routes that want the standard error envelope,
 * a per-request ID propagated as `X-Request-Id`, and structured logging.
 *
 * Usage (typical route):
 *
 *   import { newRequestId, errorResponse, withRequestMeta } from '@/lib/apiHelpers';
 *
 *   export async function POST(request: Request) {
 *     const meta = withRequestMeta(request, 'tools.gmail');
 *     try {
 *       ...
 *       return NextResponse.json({ ok: true }, { headers: meta.headers });
 *     } catch (err) {
 *       return errorResponse(err, meta);
 *     }
 *   }
 *
 * Every route built on this helper guarantees:
 *   - X-Request-Id response header
 *   - errorClass + requestId + timestamp + message + nextAction in error body
 *   - one-line JSON log with requestId + route + errorClass + statusFromClass
 *   - zero secret leakage (only the taxonomy class + short detail is logged)
 */
import { NextResponse } from 'next/server';
import { classifyError, envelope, type ErrorClass } from './errorTaxonomy';
import { safeLog } from './safeLog';

export interface RequestMeta {
    requestId: string;
    startedAt: string;
    route: string;
    /** Headers to attach to every successful response from this route. */
    headers: { 'X-Request-Id': string };
}

export function newRequestId(): string {
    return `req_${crypto.randomUUID()}`;
}

export function withRequestMeta(request: Request, route: string): RequestMeta {
    const requestId = request.headers.get('x-request-id') || newRequestId();
    return {
        requestId,
        startedAt: new Date().toISOString(),
        route,
        headers: { 'X-Request-Id': requestId },
    };
}

/** HTTP status for a given taxonomy class. */
export function statusFor(errorClass: ErrorClass, httpHint?: number): number {
    if (httpHint && httpHint >= 400) return httpHint;
    switch (errorClass) {
        case 'malformed_token':
        case 'expired_token':
        case 'reauth_required':
            return 401;
        case 'provider_unavailable':
            return 503;
        case 'unknown':
        default:
            return 500;
    }
}

/**
 * Standardized error response. Accepts either a raw thrown error (will
 * auto-classify) or an explicit errorClass override when the caller
 * knows better (e.g. a 400 input_invalid).
 *
 * `httpHint` wins over taxonomy defaults, a 400 input_invalid stays
 * 400 even though classifyError would map it to `unknown`.
 */
export function errorResponse(
    err: unknown,
    meta: RequestMeta,
    opts?: { errorClass?: ErrorClass; httpHint?: number; details?: Record<string, unknown> },
): NextResponse {
    const detail = err instanceof Error ? err.message : String(err || 'unknown');
    const errorClass = opts?.errorClass ?? classifyError(err);
    const httpStatus = statusFor(errorClass, opts?.httpHint);

    const body = {
        ...envelope(errorClass, detail, meta.requestId, meta.startedAt),
        ...(opts?.details ? { details: opts.details } : {}),
    };

    // safeLog runs the payload through redact() automatically: `detail`
    // may contain a Bearer token or cookie string echoed back from an
    // upstream error message; `details.opsHint` is usually a plain
    // diagnostic string but redact handles either shape defensively.
    const truncatedDetail = detail.slice(0, 240);
    safeLog({
        at: meta.route,
        event: 'error',
        requestId: meta.requestId,
        errorClass,
        httpStatus,
        detail: truncatedDetail,
        ...(opts?.details ? { extra: opts.details } : {}),
    });

    return NextResponse.json(body, {
        status: httpStatus,
        headers: meta.headers,
    });
}

/**
 * Convenience for input-validation 400s, keeps a stable shape for the UI
 * (message + nextAction + requestId) without funneling through the taxonomy.
 */
export function validationError(
    message: string,
    nextAction: string,
    meta: RequestMeta,
    details?: Record<string, unknown>,
): NextResponse {
    safeLog({
        at: meta.route,
        event: 'validation',
        requestId: meta.requestId,
        detail: message.slice(0, 240),
    });
    return NextResponse.json({
        error: message,
        errorClass: 'unknown' as ErrorClass,
        reason: 'input_invalid',
        recovery: 'retry' as const,
        requestId: meta.requestId,
        timestamp: meta.startedAt,
        message,
        nextAction,
        ...(details ? { details } : {}),
    }, {
        status: 400,
        headers: meta.headers,
    });
}
