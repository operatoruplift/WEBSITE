'use client';

import { useEffect, useState } from 'react';
import { Loader2, ShieldAlert, RefreshCw, CheckCircle2, Clock, MessageSquare, Send, ChevronDown, ChevronRight, Ban, X } from 'lucide-react';

/**
 * Admin-gated iMessage observability page at /dev/photon.
 *
 * Pulls /api/admin/photon/recent and renders the last N inbound rows
 * with their reply status. Designed to be opened on a phone browser
 * so an operator can verify the iMessage agent round trip in real
 * time without curling.
 *
 * Access control: client pre-flights /api/whoami. Non-admins get a
 * clean "admin-only" notice. The /api/admin/photon/recent route also
 * enforces the same gate server-side, so this page is only a UI shell.
 *
 * No data fetching here for non-admins, no error spelling out which
 * env vars are missing or whether the table exists, the underlying
 * route's response carries the actionable hint via the `nextAction`
 * field which we surface verbatim.
 */

interface RecentRow {
    id: string;
    sender: string;
    platform: string;
    text: string | null;
    received_at: string;
    processed_at: string | null;
    reply_message_id: string | null;
    /** Outbound reply text. Null on rows from a pre-migration schema or
     *  when the agent failed to send. Truncated to 300 chars by /api/admin/photon/recent. */
    reply_text?: string | null;
    acked_at: string | null;
    status: 'replied' | 'pending';
}

interface RecentResponse {
    requestId?: string;
    timestamp?: string;
    count?: number;
    rows?: RecentRow[];
    error?: string;
    nextAction?: string;
    detail?: string;
}

function readToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function authHeaders(token: string | null): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatTime(iso: string | null): string {
    if (!iso) return '\u2014';
    try {
        return new Date(iso).toLocaleTimeString();
    } catch {
        return iso;
    }
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">{label}</span>
            <span className="text-lg font-mono text-white mt-0.5">{value}</span>
        </div>
    );
}

function StatusPill({ status }: { status: 'replied' | 'pending' }) {
    if (status === 'replied') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono uppercase tracking-widest">
                <CheckCircle2 size={11} /> replied
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono uppercase tracking-widest">
            <Clock size={11} /> pending
        </span>
    );
}

interface StatsWindow {
    received: number;
    replied: number;
    pending: number;
    rate: number | null;
}

interface StatsResponse {
    last24h?: StatsWindow;
    last7d?: StatsWindow;
    byPlatform24h?: Array<{ platform: string; received: number; replied: number }>;
    /** Verified-user count from imessage_users. Null when the table is missing. */
    verifiedUsers?: number | null;
    /** Opted-out sender count from imessage_opt_outs. Null when the table is missing. */
    optedOut?: number | null;
    error?: string;
    nextAction?: string;
}

export default function DevPhotonPage() {
    const [adminStatus, setAdminStatus] = useState<'loading' | 'admin' | 'not-admin' | 'unauthenticated'>('loading');
    const [adminEmail, setAdminEmail] = useState<string | null>(null);
    const [resp, setResp] = useState<RecentResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [stats, setStats] = useState<StatsResponse | null>(null);

    useEffect(() => {
        fetch('/api/whoami', { headers: authHeaders(readToken()), cache: 'no-store' })
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then((data) => {
                const isAdmin = !!(data?.bypass?.session_email_on_allowlist || data?.bypass?.user_id_on_allowlist);
                setAdminStatus(isAdmin ? 'admin' : 'not-admin');
                setAdminEmail(data?.session_email ?? null);
            })
            .catch((status) => {
                setAdminStatus(status === 401 ? 'unauthenticated' : 'not-admin');
            });
    }, []);

    const refresh = async () => {
        setLoading(true);
        setErr(null);
        try {
            const res = await fetch('/api/admin/photon/recent?limit=20', {
                headers: authHeaders(readToken()),
                cache: 'no-store',
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setResp(data as RecentResponse);
                setErr((data as RecentResponse).nextAction || (data as RecentResponse).detail || `HTTP ${res.status}`);
                return;
            }
            setResp(data as RecentResponse);
        } catch (e) {
            setErr(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    };

    // Simulator: POSTs a synthetic webhook so we can verify the
    // round trip without a real iPhone. Calls /api/admin/photon/simulate
    // (PR #409) which signs the body with PHOTON_WEBHOOK_SECRET so the
    // webhook signature gate exercises the real code path.
    const [simSender, setSimSender] = useState('+15551234567');
    const [simText, setSimText] = useState('hello');
    const [simPlatform, setSimPlatform] = useState<'imessage' | 'telegram' | 'whatsapp'>('imessage');
    const [simOpen, setSimOpen] = useState(false);
    const [simRunning, setSimRunning] = useState(false);
    const [simResult, setSimResult] = useState<{ status: number; body: unknown; elapsedMs: number } | null>(null);
    const [simErr, setSimErr] = useState<string | null>(null);

    const runSimulate = async () => {
        if (!simSender.trim() || !simText.trim()) return;
        setSimRunning(true);
        setSimResult(null);
        setSimErr(null);
        try {
            const res = await fetch('/api/admin/photon/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders(readToken()) },
                body: JSON.stringify({ sender: simSender.trim(), text: simText.trim(), platform: simPlatform }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setSimErr(data?.nextAction || data?.detail || `HTTP ${res.status}`);
                return;
            }
            setSimResult({
                status: data?.webhook?.status ?? 0,
                body: data?.webhook?.body,
                elapsedMs: data?.webhook?.elapsedMs ?? 0,
            });
            // Pull the new row in if we just created one.
            void refresh();
        } catch (e) {
            setSimErr(e instanceof Error ? e.message : String(e));
        } finally {
            setSimRunning(false);
        }
    };

    // Opt-outs panel state. Lists active opt-outs and lets the
    // operator clear one (re-enable replies for that sender) with a
    // single click. Backed by GET/POST /api/admin/photon/optouts.
    interface OptOutRow {
        sender: string;
        opted_out_at: string;
        last_reason: string | null;
        updated_at: string;
    }
    const [optsOpen, setOptsOpen] = useState(false);
    const [optsRows, setOptsRows] = useState<OptOutRow[]>([]);
    const [optsLoading, setOptsLoading] = useState(false);
    const [optsErr, setOptsErr] = useState<string | null>(null);

    const refreshOpts = async () => {
        setOptsLoading(true);
        setOptsErr(null);
        try {
            const res = await fetch('/api/admin/photon/optouts', {
                headers: authHeaders(readToken()),
                cache: 'no-store',
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setOptsRows([]);
                setOptsErr(data?.nextAction || data?.detail || `HTTP ${res.status}`);
                return;
            }
            setOptsRows(Array.isArray(data?.rows) ? data.rows : []);
        } catch (e) {
            setOptsErr(e instanceof Error ? e.message : String(e));
        } finally {
            setOptsLoading(false);
        }
    };

    const clearOpt = async (sender: string) => {
        try {
            const res = await fetch('/api/admin/photon/optouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders(readToken()) },
                body: JSON.stringify({ sender, action: 'clear' }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setOptsErr(data?.nextAction || data?.detail || `HTTP ${res.status}`);
                return;
            }
            await refreshOpts();
        } catch (e) {
            setOptsErr(e instanceof Error ? e.message : String(e));
        }
    };

    const refreshStats = async () => {
        try {
            const res = await fetch('/api/admin/photon/stats', {
                headers: authHeaders(readToken()),
                cache: 'no-store',
            });
            const data = await res.json().catch(() => ({}));
            setStats(data as StatsResponse);
        } catch {
            /* non-fatal: stats header is optional polish */
        }
    };

    useEffect(() => {
        if (adminStatus === 'admin') {
            void refresh();
            void refreshStats();
        }
    }, [adminStatus]);

    useEffect(() => {
        if (adminStatus === 'admin' && optsOpen && optsRows.length === 0 && !optsErr) void refreshOpts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adminStatus, optsOpen]);

    if (adminStatus === 'loading') {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 size={20} className="animate-spin text-gray-500" /></div>;
    }

    if (adminStatus !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-md w-full p-6 rounded-2xl border border-white/10 bg-[#111111] text-center">
                    <ShieldAlert size={28} className="text-[#F97316] mx-auto mb-3" />
                    <h1 className="text-lg font-medium text-white mb-2">Admin-only</h1>
                    <p className="text-sm text-gray-400">
                        {adminStatus === 'unauthenticated'
                            ? 'Sign in with an admin email to view the iMessage agent inbox.'
                            : 'Your email is not on the admin allowlist. Contact ops if you need access.'}
                    </p>
                </div>
            </div>
        );
    }

    const rows = resp?.rows ?? [];
    const repliedCount = rows.filter(r => r.status === 'replied').length;
    const pendingCount = rows.length - repliedCount;

    return (
        <div className="min-h-screen p-6 lg:p-10">
            <div className="max-w-[920px] mx-auto space-y-6">
                <header className="mb-2">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-medium tracking-tight text-white flex items-center gap-2">
                            <MessageSquare size={20} /> iMessage agent inbox
                        </h1>
                        <span className="text-[10px] font-mono text-gray-500">admin · {adminEmail ?? 'unknown'}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                        Last {rows.length} inbound webhook rows. Replied rows have a Claude Haiku response on the way back to the sender.
                    </p>
                </header>

                {stats?.last24h && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                        <Stat label="24h received" value={String(stats.last24h.received)} />
                        <Stat label="24h replied" value={String(stats.last24h.replied)} />
                        <Stat label="24h pending" value={String(stats.last24h.pending)} />
                        <Stat
                            label="24h reply rate"
                            value={
                                stats.last24h.rate === null
                                    ? '\u2014'
                                    : `${Math.round((stats.last24h.rate ?? 0) * 100)}%`
                            }
                        />
                    </div>
                )}

                {stats && (stats.verifiedUsers !== undefined || stats.optedOut !== undefined) && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                        <Stat
                            label="verified users"
                            value={stats.verifiedUsers === null || stats.verifiedUsers === undefined ? '\u2014' : String(stats.verifiedUsers)}
                        />
                        <Stat
                            label="opted out"
                            value={stats.optedOut === null || stats.optedOut === undefined ? '\u2014' : String(stats.optedOut)}
                        />
                    </div>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white transition-all disabled:opacity-40"
                    >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        {loading ? 'Loading' : 'Refresh'}
                    </button>
                    <button
                        onClick={() => setSimOpen(o => !o)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white transition-all"
                    >
                        {simOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        Simulate webhook
                    </button>
                    <button
                        onClick={() => setOptsOpen(o => !o)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white transition-all"
                    >
                        {optsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        <Ban size={12} /> Opt-outs
                    </button>
                    {rows.length > 0 && (
                        <span className="text-xs font-mono text-gray-500">
                            {repliedCount} replied · {pendingCount} pending
                        </span>
                    )}
                </div>

                {simOpen && (
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
                        <p className="text-xs text-gray-400">
                            Fires a synthetic POST at /api/webhooks/photon (signed with PHOTON_WEBHOOK_SECRET if configured) so the agent round trip runs without involving Spectrum or a real iPhone.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                                value={simSender}
                                onChange={e => setSimSender(e.target.value)}
                                placeholder="sender (E.164 phone)"
                                className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50"
                            />
                            <select
                                value={simPlatform}
                                onChange={e => setSimPlatform(e.target.value as typeof simPlatform)}
                                className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-[#F97316]/50"
                            >
                                <option value="imessage">iMessage</option>
                                <option value="telegram">Telegram</option>
                                <option value="whatsapp">WhatsApp</option>
                            </select>
                            <button
                                onClick={runSimulate}
                                disabled={simRunning || !simSender.trim() || !simText.trim()}
                                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#F97316] hover:bg-[#F97316]/90 text-white text-sm font-bold uppercase tracking-widest disabled:opacity-40 transition-all"
                            >
                                {simRunning ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                {simRunning ? 'Sending' : 'Send'}
                            </button>
                        </div>
                        <textarea
                            value={simText}
                            onChange={e => setSimText(e.target.value)}
                            rows={2}
                            placeholder="message text"
                            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50 font-mono"
                        />
                        {simErr && (
                            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-xs text-red-200">
                                {simErr}
                            </div>
                        )}
                        {simResult && (
                            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs text-emerald-200 font-mono">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-bold">webhook {simResult.status}</span>
                                    <span className="text-gray-400">{simResult.elapsedMs}ms</span>
                                </div>
                                <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] text-emerald-100/80">{JSON.stringify(simResult.body, null, 2)}</pre>
                            </div>
                        )}
                    </div>
                )}

                {optsOpen && (
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400">
                                Senders that have texted STOP. Click Clear to re-enable replies (writes a START row to imessage_opt_outs).
                            </p>
                            <button
                                onClick={refreshOpts}
                                disabled={optsLoading}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-widest text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 transition-all disabled:opacity-40"
                            >
                                {optsLoading ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                                Refresh
                            </button>
                        </div>
                        {optsErr && (
                            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-xs text-red-200">{optsErr}</div>
                        )}
                        {!optsErr && optsRows.length === 0 && !optsLoading && (
                            <div className="text-xs text-gray-500">No active opt-outs.</div>
                        )}
                        {optsRows.length > 0 && (
                            <ul className="space-y-1.5">
                                {optsRows.map((r) => (
                                    <li key={r.sender} className="flex items-center gap-3 p-2 rounded-lg bg-black/30 border border-white/5">
                                        <span className="text-xs font-mono text-gray-300 truncate flex-1" title={r.sender}>{r.sender}</span>
                                        <span className="text-[10px] font-mono text-gray-500">
                                            {formatTime(r.opted_out_at)}
                                        </span>
                                        {r.last_reason && (
                                            <span className="text-[10px] font-mono text-amber-300 uppercase tracking-widest">{r.last_reason}</span>
                                        )}
                                        <button
                                            onClick={() => clearOpt(r.sender)}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-widest text-emerald-300 hover:text-white border border-emerald-500/30 hover:bg-emerald-500/10 transition-all"
                                            title={`Re-enable replies for ${r.sender}`}
                                        >
                                            <X size={10} /> Clear
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {err && (
                    <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/5 text-sm text-red-200">
                        <div className="font-mono text-xs uppercase tracking-widest text-red-300 mb-1">{resp?.error || 'error'}</div>
                        {err}
                    </div>
                )}

                {!err && rows.length === 0 && resp && (
                    <div className="p-4 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-gray-400">
                        No inbound webhook rows yet. Text the bot from your iPhone to populate this list.
                    </div>
                )}

                {rows.length > 0 && (
                    <ul className="space-y-2">
                        {rows.map((r) => (
                            <li key={r.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/10">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <StatusPill status={r.status} />
                                    <span className="text-xs font-mono text-gray-400">{r.platform}</span>
                                    <span className="text-xs font-mono text-gray-500 truncate max-w-[220px]" title={r.sender}>{r.sender}</span>
                                    <span className="text-xs font-mono text-gray-500 ml-auto">
                                        in {formatTime(r.received_at)}
                                        {r.processed_at ? <> · out {formatTime(r.processed_at)}</> : null}
                                    </span>
                                </div>
                                {r.text && (
                                    <p className="mt-2 text-sm text-gray-300 line-clamp-3 whitespace-pre-wrap">{r.text}</p>
                                )}
                                {r.reply_text && (
                                    <p className="mt-2 text-sm text-emerald-200/85 line-clamp-3 whitespace-pre-wrap pl-3 border-l-2 border-emerald-500/30">
                                        {r.reply_text}
                                    </p>
                                )}
                                {r.reply_message_id && (
                                    <div className="mt-2 text-[10px] font-mono text-gray-500 truncate" title={r.reply_message_id}>
                                        reply id: {r.reply_message_id}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
