'use client';

import React from 'react';
import { infraLogos } from './InfraLogos';
import { AnthropicLogo, OpenAILogo } from './ProviderLogos';

/**
 * Built With carousel — reuses the exact marquee pattern from
 * `TrustedBy.tsx` (mask-gradient edges, animate-marquee 40s scroll,
 * grayscale-default + color-on-hover). Paused on hover.
 *
 * Fixed logo height (h-6) so nothing shifts on load.
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
    // Duplicate so the marquee can loop seamlessly
    const items = [...TOOLS, ...TOOLS];

    return (
        <div className="w-full">
            <div className="relative w-full overflow-hidden mask-gradient group">
                {/* Edge fades to match TrustedBy */}
                <div className="absolute top-0 left-0 w-12 md:w-24 h-full bg-gradient-to-r from-[#0A0A0A] to-transparent z-10" />
                <div className="absolute top-0 right-0 w-12 md:w-24 h-full bg-gradient-to-l from-[#0A0A0A] to-transparent z-10" />

                <div className="flex w-fit animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused]">
                    {items.map((tool, i) => {
                        const Logo = tool.Logo;
                        return (
                            <div
                                key={`${tool.name}-${i}`}
                                className="flex items-center gap-3 mx-8 h-6 opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
                            >
                                <div className="text-gray-500 hover:text-[#F97316] transition-colors shrink-0">
                                    <Logo className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col justify-center leading-tight">
                                    <span className="text-sm md:text-base text-white font-medium tracking-tight">
                                        {tool.name}
                                    </span>
                                    <span className="text-[9px] text-[#A1A1AA] font-bold tracking-widest uppercase">
                                        {tool.role}
                                    </span>
                                </div>
                                <div className="w-1 h-1 bg-white/20 rounded-full ml-6" />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
