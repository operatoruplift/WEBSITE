import React from 'react';
import { cn } from '@/lib/utils';

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    glow?: boolean;
}

export const GlowButton = ({ children, variant = 'primary', size = 'md', glow = true, className, ...props }: GlowButtonProps) => {
    const baseStyles = "font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center";
    const variants = {
        primary: "bg-primary text-white hover:bg-primary-light border border-primary-light/50",
        secondary: "bg-secondary text-white hover:bg-secondary-light border border-white/10",
        outline: "border border-primary/50 text-primary hover:bg-primary/10 hover:border-primary",
    };
    const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-base", lg: "px-6 py-3 text-lg" };
    const glowStyles = glow && variant === 'primary' ? "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/40" : "";
    return <button className={cn(baseStyles, variants[variant], sizes[size], glowStyles, className)} {...props}>{children}</button>;
};
