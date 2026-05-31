'use client';

import React from 'react';
import Link from 'next/link';
import { FadeIn } from '@/src/components/Animators';

/**
 * Download section, 2026-05-22 v2-canvas addition.
 *
 * The earlier hero shoehorned App Store + Google Play badges
 * directly under the primary CTAs. PR #689 dropped that row to clean
 * up the hero. The v2 design canvas
 * (/tmp/disrupt-onboarding-v2/index.html, /04 · DOWNLOAD/ board)
 * reserves a dedicated mid-page section for the install prompt:
 *
 *   - eyebrow "04 · DOWNLOAD"
 *   - large two-line headline ("Don't read about it. Install it.")
 *     with the second line in the accent color
 *   - one-sentence sub: free-for-first-commitment + setup time
 *   - two app badges side by side: Apple App Store + Google Play
 *   - a small monospace caption ("Coming soon · operatoruplift.com")
 *
 * Both badges currently link to /waitlist because the iOS + Android
 * apps are not shipped yet (the homepage badge says "Now in private
 * beta · iOS & Android coming soon"). When the apps ship, swap the
 * href + drop the Coming soon caption.
 */
const DownloadSection: React.FC = () => {
    return (
        <section
            id="download"
            aria-labelledby="download-heading"
            className="relative w-full px-6 md:px-12 text-center flex flex-col justify-center"
            style={{
                minHeight: 'clamp(560px, 80vh, 760px)',
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
                    className="mt-6 font-medium tracking-[-0.04em] leading-[0.95] text-foreground"
                    style={{ fontSize: 'clamp(32px, 5vw, 72px)' }}
                >
                    <span className="block">Don&apos;t read about it.</span>
                    <span className="block text-primary">Install it.</span>
                </h2>

                <p
                    className="mt-7 mx-auto max-w-[560px] text-foreground/75 leading-relaxed"
                    style={{ fontSize: 'clamp(15px, 1.15vw, 18px)' }}
                >
                    Free forever for your first commitment. Money on the line is opt-in. Setup takes less than 60 seconds.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-stretch">
                    <Link
                        href="/waitlist"
                        aria-label="Download on the App Store, coming soon. Joins the waitlist."
                        className="inline-flex items-center gap-3 px-4 py-2.5 border border-foreground/[0.16] bg-foreground/[0.02] hover:border-foreground/40 transition-colors"
                    >
                        <AppleGlyph className="w-6 h-6 text-foreground" />
                        <span className="text-left leading-tight">
                            <span className="block text-[10px] font-mono text-muted uppercase tracking-wider">Download on the</span>
                            <span className="block text-base font-medium text-foreground">App Store</span>
                        </span>
                    </Link>
                    <Link
                        href="/waitlist"
                        aria-label="Get it on Google Play, coming soon. Joins the waitlist."
                        className="inline-flex items-center gap-3 px-4 py-2.5 border border-foreground/[0.16] bg-foreground/[0.02] hover:border-foreground/40 transition-colors"
                    >
                        <PlayGlyph className="w-6 h-6 text-foreground" />
                        <span className="text-left leading-tight">
                            <span className="block text-[10px] font-mono text-muted uppercase tracking-wider">Get it on</span>
                            <span className="block text-base font-medium text-foreground">Google Play</span>
                        </span>
                    </Link>
                </div>

                <p className="mt-7 font-mono text-[11px] tracking-[0.16em] text-muted/70 uppercase">
                    Coming soon · operatoruplift.com
                </p>
            </FadeIn>
        </section>
    );
};

function AppleGlyph({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
            <path d="M17.05 12.04c-.02-2.13 1.74-3.16 1.82-3.21-.99-1.45-2.54-1.65-3.09-1.67-1.31-.13-2.56.77-3.23.77-.68 0-1.7-.75-2.79-.73-1.43.02-2.76.83-3.5 2.11-1.5 2.6-.38 6.43 1.07 8.53.71 1.03 1.55 2.18 2.65 2.14 1.07-.04 1.47-.69 2.76-.69 1.28 0 1.65.69 2.78.66 1.15-.02 1.87-1.04 2.57-2.07.81-1.19 1.14-2.34 1.16-2.4-.03-.01-2.22-.85-2.24-3.38ZM14.94 5.6c.59-.71.99-1.7.88-2.69-.85.03-1.88.57-2.49 1.28-.54.62-1.02 1.63-.9 2.6.95.07 1.92-.48 2.51-1.19Z" />
        </svg>
    );
}

function PlayGlyph({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
            <path d="M4 3.5v17l13-8.5L4 3.5Z" fill="currentColor" opacity="0.85" />
            <path d="M4 3.5l9 8.5M4 20.5l9-8.5" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
        </svg>
    );
}

export default DownloadSection;
