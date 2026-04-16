import React from 'react';

type LogoProps = { className?: string };

/**
 * Brand marks for the infrastructure stack shown in the "Built With"
 * carousel. Each is a simplified SVG — official marks at simplified
 * weights to render cleanly at w-5 h-5 and degrade to grayscale.
 *
 * These are deliberately monochrome (fill="currentColor") so the
 * carousel's default grayscale + hover-color treatment works.
 */

// Privy — stylized P
export const PrivyLogo = ({ className = 'w-5 h-5' }: LogoProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 3h7.5a5.5 5.5 0 0 1 0 11H8v7H5V3zm3 3v5h4.5a2.5 2.5 0 0 0 0-5H8z" />
    </svg>
);

// Supabase — two-tone arrow (rendered as single fill)
export const SupabaseLogo = ({ className = 'w-5 h-5' }: LogoProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.3 1.8c.6-.7 1.8-.3 1.8.7v8.4h7.4c1 0 1.5 1.1.9 1.8l-8.6 10c-.6.7-1.8.3-1.8-.7v-8.4H1.6c-1 0-1.5-1.1-.9-1.8l12.6-10z" />
    </svg>
);

// Solana — three parallel slanted bars
export const SolanaLogo = ({ className = 'w-5 h-5' }: LogoProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 6.5h14l-2 2.5H3l2-2.5zm0 4.3h14l-2 2.5H3l2-2.5zm0 4.3h14l-2 2.5H3l2-2.5z" />
    </svg>
);

// Vercel — triangle
export const VercelLogo = ({ className = 'w-5 h-5' }: LogoProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3l10 17H2L12 3z" />
    </svg>
);

// Map for easy lookup
export const infraLogos: Record<string, React.FC<LogoProps>> = {
    Privy: PrivyLogo,
    Supabase: SupabaseLogo,
    Solana: SolanaLogo,
    Vercel: VercelLogo,
};
