'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, ChevronDown, ChevronRight, MessageSquare, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/Card';

/**
 * Personal recent-traffic panel for the dashboard /integrations page.
 *
 * Renders the calling Privy user's own iMessage agent rows (their
 * inbound text + the bot's reply) so they can see what the bot
 * heard and how it answered without paging through a phone log.
 *
 * Always scoped server-side to senders the caller owns (route
 * /api/integrations/imessage/recent does the privy_user_id ->
 * sender lookup). Empty state shows "No traffic yet" instead of
 * a generic placeholder.
 *
 * Defaults to collapsed: opening the panel triggers the first
 * fetch so unverified users don't pay for a 200 + empty rows on
 * every dashboard mount.
 */

interface RecentRow {
    id: string;
    sender: string;
    platform: string;
    text: string | null;
    received_at: string;
    processed_at: string | null;
    reply_message_id: string | null;
    reply_text: string | null;
    acked_at: string | null;
    status: 'replied' | 'pending';
}

interface RecentResponse {
    rows?: RecentRow[];
    count?: number;
    error?: string;
    nextAction?: string;
}

function authHeader(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = window.localStorage.getItem('token');
    return token && token !== 'demo-token' ? { Authorization: `Bearer ${token}` } : {};
}

function formatTime(iso: string | null): string {
    if (!iso) return '\u2014';
    try {
        return new Date(iso).toLocaleTimeString();
    } catch {
        return iso;
    }
}

export function IMessageRecentPanel() {
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState<RecentRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);

    async function refresh() {
        setLoading(true);
        setErr(null);
        try {
            const res = await fetch('/api/integrations/imessage/recent?limit=20', {
                headers: { ...authHeader() },
                cache: 'no-store',
            });
            const data = (await res.json().catch(() => ({}))) as RecentResponse;
            if (!res.ok) {
                setRows([]);
                setErr(data.nextAction || data.error || `HTTP ${res.status}`);
                return;
            }
            setRows(Array.isArray(data.rows) ? data.rows : []);
        } catch (e) {
            setErr(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
            setHasFetched(true);
        }
    }

    useEffect(() => {
        if (open && !hasFetched) void refresh();
    }, [open, hasFetched]);

    return (
        <Card variant="glass" className="border-white/10">
            <CardContent className="p-0">
                {/* 2026-06-03 a11y: split the toggle and refresh into
                    sibling <button>s. The prior layout nested a
                    role="button" <span> inside the toggle <button>,
                    which is invalid HTML (interactive-in-interactive)
                    and confuses screen readers about what the outer
                    button activates. The refresh button now sits
                    outside the toggle and renders only when open. */}
                <div className="w-full p-4 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-all">
                    <button
                        type="button"
                        onClick={() => setOpen(o => !o)}
                        aria-expanded={open}
                        className="flex items-center gap-3 flex-1 text-left -m-2 p-2 rounded hover:bg-white/[0.02]"
                    >
                        {open ? <ChevronDown size={14} aria-hidden="true" className="text-gray-400" /> : <ChevronRight size={14} aria-hidden="true" className="text-gray-400" />}
                        <MessageSquare size={14} aria-hidden="true" className="text-primary" />
                        <h3 className="text-sm font-semibold text-white">Recent messages</h3>
                        {hasFetched && rows.length > 0 && (
                            <span className="text-[10px] font-mono text-gray-500">{rows.length} rows</span>
                        )}
                    </button>
                    {open && (
                        <button
                            type="button"
                            aria-label="Refresh recent messages"
                            onClick={() => { void refresh(); }}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-widest text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 transition-all"
                        >
                            {loading ? <Loader2 size={10} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={10} aria-hidden="true" />}
                            Refresh
                        </button>
                    )}
                </div>

                {open && (
                    <div className="px-4 pb-4 space-y-2">
                        {err && (
                            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-xs text-red-200">{err}</div>
                        )}
                        {!err && hasFetched && rows.length === 0 && !loading && (
                            <div className="text-xs text-gray-500 leading-relaxed">
                                No traffic yet. Verify your phone above, then text the bot from your iPhone.
                            </div>
                        )}
                        {rows.length > 0 && (
                            <ul className="space-y-2">
                                {rows.map((r) => (
                                    <li key={r.id} className="p-3 rounded-lg bg-foreground/[0.02] border border-white/10">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {r.status === 'replied' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono uppercase tracking-widest">
                                                    <CheckCircle2 size={11} aria-hidden="true" /> replied
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono uppercase tracking-widest">
                                                    <Clock size={11} aria-hidden="true" /> pending
                                                </span>
                                            )}
                                            <span className="text-xs font-mono text-gray-500 ml-auto">
                                                in {formatTime(r.received_at)}
                                                {r.processed_at ? <> &middot; out {formatTime(r.processed_at)}</> : null}
                                            </span>
                                        </div>
                                        {r.text && (
                                            <p className="mt-2 text-sm text-gray-300 line-clamp-3 whitespace-pre-wrap">{r.text}</p>
                                        )}
                                        {r.reply_text && (
                                            <p className="mt-1 pl-3 border-l border-primary/30 text-sm text-gray-400 line-clamp-3 whitespace-pre-wrap">{r.reply_text}</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
