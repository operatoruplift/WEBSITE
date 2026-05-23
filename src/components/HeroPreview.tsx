'use client';

import React from 'react';

/**
 * HeroPreview, a static commitment-card UI snapshot rendered
 * directly under the hero CTAs. PR #726 removed the cycling
 * terminal/iMessage chat mock per founder feedback. The hero now
 * needs a visual that shows what the actual product looks like
 * without animating distractingly.
 *
 * Design language: glassmorphism panel on the dark background,
 * editorial mono labels, the orange accent reserved for the
 * "active" commitment and the staked amount. No motion, no
 * dependencies, no canvas. Reads as a single deliberate frame
 * that a journalist or judge can screenshot.
 *
 * The card mirrors the AppSection "Today" phone screen but at
 * desktop scale, so the visual narrative from hero -> AppSection
 * builds rather than competes.
 */
const HeroPreview: React.FC = () => {
    return (
        <div className="relative w-full max-w-[920px] mx-auto">
            {/* Soft accent halo behind the card. */}
            <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 blur-3xl opacity-60"
                style={{
                    background:
                        'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(240, 138, 76, 0.18), transparent 70%)',
                }}
            />
            <div
                className="relative border border-foreground/[0.12] bg-foreground/[0.02] backdrop-blur-sm"
                style={{
                    borderRadius: '24px',
                    boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset',
                }}
            >
                {/* Top chrome bar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-foreground/[0.08]">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-foreground/15" />
                        <span className="w-2.5 h-2.5 rounded-full bg-foreground/15" />
                        <span className="w-2.5 h-2.5 rounded-full bg-foreground/15" />
                    </div>
                    <span className="font-mono text-[11px] tracking-[0.16em] text-muted/80 uppercase">
                        operatoruplift.com / today
                    </span>
                    <span className="font-mono text-[11px] text-muted/60">v.01</span>
                </div>

                {/* Body */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 md:gap-8 p-6 md:p-8">
                    {/* Left: live commitment card */}
                    <article className="flex flex-col gap-5 p-6 border border-primary/35 bg-primary/[0.04]" style={{ borderRadius: '16px' }}>
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">
                                Active commitment
                            </span>
                            <span className="inline-flex items-center gap-2 font-mono text-[11px] text-primary">
                                <span className="relative flex w-1.5 h-1.5">
                                    <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-75 animate-ping" />
                                    <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-primary" />
                                </span>
                                Day 3 of 7
                            </span>
                        </div>
                        <h3 className="text-[22px] md:text-[26px] font-medium text-foreground tracking-[-0.02em] leading-tight">
                            Run 4× this week.
                        </h3>
                        <div className="grid grid-cols-3 gap-3 text-left">
                            <Stat label="Stake" value="$50" accent />
                            <Stat label="Witnesses" value="3" />
                            <Stat label="Streak" value="12d" />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                            <Pill>photo · GPS · timestamp</Pill>
                            <Pill>AI Game Master verifies</Pill>
                        </div>
                        <button
                            type="button"
                            disabled
                            aria-label="Check-in action - illustrative preview only"
                            className="mt-3 inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-[#0A0A0B] font-mono text-sm font-semibold tracking-[0.02em] border border-primary"
                            style={{ cursor: 'default' }}
                        >
                            Check in for today
                            <span aria-hidden="true">→</span>
                        </button>
                    </article>

                    {/* Right: progress strip */}
                    <aside className="flex flex-col gap-4">
                        <div>
                            <span className="font-mono text-[10px] tracking-[0.18em] text-muted/80 uppercase">
                                Last 14 days
                            </span>
                            <div className="mt-3 flex items-end gap-[3px] h-14" aria-hidden="true">
                                {[40, 55, 30, 70, 60, 80, 45, 95, 70, 85, 60, 75, 90, 80].map((h, i) => (
                                    <span
                                        key={i}
                                        className={`flex-1 ${i >= 11 ? 'bg-primary' : 'bg-foreground/30'}`}
                                        style={{ height: `${h}%`, borderRadius: '2px' }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <Stat label="Honored" value="85%" />
                            <Stat label="Forfeit" value="$0" />
                            <Stat label="Pool" value="+$12" accent />
                        </div>
                        <div className="text-[12px] text-muted/80 leading-relaxed">
                            On-chain anchored. Verifiable record clients can audit. No streaks reset in private.
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] tracking-[0.16em] text-muted/80 uppercase">
                {label}
            </span>
            <span
                className={[
                    'text-[18px] md:text-[20px] font-medium tracking-[-0.02em]',
                    accent ? 'text-primary' : 'text-foreground',
                ].join(' ')}
            >
                {value}
            </span>
        </div>
    );
}

function Pill({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-2 px-2.5 py-1 border border-foreground/[0.14] bg-foreground/[0.02] font-mono text-[11px] text-muted/85 tracking-[0.02em]">
            {children}
        </span>
    );
}

export default HeroPreview;
