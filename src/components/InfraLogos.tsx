import React from 'react';

type LogoProps = { className?: string };

/**
 * Brand marks for the "Built With" carousel. Monochrome SVGs
 * (fill="currentColor") so the carousel's grayscale-default +
 * hover-color treatment works uniformly.
 *
 * All marks are sized for a 24x24 viewBox with stroke-widths /
 * shape weights tuned so they render cleanly at w-5 h-5 AND at the
 * h-6 carousel row height. Aspect-ratio: 1:1 so no clipping.
 *
 * Sources for the official shapes (simplified):
 *   - Privy: https://privy.io (crest with P notch)
 *   - Supabase: https://supabase.com (electric arrow)
 *   - Solana: https://solana.com (three parallel bars)
 *   - Vercel: https://vercel.com (triangle)
 */

// Privy — stylized shield with P interior
export const PrivyLogo = ({ className = 'w-5 h-5' }: LogoProps) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Privy"
    >
        <path d="M12 2.5c-2.4 0-4.6.5-6.6 1.4-.4.2-.6.6-.6 1v6.2c0 4.8 3 9 7.2 10.3.3.1.6.1.9 0 4.2-1.3 7.1-5.5 7.1-10.3V4.9c0-.4-.2-.8-.6-1-2-.9-4.2-1.4-6.6-1.4zm0 2.1c1.9 0 3.7.3 5.4 1v5.5c0 3.8-2.2 7.1-5.4 8.2v-6.3h2.5v-2H12V8.3h3.6v-2H9.4v8.1c-.8-.9-1.4-2.1-1.6-3.4-.1-.5-.2-1-.2-1.5V5.6c1.7-.7 3.5-1 5.4-1z" />
    </svg>
);

// Supabase — power bolt / arrow
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

// Solana — three slanted parallel bars (official wordmark simplified)
export const SolanaLogo = ({ className = 'w-5 h-5' }: LogoProps) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Solana"
    >
        {/* Top bar — slants up-right */}
        <path d="M4.5 5.5h13.2c.27 0 .52.11.7.3l1.9 1.9a.5.5 0 0 1-.35.85H6.75c-.27 0-.52-.11-.7-.3L4.15 6.35a.5.5 0 0 1 .35-.85z" />
        {/* Middle bar — slants down-right */}
        <path d="M19.5 11.25h-13.2c-.27 0-.52.11-.7.3l-1.9 1.9a.5.5 0 0 0 .35.85h13.2c.27 0 .52-.11.7-.3l1.9-1.9a.5.5 0 0 0-.35-.85z" />
        {/* Bottom bar — slants up-right */}
        <path d="M4.5 17h13.2c.27 0 .52.11.7.3l1.9 1.9a.5.5 0 0 1-.35.85H6.75c-.27 0-.52-.11-.7-.3l-1.9-1.9a.5.5 0 0 1 .35-.85z" />
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
