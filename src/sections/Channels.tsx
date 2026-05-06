'use client';

import React from 'react';
import { MessageSquare, Send, MessageCircle, Hash, Gamepad2, Phone } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';
import { Section } from '@/src/components/Section';
import { SectionHeader } from '@/src/components/SectionHeader';

/**
 * Channels grid: shows which messaging surfaces the agent runs on.
 *
 * Inspiration is the "agents live in messaging apps" framing every
 * agent-platform vendor leans on (Photon Spectrum's product page is
 * one example). Goal here is to translate that framing into our
 * voice: meet users in the threads they already keep open instead
 * of asking them to install another app.
 *
 * Honest framing matters: Photon Spectrum supports more channels
 * than we've validated end-to-end. Each tile shows a `status`
 * (shipping / ready / roadmap) so we don't overpromise:
 *
 *   - shipping: full agent loop verified on prod (iMessage today)
 *   - ready: same webhook + adapter shape, just not yet stress-tested
 *   - roadmap: needs additional integration work
 */

type ChannelStatus = 'shipping' | 'ready' | 'roadmap';

interface Channel {
    name: string;
    blurb: string;
    status: ChannelStatus;
    Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}

const CHANNELS: Channel[] = [
    {
        name: 'iMessage',
        blurb: 'Full agent loop, signed receipts, multi-turn memory.',
        status: 'shipping',
        Icon: MessageSquare,
    },
    {
        name: 'Telegram',
        blurb: 'Same webhook, same agent. Forward your project traffic to flip it on.',
        status: 'ready',
        Icon: Send,
    },
    {
        name: 'WhatsApp',
        blurb: 'Spectrum bridges WhatsApp Business; the agent loop runs identically.',
        status: 'ready',
        Icon: MessageCircle,
    },
    {
        name: 'Slack',
        blurb: 'App with slash commands so the bot can answer in any channel you invite it to.',
        status: 'roadmap',
        Icon: Hash,
    },
    {
        name: 'Discord',
        blurb: 'Server bot with slash commands and DM-aware tool calls.',
        status: 'roadmap',
        Icon: Gamepad2,
    },
    {
        name: 'Phone',
        blurb: 'Voice via Photon\u2019s phone bridge. Same agent answers spoken questions.',
        status: 'roadmap',
        Icon: Phone,
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
    roadmap: {
        label: 'Roadmap',
        cls: 'bg-foreground/5 text-foreground/60 border-foreground/15',
    },
};

const Channels: React.FC = () => {
    return (
        <Section id="channels" ariaLabelledby="channels-heading" innerClassName="max-w-[1100px]">
            <SectionHeader
                headingId="channels-heading"
                eyebrow="Channels"
                title="Where the bot lives"
                description="Open the messaging app you already use. The bot is whoever you text, no install, no separate inbox, no extra tab."
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
