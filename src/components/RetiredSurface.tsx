'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Retired-surface notice card. 2026-05-22 dashboard cleanup.
 *
 * Used by routes whose UI belonged to the retired AI-assistant
 * product (chat, integrations, swarm, profile, security) and have
 * no equivalent in the commitment-infrastructure brand. The route
 * stays alive (so external links + specs still resolve) but renders
 * this card on the v2 dark palette instead of the old sidebar +
 * topbar dashboard chrome.
 *
 * Surfaces a single primary action (go to homepage) and a secondary
 * link to /waitlist for users who actually want the new product.
 */
interface RetiredSurfaceProps {
    title: string;
    body: string;
    /** Optional related-route nudge ("If you wanted X, go to Y"). */
    relatedLabel?: string;
    relatedHref?: string;
}

export default function RetiredSurface({
    title,
    body,
    relatedLabel,
    relatedHref,
}: RetiredSurfaceProps) {
    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-16">
            <div className="w-full max-w-[560px] text-center">
                <span className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase inline-flex items-center gap-3">
                    <span className="h-px w-6 bg-primary inline-block" />
                    Retired surface
                </span>
                <h1
                    className="mt-5 font-medium tracking-[-0.035em] leading-[1.05] text-foreground"
                    style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}
                >
                    {title}
                </h1>
                <p
                    className="mt-6 mx-auto max-w-[460px] text-foreground/70 leading-relaxed"
                    style={{ fontSize: '15px' }}
                >
                    {body}
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-foreground text-background font-mono text-sm font-semibold tracking-[0.02em] border border-foreground hover:bg-foreground/90 transition-colors"
                    >
                        Back to homepage
                        <span aria-hidden="true">→</span>
                    </Link>
                    <Link
                        href="/waitlist"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-foreground/[0.16] text-foreground font-mono text-sm tracking-[0.02em] hover:border-foreground/40 transition-colors"
                    >
                        Join the waitlist
                    </Link>
                </div>
                {relatedLabel && relatedHref && (
                    <p className="mt-8 text-[12px] text-muted/70 font-mono">
                        Looking for the new equivalent?{' '}
                        <Link href={relatedHref} className="text-primary hover:underline">
                            {relatedLabel}
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}
