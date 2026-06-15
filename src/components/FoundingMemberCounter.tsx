'use client';

import React, { useEffect, useRef, useState } from 'react';
import { WAITLIST_OFFPLATFORM_BASE } from '@/lib/waitlist-constants';

/**
 * FoundingMemberCounter , live founding-member count rendered as a
 * hero trust signal. Replaces the static "53/100 Private Beta Spots
 * Claimed" tile (no real 100-person cap; founder direction
 * 2026-06-03 was to keep the door open and let the number grow).
 *
 * Visual: large mono numeral on the left, label on the right.
 *   - Counts up from 0 to the displayed total over ~900ms on mount.
 *   - "people on the waitlist" stays static while the
 *     numeral animates.
 *   - Tween respects prefers-reduced-motion: AT users and people
 *     who set that media query see the final number immediately.
 *
 * Display value: whatever /api/waitlist/counts returns for `total`,
 * which the server already computes as the off-platform base plus the
 * live Supabase table count (see lib/waitlist-constants.ts). So the
 * hero reads 585+ and grows by one with every new web signup. On a
 * network error we fall back to the off-platform base alone so the
 * trust signal still works when the counts endpoint is down.
 */

const FoundingMemberCounter: React.FC = () => {
    const [target, setTarget] = useState<number | null>(null);
    const [displayed, setDisplayed] = useState(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/waitlist/counts', { cache: 'no-store' })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (cancelled) return;
                // The server already folds the off-platform base into
                // `total`, so use it directly. Fall back to the base
                // alone if the payload is missing/malformed.
                const total =
                    data && typeof data.total === 'number'
                        ? data.total
                        : WAITLIST_OFFPLATFORM_BASE;
                setTarget(total);
            })
            .catch(() => {
                // Network error: still show the off-platform base so the
                // trust signal works even when the counts endpoint is down.
                if (!cancelled) setTarget(WAITLIST_OFFPLATFORM_BASE);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (target == null) return;

        const reducedMotion =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion) {
            setDisplayed(target);
            return;
        }

        const durationMs = 900;
        const start = performance.now();
        const startValue = 0;

        const tick = (now: number) => {
            const elapsed = now - start;
            const t = Math.min(1, elapsed / durationMs);
            // ease-out cubic: starts fast, slows into the final value
            const eased = 1 - Math.pow(1 - t, 3);
            const next = Math.round(startValue + (target - startValue) * eased);
            setDisplayed(next);
            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
            }
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        };
    }, [target]);

    if (target == null || target <= 0) return null;

    return (
        <div
            className="inline-flex items-center gap-3 px-6 py-3 mb-8 md:mb-10 rounded-xl border border-primary/20 bg-primary/[0.04] font-mono"
            aria-label={`${target} people ${target === 1 ? 'is' : 'are'} on the waitlist`}
        >
            <span
                aria-hidden="true"
                className="text-2xl md:text-3xl font-bold text-primary tracking-tight tabular-nums"
            >
                {displayed.toLocaleString()}
            </span>
            <div aria-hidden="true" className="h-8 w-px bg-primary/20" />
            <div className="text-left">
                <p className="text-sm font-bold text-foreground leading-tight">
                    people on the waitlist
                </p>
                <p className="text-[11px] text-muted leading-tight">
                    Join early. Lock in founding pricing forever.
                </p>
            </div>
        </div>
    );
};

export default FoundingMemberCounter;
