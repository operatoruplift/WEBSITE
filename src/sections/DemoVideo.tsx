'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Play, ArrowRight } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';
import { Section } from '@/src/components/Section';
import { SectionHeader } from '@/src/components/SectionHeader';

/**
 * 90-second demo video, recorded on PROD with the Playwright harness
 * running the three consumer beats (Briefing, Inbox, Reminders). The
 * landing hero's secondary CTA + the Navbar DEMO item both anchor
 * here via `#demo-video`, so this section is the single source of
 * truth for "watch the demo."
 *
 * Kept off the critical-render path: the <video> has preload="none"
 * and the poster jpg (70 KB) stands in until the user clicks. LCP
 * stays on the hero copy, not on the mp4 fetch.
 *
 * Graceful fallback: if the mp4 fails to load (network error, decoder
 * missing on an old browser), the poster + Play button stay visible
 * and a small text prompt tells the user the video could not load.
 */
export function DemoVideo() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [started, setStarted] = useState(false);
    const [failed, setFailed] = useState(false);

    const start = () => {
        if (!videoRef.current || failed) return;
        videoRef.current.play().catch(() => {/* autoplay blocked is fine */});
        setStarted(true);
    };

    return (
        <Section id="demo-video" ariaLabelledby="demo-video-heading">
            <SectionHeader
                headingId="demo-video-heading"
                eyebrow="90 seconds"
                title="Watch it actually work"
                description="Three real things, your morning briefing, your inbox, your reminders. Recorded end-to-end. Every action waits for the tap."
            />

            <FadeIn>
                <div className="w-full max-w-[960px] mx-auto relative rounded-2xl overflow-hidden border border-white/10 bg-[#0A0A0A] aspect-[16/9]">
                    <video
                        ref={videoRef}
                        src="/demo/operator-uplift-demo.mp4"
                        poster="/demo/operator-uplift-demo-poster.jpg"
                        preload="none"
                        controls={started}
                        playsInline
                        onPlay={() => setStarted(true)}
                        onError={() => setFailed(true)}
                        className="w-full h-full object-cover"
                        aria-label="90 second Operator Uplift demo"
                    />
                    {!started && !failed && (
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
                    {failed && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 px-6">
                            <p className="text-sm text-muted font-mono text-center">
                                The demo video didn&apos;t load. Refresh, or
                                {' '}
                                <Link href="/chat" className="underline hover:text-white">try the live demo chat</Link>
                                {' '}instead.
                            </p>
                        </div>
                    )}
                </div>
            </FadeIn>

            <div className="flex flex-col items-center gap-3 pt-4">
                <p className="text-xs text-muted font-mono text-center max-w-md">
                    90 seconds. Nothing is real until you sign in.
                </p>
                <Link
                    href="/login?returnTo=/integrations"
                    className="inline-flex items-center h-11 px-6 bg-[#F97316] text-white rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#F97316]/90 transition-colors"
                >
                    Sign in and connect Gmail <ArrowRight aria-hidden="true" size={16} className="ml-2" />
                </Link>
            </div>
        </Section>
    );
}

export default DemoVideo;
