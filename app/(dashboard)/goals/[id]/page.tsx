'use client';

import React, { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Flame, CheckCircle2, AlertCircle, Loader2, Pause, Play, X, Trophy, RefreshCw } from 'lucide-react';
import type { GoalWithMetrics, GoalStatus } from '@/lib/goals/types';

/**
 * Goal detail page. Shows the full AI-generated questline, every
 * check-in (most-recent first), and lets the operator change the
 * status (active / paused / completed / abandoned).
 */

interface DetailResponse {
    goal: GoalWithMetrics;
}

export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [goal, setGoal] = useState<GoalWithMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const refresh = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch(`/api/goals/${id}`);
            if (res.status === 404) {
                setError('That goal does not exist or is not yours.');
                setLoading(false);
                return;
            }
            if (!res.ok) {
                setError('Could not load the goal. Try again.');
                setLoading(false);
                return;
            }
            const data = (await res.json()) as DetailResponse;
            setGoal(data.goal);
            setLoading(false);
        } catch {
            setError('Network error. Check your connection and try again.');
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const checkIn = async () => {
        if (busy || !goal) return;
        setBusy(true);
        try {
            await fetch(`/api/goals/${id}/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'done' }),
            });
            await refresh();
        } finally {
            setBusy(false);
        }
    };

    const setStatus = async (status: GoalStatus) => {
        if (busy || !goal) return;
        setBusy(true);
        try {
            await fetch(`/api/goals/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            await refresh();
        } finally {
            setBusy(false);
        }
    };

    const regenerate = async () => {
        if (busy || !goal) return;
        if (!confirm('Ask the AI for a different questline? This replaces the current plan.')) return;
        setBusy(true);
        try {
            const res = await fetch(`/api/goals/${id}/regenerate`, { method: 'POST' });
            if (!res.ok) {
                setError('Could not regenerate the questline. Try again in a moment.');
                return;
            }
            await refresh();
        } catch {
            setError('Network error during regenerate.');
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="theme-light min-h-screen bg-background flex items-center justify-center">
                <Loader2 aria-hidden className="w-6 h-6 text-foreground/40 animate-spin" />
            </div>
        );
    }

    if (error || !goal) {
        return (
            <div className="theme-light min-h-screen bg-background text-foreground px-6 md:px-12 pt-10 pb-24">
                <div className="max-w-2xl mx-auto">
                    <Link href="/goals" className="inline-flex items-center text-xs font-bold tracking-widest uppercase text-foreground/60 hover:text-foreground mb-6">
                        <ArrowLeft aria-hidden className="w-3.5 h-3.5 mr-1.5" />
                        Back to goals
                    </Link>
                    <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/[0.05] px-5 py-4 flex items-start gap-3">
                        <AlertCircle aria-hidden className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                        <div className="text-sm text-foreground/90">{error ?? 'Goal not found.'}</div>
                    </div>
                </div>
            </div>
        );
    }

    const isActive = goal.status === 'active';
    const isPaused = goal.status === 'paused';
    const isClosed = goal.status === 'completed' || goal.status === 'abandoned';

    return (
        <div className="theme-light min-h-screen bg-background text-foreground px-6 md:px-12 pt-10 pb-24">
            <div className="max-w-[900px] mx-auto">
                <Link href="/goals" className="inline-flex items-center text-xs font-bold tracking-widest uppercase text-foreground/60 hover:text-foreground mb-6">
                    <ArrowLeft aria-hidden className="w-3.5 h-3.5 mr-1.5" />
                    Back to goals
                </Link>

                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <h1 className="text-2xl md:text-3xl font-medium text-foreground tracking-tight leading-tight">
                            {goal.title}
                        </h1>
                        <StatusBadge status={goal.status} />
                    </div>
                    {goal.stakes && (
                        <p className="text-sm text-muted mb-1">
                            <span className="text-[10px] font-bold tracking-widest uppercase text-foreground/60 mr-2">Stakes</span>
                            {goal.stakes}
                        </p>
                    )}
                    {goal.target_date && (
                        <p className="text-xs text-muted">
                            <span className="font-bold tracking-widest uppercase text-foreground/60 mr-2">Target</span>
                            {goal.target_date}
                        </p>
                    )}
                </header>

                {/* Stats strip */}
                <div className="mb-8 grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-[#F97316]/20 bg-[#F97316]/[0.04] p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Flame aria-hidden className="w-4 h-4 text-[#F97316]" />
                            <span className="text-[10px] font-bold tracking-widest uppercase text-foreground/60">Streak</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{goal.streak} <span className="text-sm text-muted font-medium">day{goal.streak === 1 ? '' : 's'}</span></p>
                    </div>
                    <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 aria-hidden className="w-4 h-4 text-foreground/60" />
                            <span className="text-[10px] font-bold tracking-widest uppercase text-foreground/60">Check-ins</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{goal.recent_checkins.length}</p>
                    </div>
                    <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 hidden md:block">
                        <div className="flex items-center gap-2 mb-1">
                            <Trophy aria-hidden className="w-4 h-4 text-foreground/60" />
                            <span className="text-[10px] font-bold tracking-widest uppercase text-foreground/60">Started</span>
                        </div>
                        <p className="text-sm font-bold text-foreground">{formatDate(goal.created_at)}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="mb-10 flex flex-wrap gap-2">
                    {isActive && (
                        <button
                            type="button"
                            onClick={checkIn}
                            disabled={busy}
                            className="inline-flex items-center px-4 py-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white font-bold text-xs rounded-lg uppercase tracking-widest transition-colors shadow-[0_0_20px_rgba(249,115,22,0.25)] disabled:opacity-50"
                        >
                            Check in today
                            <CheckCircle2 aria-hidden className="ml-1.5 w-3.5 h-3.5" />
                        </button>
                    )}
                    {isActive && (
                        <button
                            type="button"
                            onClick={() => setStatus('paused')}
                            disabled={busy}
                            className="inline-flex items-center px-4 py-2 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 text-foreground/80 font-bold text-xs rounded-lg uppercase tracking-widest transition-colors disabled:opacity-50"
                        >
                            <Pause aria-hidden className="mr-1.5 w-3.5 h-3.5" />
                            Pause
                        </button>
                    )}
                    {isPaused && (
                        <button
                            type="button"
                            onClick={() => setStatus('active')}
                            disabled={busy}
                            className="inline-flex items-center px-4 py-2 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 text-foreground/80 font-bold text-xs rounded-lg uppercase tracking-widest transition-colors disabled:opacity-50"
                        >
                            <Play aria-hidden className="mr-1.5 w-3.5 h-3.5" />
                            Resume
                        </button>
                    )}
                    {!isClosed && (
                        <button
                            type="button"
                            onClick={() => setStatus('completed')}
                            disabled={busy}
                            className="inline-flex items-center px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 font-bold text-xs rounded-lg uppercase tracking-widest transition-colors disabled:opacity-50"
                        >
                            <Trophy aria-hidden className="mr-1.5 w-3.5 h-3.5" />
                            Mark complete
                        </button>
                    )}
                    {!isClosed && (
                        <button
                            type="button"
                            onClick={() => setStatus('abandoned')}
                            disabled={busy}
                            className="inline-flex items-center px-4 py-2 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 text-foreground/80 font-bold text-xs rounded-lg uppercase tracking-widest transition-colors disabled:opacity-50"
                        >
                            <X aria-hidden className="mr-1.5 w-3.5 h-3.5" />
                            Abandon
                        </button>
                    )}
                </div>

                {/* Questline */}
                {goal.questline.length > 0 && (
                    <section className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-foreground/60">Questline</h2>
                            {!isClosed && (
                                <button
                                    type="button"
                                    onClick={regenerate}
                                    disabled={busy}
                                    className="inline-flex items-center px-3 py-1.5 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 text-foreground/70 font-bold text-[10px] rounded-lg uppercase tracking-widest transition-colors disabled:opacity-50"
                                    title="Ask the AI for a different plan"
                                >
                                    <RefreshCw aria-hidden className={`mr-1.5 w-3 h-3 ${busy ? 'animate-spin' : ''}`} />
                                    Regenerate
                                </button>
                            )}
                        </div>
                        <ol className="space-y-2 list-none p-0">
                            {goal.questline.map((step, i) => (
                                <li key={i} className="rounded-lg border border-foreground/10 bg-card p-4">
                                    <div className="flex items-baseline gap-3 mb-1">
                                        <span className="text-[10px] font-mono font-bold text-[#F97316]/80 shrink-0 tabular-nums">DAY {step.day}</span>
                                        <span className="text-sm font-semibold text-foreground">{step.action}</span>
                                    </div>
                                    {step.notes && <p className="text-xs text-muted ml-12">{step.notes}</p>}
                                </li>
                            ))}
                        </ol>
                    </section>
                )}

                {/* Check-ins */}
                <section>
                    <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-foreground/60 mb-4">Recent check-ins</h2>
                    {goal.recent_checkins.length === 0 ? (
                        <p className="text-sm text-muted">No check-ins yet. Tap "Check in today" once you take today's action.</p>
                    ) : (
                        <ul className="space-y-2 list-none p-0">
                            {goal.recent_checkins.map((c) => (
                                <li key={c.id} className="rounded-lg border border-foreground/10 bg-foreground/[0.02] p-3 flex items-center justify-between text-sm">
                                    <span className="font-mono text-foreground/80">{c.checkin_date}</span>
                                    <span className={
                                        c.status === 'done'
                                            ? 'text-[10px] font-bold tracking-widest uppercase text-emerald-600'
                                            : c.status === 'partial'
                                                ? 'text-[10px] font-bold tracking-widest uppercase text-amber-600'
                                                : 'text-[10px] font-bold tracking-widest uppercase text-foreground/40'
                                    }>
                                        {c.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: GoalStatus }) {
    const styles: Record<GoalStatus, string> = {
        active: 'bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316]',
        paused: 'bg-foreground/5 border-foreground/20 text-foreground/60',
        completed: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700',
        abandoned: 'bg-foreground/5 border-foreground/20 text-foreground/40',
    };
    return (
        <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-widest uppercase ${styles[status]}`}>
            {status}
        </span>
    );
}

function formatDate(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return iso;
    }
}
