/**
 * safeLog, structured logger with default redaction of sensitive keys.
 *
 * Use this instead of raw `console.log/warn/error` whenever the payload
 * could carry user-controlled or auth-sensitive fields. Preserves the
 * existing observability contract (one-line JSON, `requestId` kept
 * intact) while stripping tokens, cookies, API keys, and similar.
 *
 * Scope: this helper does NOT replace every console call, small fixed
 * strings and numeric metrics are fine as plain `console.log`. It
 * replaces the call sites that pass request headers, error details, or
 * any object that could include auth material.
 *
 * Redaction rules:
 *   - Object keys that match the `SENSITIVE_KEY_RE` regex are replaced
 *     with the literal string "[REDACTED]".
 *   - Bearer tokens embedded in string values are replaced inline with
 *     "Bearer [REDACTED]".
 *   - `Set-Cookie` / `cookie` header-like strings are replaced with
 *     "[REDACTED]".
 *   - Strings that look like JWTs (three base64url segments) are
 *     truncated to `<alg.kid...>[REDACTED]` preserving diagnosis.
 *
 * Never logged: raw request bodies, raw response bodies, OAuth codes.
 */

/** Matches the most common header / property names that carry secrets. */
export const SENSITIVE_KEY_RE = /^(authorization|cookie|set-cookie|token|api[_-]?key|privy[_-]?token|jwt|bearer|secret|password|private[_-]?key|access[_-]?token|refresh[_-]?token|session[_-]?token|x-api-key|x-auth-token)$/i;

/** Matches bearer-looking substrings inside string values. */
const BEARER_SUBSTRING_RE = /Bearer\s+[A-Za-z0-9._~+/=-]{8,}/g;

/** Matches three-segment base64url things that smell like JWS. */
const JWS_LIKE_RE = /([A-Za-z0-9_-]{4,})\.([A-Za-z0-9_-]{4,})\.([A-Za-z0-9_-]{4,})/g;

/**
 * Deep-redact an unknown value. Arrays are walked element-wise. Objects
 * are shallow-copied with offending keys replaced by "[REDACTED]".
 * Strings get bearer / JWS stripping. Everything else is pass-through.
 */
export function redact(value: unknown, depth = 0): unknown {
    if (depth > 8) return '[DEPTH_EXCEEDED]';
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') return redactString(value);
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return value;
    if (Array.isArray(value)) return value.map(v => redact(v, depth + 1));
    if (typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            if (SENSITIVE_KEY_RE.test(k)) {
                out[k] = '[REDACTED]';
                continue;
            }
            out[k] = redact(v, depth + 1);
        }
        return out;
    }
    // Functions, symbols, don't log them at all.
    return '[UNSUPPORTED]';
}

function redactString(s: string): string {
    if (s.length > 4000) {
        // Very long strings are almost always mistakes (full request bodies etc).
        return s.slice(0, 240) + '…[TRUNCATED]';
    }
    return s
        .replace(BEARER_SUBSTRING_RE, 'Bearer [REDACTED]')
        .replace(JWS_LIKE_RE, (_m, h) => `${String(h).slice(0, 4)}…[JWS_REDACTED]`);
}

export interface SafeLogFields {
    /** Route / module name, e.g. "subscription", "tools.gmail". Required. */
    at: string;
    /** Event name, e.g. "auth-failed", "rate-limited". Required. */
    event: string;
    /** Request ID, pass through unredacted so support can grep. */
    requestId?: string;
    /** Anything else. Will be deep-redacted. */
    [key: string]: unknown;
}

/**
 * Emit one line of structured JSON with sensitive fields redacted.
 * `at`, `event`, `requestId`, and `ts` always pass through; everything
 * else is deep-redacted via `redact()`.
 */
export function safeLog(fields: SafeLogFields): void {
    const { at, event, requestId, ...rest } = fields;
    const payload = {
        at,
        event,
        ts: new Date().toISOString(),
        ...(requestId ? { requestId } : {}),
        ...(redact(rest) as Record<string, unknown>),
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload));
}

export function safeWarn(fields: SafeLogFields): void {
    const { at, event, requestId, ...rest } = fields;
    const payload = {
        at,
        event,
        level: 'warn',
        ts: new Date().toISOString(),
        ...(requestId ? { requestId } : {}),
        ...(redact(rest) as Record<string, unknown>),
    };
    // eslint-disable-next-line no-console
    console.warn(JSON.stringify(payload));
}

export function safeError(fields: SafeLogFields & { error?: unknown }): void {
    const { at, event, requestId, error, ...rest } = fields;
    const payload = {
        at,
        event,
        level: 'error',
        ts: new Date().toISOString(),
        ...(requestId ? { requestId } : {}),
        ...(error ? { error: redact(normalizeError(error)) } : {}),
        ...(redact(rest) as Record<string, unknown>),
    };
    // eslint-disable-next-line no-console
    console.error(JSON.stringify(payload));
}

function normalizeError(err: unknown): unknown {
    if (err instanceof Error) {
        return {
            name: err.name,
            message: err.message.slice(0, 240),
            // Stack trimmed to first 4 frames so we don't blow up log size.
            stack: typeof err.stack === 'string'
                ? err.stack.split('\n').slice(0, 5).join('\n')
                : undefined,
        };
    }
    return err;
}
