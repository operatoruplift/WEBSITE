'use client';

import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, XCircle, Loader2, Copy, ShieldAlert } from 'lucide-react';

/**
 * Admin-gated reliability harness at /dev/reliability.
 *
 * Runs five scripted checks against the same internal tool-call paths
 * that /chat uses. Does NOT create a parallel codepath, every check
 * POSTs to the real route so any bug surfaces identically to the chat
 * flow.
 *
 * The five checks:
 *   1. calendar.list             , free read, expected 200
 *   2. calendar.free_slots       , free read, expected 200
 *   3. gmail.draft               , write, expected 402 (x402 challenge)
 *                                   or 403 (google_not_connected)
 *   4. calendar.create           , write, expected 402 or 403
 *   5. /api/dev/reliability/timeout, expected 504 with calm copy
 *
 * Access control happens server-side on every check route, this page
 * only renders the UI and the pre-flight admin probe via /api/whoami.
 * A non-admin sees a clean "admin-only" notice with no dev surface.
 */

type Status = 'pending' | 'running' | 'pass' | 'fail';

interface Check {
    id: string;
    label: string;
    description: string;
    run: (token: string | null) => Promise<CheckResult>;
}

interface CheckResult {
    status: 'pass' | 'fail';
    httpStatus: number;
    requestId: string | null;
    nextAction: string;
    detail: string;
}

function passIfStatusIn(allowed: number[]): (httpStatus: number) => boolean {
    return (s) => allowed.includes(s);
}

async function postJson(url: string, body: unknown, token: string | null) {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
    const requestId = res.headers.get('x-request-id');
    let data: Record<string, unknown> = {};
    try { data = await res.json(); } catch { /* some routes stream */ }
    return { httpStatus: res.status, requestId, data };
}

function makeCheck(
    id: string,
    label: string,
    description: string,
    url: string,
    body: unknown,
    isPass: (httpStatus: number) => boolean,
): Check {
    return {
        id,
        label,
        description,
        run: async (token) => {
            const { httpStatus, requestId, data } = await postJson(url, body, token);
            const pass = isPass(httpStatus);
            const nextAction = String((data?.nextAction ?? data?.message ?? '') || (pass
                ? 'Behaved as expected.'
                : 'Re-run the check, upstream may be transient.'));
            const detail = String(data?.error ?? data?.detail ?? data?.reason ?? '(no body)');
            return { status: pass ? 'pass' : 'fail', httpStatus, requestId, nextAction, detail };
        },
    };
}

const CHECKS: Check[] = [
    makeCheck(
        'calendar.list',
        'calendar.list',
        'Read today\u2019s events. x402-free. Expect 200 when Google is connected, 403 when not.',
        '/api/tools/calendar',
        { action: 'list', params: { days_ahead: 1, max_results: 5 } },
        passIfStatusIn([200, 403]),
    ),
    makeCheck(
        'calendar.free_slots',
        'calendar.free_slots',
        'Find a free 30-min slot today. x402-free. Expect 200 or 403.',
        '/api/tools/calendar',
        { action: 'free_slots', params: { duration_mins: 30, days_ahead: 1 } },
        passIfStatusIn([200, 403]),
    ),
    makeCheck(
        'gmail.draft',
        'gmail.draft',
        'Draft an email. x402-gated. Expect 402 (payment challenge) or 403 (not connected).',
        '/api/tools/gmail',
        { action: 'draft', params: { to: 'self@example.com', subject: 'harness', body: 'harness' } },
        passIfStatusIn([402, 403]),
    ),
    makeCheck(
        'calendar.create',
        'calendar.create',
        'Create an event. x402-gated. Expect 402 or 403.',
        '/api/tools/calendar',
        {
            action: 'create',
            params: {
                summary: 'Harness check (simulated)',
                start: new Date(Date.now() + 86400_000).toISOString(),
                end: new Date(Date.now() + 86400_000 + 3600_000).toISOString(),
            },
        },
        passIfStatusIn([402, 403]),
    ),
    makeCheck(
        'provider.timeout',
        'provider.timeout (simulated)',
        'Admin-only. Sleeps 6s then returns 504 with calm copy, proves the calm-error path renders.',
        '/api/dev/reliability/timeout',
        { delayMs: 6000 },
        passIfStatusIn([504]),
    ),
];

export default function ReliabilityHarnessPage() {
    const [adminStatus, setAdminStatus] = useState<'loading' | 'admin' | 'not-admin' | 'unauthenticated'>('loading');
    const [adminEmail, setAdminEmail] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, { status: Status; result?: CheckResult }>>(
        Object.fromEntries(CHECKS.map(c => [c.id, { status: 'pending' as const }])),
    );
    const [running, setRunning] = useState(false);

    useEffect(() => {
        const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        setToken(t);
        fetch('/api/whoami', {
            headers: t ? { Authorization: `Bearer ${t}` } : {},
            cache: 'no-store',
        })
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then((data: { session_email?: string | null; bypass?: { session_email_on_allowlist?: boolean; user_id_on_allowlist?: boolean } }) => {
                const isAdmin = !!(data.bypass?.session_email_on_allowlist || data.bypass?.user_id_on_allowlist);
                setAdminStatus(isAdmin ? 'admin' : 'not-admin');
                setAdminEmail(data.session_email ?? null);
            })
            .catch((status) => {
                setAdminStatus(status === 401 ? 'unauthenticated' : 'not-admin');
            });
    }, []);

    const runAll = async () => {
        setRunning(true);
        setResults(Object.fromEntries(CHECKS.map(c => [c.id, { status: 'pending' as const }])));
        for (const check of CHECKS) {
            setResults(prev => ({ ...prev, [check.id]: { status: 'running' } }));
            try {
                const result = await check.run(token);
                setResults(prev => ({ ...prev, [check.id]: { status: result.status, result } }));
            } catch (err) {
                setResults(prev => ({
                    ...prev,
                    [check.id]: {
                        status: 'fail',
                        result: {
                            status: 'fail',
                            httpStatus: 0,
                            requestId: null,
                            nextAction: 'Check your network and re-run.',
                            detail: err instanceof Error ? err.message : 'fetch failed',
                        },
                    },
                }));
            }
        }
        setRunning(false);
    };

    const copyRef = async (ref: string) => {
        try { await navigator.clipboard.writeText(ref); } catch { /* noop */ }
    };

    if (adminStatus === 'loading') {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-gray-500" />
            </div>
        );
    }

    if (adminStatus !== 'admin') {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
                <div className="max-w-md w-full p-6 rounded-2xl border border-white/10 bg-[#111111] text-center">
                    <ShieldAlert size={28} className="text-[#F97316] mx-auto mb-3" />
                    <h1 className="text-lg font-medium text-white mb-2">Admin-only</h1>
                    <p className="text-sm text-gray-400">
                        {adminStatus === 'unauthenticated'
                            ? 'Sign in with an admin email to access the reliability harness.'
                            : 'Your email is not on the admin bypass list. Contact ops if you need access.'}
                    </p>
                </div>
            </div>
        );
    }

    const passCount = Object.values(results).filter(r => r.status === 'pass').length;
    const failCount = Object.values(results).filter(r => r.status === 'fail').length;

    return (
        <div className="min-h-screen bg-[#0A0A0A] p-6 lg:p-10">
            <div className="max-w-[900px] mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 border border-[#F97316]/30 flex items-center justify-center">
                            <Activity size={20} className="text-[#F97316]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-medium text-white tracking-tight">Reliability harness</h1>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                                admin: {adminEmail ?? 'unknown'} · 5 checks · uses /chat tool paths
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={runAll}
                        disabled={running}
                        className="h-10 px-4 rounded-xl bg-[#F97316] hover:bg-[#F97316]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold uppercase tracking-widest transition-all"
                    >
                        {running ? 'Running…' : 'Run all checks'}
                    </button>
                </div>

                <div className="mb-6 grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-foreground/[0.04] border border-foreground/10">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Pass</p>
                        <p className="text-xl text-emerald-400 font-medium mt-1">{passCount}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-foreground/[0.04] border border-foreground/10">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Fail</p>
                        <p className="text-xl text-red-400 font-medium mt-1">{failCount}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-foreground/[0.04] border border-foreground/10">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Total</p>
                        <p className="text-xl text-white font-medium mt-1">{CHECKS.length}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    {CHECKS.map(check => {
                        const r = results[check.id];
                        const icon = r.status === 'pass'
                            ? <CheckCircle2 size={16} className="text-emerald-400" />
                            : r.status === 'fail'
                                ? <XCircle size={16} className="text-red-400" />
                                : r.status === 'running'
                                    ? <Loader2 size={16} className="text-[#F97316] animate-spin" />
                                    : <div className="w-4 h-4 rounded-full border border-white/20" />;
                        return (
                            <div key={check.id} className="p-4 rounded-xl bg-foreground/[0.04] border border-foreground/10">
                                <div className="flex items-center gap-3 mb-1">
                                    {icon}
                                    <p className="text-sm font-mono text-white">{check.label}</p>
                                    {r.result ? (
                                        <span className="text-[10px] font-mono text-gray-500">HTTP {r.result.httpStatus}</span>
                                    ) : null}
                                </div>
                                <p className="text-[11px] text-gray-500 pl-7">{check.description}</p>
                                {r.result ? (
                                    <div className="mt-2 pl-7 flex items-center justify-between gap-3">
                                        <p className="text-xs text-gray-300 truncate">
                                            {r.result.nextAction}
                                            {r.result.detail && r.result.detail !== '(no body)' ? (
                                                <span className="text-gray-500"> · {r.result.detail}</span>
                                            ) : null}
                                        </p>
                                        {r.result.requestId ? (
                                            <button
                                                onClick={() => copyRef(r.result!.requestId!)}
                                                className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono text-gray-400 hover:text-white border border-foreground/10 hover:bg-foreground/[0.08] transition-all"
                                            >
                                                <Copy size={10} /> Ref
                                            </button>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>

                <p className="mt-6 text-[10px] font-mono text-gray-600 text-center">
                    Admin-gated. 402/403 on writes are expected, they prove x402 + google-connect gates fire.
                </p>
            </div>
        </div>
    );
}
