'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Activity, CheckCircle2, XCircle, Loader2, Copy, ShieldAlert, RefreshCw, Send, PlayCircle,
} from 'lucide-react';

/**
 * /dev/imessage — admin-gated transport-loopback harness for Photon iMessage.
 *
 * Two buttons for exercising the two directions without the LLM:
 *   - Replay: refreshes the last 20 inbound + outbound rows from Supabase
 *     so you can eyeball what the webhook saw.
 *   - Send: POSTs /api/photon/imessage/send with a hardcoded "pong"
 *     into a threadId you type (or a recipient handle).
 *
 * No agent pipeline is invoked. No LLM call happens here. The point is
 * to prove transport works before the next PR wires agent_generate_reply.
 */

type Chip = 'idle' | 'sending' | 'sent' | 'failed';

interface InboundRow {
    id: string;
    provider: string;
    platform: string;
    event_type: string;
    sender: string | null;
    recipient: string | null;
    thread_id: string | null;
    message_id: string | null;
    text: string | null;
    received_at: string;
    request_id: string | null;
    status: string | null;
}

interface OutboundRow {
    id: string;
    provider: string;
    platform: string;
    recipient: string | null;
    thread_id: string | null;
    text: string | null;
    photon_message_id: string | null;
    status: string;
    failure_reason: string | null;
    sent_at: string;
    request_id: string | null;
    source: string | null;
}

interface WhoAmI {
    session_email?: string | null;
    bypass?: { session_email_on_allowlist?: boolean; user_id_on_allowlist?: boolean };
}

function readToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function authHeaders(token: string | null): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function authHeadersWithContentType(token: string | null): Record<string, string> {
    return token
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        : { 'Content-Type': 'application/json' };
}

function last4(s: string | null): string {
    if (!s) return '----';
    const d = s.replace(/\D/g, '');
    return d.length >= 4 ? d.slice(-4) : s.slice(-4);
}

function CopyChip({ value, label = 'Copy' }: { value: string | null | undefined; label?: string }) {
    if (!value) return null;
    return (
        <button
            onClick={() => { try { navigator.clipboard.writeText(value); } catch { /* noop */ } }}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-300 hover:text-white border border-white/10 hover:bg-white/5 transition-all"
            title={value}
        >
            <Copy size={10} /> {label}
        </button>
    );
}

export default function ImessageHarnessPage() {
    const [admin, setAdmin] = useState<'loading' | 'admin' | 'not-admin' | 'unauthenticated'>('loading');
    const [adminEmail, setAdminEmail] = useState<string | null>(null);

    const [inbound, setInbound] = useState<InboundRow[]>([]);
    const [outbound, setOutbound] = useState<OutboundRow[]>([]);
    const [loading, setLoading] = useState(false);

    // Send form
    const [toRecipient, setToRecipient] = useState('');
    const [sendThreadId, setSendThreadId] = useState('');
    const [testText, setTestText] = useState('pong');
    const [chip, setChip] = useState<Chip>('idle');
    const [sendResult, setSendResult] = useState<Record<string, unknown> | null>(null);

    useEffect(() => {
        fetch('/api/whoami', { headers: authHeaders(readToken()), cache: 'no-store' })
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then((data: WhoAmI) => {
                const isAdmin = !!(data.bypass?.session_email_on_allowlist || data.bypass?.user_id_on_allowlist);
                setAdmin(isAdmin ? 'admin' : 'not-admin');
                setAdminEmail(data.session_email ?? null);
            })
            .catch((status) => setAdmin(status === 401 ? 'unauthenticated' : 'not-admin'));
    }, []);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/photon/imessage/replay?limit=20', { headers: authHeaders(readToken()), cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setInbound(data.inbound || []);
                setOutbound(data.outbound || []);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { if (admin === 'admin') refresh(); }, [admin, refresh]);

    // Autofill send fields from the most recent inbound so a roundtrip
    // is one click if you just received a message.
    useEffect(() => {
        if (inbound[0] && !toRecipient && !sendThreadId) {
            if (inbound[0].sender) setToRecipient(inbound[0].sender);
            if (inbound[0].thread_id) setSendThreadId(inbound[0].thread_id);
        }
    }, [inbound, toRecipient, sendThreadId]);

    const sendPong = async () => {
        if (!toRecipient.trim() || !testText.trim()) return;
        setChip('sending');
        setSendResult(null);
        try {
            const res = await fetch('/api/photon/imessage/send', {
                method: 'POST',
                headers: authHeadersWithContentType(readToken()),
                body: JSON.stringify({
                    to: toRecipient.trim(),
                    text: testText,
                    threadId: sendThreadId || undefined,
                    source: 'dev_harness',
                }),
            });
            const data: Record<string, unknown> = await res.json().catch(() => ({}));
            setSendResult(data);
            setChip(res.ok ? 'sent' : 'failed');
            if (data.requestId) { try { localStorage.setItem('lastRequestId', String(data.requestId)); } catch { /* noop */ } }
            // Refresh rows so the new outbound shows up.
            refresh();
        } catch (err) {
            setSendResult({ error: err instanceof Error ? err.message : 'network_error' });
            setChip('failed');
        }
    };

    if (admin === 'loading') {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 size={20} className="animate-spin text-gray-500" /></div>;
    }

    if (admin !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-md w-full p-6 rounded-2xl border border-white/10 bg-[#111111] text-center">
                    <ShieldAlert size={28} className="text-[#F97316] mx-auto mb-3" />
                    <h1 className="text-lg font-medium text-white mb-2">Admin-only</h1>
                    <p className="text-sm text-gray-400">
                        {admin === 'unauthenticated' ? 'Sign in with an admin email to access the Photon harness.' : 'Your email is not on the admin allowlist.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 lg:p-10">
            <div className="max-w-[1100px] mx-auto space-y-6">
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 border border-[#F97316]/30 flex items-center justify-center">
                            <Activity size={20} className="text-[#F97316]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-medium text-white tracking-tight">Photon iMessage harness</h1>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">admin · {adminEmail ?? 'unknown'} · transport loopback, no LLM</p>
                        </div>
                    </div>
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white transition-all"
                    >
                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </header>

                {/* Send panel */}
                <section className="p-5 rounded-2xl border border-white/10 bg-foreground/[0.04]">
                    <h2 className="text-base font-medium text-white mb-1 flex items-center gap-2">
                        <Send size={14} className="text-[#F97316]" /> Send test reply
                    </h2>
                    <p className="text-xs text-gray-500 mb-4">
                        Hits <code className="font-mono text-gray-400">POST /api/photon/imessage/send</code> with a hardcoded &ldquo;pong&rdquo;. Autofills from the most recent inbound so you can round-trip with one click.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-mono uppercase tracking-widest text-gray-500 mb-1">To (recipient / E.164)</label>
                            <input
                                type="text"
                                value={toRecipient}
                                onChange={e => setToRecipient(e.target.value)}
                                placeholder="+1415…"
                                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50 font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-mono uppercase tracking-widest text-gray-500 mb-1">Thread id (stored on outbound row)</label>
                            <input
                                type="text"
                                value={sendThreadId}
                                onChange={e => setSendThreadId(e.target.value)}
                                placeholder="(optional)"
                                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50 font-mono"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-[11px] font-mono uppercase tracking-widest text-gray-500 mb-1">Text</label>
                            <input
                                type="text"
                                value={testText}
                                onChange={e => setTestText(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-[#F97316]/50 font-mono"
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                        <button
                            onClick={sendPong}
                            disabled={!toRecipient.trim() || !testText.trim() || chip === 'sending'}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F97316] hover:bg-[#F97316]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold uppercase tracking-widest transition-all"
                        >
                            {chip === 'sending' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            {chip === 'sending' ? 'Sending…' : `Send \"${testText}\"`}
                        </button>
                        {chip === 'sent' && <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 size={12} /> Sent</span>}
                        {chip === 'failed' && <span className="inline-flex items-center gap-1 text-xs text-red-400"><XCircle size={12} /> Failed</span>}
                    </div>
                    {sendResult ? (
                        <details className="mt-3">
                            <summary className="text-[10px] font-mono text-gray-500 cursor-pointer hover:text-gray-300">Raw envelope</summary>
                            <pre className="mt-1 p-2 rounded bg-black/60 text-[10px] text-gray-300 font-mono overflow-x-auto">{JSON.stringify(sendResult, null, 2)}</pre>
                        </details>
                    ) : null}
                </section>

                {/* Replay panel */}
                <section className="p-5 rounded-2xl border border-white/10 bg-foreground/[0.04]">
                    <h2 className="text-base font-medium text-white mb-1 flex items-center gap-2">
                        <PlayCircle size={14} className="text-[#F97316]" /> Last 20 events
                    </h2>
                    <p className="text-xs text-gray-500 mb-4">
                        Reads <code className="font-mono text-gray-400">GET /api/photon/imessage/replay</code>. No re-POST happens — this is a snapshot.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-2">Inbound ({inbound.length})</p>
                            <ul className="space-y-2 max-h-[420px] overflow-auto pr-1">
                                {inbound.length === 0 ? <li className="text-xs text-gray-500">No rows. Send a message to the Photon number to see it here.</li> : null}
                                {inbound.map(row => (
                                    <li key={row.id} className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-emerald-400">{row.platform}.{row.event_type}</span>
                                            <span className="text-gray-500">from …{last4(row.sender)}</span>
                                            <span className="text-gray-500">· {new Date(row.received_at).toLocaleTimeString()}</span>
                                            {row.status && row.status !== 'new' ? <span className="text-amber-400 font-mono">[{row.status}]</span> : null}
                                        </div>
                                        {row.text ? <p className="mt-1 text-gray-200 break-words">{row.text}</p> : null}
                                        <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[10px] font-mono text-gray-500">
                                            {row.thread_id ? <span>thread {row.thread_id.slice(0, 12)}…</span> : null}
                                            {row.message_id ? <><CopyChip value={row.message_id} label="msg" /></> : null}
                                            {row.request_id ? <CopyChip value={row.request_id} label="ref" /> : null}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-2">Outbound ({outbound.length})</p>
                            <ul className="space-y-2 max-h-[420px] overflow-auto pr-1">
                                {outbound.length === 0 ? <li className="text-xs text-gray-500">No sends yet. Use the panel above to send a pong.</li> : null}
                                {outbound.map(row => (
                                    <li key={row.id} className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`font-mono ${row.status === 'sent' ? 'text-emerald-400' : row.status === 'failed' || row.status === 'not_configured' ? 'text-red-400' : 'text-amber-400'}`}>
                                                {row.status}
                                            </span>
                                            <span className="text-gray-500">to …{last4(row.recipient)}</span>
                                            <span className="text-gray-500">· {new Date(row.sent_at).toLocaleTimeString()}</span>
                                            {row.source ? <span className="text-gray-600 font-mono">[{row.source}]</span> : null}
                                        </div>
                                        {row.text ? <p className="mt-1 text-gray-200 break-words">{row.text}</p> : null}
                                        {row.failure_reason ? <p className="mt-1 text-red-300 break-words">{row.failure_reason}</p> : null}
                                        <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[10px] font-mono text-gray-500">
                                            {row.thread_id ? <span>thread {row.thread_id.slice(0, 12)}…</span> : null}
                                            {row.photon_message_id ? <CopyChip value={row.photon_message_id} label="photon_id" /> : null}
                                            {row.request_id ? <CopyChip value={row.request_id} label="ref" /> : null}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                <p className="text-[10px] font-mono text-gray-600 text-center">
                    Transport-only. Agent + LLM wiring is the next PR.
                    <Link href="/docs/photon-imessage.md" className="ml-2 underline hover:text-white">Runbook</Link>
                </p>
            </div>
        </div>
    );
}
