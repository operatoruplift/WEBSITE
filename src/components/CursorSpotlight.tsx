'use client';

import React, { useEffect, useRef } from 'react';

/**
 * CursorSpotlight, a page-wide cursor-following orange radial
 * highlight. 2026-06-03: lifted from the hero-only HeroSpotlight
 * pattern into a fixed-position layer so every section gets the
 * effect without each one having to mount its own copy.
 *
 * Implementation:
 *   - position: fixed inset-0, pointer-events-none, behind content
 *     via z-[1] (the dot-grid backdrop sits at z-0; sections
 *     themselves use z-10)
 *   - listens on document.body for pointermove (vs each section's
 *     own getBoundingClientRect), and writes the cursor's viewport
 *     coords to --x and --y CSS variables
 *   - rAF-throttles so we update the variables at most once per
 *     paint, not per pointermove
 *   - skipped on touch-only devices (no useful pointer) and when
 *     prefers-reduced-motion is set
 *
 * Mount once at the top of app/page.tsx (and other pages that want
 * it) right after the background grid. HeroSpotlight stays in
 * Hero.tsx for now as a denser top-fold effect; CursorSpotlight
 * sits behind it on the homepage and is the sole effect everywhere
 * else.
 */
const CursorSpotlight: React.FC = () => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion) {
            el.style.setProperty('--x', '50%');
            el.style.setProperty('--y', '30%');
            return;
        }

        const isTouch = window.matchMedia('(hover: none)').matches;
        if (isTouch) {
            el.style.opacity = '0';
            return;
        }

        let raf: number | null = null;
        let pendingX = 50;
        let pendingY = 30;

        const handle = (e: PointerEvent) => {
            // Viewport-relative percentages, no per-section
            // getBoundingClientRect needed because we're position:fixed.
            pendingX = (e.clientX / window.innerWidth) * 100;
            pendingY = (e.clientY / window.innerHeight) * 100;
            if (raf == null) {
                raf = requestAnimationFrame(() => {
                    el.style.setProperty('--x', `${pendingX}%`);
                    el.style.setProperty('--y', `${pendingY}%`);
                    raf = null;
                });
            }
        };

        const onEnter = () => {
            el.style.opacity = '1';
        };
        const onLeave = () => {
            el.style.opacity = '0';
        };

        // Make the spotlight visible after the first move, so it
        // doesn't briefly flash at center-screen on page load.
        const onFirstMove = (e: PointerEvent) => {
            onEnter();
            handle(e);
            window.removeEventListener('pointermove', onFirstMove);
        };

        window.addEventListener('pointermove', onFirstMove, { once: true });
        window.addEventListener('pointermove', handle);
        document.addEventListener('mouseleave', onLeave);
        document.addEventListener('mouseenter', onEnter);

        return () => {
            window.removeEventListener('pointermove', onFirstMove);
            window.removeEventListener('pointermove', handle);
            document.removeEventListener('mouseleave', onLeave);
            document.removeEventListener('mouseenter', onEnter);
            if (raf != null) cancelAnimationFrame(raf);
        };
    }, []);

    return (
        <div
            ref={ref}
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-[1] opacity-0 transition-opacity duration-300"
            style={{
                background:
                    'radial-gradient(520px circle at var(--x, 50%) var(--y, 30%), rgba(240, 138, 76, 0.10), transparent 65%)',
            }}
        />
    );
};

export default CursorSpotlight;
