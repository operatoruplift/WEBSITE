'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * FoundingMemberCounter , live founding-member count rendered as a
 * hero trust signal. Replaces the static "53/100 Private Beta Spots
 * Claimed" tile (no real 100-person cap; founder direction
 * 2026-06-03 was to keep the door open and let the number grow).
 *
 * Visual: large mono numeral on the left, label on the right.
 *   - Counts up from 0 to the displayed total over ~900ms on mount.
 *   - "founding member spots claimed" stays static while the
 *     numeral animates.
 *   - Tween respects prefers-reduced-motion: AT users and people
 *     who set that media query see the final number immediately.
 *
 * Display value: max(realWaitlistTotal, MIN_FOUNDING_MEMBERS).
 *
 * Why a floor and not the raw Supabase total?
 *   - The Supabase `waitlist` table only counts email submissions
 *     on this site. The real founding-member cohort also includes
 *     people who pledged via Discord, X DMs, founder direct
 *     outreach, and the earliest pilot cohort that predates the
 *     /waitlist page. The user-flagged count was "at least 53"
 *     (2026-06-04) but the Supabase row count was 19, so the
 *     pre-launch tile under-counted real interest by ~3x.
 *   - The floor is published in MIN_FOUNDING_MEMBERS below. Update
 *     it whenever the founder confirms new off-platform commits.
 *   - Once the Supabase count exceeds the floor, the floor stops
 *     mattering: real signups always win.
 */

/**
 * Conservative floor for the founding-member display. Reflects
 * pledges that exist outside the `waitlist` table (Discord, founder
 * outreach, early pilot). Bumped 2026-06-04 from 19 (Supabase row
 * count at the time) to 53 per the founder's count of confirmed
 * founding members across all surfaces.
 */
const MIN_FOUNDING_MEMBERS = 53;

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
                const real = data && typeof data.total === 'number' ? data.total : 0;
                // Take the higher of the real Supabase total and the
                // published floor. So the tile always reflects at
                // least the founder-confirmed count, and naturally
                // grows past it as new signups come in.
                setTarget(Math.max(real, MIN_FOUNDING_MEMBERS));
            })
            .catch(() => {
                // Network error: still show the floor so the trust
                // signal works even when the counts endpoint is down.
                if (!cancelled) setTarget(MIN_FOUNDING_MEMBERS);
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
            aria-label={`${target} founding member ${target === 1 ? 'spot' : 'spots'} claimed`}
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
                    founding member spots claimed
                </p>
                <p className="text-[11px] text-muted leading-tight">
                    Join early. Lock in founding pricing forever.
                </p>
            </div>
        </div>
    );
};

export default FoundingMemberCounter;
