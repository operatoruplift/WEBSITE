'use client';

import React from 'react';
import { infraLogos } from './InfraLogos';
import { AnthropicLogo, OpenAILogo } from './ProviderLogos';

/**
 * Built With carousel — reuses the marquee pattern from TrustedBy
 * (mask-gradient edges, animate-marquee 40s, grayscale default,
 * pause on hover). Subtle — no glows, no gradients.
 *
 * Row layout:
 *   - Outer wrapper: py-4 (prevents bottom clipping on mobile)
 *   - Inner scroll track: h-14 fixed — enough vertical room for the
 *     two-line logo+role block without clipping descenders
 *   - Each item: h-full flex items-center (center-aligned)
 *   - Logos: w-5 h-5 (1:1 aspect) — no stretching
 *
 * Pause-on-hover is driven by `group-hover:[animation-play-state:paused]`
 * which piggybacks on the outer `group` class. No new JS.
 */

interface Tool {
    name: string;
    role: string;
    Logo: React.FC<{ className?: string }>;
}

const TOOLS: Tool[] = [
    { name: 'Privy', role: 'Authentication', Logo: infraLogos.Privy },
    { name: 'Supabase', role: 'Database + RLS', Logo: infraLogos.Supabase },
    { name: 'Solana', role: 'Audit roots', Logo: infraLogos.Solana },
    { name: 'Vercel', role: 'Hosting', Logo: infraLogos.Vercel },
    { name: 'Anthropic', role: 'Models', Logo: AnthropicLogo },
    { name: 'OpenAI', role: 'Models', Logo: OpenAILogo },
];

export function BuiltWithCarousel() {
    // Duplicate so the marquee loops seamlessly
    const items = [...TOOLS, ...TOOLS];

    return (
        <div className="w-full py-4">
            <div className="relative w-full overflow-hidden mask-gradient group">
                {/* Edge fades — match the page background so logos dissolve on the sides */}
                <div className="absolute top-0 left-0 w-12 md:w-24 h-full bg-gradient-to-r from-[#0A0A0A] to-transparent z-10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-12 md:w-24 h-full bg-gradient-to-l from-[#0A0A0A] to-transparent z-10 pointer-events-none" />

                {/* Fixed-height track so logos don't shift or clip on load */}
                <div className="flex w-fit items-center h-14 animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused]">
                    {items.map((tool, i) => {
                        const Logo = tool.Logo;
                        return (
                            <div
                                key={`${tool.name}-${i}`}
                                className="flex items-center gap-3 mx-8 h-full opacity-60 grayscale transition-opacity duration-300 hover:opacity-100 hover:grayscale-0"
                            >
                                <div className="flex items-center justify-center shrink-0 w-5 h-5 text-[#A1A1AA]">
                                    <Logo className="w-full h-full" />
                                </div>
                                <div className="flex flex-col justify-center leading-tight">
                                    <span className="text-sm text-white font-medium tracking-tight">
                                        {tool.name}
                                    </span>
                                    <span className="text-[9px] text-[#A1A1AA] font-semibold tracking-widest uppercase">
                                        {tool.role}
                                    </span>
                                </div>
                                <div className="w-1 h-1 bg-white/15 rounded-full ml-6 shrink-0" />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
