'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

const PHASES = [
    {
        step: '01',
        id: 'commit' as const,
        label: 'COMMIT',
        title: 'Name your goal.',
        short: 'A commitment without a verb and a date is just a wish.',
        detail:
            'Write exactly what you will do, when you will do it, and what counts as proof. The protocol locks in those terms before a single dollar moves.',
        accent: 'No vague goals. No moving goalposts.',
        coinLabel: 'C',
    },
    {
        step: '02',
        id: 'stake' as const,
        label: 'STAKE',
        title: 'Put money on it.',
        short: 'Your stake is held by a trustless contract, not a company.',
        detail:
            'Lock USDC into on-chain escrow. The contract holds your stake until the verdict. You can see it on-chain, but you cannot touch it until the outcome is settled.',
        accent: 'Non-custodial. Trustless. On Solana.',
        coinLabel: 'S',
    },
    {
        step: '03',
        id: 'prove' as const,
        label: 'PROVE',
        title: 'Show your work.',
        short: 'The AI Game Master reviews your evidence. Not your excuses.',
        detail:
            'Upload your proof. An impartial AI Game Master compares it against the terms you set. No relationship with you, no incentive to let you off easy.',
        accent: 'AI-verified. Bias-free.',
        coinLabel: 'P',
    },
    {
        step: '04',
        id: 'settle' as const,
        label: 'SETTLE',
        title: 'Stakes resolve on-chain.',
        short: 'Honored stakes return. Missed stakes fund operators who followed through.',
        detail:
            'Smart contract settlement. Keep your word and your stake comes back. Miss it and it redistributes to operators who followed through. The math is simple. The rule is the rule.',
        accent: 'On-chain. Automatic. Final.',
        coinLabel: '✓',
    },
];

type PhaseId = (typeof PHASES)[number]['id'];

export default function PhaseScrollySection() {
    const [activeId, setActiveId] = useState<PhaseId>('commit');
    const [panelKey, setPanelKey] = useState(0);
    const [reducedMotion, setReducedMotion] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);
    const sentinelRefs = useRef<(HTMLDivElement | null)[]>([]);

    const activePhase = PHASES.find((p) => p.id === activeId) ?? PHASES[0];

    // Detect reduced-motion preference
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(mq.matches);
        const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    // Track which phase sentinel is in the center of the viewport.
    // We pick the one whose top is closest to 40% of the viewport height
    // so the card activates before it fully enters (feels responsive).
    useEffect(() => {
        const observers: IntersectionObserver[] = [];

        sentinelRefs.current.forEach((el, i) => {
            if (!el) return;
            const io = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        if (entry.isIntersecting) {
                            const nextId = PHASES[i].id;
                            setActiveId((prev) => {
                                if (prev !== nextId) {
                                    setPanelKey((k) => k + 1);
                                    return nextId;
                                }
                                return prev;
                            });
                        }
                    }
                },
                {
                    // The sentinel activates when its center crosses
                    // 35-65% of the viewport height.
                    rootMargin: '-35% 0px -35% 0px',
                    threshold: 0,
                },
            );
            io.observe(el);
            observers.push(io);
        });

        return () => observers.forEach((io) => io.disconnect());
    }, []);

    // Keyboard + click navigation: jump to the card's sentinel
    const jumpToPhase = useCallback((index: number) => {
        const el = sentinelRefs.current[index];
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, []);

    return (
        <section
            ref={sectionRef}
            id="how-it-works"
            aria-labelledby="phases-heading"
            className="relative w-full"
        >
            {/* ── Sticky two-column shell ── */}
            <div className="max-w-[1280px] mx-auto px-6 md:px-10">
                {/* Section header */}
                <div className="pt-24 pb-12 md:pt-32 md:pb-16 text-center">
                    <span className="block font-mono text-[11px] tracking-[0.18em] text-primary uppercase mb-4">
                        // how it works
                    </span>
                    <h2
                        id="phases-heading"
                        className="text-3xl md:text-4xl font-medium tracking-tight text-foreground"
                        style={{ letterSpacing: '-0.03em' }}
                    >
                        Four steps. One rule.
                    </h2>
                    <p className="mt-3 text-muted max-w-[480px] mx-auto text-sm leading-relaxed">
                        Commit to something. Back it with money. Prove it happened. Stakes settle
                        automatically on-chain.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 pb-32">
                    {/* ── LEFT: Sticky coin + detail panel ── */}
                    <div className="lg:w-[42%] lg:sticky lg:top-28 lg:self-start">
                        {/* Phase nav pills (desktop only) */}
                        <div
                            role="tablist"
                            aria-label="Commitment phases"
                            className="hidden lg:flex items-center gap-2 mb-8"
                        >
                            {PHASES.map((p, i) => (
                                <button
                                    key={p.id}
                                    role="tab"
                                    aria-selected={activeId === p.id}
                                    aria-controls={`phase-panel-${p.id}`}
                                    id={`phase-tab-${p.id}`}
                                    tabIndex={activeId === p.id ? 0 : -1}
                                    onClick={() => jumpToPhase(i)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            jumpToPhase(i);
                                        }
                                        if (e.key === 'ArrowRight') {
                                            const next = sentinelRefs.current[(i + 1) % PHASES.length];
                                            next?.focus();
                                        }
                                        if (e.key === 'ArrowLeft') {
                                            const prev =
                                                sentinelRefs.current[
                                                    (i - 1 + PHASES.length) % PHASES.length
                                                ];
                                            prev?.focus();
                                        }
                                    }}
                                    className={[
                                        'px-3 py-1 rounded-full font-mono text-[10px] tracking-[0.14em] uppercase transition-all duration-200',
                                        activeId === p.id
                                            ? 'bg-primary text-black'
                                            : 'text-muted border border-white/10 hover:border-white/20 hover:text-foreground',
                                    ].join(' ')}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        {/* 3D Coin */}
                        <div
                            className="relative mx-auto lg:mx-0 mb-8"
                            style={{ width: 120, height: 120, perspective: '600px' }}
                            aria-hidden="true"
                        >
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    transformStyle: 'preserve-3d',
                                    animation: reducedMotion ? 'none' : 'coinSpin 5s linear infinite',
                                }}
                            >
                                {/* Front face */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backfaceVisibility: 'hidden',
                                        borderRadius: '50%',
                                        background:
                                            'radial-gradient(circle at 35% 35%, #f9a76c, #F08A4C 60%, #c4621e)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow:
                                            '0 0 0 2px rgba(240,138,76,0.3), 0 0 40px rgba(240,138,76,0.25)',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: 'monospace',
                                            fontSize: 36,
                                            fontWeight: 700,
                                            color: '#0A0A0B',
                                            letterSpacing: '-0.04em',
                                            userSelect: 'none',
                                        }}
                                    >
                                        {activePhase.coinLabel}
                                    </span>
                                </div>
                                {/* Back face */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backfaceVisibility: 'hidden',
                                        transform: 'rotateY(180deg)',
                                        borderRadius: '50%',
                                        background:
                                            'radial-gradient(circle at 65% 35%, #c4621e, #8a3f0e)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: 'monospace',
                                            fontSize: 20,
                                            fontWeight: 700,
                                            color: 'rgba(255,255,255,0.4)',
                                            letterSpacing: '0.1em',
                                            userSelect: 'none',
                                        }}
                                    >
                                        OU
                                    </span>
                                </div>
                            </div>
                            {/* Coin shadow */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: -16,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: 80,
                                    height: 12,
                                    borderRadius: '50%',
                                    background: 'rgba(240,138,76,0.15)',
                                    filter: 'blur(8px)',
                                }}
                            />
                        </div>

                        {/* Detail panel */}
                        <div
                            id={`phase-panel-${activeId}`}
                            role="tabpanel"
                            aria-labelledby={`phase-tab-${activeId}`}
                            aria-live="polite"
                            aria-atomic="true"
                            key={panelKey}
                            className={[
                                'rounded-2xl p-6 liquid-glass-ou-active',
                                reducedMotion ? '' : 'animate-blur-fade-up',
                            ].join(' ')}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <span className="font-mono text-[10px] tracking-[0.18em] text-primary uppercase">
                                    {activePhase.step}
                                </span>
                                <span
                                    className="h-px flex-1 opacity-30"
                                    style={{ background: 'var(--color-primary)' }}
                                />
                                <span className="font-mono text-[10px] tracking-[0.18em] text-primary uppercase">
                                    {activePhase.label}
                                </span>
                            </div>
                            <p className="text-foreground text-base leading-relaxed mb-4">
                                {activePhase.detail}
                            </p>
                            <p className="font-mono text-[11px] tracking-[0.1em] text-primary uppercase">
                                {activePhase.accent}
                            </p>
                        </div>
                    </div>

                    {/* ── RIGHT: Scrollable phase cards ── */}
                    <div
                        className="flex-1 flex flex-col gap-0 lg:gap-0"
                        role="list"
                        aria-label="Scroll through each commitment phase"
                    >
                        {PHASES.map((phase, i) => (
                            <div
                                key={phase.id}
                                role="listitem"
                                className="relative"
                                style={{ minHeight: '60vh' }}
                            >
                                {/* Sentinel: IntersectionObserver target */}
                                <div
                                    ref={(el) => {
                                        sentinelRefs.current[i] = el;
                                    }}
                                    className="absolute"
                                    style={{ top: '20%', height: '60%', width: 1 }}
                                    aria-hidden="true"
                                />

                                {/* Phase card */}
                                <div
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Phase ${phase.step}: ${phase.label}. ${phase.title} ${phase.short}`}
                                    aria-pressed={activeId === phase.id}
                                    onClick={() => jumpToPhase(i)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            jumpToPhase(i);
                                        }
                                    }}
                                    className={[
                                        'relative rounded-2xl p-7 cursor-pointer select-none',
                                        'transition-all duration-500',
                                        'mt-6 mb-6 lg:mt-8 lg:mb-8',
                                        activeId === phase.id
                                            ? 'liquid-glass-ou-active'
                                            : 'liquid-glass-ou hover:bg-white/[0.025]',
                                    ].join(' ')}
                                    style={{
                                        transform:
                                            activeId === phase.id
                                                ? 'translateX(0)'
                                                : 'translateX(0)',
                                    }}
                                >
                                    {/* Step number + active indicator */}
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
                                            {phase.step}
                                        </span>
                                        <span
                                            className={[
                                                'font-mono text-[10px] tracking-[0.2em] uppercase transition-all duration-300',
                                                activeId === phase.id
                                                    ? 'text-primary'
                                                    : 'text-muted/40',
                                            ].join(' ')}
                                        >
                                            {phase.label}
                                        </span>
                                        {/* Active dot */}
                                        <span
                                            className={[
                                                'w-2 h-2 rounded-full transition-all duration-300',
                                                activeId === phase.id
                                                    ? 'bg-primary shadow-[0_0_8px_var(--color-primary)]'
                                                    : 'bg-white/10',
                                            ].join(' ')}
                                            aria-hidden="true"
                                        />
                                    </div>

                                    {/* Headline */}
                                    <h3
                                        className={[
                                            'text-2xl md:text-3xl font-medium tracking-tight mb-3 transition-colors duration-300',
                                            activeId === phase.id ? 'text-foreground' : 'text-foreground/60',
                                        ].join(' ')}
                                        style={{ letterSpacing: '-0.03em' }}
                                    >
                                        {phase.title}
                                    </h3>

                                    {/* Short description */}
                                    <p
                                        className={[
                                            'text-sm leading-relaxed transition-colors duration-300',
                                            activeId === phase.id ? 'text-muted-foreground' : 'text-muted/50',
                                        ].join(' ')}
                                    >
                                        {phase.short}
                                    </p>

                                    {/* Active underline bar */}
                                    <div
                                        className={[
                                            'absolute bottom-0 left-7 right-7 h-px transition-all duration-500',
                                            activeId === phase.id
                                                ? 'opacity-30'
                                                : 'opacity-0',
                                        ].join(' ')}
                                        style={{ background: 'var(--color-primary)' }}
                                        aria-hidden="true"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
