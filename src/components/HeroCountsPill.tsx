'use client';

import React, { useEffect, useState } from 'react';

interface Counts {
    total: number;
    founder: number;
}

/**
 * Hero social-proof pill. Fetches /api/waitlist/counts on mount and
 * renders a small chip below the "Now in private beta" badge that
 * reads "N on the waitlist" (and "+ M founder members" if any have
 * paid).
 *
 * Rendered as a sibling of the private-beta badge so the two pills
 * stack visually without competing with the headline below. Hides
 * entirely on error or when total === 0 so the hero never carries
 * an empty pill (honest empty state, see /waitlist for the same
 * pattern, app/waitlist/page.tsx:124).
 */
const HeroCountsPill: React.FC = () => {
    const [counts, setCounts] = useState<Counts | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/waitlist/counts', { cache: 'no-store' })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (cancelled) return;
                if (data && typeof data.total === 'number') {
                    setCounts({ total: data.total, founder: data.founder ?? 0 });
                }
            })
            .catch(() => {
                // Silently keep counts null. The pill simply does not render.
            });
        return () => {
            cancelled = true;
        };
    }, []);

    if (!counts || counts.total <= 0) return null;

    return (
        <div
            className="inline-flex items-center gap-2 px-3 py-1.5 -mt-6 md:-mt-10 mb-2 rounded-full border border-foreground/[0.10] bg-foreground/[0.015] font-mono text-[11px] tracking-[0.04em] text-muted/90"
            aria-label={`${counts.total} ${counts.total === 1 ? 'operator' : 'operators'} on the waitlist`}
        >
            <span>{counts.total.toLocaleString()} on the waitlist</span>
            {counts.founder > 0 ? (
                <>
                    <span aria-hidden="true" className="text-foreground/30">·</span>
                    <span className="text-foreground/80">
                        {counts.founder.toLocaleString()} founder
                        {counts.founder === 1 ? '' : 's'}
                    </span>
                </>
            ) : null}
        </div>
    );
};

export default HeroCountsPill;
