/**
 * Photon iMessage adapter — provider-agnostic HTTP contract.
 *
 * The user set PHOTON_PROJECT_ID and PHOTON_API_KEY in Vercel env. The
 * exact provider behind those values wasn't specified (LoopMessage,
 * Sendblue, BlueBubbles, Beeper, Photon Messaging, or an in-house
 * service all use similar shapes). Rather than hard-code one vendor,
 * we expose a small adapter interface: SendImessageRequest in,
 * SendImessageResult out. The default implementation is a generic
 * HTTP POST that works with any service that accepts:
 *
 *   POST <PHOTON_API_BASE>/messages
 *   Headers: Authorization: Bearer <PHOTON_API_KEY>
 *            X-Project-Id: <PHOTON_PROJECT_ID>
 *            Content-Type: application/json
 *   Body:    { to, text, html?, subject?, attachments? }
 *
 * If Photon uses a different path, auth header, or body shape:
 *   1. Flip PHOTON_API_BASE in env to the provider's root.
 *   2. Either set PHOTON_SEND_PATH to their endpoint path (default
 *      `/messages`), OR replace `getPhotonAdapter()` below with a
 *      provider-specific implementation.
 *
 * This pattern matches what we did for the MagicBlock adapter: ship
 * a real interface + a default implementation, let ops configure the
 * actual provider via env without a code push.
 */

export interface SendImessageRequest {
    to: string;
    text: string;
    html?: string;
    subject?: string;
    attachments?: string[];
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
    providerStatus?: number;
}

export interface PhotonAdapter {
    isActive(): boolean;
    send(req: SendImessageRequest): Promise<SendImessageResult | SendImessageError>;
}

const DEFAULT_BASE = 'https://api.loopmessage.com/api/v1'; // LoopMessage default; override via PHOTON_API_BASE
const DEFAULT_SEND_PATH = '/message/send/';

/**
 * Generic HTTP-POST adapter. Works unchanged for any iMessage
 * provider whose send endpoint accepts JSON with a text/html body
 * and returns a JSON envelope with a message id.
 *
 * The default base + path target LoopMessage. If your PHOTON_* env
 * vars belong to a different vendor, set PHOTON_API_BASE and
 * PHOTON_SEND_PATH accordingly.
 */
function genericAdapter(): PhotonAdapter {
    return {
        isActive(): boolean {
            return Boolean(process.env.PHOTON_API_KEY && process.env.PHOTON_PROJECT_ID);
        },
        async send(req: SendImessageRequest): Promise<SendImessageResult | SendImessageError> {
            const key = process.env.PHOTON_API_KEY;
            const projectId = process.env.PHOTON_PROJECT_ID;
            if (!key || !projectId) {
                return {
                    ok: false,
                    reason: 'not_configured',
                    message: 'PHOTON_API_KEY or PHOTON_PROJECT_ID not set on the server.',
                };
            }
            const base = process.env.PHOTON_API_BASE || DEFAULT_BASE;
            const path = process.env.PHOTON_SEND_PATH || DEFAULT_SEND_PATH;
            try {
                const res = await fetch(`${base}${path}`, {
                    method: 'POST',
                    headers: {
                        // Two common auth patterns, both sent. Providers
                        // that only check one ignore the other.
                        'Authorization': `Bearer ${key}`,
                        'Authorization-Key': key,
                        'Loop-Secret-Api-Key': key,
                        'X-Project-Id': projectId,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        recipient: req.to,
                        to: req.to,
                        text: req.text,
                        html: req.html,
                        subject: req.subject,
                        attachments: req.attachments,
                        project_id: projectId,
                    }),
                    // Don't let a slow provider hang the whole /api/tools/imessage handler.
                    signal: AbortSignal.timeout(12_000),
                });
                if (!res.ok) {
                    const body = await res.text().catch(() => '');
                    return {
                        ok: false,
                        reason: 'provider_rejected',
                        message: `Provider returned ${res.status}: ${body.slice(0, 240)}`,
                        providerStatus: res.status,
                    };
                }
                const data = await res.json().catch(() => ({}));
                const id = data.message_id
                    || data.messageId
                    || data.id
                    || data.uuid
                    || data?.data?.message_id
                    || `photon-${Date.now()}`;
                return {
                    ok: true,
                    messageId: String(id),
                    provider: base,
                    submittedAt: Date.now(),
                };
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'network_error';
                return { ok: false, reason: 'network_error', message: msg };
            }
        },
    };
}

export function getPhotonAdapter(): PhotonAdapter {
    return genericAdapter();
}

/**
 * Surface status for /demo/hackathon + Truth Table. Reports whether
 * Photon is actually configured — the `project_id` and `api_key`
 * have to both be present for the adapter to report active.
 */
export function photonStatus(): { active: boolean; reason: string; base: string } {
    const adapter = genericAdapter();
    const base = process.env.PHOTON_API_BASE || DEFAULT_BASE;
    if (adapter.isActive()) {
        return { active: true, reason: `Photon adapter wired against ${base}.`, base };
    }
    return {
        active: false,
        reason: 'PHOTON_API_KEY + PHOTON_PROJECT_ID not both set — iMessage sends will 503.',
        base,
    };
}
