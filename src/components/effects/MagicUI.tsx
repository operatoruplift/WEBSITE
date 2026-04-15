'use client';

/**
 * Magic UI / Aceternity-inspired effects for Operator Uplift.
 *
 * Ported from the @operatoruplift/ui storybook design system.
 * Uses framer-motion (already a dep). No external libraries needed.
 */
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Border Beam — traveling light on card hover ── */
export function BorderBeam({
    size = 200,
    duration = 6,
    colorFrom = '#F97316',
    colorTo = '#F59E0B',
    className = '',
}: {
    size?: number;
    duration?: number;
    colorFrom?: string;
    colorTo?: string;
    className?: string;
}) {
    return (
        <div
            style={{ '--size': `${size}px`, '--duration': `${duration}s`, '--color-from': colorFrom, '--color-to': colorTo } as React.CSSProperties}
            className={`pointer-events-none absolute inset-[-1px] rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden ${className}`}
        >
            <div
                className="absolute inset-0 rounded-[inherit]"
                style={{
                    background: `conic-gradient(from 0deg, transparent 0 330deg, ${colorFrom}, ${colorTo} 360deg)`,
                    animation: `spin ${duration}s linear infinite`,
                }}
            />
            <div className="absolute inset-[1px] rounded-[inherit] bg-[#111111]" />
        </div>
    );
}

/* ── Spotlight — cursor-tracking glow ── */
export function Spotlight({
    children,
    className = '',
    fill = '#F97316',
}: {
    children: React.ReactNode;
    className?: string;
    fill?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [active, setActive] = useState(false);

    const handleMove = (e: React.MouseEvent) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <div
            ref={ref}
            onMouseMove={handleMove}
            onMouseEnter={() => setActive(true)}
            onMouseLeave={() => setActive(false)}
            className={`relative ${className}`}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
                style={{
                    opacity: active ? 1 : 0,
                    background: `radial-gradient(400px circle at ${pos.x}px ${pos.y}px, ${fill}18, transparent 60%)`,
                }}
            />
            {children}
        </div>
    );
}

/* ── Shimmer Button — glowing sweep animation ── */
export function ShimmerButton({
    children,
    className = '',
    shimmerColor = '#F97316',
    onClick,
    disabled,
}: {
    children: React.ReactNode;
    className?: string;
    shimmerColor?: string;
    onClick?: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`relative overflow-hidden rounded-lg px-6 py-2.5 font-medium text-white bg-primary hover:bg-primary/90 transition-all disabled:opacity-40 ${className}`}
        >
            <div
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: `linear-gradient(90deg, transparent, ${shimmerColor}30, transparent)`,
                    animation: 'shimmer-sweep 2s ease-in-out infinite',
                }}
            />
            <span className="relative z-10">{children}</span>
        </button>
    );
}

/* ── Animated Card — hover lift + border glow ── */
export function AnimatedCard({
    children,
    className = '',
    hoverGlow = true,
}: {
    children: React.ReactNode;
    className?: string;
    hoverGlow?: boolean;
}) {
    return (
        <motion.div
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className={`group relative rounded-xl border border-[#222222] bg-[#111111] p-4 transition-colors hover:border-[#333333] overflow-hidden ${className}`}
        >
            {hoverGlow && <BorderBeam />}
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
}

/* ── Number Ticker — count-up animation ── */
export function NumberTicker({
    value,
    durationMs = 1200,
    decimals = 0,
    prefix = '',
    suffix = '',
    className = '',
}: {
    value: number;
    durationMs?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const [display, setDisplay] = useState(0);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        if (!ref.current) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setInView(true);
        }, { threshold: 0.1 });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!inView) return;
        let raf = 0;
        const start = performance.now();
        const step = (now: number) => {
            const t = Math.min(1, (now - start) / durationMs);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(value * eased);
            if (t < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [inView, value, durationMs]);

    return (
        <span ref={ref} className={`tabular-nums ${className}`}>
            {prefix}{display.toFixed(decimals)}{suffix}
        </span>
    );
}

/* ── Stagger Children — fade in sequentially ── */
export function StaggerChildren({
    children,
    delayMs = 80,
    className = '',
}: {
    children: React.ReactNode;
    delayMs?: number;
    className?: string;
}) {
    const items = React.Children.toArray(children);
    return (
        <div className={className}>
            <AnimatePresence>
                {items.map((child, i) => (
                    <motion.div
                        key={(child as any)?.key ?? i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: (i * delayMs) / 1000, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {child}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
