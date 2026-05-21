'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Target, Sparkles, Flame, CheckCircle2, ArrowRight } from 'lucide-react';

/**
 * /goals dashboard surface, Phase 8 of the Gamify Your Growth pivot.
 *
 * This is the first iteration. It renders the dashboard shape so the
 * design lands honestly before the backend lands, then the backend
 * fills in the data. Today the page intentionally:
 *
 *   - Shows an empty state with the goal-creation form
 *   - Does NOT call any API (the routes do not exist yet)
 *   - Tells the operator exactly what is shipping today and what is
 *     not, so we never claim a feature that does not work yet
 *
 * When the POST /api/goals route lands, the form's submit handler
 * swaps from local-only "added" to a real network call. The shape
 * of the form fields already matches lib/goals/types.ts::CreateGoalInput.
 */

interface PreviewGoal {
    title: string;
    stakes?: string;
    target_date?: string;
}

export default function GoalsPage() {
    const [goals, setGoals] = useState<PreviewGoal[]>([]);
    const [title, setTitle] = useState('');
    const [stakes, setStakes] = useState('');
    const [targetDate, setTargetDate] = useState('');

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        // First iteration: hold the goal in component state only.
        // The next iteration wires POST /api/goals here.
        setGoals((prev) => [
            ...prev,
            {
                title: title.trim(),
                stakes: stakes.trim() || undefined,
                target_date: targetDate || undefined,
            },
        ]);
        setTitle('');
        setStakes('');
        setTargetDate('');
    };

    return (
        <div className="theme-light min-h-screen bg-background text-foreground px-6 md:px-12 pt-10 pb-24">
            <div className="max-w-[1100px] mx-auto">
                {/* Header */}
                <header className="mb-10">
                    <div className="inline-flex items-center gap-3 mb-3">
                        <span className="h-px w-12 bg-[#F97316]/40" aria-hidden />
                        <span className="text-xs font-bold tracking-[0.25em] text-[#F97316] uppercase">Goals</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-medium text-foreground tracking-tight leading-[1.1]">
                        Keep your word. Bet on yourself.
                    </h1>
                    <p className="text-muted leading-relaxed mt-3 max-w-2xl">
                        Name an ambition. Tomorrow morning a small daily action will be waiting for you. Build a streak. Adjust as you learn.
                    </p>
                </header>

                {/* Beta banner: honest about what ships today. */}
                <div className="mb-10 rounded-xl border border-[#F97316]/30 bg-[#F97316]/[0.05] px-5 py-4 flex items-start gap-3">
                    <Sparkles aria-hidden className="w-5 h-5 text-[#F97316] mt-0.5 shrink-0" />
                    <div className="text-sm text-foreground/90 leading-relaxed">
                        <strong>Private beta.</strong> The form below saves your goal locally so you can see how the dashboard will feel; the AI questline + daily check-ins land in the next release. Want early access? <Link href="/waitlist" className="text-[#F97316] underline hover:no-underline">Join the waitlist.</Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* New goal form */}
                    <section aria-labelledby="new-goal-heading" className="lg:col-span-1">
                        <div className="rounded-2xl border border-foreground/10 bg-card p-6">
                            <h2 id="new-goal-heading" className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                                <Target aria-hidden className="w-4 h-4 text-[#F97316]" />
                                Name a goal
                            </h2>
                            <p className="text-xs text-muted mb-5 leading-relaxed">
                                Anything you keep saying you will start. Specific is better than vague.
                            </p>
                            <form onSubmit={submit} className="flex flex-col gap-4">
                                <div>
                                    <label htmlFor="goal-title" className="block text-xs font-bold tracking-widest uppercase text-foreground/70 mb-1.5">
                                        Goal
                                    </label>
                                    <input
                                        id="goal-title"
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Run a half marathon"
                                        required
                                        className="w-full rounded-lg border border-foreground/10 bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus:outline-none focus:border-[#F97316]/50 focus:ring-1 focus:ring-[#F97316]/30"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="goal-stakes" className="block text-xs font-bold tracking-widest uppercase text-foreground/70 mb-1.5">
                                        Stakes (optional)
                                    </label>
                                    <input
                                        id="goal-stakes"
                                        type="text"
                                        value={stakes}
                                        onChange={(e) => setStakes(e.target.value)}
                                        placeholder="$20 to a friend if I miss a week"
                                        className="w-full rounded-lg border border-foreground/10 bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus:outline-none focus:border-[#F97316]/50 focus:ring-1 focus:ring-[#F97316]/30"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="goal-target" className="block text-xs font-bold tracking-widest uppercase text-foreground/70 mb-1.5">
                                        Target date (optional)
                                    </label>
                                    <input
                                        id="goal-target"
                                        type="date"
                                        value={targetDate}
                                        onChange={(e) => setTargetDate(e.target.value)}
                                        className="w-full rounded-lg border border-foreground/10 bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-[#F97316]/50 focus:ring-1 focus:ring-[#F97316]/30"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!title.trim()}
                                    className="inline-flex items-center justify-center px-5 py-2.5 bg-[#F97316] text-white font-bold text-xs rounded-lg uppercase tracking-widest hover:bg-[#F97316]/90 transition-colors shadow-[0_0_20px_rgba(249,115,22,0.25)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    Add goal
                                    <ArrowRight aria-hidden className="ml-2 w-3.5 h-3.5" />
                                </button>
                            </form>
                        </div>
                    </section>

                    {/* Goal list */}
                    <section aria-labelledby="goal-list-heading" className="lg:col-span-2">
                        <h2 id="goal-list-heading" className="text-xs font-bold tracking-[0.25em] uppercase text-foreground/60 mb-4">
                            Your goals
                        </h2>
                        {goals.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-foreground/15 bg-foreground/[0.02] p-10 text-center">
                                <Flame aria-hidden className="w-8 h-8 text-foreground/30 mx-auto mb-3" />
                                <p className="text-sm text-muted leading-relaxed max-w-md mx-auto">
                                    No goals yet. Name one on the left and it lands here.
                                </p>
                            </div>
                        ) : (
                            <ul className="space-y-3 list-none p-0">
                                {goals.map((g, i) => (
                                    <li key={i} className="rounded-2xl border border-foreground/10 bg-card p-5 flex items-start gap-4">
                                        <div className="w-10 h-10 shrink-0 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center">
                                            <CheckCircle2 aria-hidden className="w-5 h-5 text-[#F97316]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-semibold text-foreground mb-1">{g.title}</h3>
                                            {g.stakes && (
                                                <p className="text-sm text-muted mb-1">
                                                    <span className="text-[10px] font-bold tracking-widest uppercase text-foreground/60 mr-2">Stakes</span>
                                                    {g.stakes}
                                                </p>
                                            )}
                                            {g.target_date && (
                                                <p className="text-xs text-muted">
                                                    <span className="font-bold tracking-widest uppercase text-foreground/60 mr-2">Target</span>
                                                    {g.target_date}
                                                </p>
                                            )}
                                            <div className="mt-2 text-[11px] text-foreground/50">
                                                Daily questline lands in the next release.
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
