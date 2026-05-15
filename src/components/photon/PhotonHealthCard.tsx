'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Surfaces /api/health/adapters in human form so an admin operator
 * sees at a glance which Vercel env var is missing when the iMessage
 * agent goes silent. Replaces the curl-the-route-and-eyeball-the-JSON
 * step in docs/imessage-agent-runbook.md.
 *
 * Rendered above the inbox table on /dev/photon. Admin-gated by the
 * surrounding page; no extra auth check here.
 */

interface AdapterDetails {
    base?: string;
    path?: string;
    projectIdConfigured?: boolean;
    secretConfigured?: boolean;
    clientIdConfigured?: boolean;
    clientSecretConfigured?: boolean;
    stateSecretConfigured?: boolean;
    redirectUriConfigured?: boolean;
    // PR #515: filecoin + elevenlabs adapter rows
    provider?: string | null;
    voiceId?: string | null;
    // PR #576: og_storage adapter row
    network?: string | null;
    rpcUrl?: string | null;
    indexerRpc?: string | null;
    // PR #576: og_agent_id adapter row
    contract?: string | null;
    explorer?: string | null;
}

interface AdapterStatus {
    name: string;
    active: boolean;
    reason?: string;
    details?: AdapterDetails;
}

interface HealthResponse {
    requestId?: string;
    adapters?: AdapterStatus[];
    error?: string;
    nextAction?: string;
}

function readToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

interface Props {
    className?: string;
}

export function PhotonHealthCard({ className }: Props) {
    const [data, setData] = useState<HealthResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        const token = readToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        fetch('/api/health/adapters', { headers, cache: 'no-store' })
            .then(async r => {
                const body = await r.json().catch(() => ({}));
                if (!r.ok) {
                    setErr(body.nextAction || body.error || `HTTP ${r.status}`);
                    return;
                }
                setData(body);
            })
            .catch(e => setErr(e instanceof Error ? e.message : String(e)))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div
                className={`p-3 rounded-xl border border-white/10 bg-white/[0.02] flex items-center gap-2 ${className ?? ''}`}
                role="status"
                aria-live="polite"
            >
                <Loader2 size={14} className="animate-spin text-gray-400" aria-hidden="true" />
                <span className="text-xs font-mono text-gray-400">Loading adapter status&hellip;</span>
            </div>
        );
    }

    if (err) {
        return (
            <div className={`p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 ${className ?? ''}`}>
                <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={14} className="text-amber-400" />
                    <span className="text-xs font-mono uppercase tracking-widest text-amber-400">Health check failed</span>
                </div>
                <p className="text-xs text-gray-400">{err}</p>
            </div>
        );
    }

    const photon = data?.adapters?.find(a => a.name === 'photon');
    const inbox = data?.adapters?.find(a => a.name === 'photon_inbox');
    const anthropic = data?.adapters?.find(a => a.name === 'anthropic');
    const google = data?.adapters?.find(a => a.name === 'google_oauth');
    const filecoin = data?.adapters?.find(a => a.name === 'filecoin');
    const elevenlabs = data?.adapters?.find(a => a.name === 'elevenlabs');
    const ogStorage = data?.adapters?.find(a => a.name === 'og_storage');
    const ogAgentId = data?.adapters?.find(a => a.name === 'og_agent_id');

    // Surface the FIRST missing Google env var as the hint, since
    // showing four "missing" toasts would be noisy. Operator fixes
    // them one at a time.
    const googleHint = google && !google.active ? (() => {
        const d = google.details;
        if (!d?.clientIdConfigured) return 'GOOGLE_OAUTH_CLIENT_ID not set';
        if (!d?.clientSecretConfigured) return 'GOOGLE_OAUTH_CLIENT_SECRET not set';
        if (!d?.stateSecretConfigured) return 'GOOGLE_OAUTH_STATE_SECRET not set';
        if (!d?.redirectUriConfigured) return 'GOOGLE_OAUTH_REDIRECT_URI not set';
        return undefined;
    })() : undefined;

    return (
        <div className={`p-3 rounded-xl border border-white/10 bg-white/[0.02] ${className ?? ''}`}>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Connection status</span>
            </div>
            <div className="space-y-1.5">
                <Row
                    label="Photon adapter (outbound)"
                    active={photon?.active ?? false}
                    reason={photon?.reason}
                    hint={
                        !photon?.details?.projectIdConfigured
                            ? 'PHOTON_PROJECT_ID not set'
                            : !photon?.details?.secretConfigured
                                ? 'PHOTON_API_KEY not set'
                                : undefined
                    }
                />
                <Row
                    label="Photon inbox (Supabase)"
                    active={inbox?.active ?? false}
                    reason={inbox?.reason}
                />
                <Row
                    label="Anthropic LLM (replies)"
                    active={anthropic?.active ?? false}
                    reason={anthropic?.reason}
                    hint={
                        anthropic && !anthropic.active
                            ? 'ANTHROPIC_API_KEY not set; agent falls back to a fixed-string ack'
                            : undefined
                    }
                />
                <Row
                    label="Google OAuth (Gmail/Calendar)"
                    active={google?.active ?? false}
                    reason={google?.reason}
                    hint={googleHint}
                />
                <Row
                    label="Filecoin anchor (receipts)"
                    active={filecoin?.active ?? false}
                    reason={filecoin?.reason}
                    hint={
                        filecoin && !filecoin.active
                            ? 'Set FILECOIN_PROVIDER + LIGHTHOUSE_API_KEY (or PINATA_JWT)'
                            : undefined
                    }
                />
                <Row
                    label="ElevenLabs TTS (voiceover)"
                    active={elevenlabs?.active ?? false}
                    reason={elevenlabs?.reason}
                    hint={
                        elevenlabs && !elevenlabs.active
                            ? 'ELEVENLABS_API_KEY not set; /api/voice/synth returns 503'
                            : undefined
                    }
                />
                <Row
                    label="0G Storage anchor (receipts)"
                    active={ogStorage?.active ?? false}
                    reason={ogStorage?.reason}
                    hint={
                        ogStorage && !ogStorage.active
                            ? 'OG_PRIVATE_KEY not set; receipts ship signed but the 0g: link on /security stays hidden'
                            : undefined
                    }
                />
                <Row
                    label="0G Agent ID (ERC-7857)"
                    active={ogAgentId?.active ?? false}
                    reason={ogAgentId?.reason}
                    hint={
                        ogAgentId && !ogAgentId.active
                            ? 'Module wired; run scripts/og-agent-id-mint.mjs against funded OG_PRIVATE_KEY wallet to mint'
                            : undefined
                    }
                />
            </div>
            <p className="text-[10px] font-mono text-gray-600 mt-2">
                See docs/imessage-agent-runbook.md &rarr; &quot;iMessage doesn&apos;t work&quot; symptom map.
            </p>
        </div>
    );
}

function Row({
    label,
    active,
    reason,
    hint,
}: {
    label: string;
    active: boolean;
    reason?: string;
    hint?: string;
}) {
    return (
        <div className="flex items-start justify-between gap-3">
            <span className="text-xs text-gray-400">{label}</span>
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5">
                    {active ? (
                        <>
                            <CheckCircle2 size={12} className="text-emerald-400" />
                            <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest">Active</span>
                        </>
                    ) : (
                        <>
                            <AlertTriangle size={12} className="text-amber-400" />
                            <span className="text-[11px] font-mono text-amber-400 uppercase tracking-widest">Down</span>
                        </>
                    )}
                </div>
                {hint && <span className="text-[10px] font-mono text-amber-300/80 mt-0.5">{hint}</span>}
                {!hint && reason && reason !== 'configured' && (
                    <span className="text-[10px] font-mono text-gray-500 mt-0.5">{reason}</span>
                )}
            </div>
        </div>
    );
}
