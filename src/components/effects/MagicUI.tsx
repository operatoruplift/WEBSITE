'use client';

/**
 * MagicUI, Simplified.
 *
 * The previous "wow effect" versions (BorderBeam rotating gradient,
 * Spotlight cursor-tracking glow, shimmer-sweep buttons, hover-lift
 * AnimatedCard) were dialed back to match uplift.exe's calm,
 * consumer-friendly design. Components are now plain surfaces with
 * subtle hover states only. API is preserved so existing call sites
 * don't need to change.
 */
import React from 'react';

/* BorderBeam, no-op. Kept as named export for backwards compatibility.
 * Accepts arbitrary props (size, duration, colorFrom, colorTo, etc.)
 * because callers spread the props that the original animated version
 * used. We discard them here so the simplified component never errors. */
export function BorderBeam(props: Record<string, unknown>) {
    void props;
    return null;
}

/* Spotlight, plain passthrough. No cursor tracking, no glow. */
export function Spotlight({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
    fill?: string;
}) {
    return <div className={className}>{children}</div>;
}

/* ShimmerButton, plain button, no sweep. */
export function ShimmerButton({
    children,
    className = '',
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
            className={`rounded-lg px-6 py-2.5 font-medium text-white bg-primary hover:bg-primary/90 transition-colors disabled:opacity-40 ${className}`}
        >
            {children}
        </button>
    );
}

/* AnimatedCard, plain card with subtle hover border only. No lift, no beam. */
export function AnimatedCard({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
    hoverGlow?: boolean;
}) {
    return (
        <div className={`relative rounded-xl border border-foreground/10 bg-foreground/[0.04] p-4 transition-colors hover:border-foreground/20 ${className}`}>
            {children}
        </div>
    );
}

/* NumberTicker, static number. No count-up animation. */
export function NumberTicker({
    value,
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
    return (
        <span className={`tabular-nums ${className}`}>
            {prefix}{value.toFixed(decimals)}{suffix}
        </span>
    );
}

/* StaggerChildren, plain container. No sequential fade-in. */
export function StaggerChildren({
    children,
    className = '',
}: {
    children: React.ReactNode;
    delayMs?: number;
    className?: string;
}) {
    return <div className={className}>{children}</div>;
}
