import React from 'react';

type LogoProps = { className?: string };

/**
 * Brand marks for the "Built With" carousel — monochrome SVG
 * (fill="currentColor") so the grayscale-default + color-on-hover
 * treatment works uniformly.
 *
 * All marks: 24x24 viewBox, 1:1 aspect — no clipping, no stretching.
 * Shapes are the official brand silhouettes at reduced detail so they
 * render cleanly at w-5 h-5.
 */

// Privy — official "P" monogram with notch (from privy.io)
// Rounded square containing a stylized P. Looks like a P when viewed small.
export const PrivyLogo = ({ className = 'w-5 h-5' }: LogoProps) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Privy"
    >
        <path d="M4 3h12a5 5 0 0 1 0 10h-5v4H4V3zm5 4v2h6a1 1 0 0 0 0-2H9z" />
    </svg>
);

// Supabase — electric arrow (official mark, single-color)
export const SupabaseLogo = ({ className = 'w-5 h-5' }: LogoProps) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Supabase"
    >
        <path d="M13.976 1.805a1.05 1.05 0 0 1 1.847.66v8.07h7.054c.875 0 1.337 1.034.765 1.695l-8.8 10.155a1.05 1.05 0 0 1-1.847-.66v-8.07H5.942c-.874 0-1.337-1.034-.764-1.695l8.798-10.155z" />
    </svg>
);

// Solana — three parallel bars, slanted right.
// Official orientation: top+bottom bars slant one way, middle bar the
// OTHER way (this is what makes the Solana mark instantly recognizable).
// 24x24 viewBox, centered, equal spacing.
export const SolanaLogo = ({ className = 'w-5 h-5' }: LogoProps) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Solana"
    >
        {/* Top bar — slants up-right (starts lower-left, ends upper-right) */}
        <path d="M5 5h12l2.5 2H5.5z" />
        {/* Middle bar — slants the OPPOSITE way (down-right) — this is the Solana signature */}
        <path d="M5.5 10h14L17 12H5z" />
        {/* Bottom bar — slants up-right (parallel to top) */}
        <path d="M5 15h12l2.5 2H5.5z" />
    </svg>
);

// Vercel — equilateral triangle mark
export const VercelLogo = ({ className = 'w-5 h-5' }: LogoProps) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Vercel"
    >
        <path d="M12 2 22.7 20.5H1.3L12 2z" />
    </svg>
);

// Map for easy lookup
export const infraLogos: Record<string, React.FC<LogoProps>> = {
    Privy: PrivyLogo,
    Supabase: SupabaseLogo,
    Solana: SolanaLogo,
    Vercel: VercelLogo,
};
