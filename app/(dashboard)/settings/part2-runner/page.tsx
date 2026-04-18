'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    CheckCircle2, XCircle, Loader2, Copy, ShieldAlert, ArrowRight, RefreshCw, FileSignature,
} from 'lucide-react';
import { executeToolCall, type ToolCall, type ToolResult } from '@/lib/toolCalls';

/**
 * Part 2 Runner — admin-gated manual test harness for the Real-Mode
 * happy path. Every step is human-gated: no step runs unless the user
 * clicks its button. Server calls hit the same internal routes /chat
 * uses (via executeToolCall); no parallel codepath.
 *
 * Admin gate: client pre-flights GET /api/whoami. The page renders
 * only when bypass.session_email_on_allowlist is true. Non-admins
 * see a clean "Admin-only" notice — no controls rendered.
 *
 * What this is NOT:
 *   - Not an auto-login, not a wallet auto-sign. The human signs the
 *     $19 USDC subscription elsewhere (/paywall → Phantom). This page
 *     only *verifies* that subscription landed.
 *   - Not a replacement for /chat. It's diagnostic-only.
 */

type Chip = 'pending' | 'running' | 'pass' | 'fail';

interface WhoAmI {
    session_email?: string | null;
    privy_user_id?: string | null;
    bypass?: { session_email_on_allowlist?: boolean; user_id_on_allowlist?: boolean };
    subscription?: { active?: boolean; tier?: string; expiresAt?: string | null };
}

interface Capabilities {
    capability_google: boolean;
    capability_key: boolean;
    capability_real: boolean;
    authenticated: boolean;
}

interface Receipt {
    id?: string;
    tool?: string;
    action?: string;
    created_at?: string;
    signature?: string;
    payload_hash?: string;
    request_id?: string | null;
}

function authHeader(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function Pill({ chip, label }: { chip: Chip; label: string }) {
    const cls = chip === 'pass'
        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        : chip === 'fail'
            ? 'bg-red-500/15 text-red-300 border-red-500/30'
            : chip === 'running'
                ? 'bg-[#F97316]/15 text-[#F97316] border-[#F97316]/30'
                : 'bg-white/5 text-gray-400 border-white/10';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest border ${cls}`}>
            {chip === 'pass' && <CheckCircle2 size={12} />}
            {chip === 'fail' && <XCircle size={12} />}
            {chip === 'running' && <Loader2 size={12} className="animate-spin" />}
            {label}
        </span>
    );
}

function RefLine({ requestId }: { requestId?: string | null }) {
    if (!requestId) return null;
    return (
        <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] font-mono text-gray-500">Ref:</span>
            <span className="text-[11px] font-mono text-gray-300 truncate flex-1">{requestId}</span>
            <button
                onClick={() => { try { navigator.clipboard.writeText(requestId); } catch { /* noop */ } }}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider text-gray-300 hover:text-white border border-white/10 hover:bg-white/5 transition-all"
            >
                <Copy size={10} /> Copy
            </button>
        </div>
    );
}

export default function Part2RunnerPage() {
    // Admin gate
    const [adminStatus, setAdminStatus] = useState<'loading' | 'admin' | 'not-admin' | 'unauthenticated'>('loading');
    const [adminEmail, setAdminEmail] = useState<string | null>(null);

    // Step 1 — Signed in
    const [caps, setCaps] = useState<Capabilities | null>(null);
    const [capsChecked, setCapsChecked] = useState(false);
    const [capsRequestId, setCapsRequestId] = useState<string | null>(null);

    // Step 3 — Subscription
    const [sub, setSub] = useState<{ active: boolean; tier?: string; expiresAt?: string | null } | null>(null);
    const [subRequestId, setSubRequestId] = useState<string | null>(null);
    const [subChip, setSubChip] = useState<Chip>('pending');
    const [subDetail, setSubDetail] = useState<string>('');

    // Step 4 — Gmail draft
    const [senderChoice, setSenderChoice] = useState('');
    const [recentSenders, setRecentSenders] = useState<string[]>([]);
    const [loadingSenders, setLoadingSenders] = useState(false);
    const [draftSubject, setDraftSubject] = useState('Operator Uplift — test draft');
    const [draftBody, setDraftBody] = useState('This is a Part 2 runner test draft. Safe to delete.\n\n— Operator Uplift');
    const [draftChip, setDraftChip] = useState<Chip>('pending');
    const [draftResult, setDraftResult] = useState<ToolResult | null>(null);

    // Step 5 — Calendar create
    const defaultTomorrow = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(15, 0, 0, 0);
        return d.toISOString().slice(0, 16);
    };
    const [evTitle, setEvTitle] = useState('Operator Uplift test');
    const [evStart, setEvStart] = useState(defaultTomorrow());
    const [evDurationMin, setEvDurationMin] = useState(25);
    const [calChip, setCalChip] = useState<Chip>('pending');
    const [calResult, setCalResult] = useState<ToolResult | null>(null);

    // Receipts
    const [receipts, setReceipts] = useState<Receipt[]>([]);

    // ---------- effects ----------

    useEffect(() => {
        fetch('/api/whoami', {
            headers: { ...authHeader() },
            cache: 'no-store',
        })
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then((data: WhoAmI) => {
                const isAdmin = !!(data.bypass?.session_email_on_allowlist || data.bypass?.user_id_on_allowlist);
                setAdminStatus(isAdmin ? 'admin' : 'not-admin');
                setAdminEmail(data.session_email ?? null);
            })
            .catch((status) => {
                setAdminStatus(status === 401 ? 'unauthenticated' : 'not-admin');
            });
    }, []);

    // ---------- step runners ----------

    const runCheckAuthAndGoogle = async () => {
        setCapsChecked(false);
        const res = await fetch('/api/capabilities', { headers: { ...authHeader() }, cache: 'no-store' });
        const rid = res.headers.get('x-request-id');
        if (rid) {
            setCapsRequestId(rid);
            try { localStorage.setItem('lastRequestId', rid); } catch { /* noop */ }
        }
        if (!res.ok) {
            setCaps({ capability_google: false, capability_key: false, capability_real: false, authenticated: false });
        } else {
            const data = await res.json();
            setCaps({
                capability_google: !!data.capability_google,
                capability_key: !!data.capability_key,
                capability_real: !!data.capability_real,
                authenticated: !!data.authenticated,
            });
        }
        setCapsChecked(true);
    };

    const runCheckSubscription = async () => {
        setSubChip('running');
        setSubDetail('');
        try {
            const res = await fetch('/api/subscription', { headers: { ...authHeader() }, cache: 'no-store' });
            const rid = res.headers.get('x-request-id');
            if (rid) setSubRequestId(rid);
            const data = await res.json();
            if (res.ok && data.active) {
                setSub({ active: true, tier: data.tier, expiresAt: data.expiresAt ?? null });
                setSubDetail(`Active (${data.tier || 'pro'}). Expires ${data.expiresAt || 'n/a'}.`);
                setSubChip('pass');
            } else {
                setSub({ active: false });
                const hint = data.nextAction || data.message || data.reason || 'Open /paywall and complete the $19 USDC payment.';
                setSubDetail(hint);
                setSubChip('fail');
            }
        } catch (err) {
            setSubDetail(err instanceof Error ? err.message : 'Network error');
            setSubChip('fail');
        }
    };

    const loadRecentSenders = async () => {
        setLoadingSenders(true);
        // Reuse the real gmail.list route. Pull only `from` off each message.
        // No subjects, no snippets, no bodies enter the UI.
        const res = await fetch('/api/tools/gmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader() },
            body: JSON.stringify({ action: 'list', params: { query: 'in:inbox', max_results: 25 } }),
        });
        if (!res.ok) {
            setRecentSenders([]);
            setLoadingSenders(false);
            return;
        }
        const data = await res.json();
        const messages: Array<{ from?: string }> = Array.isArray(data?.messages) ? data.messages : [];
        const emails = Array.from(new Set(
            messages
                .map(m => {
                    const raw = String(m.from || '');
                    const m2 = raw.match(/<([^>]+)>/);
                    return (m2 ? m2[1] : raw).trim().toLowerCase();
                })
                .filter(Boolean),
        )).slice(0, 10);
        setRecentSenders(emails);
        setLoadingSenders(false);
    };

    const runGmailDraft = async () => {
        if (!senderChoice) return;
        setDraftChip('running');
        setDraftResult(null);
        const userId = caps?.authenticated ? 'self' : 'demo-user';
        const call: ToolCall = {
            id: `p2-${Date.now()}`,
            tool: 'gmail',
            action: 'draft',
            params: {
                to: senderChoice.trim(),
                subject: draftSubject,
                body: draftBody,
            },
            rawBlock: '',
        };
        const result = await executeToolCall(call, userId);
        setDraftResult(result);
        setDraftChip(result.success ? 'pass' : 'fail');
        if (result.requestId) {
            try { localStorage.setItem('lastRequestId', result.requestId); } catch { /* noop */ }
        }
        if (result.success) refreshReceipts();
    };

    const runCalendarCreate = async () => {
        setCalChip('running');
        setCalResult(null);
        const startIso = new Date(evStart).toISOString();
        const endIso = new Date(new Date(evStart).getTime() + evDurationMin * 60_000).toISOString();
        const userId = caps?.authenticated ? 'self' : 'demo-user';
        const call: ToolCall = {
            id: `p2-${Date.now()}`,
            tool: 'calendar',
            action: 'create',
            params: {
                summary: evTitle,
                start: startIso,
                end: endIso,
                description: 'Created by the Part 2 runner.',
            },
            rawBlock: '',
        };
        const result = await executeToolCall(call, userId);
        setCalResult(result);
        setCalChip(result.success ? 'pass' : 'fail');
        if (result.requestId) {
            try { localStorage.setItem('lastRequestId', result.requestId); } catch { /* noop */ }
        }
        if (result.success) refreshReceipts();
    };

    const refreshReceipts = async () => {
        try {
            const res = await fetch('/api/receipts', { headers: { ...authHeader() }, cache: 'no-store' });
            if (!res.ok) return;
            const data = await res.json();
            const list: Receipt[] = Array.isArray(data.receipts) ? data.receipts.slice(0, 5) : [];
            setReceipts(list);
        } catch { /* non-fatal */ }
    };

    // ---------- render ----------

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
                            ? 'Sign in with an admin email to access the Part 2 runner.'
                            : 'Your email is not on the admin allowlist. Contact ops if you need access.'}
                    </p>
                </div>
            </div>
        );
    }

    const signedInChip: Chip = capsChecked ? (caps?.authenticated ? 'pass' : 'fail') : 'pending';
    const googleChip: Chip = capsChecked ? (caps?.capability_google ? 'pass' : 'fail') : 'pending';

    return (
        <div className="min-h-screen p-6 lg:p-10">
            <div className="max-w-[880px] mx-auto space-y-6">
                <header className="mb-2">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-medium tracking-tight text-white">Part 2 Runner</h1>
                        <span className="text-[10px] font-mono text-gray-500">admin · {adminEmail ?? 'unknown'}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                        Five human-clicked steps. Every action uses the same routes /chat uses. No auto-login, no wallet auto-sign. Each write is x402-gated so $0.01 USDC per write.
                    </p>
                </header>

                {/* Step 1 — Signed in */}
                <section className="p-5 rounded-2xl border border-white/10 bg-foreground/[0.04]">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-base font-medium text-white">1 · Signed in</h2>
                        <Pill chip={signedInChip} label={signedInChip} />
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                        Confirms your Privy session token is valid and verifySession() accepts it.
                    </p>
                    <button
                        onClick={runCheckAuthAndGoogle}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white transition-all"
                    >
                        <RefreshCw size={12} /> Check sign-in + Google
                    </button>
                    <RefLine requestId={capsRequestId} />
                </section>

                {/* Step 2 — Google connected */}
                <section className="p-5 rounded-2xl border border-white/10 bg-foreground/[0.04]">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-base font-medium text-white">2 · Google connected</h2>
                        <Pill chip={googleChip} label={googleChip} />
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                        Confirms the OAuth row exists in user_integrations with a valid refresh token.
                        {!caps?.capability_google && capsChecked
                            ? ' If fail: visit /integrations and connect Google (calendar + gmail scopes).'
                            : ''}
                    </p>
                    {!caps?.capability_google && capsChecked ? (
                        <Link
                            href="/integrations"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F97316]/10 hover:bg-[#F97316]/15 border border-[#F97316]/30 text-sm text-[#F97316] transition-all"
                        >
                            Connect Google <ArrowRight size={12} />
                        </Link>
                    ) : null}
                </section>

                {/* Step 3 — Subscription */}
                <section className="p-5 rounded-2xl border border-white/10 bg-foreground/[0.04]">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-base font-medium text-white">3 · Subscription ($19 USDC)</h2>
                        <Pill chip={subChip} label={subChip} />
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                        Confirms your /api/subscription GET returns {'{'}active: true{'}'}. Pay via /paywall first —
                        that flow is human-gated (Phantom signs).
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={runCheckSubscription}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white transition-all"
                        >
                            <RefreshCw size={12} /> Check subscription
                        </button>
                        {!sub?.active && subChip !== 'pending' ? (
                            <Link
                                href="/paywall"
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F97316]/10 hover:bg-[#F97316]/15 border border-[#F97316]/30 text-sm text-[#F97316] transition-all"
                            >
                                Open paywall <ArrowRight size={12} />
                            </Link>
                        ) : null}
                    </div>
                    {subDetail ? (
                        <p className="mt-3 text-xs text-gray-400">{subDetail}</p>
                    ) : null}
                    <RefLine requestId={subRequestId} />
                </section>

                {/* Step 4 — Gmail draft */}
                <section className="p-5 rounded-2xl border border-white/10 bg-foreground/[0.04]">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-base font-medium text-white">4 · Gmail draft</h2>
                        <Pill chip={draftChip} label={draftChip} />
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                        Creates a real draft in your Gmail inbox via /api/tools/gmail.draft. x402-gated ($0.01 USDC).
                        No inbox content is shown — we only read the `from` addresses off gmail.list to populate recent senders.
                    </p>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[11px] font-mono uppercase tracking-widest text-gray-500 mb-1">To (recipient email)</label>
                            <input
                                type="email"
                                value={senderChoice}
                                onChange={e => setSenderChoice(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50"
                            />
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <button
                                    onClick={loadRecentSenders}
                                    className="text-[10px] font-mono uppercase tracking-widest text-gray-400 hover:text-white px-2 py-1 rounded border border-white/10 hover:bg-white/5 transition-all"
                                >
                                    {loadingSenders ? 'Loading…' : 'Load recent senders'}
                                </button>
                                {recentSenders.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSenderChoice(s)}
                                        className="text-[10px] font-mono text-gray-400 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition-all truncate max-w-[260px]"
                                        title={s}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-mono uppercase tracking-widest text-gray-500 mb-1">Subject</label>
                            <input
                                type="text"
                                value={draftSubject}
                                onChange={e => setDraftSubject(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-[#F97316]/50"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-mono uppercase tracking-widest text-gray-500 mb-1">Body</label>
                            <textarea
                                value={draftBody}
                                onChange={e => setDraftBody(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-[#F97316]/50 font-mono"
                            />
                        </div>
                        <button
                            onClick={runGmailDraft}
                            disabled={!senderChoice || draftChip === 'running'}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F97316] hover:bg-[#F97316]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold uppercase tracking-widest transition-all"
                        >
                            {draftChip === 'running' ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                            {draftChip === 'running' ? 'Running…' : 'Create draft ($0.01)'}
                        </button>
                        {draftResult ? (
                            <ResultPanel result={draftResult} />
                        ) : null}
                    </div>
                </section>

                {/* Step 5 — Calendar create */}
                <section className="p-5 rounded-2xl border border-white/10 bg-foreground/[0.04]">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-base font-medium text-white">5 · Calendar event</h2>
                        <Pill chip={calChip} label={calChip} />
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                        Creates a real event via /api/tools/calendar.create. x402-gated ($0.01 USDC).
                    </p>
                    <div className="grid sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-3">
                            <label className="block text-[11px] font-mono uppercase tracking-widest text-gray-500 mb-1">Title</label>
                            <input
                                type="text"
                                value={evTitle}
                                onChange={e => setEvTitle(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-[#F97316]/50"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-[11px] font-mono uppercase tracking-widest text-gray-500 mb-1">Start</label>
                            <input
                                type="datetime-local"
                                value={evStart}
                                onChange={e => setEvStart(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-[#F97316]/50"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-mono uppercase tracking-widest text-gray-500 mb-1">Duration (min)</label>
                            <input
                                type="number"
                                value={evDurationMin}
                                onChange={e => setEvDurationMin(Math.max(5, Math.min(240, Number(e.target.value) || 25)))}
                                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-[#F97316]/50"
                            />
                        </div>
                        <div className="sm:col-span-3">
                            <button
                                onClick={runCalendarCreate}
                                disabled={!evTitle || !evStart || calChip === 'running'}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F97316] hover:bg-[#F97316]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold uppercase tracking-widest transition-all"
                            >
                                {calChip === 'running' ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                                {calChip === 'running' ? 'Running…' : 'Create event ($0.01)'}
                            </button>
                        </div>
                    </div>
                    {calResult ? (
                        <div className="mt-3">
                            <ResultPanel result={calResult} />
                        </div>
                    ) : null}
                </section>

                {/* Receipts */}
                <section className="p-5 rounded-2xl border border-white/10 bg-foreground/[0.04]">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-base font-medium text-white flex items-center gap-2">
                            <FileSignature size={16} /> Recent receipts
                        </h2>
                        <button
                            onClick={refreshReceipts}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                        >
                            <RefreshCw size={10} /> Refresh
                        </button>
                    </div>
                    {receipts.length === 0 ? (
                        <p className="text-xs text-gray-500">No receipts yet. Run step 4 or 5 to generate one.</p>
                    ) : (
                        <ul className="space-y-2">
                            {receipts.map((r, i) => (
                                <li key={r.id ?? i} className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs">
                                    <div className="flex items-center gap-3 font-mono">
                                        <span className="text-emerald-400">{r.tool}.{r.action}</span>
                                        <span className="text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</span>
                                    </div>
                                    <div className="mt-1 text-[10px] font-mono text-gray-500 truncate">
                                        sig {r.signature?.slice(0, 16) ?? '—'}…  hash {r.payload_hash?.slice(0, 16) ?? '—'}…
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <p className="text-[10px] font-mono text-gray-600 text-center pt-2">
                    Admin-gated · no auto-login · human signs every $ tx · reads the same internal routes as /chat
                </p>
            </div>
        </div>
    );
}

function ResultPanel({ result }: { result: ToolResult }) {
    const ok = result.success;
    return (
        <div className={`mt-3 p-3 rounded-lg border text-xs ${ok ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-red-500/5 border-red-500/30'}`}>
            <div className="flex items-center gap-2 mb-1">
                {ok ? <CheckCircle2 size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />}
                <span className={`font-mono ${ok ? 'text-emerald-300' : 'text-red-300'}`}>
                    {result.tool}.{result.action} — {ok ? 'executed' : 'failed'}
                </span>
            </div>
            {!ok && result.error ? (
                <p className="text-gray-300 mt-1">{result.error}</p>
            ) : null}
            {!ok && result.nextAction ? (
                <p className="text-gray-400 mt-1">{result.nextAction}</p>
            ) : null}
            <RefLine requestId={result.requestId ?? null} />
            <details className="mt-2">
                <summary className="text-[10px] font-mono text-gray-500 cursor-pointer hover:text-gray-300">Raw envelope</summary>
                <pre className="mt-1 p-2 rounded bg-black/60 text-[10px] text-gray-300 font-mono overflow-x-auto">{JSON.stringify(result.data ?? { error: result.error, nextAction: result.nextAction, requestId: result.requestId }, null, 2)}</pre>
            </details>
        </div>
    );
}
