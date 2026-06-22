'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { FadeIn, SplitText } from '@/src/components/Animators';

/**
 * Download section, 2026-05-22 v2-canvas addition.
 * 2026-06-22: upgraded to editorial platform nav-cards (VEX/404 card
 * pattern). Each platform gets an icon badge, name, status subtitle,
 * and an arrow. SplitText applied to the headline for entrance rhythm.
 */
const DownloadSection: React.FC = () => {
    return (
        <section
            id="download"
            aria-labelledby="download-heading"
            className="relative w-full px-6 md:px-12 text-center flex flex-col justify-center"
            style={{
                minHeight: '560px',
                paddingTop: 'clamp(80px, 12vw, 140px)',
                paddingBottom: 'clamp(80px, 12vw, 140px)',
            }}
        >
            <FadeIn block className="max-w-[860px] mx-auto">
                <span className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase inline-flex items-center gap-3">
                    <span className="h-px w-6 bg-primary inline-block" />
                    04 · Download
                </span>

                <h2
                    id="download-heading"
                    className="mt-6 font-medium tracking-[-0.04em] leading-[0.95]"
                    style={{ fontSize: 'clamp(32px, 5vw, 72px)' }}
                >
                    <span className="block text-foreground">
                        <SplitText text="Don't read about it." baseDelay={150} wordDelay={65} />
                    </span>
                    <span className="block">
                        <SplitText text="Install it." className="text-primary" baseDelay={440} wordDelay={65} />
                    </span>
                </h2>

                <p
                    className="mt-7 mx-auto max-w-[560px] text-foreground/75 leading-relaxed"
                    style={{ fontSize: 'clamp(15px, 1.15vw, 18px)' }}
                >
                    Free forever for your first commitment. Money on the line is opt-in. Setup takes less than 60 seconds.
                </p>

                {/* Editorial platform nav-cards (VEX/404 pattern).
                    Each card has an icon badge, platform name, status
                    subtitle, and a directional arrow. The cards link to
                    /waitlist because the apps are not shipped yet. */}
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[480px] mx-auto text-left">
                    <PlatformCard
                        icon={<AppleGlyph />}
                        platform="App Store"
                        subtitle="iOS · Coming soon"
                        href="/waitlist"
                    />
                    <PlatformCard
                        icon={<PlayGlyph />}
                        platform="Google Play"
                        subtitle="Android · Coming soon"
                        href="/waitlist"
                    />
                </div>

                <p className="mt-8 font-mono text-[11px] tracking-[0.16em] text-muted/70 uppercase">
                    Coming soon · operatoruplift.com
                </p>
            </FadeIn>
        </section>
    );
};

interface PlatformCardProps {
    icon: React.ReactNode;
    platform: string;
    subtitle: string;
    href: string;
}

function PlatformCard({ icon, platform, subtitle, href }: PlatformCardProps) {
    return (
        <Link
            href={href}
            aria-label={`${platform}, ${subtitle}. Joins the waitlist.`}
            className="group relative flex items-center gap-4 px-5 py-4 border border-foreground/[0.12] bg-foreground/[0.02] hover:border-primary/40 hover:bg-primary/[0.03] transition-all duration-200"
        >
            <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-foreground/[0.1] bg-foreground/[0.05] text-foreground group-hover:border-primary/30 transition-colors duration-200">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground text-[15px] leading-tight">
                    {platform}
                </div>
                <div className="font-mono text-[11px] text-muted mt-0.5 tracking-[0.04em]">
                    {subtitle}
                </div>
            </div>
            <ArrowUpRight
                size={15}
                aria-hidden="true"
                className="shrink-0 text-muted/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-[color,transform] duration-200"
            />
        </Link>
    );
}

function AppleGlyph() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-5 h-5">
            <path d="M17.05 12.04c-.02-2.13 1.74-3.16 1.82-3.21-.99-1.45-2.54-1.65-3.09-1.67-1.31-.13-2.56.77-3.23.77-.68 0-1.7-.75-2.79-.73-1.43.02-2.76.83-3.5 2.11-1.5 2.6-.38 6.43 1.07 8.53.71 1.03 1.55 2.18 2.65 2.14 1.07-.04 1.47-.69 2.76-.69 1.28 0 1.65.69 2.78.66 1.15-.02 1.87-1.04 2.57-2.07.81-1.19 1.14-2.34 1.16-2.4-.03-.01-2.22-.85-2.24-3.38ZM14.94 5.6c.59-.71.99-1.7.88-2.69-.85.03-1.88.57-2.49 1.28-.54.62-1.02 1.63-.9 2.6.95.07 1.92-.48 2.51-1.19Z" />
        </svg>
    );
}

function PlayGlyph() {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
            <path d="M4 3.5v17l13-8.5L4 3.5Z" fill="currentColor" opacity="0.85" />
            <path d="M4 3.5l9 8.5M4 20.5l9-8.5" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
        </svg>
    );
}

export default DownloadSection;
