'use client';

import { useEffect, useState } from 'react';
import { Loader2, ShieldAlert, RefreshCw, CheckCircle2, Clock, MessageSquare } from 'lucide-react';

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

export default function DevPhotonPage() {
    const [adminStatus, setAdminStatus] = useState<'loading' | 'admin' | 'not-admin' | 'unauthenticated'>('loading');
    const [adminEmail, setAdminEmail] = useState<string | null>(null);
    const [resp, setResp] = useState<RecentResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

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

    useEffect(() => {
        if (adminStatus === 'admin') void refresh();
    }, [adminStatus]);

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

                <div className="flex items-center gap-3">
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white transition-all disabled:opacity-40"
                    >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        {loading ? 'Loading' : 'Refresh'}
                    </button>
                    {rows.length > 0 && (
                        <span className="text-xs font-mono text-gray-500">
                            {repliedCount} replied · {pendingCount} pending
                        </span>
                    )}
                </div>

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
