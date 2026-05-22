'use client';

import React from 'react';
import { FadeIn } from '@/src/components/Animators';
import { SectionHeader } from '@/src/components/SectionHeader';

/**
 * Comparison section, v10 reframe (Commitment Infrastructure).
 *
 * The pre-pivot table compared Operator Uplift to four niche AI
 * agent platforms (Zo / Poke / Hermes / OpenClaw) across eleven
 * agent-platform features (tap-to-approve, signed receipts, Gmail
 * OAuth, etc.). That table answered the wrong question for the
 * commitment-infrastructure pitch: it positioned Operator Uplift
 * inside an AI-agent market it has retired.
 *
 * Pitch deck v10 slide 9 ("BEYOND THE HONOR SYSTEM") frames the
 * comparison around the underlying accountability mechanism, not
 * a feature checklist. The three columns are the three honest
 * archetypes a high-intent operator considers:
 *
 *   Passive apps   push-notification-driven habit trackers, journals
 *   Legacy stakes  beeminder, stickK, manual referees
 *   Operator Uplift  AI Game Master + on-chain slashing
 *
 * Four rows: Mechanism, Verification, Consequence, Result. Each
 * is the deck's own wording so a judge looking at the deck and a
 * visitor looking at the live site read the same comparison.
 */

interface Column {
    key: 'passive' | 'legacy' | 'uplift';
    label: string;
    sub: string;
    highlight?: boolean;
}

const COLUMNS: Column[] = [
    { key: 'passive', label: 'Passive apps', sub: 'streak counters + push' },
    { key: 'legacy', label: 'Legacy stakes', sub: 'pledges + referees' },
    { key: 'uplift', label: 'Operator Uplift', sub: 'commitment infrastructure', highlight: true },
];

interface Row {
    eyebrow: string;
    passive: string;
    legacy: string;
    uplift: string;
}

const ROWS: Row[] = [
    {
        eyebrow: 'Mechanism',
        passive: 'Push notifications',
        legacy: 'Manual pledges',
        uplift: 'Financial loss aversion',
    },
    {
        eyebrow: 'Verification',
        passive: 'Honor system',
        legacy: 'Honor system or referees',
        uplift: 'AI Game Master',
    },
    {
        eyebrow: 'Consequence',
        passive: 'Broken streak',
        legacy: 'Manual card charge',
        uplift: 'Automated on-chain slash',
    },
    {
        eyebrow: 'Result',
        passive: 'High churn',
        legacy: 'High friction, niche',
        uplift: 'Forced follow-through',
    },
];

const Comparison: React.FC = () => {
    return (
        <section aria-labelledby="comparison-heading" className="w-full bg-background px-6 md:px-12 flex justify-center aurora-section">
            <div className="w-full max-w-[1100px] py-14 md:py-20 flex flex-col items-center gap-12">
                <SectionHeader
                    headingId="comparison-heading"
                    align="left"
                    numberPrefix="05"
                    eyebrow="Beyond the honor system"
                    title="Three ways to keep your word. One that works."
                    description="Passive apps trust you to self-report. Legacy stakes trust a referee and a card charge. Operator Uplift uses an AI Game Master and automated on-chain settlement. Pick your mechanism honestly."
                />

                {/* Mobile: stacked column layout. Desktop: 4-row x 3-column
                    table. Each row's eyebrow runs down the left edge so the
                    operator can scan vertically per mechanism (just like
                    the deck slide). */}
                <FadeIn delay={200} className="w-full block">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                        {COLUMNS.map((col) => (
                            <div
                                key={col.key}
                                className={`rounded-2xl border p-5 md:p-6 flex flex-col gap-4 ${
                                    col.highlight
                                        ? 'border-[#F97316]/40 bg-[#F97316]/[0.05] shadow-[0_0_24px_rgba(249,115,22,0.10)]'
                                        : 'border-foreground/10 bg-card/60'
                                }`}
                            >
                                <div className="border-b border-foreground/10 pb-3">
                                    <div
                                        className={`text-[10px] font-mono font-bold tracking-[0.12em] uppercase ${
                                            col.highlight ? 'text-[#F97316]' : 'text-foreground/50'
                                        }`}
                                    >
                                        // {col.sub}
                                    </div>
                                    <div className={`mt-1 text-base font-semibold ${col.highlight ? 'text-foreground' : 'text-foreground/80'}`}>
                                        {col.label}
                                    </div>
                                </div>
                                <ul className="flex flex-col gap-3 list-none p-0">
                                    {ROWS.map((row) => {
                                        const value = row[col.key];
                                        return (
                                            <li key={row.eyebrow}>
                                                <div className="text-[10px] font-mono font-bold tracking-[0.12em] uppercase text-foreground/50 mb-1">
                                                    {row.eyebrow}
                                                </div>
                                                <div
                                                    className={`text-sm leading-snug ${
                                                        col.highlight ? 'text-foreground' : 'text-foreground/75'
                                                    }`}
                                                >
                                                    {value}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-muted text-center mt-6 font-mono">
                        // The honor system is dead. We sell the system that replaces it.
                    </p>
                </FadeIn>
            </div>
        </section>
    );
};

export default Comparison;
