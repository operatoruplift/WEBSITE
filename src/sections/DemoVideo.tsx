'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Play, ArrowRight } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';
import { Section } from '@/src/components/Section';
import { SectionHeader } from '@/src/components/SectionHeader';

/**
 * 60-second demo video, recorded on PROD with the Playwright harness
 * running the three consumer beats (Briefing, Inbox, Reminders). The
 * landing hero's secondary CTA anchors here.
 *
 * Kept off the critical-render path: the <video> has preload="none"
 * and the poster jpg (70 KB) stands in until the user clicks. LCP
 * stays on the hero copy, not on a 721 KB mp4 fetch.
 */
export function DemoVideo() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [started, setStarted] = useState(false);

    const start = () => {
        if (!videoRef.current) return;
        videoRef.current.play().catch(() => {/* autoplay blocked is fine */});
        setStarted(true);
    };

    return (
        <Section id="demo-video">
            <SectionHeader
                eyebrow="60 Seconds"
                title="See the three real demo beats"
                description="Briefing, inbox triage, morning nudges. Recorded end-to-end against prod. Every tool call in this clip is labeled SIMULATED, the real versions run after you sign in."
            />

            <FadeIn>
                <div className="w-full max-w-[960px] mx-auto relative rounded-2xl overflow-hidden border border-white/10 bg-[#0A0A0A] aspect-[16/9]">
                    <video
                        ref={videoRef}
                        src="/demo/three-beats.mp4"
                        poster="/demo/three-beats-poster.jpg"
                        preload="none"
                        controls={started}
                        playsInline
                        onPlay={() => setStarted(true)}
                        className="w-full h-full object-cover"
                        aria-label="60 second Operator Uplift demo"
                    />
                    {!started && (
                        <button
                            onClick={start}
                            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors group"
                            aria-label="Play demo"
                        >
                            <span className="w-20 h-20 rounded-full bg-[#F97316]/95 flex items-center justify-center shadow-[0_0_48px_rgba(249,115,22,0.6)] group-hover:scale-105 transition-transform">
                                <Play size={28} className="text-white ml-1" fill="currentColor" />
                            </span>
                        </button>
                    )}
                </div>
            </FadeIn>

            <div className="flex flex-col items-center gap-3 pt-4">
                <p className="text-xs text-[#A1A1AA] font-mono text-center max-w-md">
                    60.3s · recorded on prod · every tool call has `simulated: true` in the payload
                </p>
                <Link
                    href="/login?returnTo=/integrations"
                    className="inline-flex items-center h-11 px-6 bg-[#F97316] text-white rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#F97316]/90 transition-colors"
                >
                    Sign in to connect Google <ArrowRight size={16} className="ml-2" />
                </Link>
            </div>
        </Section>
    );
}

export default DemoVideo;
