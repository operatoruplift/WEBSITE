/**
 * Photon Spectrum adapter — HTTP + webhook model.
 *
 * Spectrum is Photon's consumer dashboard for connecting an agent to
 * iMessage, Telegram, WhatsApp, X, Discord, Instagram. It uses a
 * Project ID (UUID) + Secret Key for auth, exposes an HTTP send API,
 * and posts incoming messages to a webhook URL configured in the
 * dashboard. This is a DIFFERENT product from @photon-ai/advanced-
 * imessage (the gRPC kit); do not confuse them.
 *
 * Env:
 *   PHOTON_PROJECT_ID — UUID from the Spectrum Settings tab.
 *   PHOTON_API_KEY    — Secret Key from the Spectrum Settings tab.
 *   PHOTON_API_BASE   — (optional) root URL. Default https://api.photon.codes
 *   PHOTON_SEND_PATH  — (optional) the send endpoint path.
 *                       Default /v1/spectrum/messages. The real path
 *                       lives in the Spectrum Settings or API tab;
 *                       flip this env var without a code change.
 *   PHOTON_WEBHOOK_SECRET — (optional) value Spectrum sends in the
 *                       X-Photon-Signature header so we can verify
 *                       inbound webhook posts. See
 *                       app/api/webhooks/photon/route.ts.
 *
 * Honest-status rule: if the adapter isn't configured, /api/tools/
 * imessage returns 503 with action_required. Never produce a fake
 * message id.
 */

export interface SendImessageRequest {
    /** E.164 phone number for direct chats, or a Spectrum user id. */
    to: string;
    text: string;
    /** Present for API parity with Gmail; Spectrum iMessage ignores html. */
    html?: string;
    subject?: string;
    attachments?: string[];
    /** Platform override. Default 'imessage'. */
    platform?: 'imessage' | 'telegram' | 'whatsapp' | 'x' | 'discord' | 'instagram';
}

export interface SendImessageResult {
    ok: true;
    messageId: string;
    provider: string;
    platform: string;
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

const DEFAULT_BASE = 'https://api.photon.codes';
const DEFAULT_SEND_PATH = '/v1/spectrum/messages';

function getSecret(): string | null {
    return (process.env.PHOTON_API_KEY?.trim() || process.env.PHOTON_TOKEN?.trim() || null);
}
function getProjectId(): string | null {
    return process.env.PHOTON_PROJECT_ID?.trim() || null;
}

function adapter(): PhotonAdapter {
    return {
        isActive(): boolean {
            return Boolean(getSecret() && getProjectId());
        },
        async send(req: SendImessageRequest): Promise<SendImessageResult | SendImessageError> {
            const secret = getSecret();
            const projectId = getProjectId();
            if (!secret || !projectId) {
                return {
                    ok: false,
                    reason: 'not_configured',
                    message: 'PHOTON_PROJECT_ID or PHOTON_API_KEY missing. Set them in Vercel env from the Spectrum Settings tab.',
                };
            }
            const base = process.env.PHOTON_API_BASE || DEFAULT_BASE;
            const path = process.env.PHOTON_SEND_PATH || DEFAULT_SEND_PATH;
            const platform = req.platform ?? 'imessage';

            try {
                const res = await fetch(`${base}${path}`, {
                    method: 'POST',
                    headers: {
                        // Send the secret under three common header names
                        // so whichever one Spectrum uses picks up. The
                        // dashboard screenshots label it "Secret Key" and
                        // offer the "x-api-key" / bearer patterns.
                        'Authorization': `Bearer ${secret}`,
                        'X-Api-Key': secret,
                        'X-Project-Id': projectId,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        project_id: projectId,
                        platform,
                        recipient: req.to,
                        to: req.to,
                        text: req.text,
                        content: req.text,
                        subject: req.subject,
                        attachments: req.attachments,
                    }),
                    signal: AbortSignal.timeout(12_000),
                });

                if (!res.ok) {
                    const body = await res.text().catch(() => '');
                    return {
                        ok: false,
                        reason: 'provider_rejected',
                        message: `Spectrum returned ${res.status}: ${body.slice(0, 300)}`,
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
                    platform,
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
    return adapter();
}

export function photonStatus(): {
    active: boolean;
    reason: string;
    base: string;
    path: string;
    projectId: string | null;
} {
    const base = process.env.PHOTON_API_BASE || DEFAULT_BASE;
    const path = process.env.PHOTON_SEND_PATH || DEFAULT_SEND_PATH;
    const projectId = getProjectId();
    const active = Boolean(getSecret() && projectId);
    if (active) {
        return {
            active: true,
            reason: `Spectrum adapter wired. Sending to ${base}${path}.`,
            base,
            path,
            projectId,
        };
    }
    return {
        active: false,
        reason: 'PHOTON_PROJECT_ID + PHOTON_API_KEY not both set — iMessage sends return 503.',
        base,
        path,
        projectId,
    };
}
