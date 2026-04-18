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

// Privy — clean capital P monogram with a round counter.
// At w-5 h-5 the previous mark read as a blob; the new path is a
// proper closed-outline "P": vertical stem, rounded bowl, empty
// interior. Renders cleanly at small sizes and in monochrome.
export const PrivyLogo = ({ className = 'w-5 h-5' }: LogoProps) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Privy"
    >
        {/* Outer P silhouette */}
        <path d="M4 3h10a6 6 0 0 1 0 12h-5v6H4V3zm5 4v4h5a2 2 0 0 0 0-4H9z" />
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

// Solana — three parallel slanted bars, all tilting the same way.
// Brand mark at reduced detail: each bar is a parallelogram whose
// left edge is at the sheared x=sheared position, mirroring the
// official mark where the three horizontal stripes share one skew
// angle (they are not opposing — that was a previous mistake).
// 24x24 viewBox, centered, equal spacing.
export const SolanaLogo = ({ className = 'w-5 h-5' }: LogoProps) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Solana"
    >
        {/* Top bar — parallelogram sheared to the right */}
        <path d="M7 5h12l-2 2.5H5z" />
        {/* Middle bar — same shear direction as top */}
        <path d="M7 10.25h12l-2 2.5H5z" />
        {/* Bottom bar — same shear direction as top */}
        <path d="M7 15.5h12l-2 2.5H5z" />
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
