'use client';

import React from 'react';
import { Lock, KeyRound, FileSignature, Cpu, ArrowRight } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';
import { Section } from '@/src/components/Section';
import { SectionHeader } from '@/src/components/SectionHeader';
import {
    AnthropicLogo,
    OpenAILogo,
    GoogleLogo,
    XAILogo,
    OllamaLogo,
} from '@/src/components/ProviderLogos';

/**
 * Concrete demonstration of the local-first / BYOK flow.
 *
 * Lives right after the Hero so a first-time visitor sees the trust
 * substance before the demo video, not buried in the FAQ. The flow
 * diagram + trust grid replace the abstract "we care about privacy"
 * paragraph that this kind of pitch usually defaults to.
 *
 * Honest framing per the existing honesty-sweep guard
 * (rules/fabrication-rot.md): the cloud-deployed web app today is
 * BYOK + data-light cloud, not local-execution. The desktop +
 * Ollama path is on the roadmap and is labeled "Soon" in the
 * provider strip so we don't overpromise.
 */

interface FlowStep {
    label: string;
    title: string;
    body: string;
    accent: string;
}

const FLOW_STEPS: FlowStep[] = [
    {
        label: '01',
        title: 'You ask',
        body: '"Draft replies to my last 3 emails. Ask me before sending."',
        accent: 'border-[#F97316]/40 bg-[#F97316]/[0.04]',
    },
    {
        label: '02',
        title: 'We read, never store',
        body: 'Operator Uplift reads from Gmail via your Google OAuth. Messages stay in your inbox. Nothing is copied to our servers.',
        accent: 'border-emerald-500/40 bg-emerald-500/[0.04]',
    },
    {
        label: '03',
        title: 'Your AI, your key',
        body: 'The prompt goes straight to Claude, GPT, or Grok using the API key you brought. We never proxy or resell.',
        accent: 'border-sky-500/40 bg-sky-500/[0.04]',
    },
    {
        label: '04',
        title: 'You tap, then we sign',
        body: 'Drafts wait for your approval. Once you tap, the action runs and a signed receipt is published to Solana.',
        accent: 'border-violet-500/40 bg-violet-500/[0.04]',
    },
];

interface TrustSignal {
    icon: React.FC<{ className?: string; size?: number }>;
    headline: string;
    body: string;
}

const TRUST_SIGNALS: TrustSignal[] = [
    {
        icon: Lock,
        headline: 'Your accounts, not ours',
        body: 'Gmail and Calendar data stays in your Google account. We orchestrate via OAuth, never store the contents.',
    },
    {
        icon: KeyRound,
        headline: 'Bring your own key',
        body: 'Anthropic, OpenAI, and xAI bill you direct. Your spend, your rate limits, your data agreement.',
    },
    {
        icon: FileSignature,
        headline: 'Signed audit trail',
        body: 'Every approved action gets an ed25519 signature and a Merkle root posted to Solana. Read-only, public, immutable.',
    },
    {
        icon: Cpu,
        headline: 'Local mode, soon',
        body: 'The desktop app routes through Ollama on your machine. Llama 4 and DeepSeek run locally; the receipt still chains.',
    },
];

const LocalFirst: React.FC = () => {
    return (
        <Section id="local-first">
            <SectionHeader
                eyebrow="Local-first"
                title="Your data, your keys, your audit log"
                description="Most AI agents copy your email, train on it, and tie you to one cloud. We just orchestrate. Here is exactly what moves where, every time you ask."
            />

            {/* Flow strip, four steps, horizontal on desktop, stacked on
                mobile. The arrow between steps signals movement; the
                accent color per step ties to the trust grid below. */}
            <div className="w-full max-w-[1100px] mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-2 items-stretch relative">
                    {FLOW_STEPS.map((step, i) => (
                        <FadeIn key={step.label} delay={i * 100}>
                            <div className="relative h-full">
                                <div className={`relative h-full rounded-2xl border ${step.accent} p-5 flex flex-col text-left`}>
                                    {/* Larger step number for visual rhythm,
                                        inspired by editorial / sully.ai-style
                                        numbered section markers. The brand
                                        orange tint (50% opacity) keeps it
                                        from competing with the title. */}
                                    <span className="text-3xl font-mono font-bold tracking-tight text-[#F97316]/50 mb-2 leading-none">
                                        {step.label}
                                    </span>
                                    <h3 className="text-base font-semibold text-foreground mb-2">
                                        {step.title}
                                    </h3>
                                    <p className="text-sm text-muted leading-relaxed">
                                        {step.body}
                                    </p>
                                </div>
                                {/* Inter-step arrow on desktop only; placed
                                    half-overlapping the right edge so the
                                    flow reads continuously left-to-right. */}
                                {i < FLOW_STEPS.length - 1 && (
                                    <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-background border border-border items-center justify-center z-10">
                                        <ArrowRight aria-hidden="true" size={12} className="text-foreground/50" />
                                    </div>
                                )}
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>

            {/* Provider strip: concrete proof that BYOK works across
                providers, plus a "Soon" pill on Ollama to flag the
                roadmap commitment without overclaiming. */}
            <FadeIn delay={500}>
                <div className="w-full max-w-[1100px] mx-auto mt-12">
                    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">
                                Works with the model you already pay for
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                            <span className="inline-flex items-center gap-2 text-sm text-foreground">
                                <AnthropicLogo className="w-4 h-4" /> Claude
                            </span>
                            <span className="inline-flex items-center gap-2 text-sm text-foreground">
                                <OpenAILogo className="w-4 h-4" /> ChatGPT
                            </span>
                            <span className="inline-flex items-center gap-2 text-sm text-foreground">
                                <GoogleLogo className="w-4 h-4" /> Gemini
                            </span>
                            <span className="inline-flex items-center gap-2 text-sm text-foreground">
                                <XAILogo className="w-4 h-4" /> Grok
                            </span>
                            <span className="inline-flex items-center gap-2 text-sm text-muted">
                                <OllamaLogo className="w-4 h-4" /> Ollama
                                <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border border-[#F97316]/40 text-[#F97316] bg-[#F97316]/10">
                                    Soon
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </FadeIn>

            {/* Trust grid: four concrete signals, each tied to a real
                mechanism in the codebase (OAuth scope, BYOK env var,
                ed25519 receipts, Ollama integration). Avoid generic
                "we care about privacy" copy; tie each card to the
                mechanism the user can verify. */}
            <div className="w-full max-w-[1100px] mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {TRUST_SIGNALS.map((signal, i) => {
                    const Icon = signal.icon;
                    return (
                        <FadeIn key={signal.headline} delay={i * 80}>
                            <div className="rounded-2xl border border-border bg-card p-6 h-full flex gap-4 text-left">
                                <div className="w-10 h-10 shrink-0 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center">
                                    <Icon size={18} className="text-[#F97316]" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-foreground mb-1">
                                        {signal.headline}
                                    </h3>
                                    <p className="text-sm text-muted leading-relaxed">
                                        {signal.body}
                                    </p>
                                </div>
                            </div>
                        </FadeIn>
                    );
                })}
            </div>
        </Section>
    );
};

export default LocalFirst;
