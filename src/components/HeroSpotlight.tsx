'use client';

import React, { useEffect, useRef } from 'react';

/**
 * HeroSpotlight, a subtle cursor-following radial highlight that
 * makes the hero feel responsive without animating distractingly.
 *
 * Aceternity-inspired pattern: a single radial-gradient layer
 * positioned absolutely inside the hero section that updates its
 * --x and --y CSS variables to wherever the pointer is. Disabled
 * on touch devices (no pointer) and when prefers-reduced-motion
 * is set.
 *
 * Drop into the hero section as a sibling to .accent-glow. The
 * z-index keeps it behind the headline + CTA column.
 */
const HeroSpotlight: React.FC = () => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const section = el.parentElement;
        if (!section) return;

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion) {
            el.style.setProperty('--x', '50%');
            el.style.setProperty('--y', '40%');
            return;
        }

        // Hide on touch-only devices, the effect needs a mouse.
        const isTouch = window.matchMedia('(hover: none)').matches;
        if (isTouch) {
            el.style.opacity = '0';
            return;
        }

        let raf: number | null = null;
        let pendingX = 50;
        let pendingY = 40;

        const handle = (e: PointerEvent) => {
            const rect = section.getBoundingClientRect();
            pendingX = ((e.clientX - rect.left) / rect.width) * 100;
            pendingY = ((e.clientY - rect.top) / rect.height) * 100;
            if (raf == null) {
                raf = requestAnimationFrame(() => {
                    el.style.setProperty('--x', `${pendingX}%`);
                    el.style.setProperty('--y', `${pendingY}%`);
                    raf = null;
                });
            }
        };

        const onEnter = () => { el.style.opacity = '1'; };
        const onLeave = () => { el.style.opacity = '0'; };

        section.addEventListener('pointermove', handle);
        section.addEventListener('pointerenter', onEnter);
        section.addEventListener('pointerleave', onLeave);
        return () => {
            section.removeEventListener('pointermove', handle);
            section.removeEventListener('pointerenter', onEnter);
            section.removeEventListener('pointerleave', onLeave);
            if (raf != null) cancelAnimationFrame(raf);
        };
    }, []);

    return (
        <div
            ref={ref}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300"
            style={{
                background:
                    'radial-gradient(420px circle at var(--x, 50%) var(--y, 40%), rgba(240, 138, 76, 0.14), transparent 65%)',
            }}
        />
    );
};

export default HeroSpotlight;
