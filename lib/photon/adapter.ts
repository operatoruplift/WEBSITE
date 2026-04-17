/**
 * Photon iMessage adapter — real gRPC SDK implementation.
 *
 * Photon (docs.photon.codes) ships `@photon-ai/advanced-imessage`, a
 * TypeScript SDK that talks to a per-customer gRPC server at
 * `<instance>.imsg.photon.codes:443`. Auth is a bearer-style token
 * passed to `createClient`. It is NOT a plain HTTP API — we had an
 * HTTP shim in the first iteration of this file, this replaces it.
 *
 * Env vars:
 *   PHOTON_ADDRESS    — full gRPC host:port (e.g. "acme.imsg.photon.codes:443").
 *                       Preferred. If unset, we try to derive it from
 *                       PHOTON_PROJECT_ID as "<id>.imsg.photon.codes:443".
 *   PHOTON_TOKEN      — auth token from Photon dashboard.
 *                       PHOTON_API_KEY is accepted as a legacy alias.
 *
 * Instantiation is lazy + per-request. The SDK supports
 * Symbol.asyncDispose; we close the client in a `finally` so we don't
 * leak connections when a serverless handler finishes.
 */

import { createClient, directChat, groupChat, type AdvancedIMessage } from '@photon-ai/advanced-imessage';

export interface SendImessageRequest {
    /** E.164 phone number for direct chats, or an opaque id for group chats. */
    to: string;
    text: string;
    /** Present for API parity with Gmail tool; Photon chat currently ignores html. */
    html?: string;
    subject?: string;
    attachments?: string[];
    /** Force group chat routing even if `to` looks like a phone number. */
    group?: boolean;
}

export interface SendImessageResult {
    ok: true;
    messageId: string;
    provider: string;
    submittedAt: number;
}

export interface SendImessageError {
    ok: false;
    reason: 'not_configured' | 'provider_rejected' | 'network_error' | 'unsupported';
    message: string;
}

export interface PhotonAdapter {
    isActive(): boolean;
    send(req: SendImessageRequest): Promise<SendImessageResult | SendImessageError>;
}

const DEFAULT_DOMAIN = 'imsg.photon.codes';
const DEFAULT_PORT = '443';

/**
 * Resolve the gRPC address the client should connect to. Honour
 * PHOTON_ADDRESS first (customer pastes the full host:port from the
 * Photon dashboard), otherwise derive from PHOTON_PROJECT_ID —
 * the common "subdomain is the project id" pattern.
 */
function resolveAddress(): string | null {
    const direct = process.env.PHOTON_ADDRESS?.trim();
    if (direct) return direct;
    const project = process.env.PHOTON_PROJECT_ID?.trim();
    if (!project) return null;
    if (project.includes(':')) return project; // user pasted host:port into project_id
    return `${project}.${DEFAULT_DOMAIN}:${DEFAULT_PORT}`;
}

function resolveToken(): string | null {
    return (process.env.PHOTON_TOKEN?.trim() || process.env.PHOTON_API_KEY?.trim() || null);
}

/**
 * Build a Photon ChatGuid from a raw `to` string. Phone numbers
 * (E.164 with a leading `+`) get `directChat`. Everything else is
 * treated as a group chat identifier unless the caller explicitly
 * overrides with `group: false`.
 */
function toChatGuid(to: string, groupHint?: boolean): ReturnType<typeof directChat | typeof groupChat> {
    if (groupHint === true) return groupChat(to);
    if (groupHint === false) return directChat(to);
    if (/^\+\d{7,15}$/.test(to)) return directChat(to);
    return groupChat(to);
}

function adapter(): PhotonAdapter {
    return {
        isActive(): boolean {
            return Boolean(resolveAddress() && resolveToken());
        },
        async send(req: SendImessageRequest): Promise<SendImessageResult | SendImessageError> {
            const address = resolveAddress();
            const token = resolveToken();
            if (!address || !token) {
                return {
                    ok: false,
                    reason: 'not_configured',
                    message: 'Photon address/token missing. Set PHOTON_ADDRESS (or PHOTON_PROJECT_ID) and PHOTON_TOKEN (or PHOTON_API_KEY) in Vercel env.',
                };
            }
            let im: AdvancedIMessage | null = null;
            try {
                im = createClient({
                    address,
                    token,
                    tls: true,
                    // Fail fast rather than hanging the /api route when
                    // the Photon server is unreachable.
                    timeout: 12_000,
                    retry: true,
                });
                const chatGuid = toChatGuid(req.to, req.group);
                // The SDK accepts a plain string or a rich message. For
                // a first-pass integration we pass text only — html is
                // advisory, iMessage itself doesn't render it inline.
                const sent = await im.messages.send(chatGuid, req.text);
                // The SDK returns a Message with an .id / .guid field
                // depending on version. Try the most common ones.
                const raw = sent as unknown as { id?: string; guid?: string; messageId?: string };
                const id = raw.id ?? raw.guid ?? raw.messageId ?? `photon-${Date.now()}`;
                return {
                    ok: true,
                    messageId: String(id),
                    provider: address,
                    submittedAt: Date.now(),
                };
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'network_error';
                // Cheap heuristic: surface "unauthenticated" / "unauthorized"
                // as provider_rejected so the caller's 503 surface makes it
                // clear the token is wrong, not that Photon is down.
                const reason = /unauth/i.test(msg) || /permission/i.test(msg)
                    ? 'provider_rejected'
                    : 'network_error';
                return { ok: false, reason, message: msg };
            } finally {
                try { await im?.close(); } catch { /* best-effort cleanup */ }
            }
        },
    };
}

export function getPhotonAdapter(): PhotonAdapter {
    return adapter();
}

/**
 * Surface status for /demo/hackathon + Truth Table.
 */
export function photonStatus(): { active: boolean; reason: string; address: string | null } {
    const address = resolveAddress();
    const token = resolveToken();
    if (address && token) {
        return {
            active: true,
            reason: `Photon adapter wired against ${address}.`,
            address,
        };
    }
    return {
        active: false,
        reason: 'PHOTON_ADDRESS (or PHOTON_PROJECT_ID) + PHOTON_TOKEN (or PHOTON_API_KEY) not both set — iMessage sends will 503.',
        address,
    };
}
