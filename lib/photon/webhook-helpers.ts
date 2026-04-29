/**
 * Pure helpers for the inbound Photon webhook handler.
 *
 * Extracted from app/api/webhooks/photon/route.ts so they can be
 * unit-tested without spinning up a Next.js Request, the Photon
 * adapter, or Supabase.
 *
 * Functions covered here:
 *   hmacHex                  — HMAC-SHA256 of body with secret, hex-encoded
 *   constantTimeEq           — constant-time string compare via crypto.timingSafeEqual
 *   verifyWebhookSignature   — wraps the above two for the route handler
 *   computeProviderMessageId — picks Photon-provided id or falls back to
 *                              a 5s-bucketed sender|text hash
 *   normalizeWebhookPayload  — extracts platform, sender, text, eventType
 *                              from the various shapes Spectrum surfaces
 *   makeFallbackAckGate      — closure-based debounce so a burst of
 *                              messages from the same sender produces one
 *                              ack per ACK_WINDOW_MS, not one per message
 */
import crypto from 'crypto';

export const ACK_WINDOW_MS = 60_000;
export const FALLBACK_MS = 5_000;

export function hmacHex(secret: string, body: string): string {
    return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export function constantTimeEq(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    try {
        return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
        return false;
    }
}

/**
 * Verify a webhook signature. Spectrum hasn't published its exact
 * header name yet, so the route handler accepts any of:
 *   x-photon-signature
 *   x-spectrum-signature
 *   x-signature
 * with optional sha256= prefix.
 *
 * Returns true if the secret is unset (the route is unauthenticated
 * for demo purposes — caller decides whether to reject) OR the
 * signature matches.
 */
export function verifyWebhookSignature(opts: {
    secret: string | undefined;
    body: string;
    provided: string | null;
}): { ok: boolean; reason?: 'missing_signature' | 'mismatch' } {
    if (!opts.secret) return { ok: true };
    const provided = (opts.provided ?? '').replace(/^sha256=/, '');
    if (!provided) return { ok: false, reason: 'missing_signature' };
    const expected = hmacHex(opts.secret, opts.body);
    if (!constantTimeEq(provided, expected)) return { ok: false, reason: 'mismatch' };
    return { ok: true };
}

/**
 * Stable id for idempotency. Prefer the id Photon gives us in any of
 * its known shapes; fall back to a content hash bucketed to 5s so
 * legitimate identical sends within a tight burst dedupe.
 */
export function computeProviderMessageId(
    body: Record<string, unknown>,
    sender: string,
    text: string,
): string {
    const providerId = (body.message_id as string)
        ?? (body.id as string)
        ?? (body.event_id as string)
        ?? ((body.data as { message_id?: string })?.message_id)
        ?? '';
    if (providerId) return providerId;
    const bucket = Math.floor(Date.now() / 5000);
    return 'hash:' + crypto
        .createHash('sha256')
        .update(`${sender}|${text}|${bucket}`)
        .digest('hex')
        .slice(0, 24);
}

export interface NormalizedPayload {
    platform: string;
    sender: string;
    text: string;
    eventType: string;
}

/**
 * Pull the canonical fields out of whatever shape Spectrum sent.
 * Different events surface the sender under different keys; this
 * tries them in order and falls back to defaults so the route
 * handler always has something to work with.
 */
export function normalizeWebhookPayload(body: Record<string, unknown>): NormalizedPayload {
    const platform = (body.platform as string) ?? 'imessage';
    const sender = (body.sender as string)
        ?? (body.from as string)
        ?? (body.phone as string)
        ?? ((body.user as { phone?: string })?.phone)
        ?? 'unknown';
    const text = (body.text as string)
        ?? (body.message as string)
        ?? ((body.content as { text?: string })?.text)
        ?? '';
    const eventType = (body.event as string) ?? (body.type as string) ?? 'message';
    return { platform, sender, text, eventType };
}

/**
 * Build a debounce gate. Each instance has its own Map so tests
 * don't share state and the production handler keeps a single
 * module-level instance for the per-instance debounce.
 */
export function makeFallbackAckGate(opts?: { windowMs?: number; maxEntries?: number; now?: () => number }) {
    const windowMs = opts?.windowMs ?? ACK_WINDOW_MS;
    const maxEntries = opts?.maxEntries ?? 500;
    const now = opts?.now ?? (() => Date.now());
    const recentAcks = new Map<string, number>();

    return {
        shouldSend(sender: string): boolean {
            const t = now();
            const last = recentAcks.get(sender);
            if (last && t - last < windowMs) return false;
            recentAcks.set(sender, t);
            // Best-effort cleanup so the map doesn't grow unbounded.
            if (recentAcks.size > maxEntries) {
                for (const [k, v] of recentAcks) {
                    if (t - v > windowMs) recentAcks.delete(k);
                }
            }
            return true;
        },
        size(): number {
            return recentAcks.size;
        },
    };
}
