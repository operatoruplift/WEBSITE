'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Target, Sparkles, Flame, CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import type { GoalWithMetrics } from '@/lib/goals/types';

/**
 * /goals dashboard surface, Phase 8 of the Gamify Your Growth pivot.
 *
 * This iteration is fully wired:
 *   - Mount: GET /api/goals returns the user's active goals with
 *     computed streak + last-7 check-ins per goal.
 *   - Submit: POST /api/goals creates a goal and prepends it locally.
 *   - Check in: POST /api/goals/[id]/checkin records today's progress
 *     and refetches so the streak reflects it.
 *
 * The page is honest about the dashboard's beta status (the AI
 * questline generation lives in a later iteration; today every new
 * goal gets a sensible fallback questline from lib/goals/db.ts).
 */

interface GoalsResponse {
    goals: GoalWithMetrics[];
}

export default function GoalsPage() {
    const [goals, setGoals] = useState<GoalWithMetrics[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [stakes, setStakes] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const refresh = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch('/api/goals');
            if (res.status === 401) {
                setGoals([]);
                setLoading(false);
                return;
            }
            if (!res.ok) {
                setError('Could not load your goals. Try again in a moment.');
                setLoading(false);
                return;
            }
            const data = (await res.json()) as GoalsResponse;
            setGoals(data.goals ?? []);
            setLoading(false);
        } catch {
            setError('Network error. Check your connection and try again.');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    stakes: stakes.trim() || undefined,
                    target_date: targetDate || undefined,
                }),
            });
            if (!res.ok) {
                const body = await safeJson(res);
                setError(body?.message || 'Could not save the goal. Try again.');
                setSubmitting(false);
                return;
            }
            setTitle('');
            setStakes('');
            setTargetDate('');
            await refresh();
        } catch {
            setError('Network error. Try again in a moment.');
        } finally {
            setSubmitting(false);
        }
    };

    const checkIn = async (goalId: string) => {
        try {
            const res = await fetch(`/api/goals/${goalId}/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'done' }),
            });
            if (!res.ok) {
                setError('Could not record your check-in. Try again.');
                return;
            }
            await refresh();
        } catch {
            setError('Network error on check-in.');
        }
    };

    return (
        <div className="theme-light min-h-screen bg-background text-foreground px-6 md:px-12 pt-10 pb-24">
            <div className="max-w-[1100px] mx-auto">
                {/* Header */}
                <header className="mb-10">
                    <div className="inline-flex items-center gap-3 mb-3">
                        <span className="text-xs font-mono font-bold tracking-[0.12em] text-[#F97316] uppercase">// commitments</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-medium text-foreground tracking-tight leading-[1.1]">
                        Keep your word. <span className="text-[#F97316]">Bet on yourself.</span>
                    </h1>
                    <p className="text-muted leading-relaxed mt-3 max-w-2xl">
                        Declare what you will do. Stake real money on it later. Get daily check-ins judged by an AI Game Master. See progress you cannot fake.
                    </p>
                </header>

                {/* Beta banner: honest about what ships today. */}
                <div className="mb-10 rounded-xl border border-[#F97316]/30 bg-[#F97316]/[0.05] px-5 py-4 flex items-start gap-3">
                    <Sparkles aria-hidden className="w-5 h-5 text-[#F97316] mt-0.5 shrink-0" />
                    <div className="text-sm text-foreground/90 leading-relaxed">
                        <strong>Private beta.</strong> Every new commitment gets an AI-built questline today. Money stakes (USDC + card), witness accountability, and on-chain settlement land in the next releases. <Link href="/waitlist" className="text-[#F97316] underline hover:no-underline">Join the waitlist for early access.</Link>
                    </div>
                </div>

                {error && (
                    <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/[0.05] px-5 py-4 flex items-start gap-3">
                        <AlertCircle aria-hidden className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                        <div className="text-sm text-foreground/90">{error}</div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* New commitment form */}
                    <section aria-labelledby="new-goal-heading" className="lg:col-span-1">
                        <div className="rounded-2xl border border-foreground/10 bg-card p-6">
                            <h2 id="new-goal-heading" className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                                <Target aria-hidden className="w-4 h-4 text-[#F97316]" />
                                Declare a commitment
                            </h2>
                            <p className="text-xs text-muted mb-5 leading-relaxed">
                                Write it in your own words. Specific enough that "did I do it?" is a yes or no.
                            </p>
                            <form onSubmit={submit} className="flex flex-col gap-4">
                                <div>
                                    <label htmlFor="goal-title" className="block text-xs font-mono font-bold tracking-[0.12em] uppercase text-foreground/70 mb-1.5">
                                        // commitment
                                    </label>
                                    <input
                                        id="goal-title"
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Run 4 times per week for the next 8 weeks"
                                        required
                                        disabled={submitting}
                                        className="w-full rounded-lg border border-foreground/10 bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus:outline-none focus:border-[#F97316]/50 focus:ring-1 focus:ring-[#F97316]/30 disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="goal-stakes" className="block text-xs font-mono font-bold tracking-[0.12em] uppercase text-foreground/70 mb-1.5">
                                        // stakes (optional, money stakes ship next release)
                                    </label>
                                    <input
                                        id="goal-stakes"
                                        type="text"
                                        value={stakes}
                                        onChange={(e) => setStakes(e.target.value)}
                                        placeholder="$50 to @maya if I miss a week"
                                        disabled={submitting}
                                        className="w-full rounded-lg border border-foreground/10 bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus:outline-none focus:border-[#F97316]/50 focus:ring-1 focus:ring-[#F97316]/30 disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="goal-target" className="block text-xs font-mono font-bold tracking-[0.12em] uppercase text-foreground/70 mb-1.5">
                                        // target date (optional)
                                    </label>
                                    <input
                                        id="goal-target"
                                        type="date"
                                        value={targetDate}
                                        onChange={(e) => setTargetDate(e.target.value)}
                                        disabled={submitting}
                                        className="w-full rounded-lg border border-foreground/10 bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-[#F97316]/50 focus:ring-1 focus:ring-[#F97316]/30 disabled:opacity-50"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!title.trim() || submitting}
                                    className="inline-flex items-center justify-center px-5 py-2.5 bg-[#F97316] text-white font-bold text-xs rounded-lg uppercase tracking-widest hover:bg-[#F97316]/90 transition-colors shadow-[0_0_20px_rgba(249,115,22,0.25)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 aria-hidden className="mr-2 w-3.5 h-3.5 animate-spin" />
                                            Saving
                                        </>
                                    ) : (
                                        <>
                                            Declare it
                                            <ArrowRight aria-hidden className="ml-2 w-3.5 h-3.5" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </section>

                    {/* Commitment list */}
                    <section aria-labelledby="goal-list-heading" className="lg:col-span-2">
                        <h2 id="goal-list-heading" className="text-xs font-mono font-bold tracking-[0.12em] uppercase text-foreground/60 mb-4">
                            // your commitments
                        </h2>
                        {loading ? (
                            <div className="rounded-2xl border border-dashed border-foreground/15 bg-foreground/[0.02] p-10 text-center" role="status" aria-live="polite">
                                <Loader2 aria-hidden className="w-6 h-6 text-foreground/40 mx-auto mb-3 animate-spin" />
                                <p className="text-sm text-muted">Loading your commitments.</p>
                            </div>
                        ) : goals.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-foreground/15 bg-foreground/[0.02] p-10 text-center">
                                <Flame aria-hidden className="w-8 h-8 text-foreground/30 mx-auto mb-3" />
                                <p className="text-sm text-muted leading-relaxed max-w-md mx-auto">
                                    No commitments yet. Declare one on the left and it lands here.
                                </p>
                            </div>
                        ) : (
                            <ul className="space-y-3 list-none p-0">
                                {goals.map((g) => (
                                    <li key={g.id} className="rounded-2xl border border-foreground/10 bg-card p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 shrink-0 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center">
                                                <CheckCircle2 aria-hidden className="w-5 h-5 text-[#F97316]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3 mb-1">
                                                    <Link href={`/goals/${g.id}`} className="text-base font-semibold text-foreground hover:text-[#F97316] transition-colors">
                                                        {g.title}
                                                    </Link>
                                                    <div className="shrink-0 flex items-center gap-2">
                                                        {hasCheckinToday(g) && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold tracking-widest uppercase text-emerald-700">
                                                                <CheckCircle2 aria-hidden className="w-3 h-3" />
                                                                Today
                                                            </span>
                                                        )}
                                                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#F97316]/10 border border-[#F97316]/20 text-[10px] font-bold tracking-widest uppercase text-[#F97316]">
                                                            <Flame aria-hidden className="w-3 h-3" />
                                                            {g.streak} day{g.streak === 1 ? '' : 's'}
                                                        </div>
                                                    </div>
                                                </div>
                                                {g.stakes && (
                                                    <p className="text-sm text-muted mb-1">
                                                        <span className="text-[10px] font-bold tracking-widest uppercase text-foreground/60 mr-2">Stakes</span>
                                                        {g.stakes}
                                                    </p>
                                                )}
                                                {g.target_date && (
                                                    <p className="text-xs text-muted mb-3">
                                                        <span className="font-bold tracking-widest uppercase text-foreground/60 mr-2">Target</span>
                                                        {g.target_date}
                                                    </p>
                                                )}
                                                {g.questline && g.questline.length > 0 && (
                                                    <div className="mt-3 mb-3">
                                                        <p className="text-[10px] font-bold tracking-widest uppercase text-foreground/60 mb-1.5">Questline</p>
                                                        <ol className="space-y-1 list-none p-0">
                                                            {g.questline.slice(0, 4).map((step, idx) => (
                                                                <li key={idx} className="flex items-baseline gap-2 text-xs">
                                                                    <span className="text-[10px] font-mono font-bold text-[#F97316]/70 shrink-0 tabular-nums">D{step.day}</span>
                                                                    <span className="text-foreground/80">{step.action}</span>
                                                                </li>
                                                            ))}
                                                        </ol>
                                                    </div>
                                                )}
                                                <div className="mt-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => checkIn(g.id)}
                                                        className="inline-flex items-center px-3.5 py-2 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 text-foreground/80 font-bold text-[11px] rounded-lg uppercase tracking-widest transition-colors"
                                                    >
                                                        Check in today
                                                        <CheckCircle2 aria-hidden className="ml-1.5 w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

async function safeJson(res: Response): Promise<{ message?: string } | null> {
    try {
        return await res.json();
    } catch {
        return null;
    }
}

/** True when the goal has a non-skipped check-in for the local today. */
function hasCheckinToday(goal: GoalWithMetrics): boolean {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    return goal.recent_checkins.some(
        (c) => c.checkin_date === todayStr && c.status !== 'skipped',
    );
}
