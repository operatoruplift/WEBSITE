'use client';

import React from 'react';
import { MessageSquare, Send, MessageCircle } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';
import { Section } from '@/src/components/Section';
import { SectionHeader } from '@/src/components/SectionHeader';

/**
 * Channels grid: which messaging surfaces the agent runs on today.
 *
 * Per user feedback 2026-05-08: "either make the roadmap items work
 * or we remove them." Slack, Discord, and Phone (voice) were trimmed
 * because none of them have a verified end-to-end loop yet.
 *
 * Telegram and WhatsApp share the same Spectrum webhook + adapter as
 * iMessage; flipping them on is a Spectrum-dashboard config change,
 * no code change. Marked "Ready" rather than "Shipping" because we
 * have not yet stress-tested an inbound on those platforms in prod.
 */

type ChannelStatus = 'shipping' | 'ready';

interface Channel {
    name: string;
    blurb: string;
    status: ChannelStatus;
    Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}

const CHANNELS: Channel[] = [
    {
        name: 'iMessage',
        blurb: 'Daily check-in by text. The AI Game Master adjudicates from the thread, no app open required.',
        status: 'shipping',
        Icon: MessageSquare,
    },
    {
        name: 'Telegram',
        blurb: 'Same adjudicator, same streak, same stakes. Telegram instead of iMessage for operators outside the Apple stack.',
        status: 'ready',
        Icon: Send,
    },
    {
        name: 'WhatsApp',
        blurb: 'WhatsApp Business is wired the same way. The protocol does not know which app you checked in from, only the verdict.',
        status: 'ready',
        Icon: MessageCircle,
    },
];

const STATUS_STYLES: Record<ChannelStatus, { label: string; cls: string }> = {
    shipping: {
        label: 'Shipping',
        cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    },
    ready: {
        label: 'Ready',
        cls: 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/30',
    },
};

const Channels: React.FC = () => {
    return (
        <Section id="channels" ariaLabelledby="channels-heading" innerClassName="max-w-[1100px]">
            <SectionHeader
                headingId="channels-heading"
                eyebrow="// Check-in channels"
                title="Honor it wherever you are."
                description="The check-in happens where your hands already are. Daily streak, real adjudication, no separate app to open."
            />

            <FadeIn className="w-full">
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0">
                    {CHANNELS.map((c, i) => {
                        const status = STATUS_STYLES[c.status];
                        return (
                            <li
                                key={c.name}
                                className="p-5 rounded-2xl border border-foreground/10 bg-foreground/[0.02] flex flex-col gap-3 transition-colors hover:border-foreground/20"
                                style={{ transitionDelay: `${i * 30}ms` }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center" aria-hidden>
                                        <c.Icon className="w-5 h-5" aria-hidden />
                                    </div>
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-widest ${status.cls}`}
                                    >
                                        {status.label}
                                    </span>
                                </div>
                                <h3 className="text-base font-medium text-foreground">{c.name}</h3>
                                <p className="text-sm text-muted leading-relaxed">{c.blurb}</p>
                            </li>
                        );
                    })}
                </ul>
            </FadeIn>
        </Section>
    );
};

export default Channels;
