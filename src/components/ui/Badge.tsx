import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'offline';
    className?: string;
    pulse?: boolean;
    style?: React.CSSProperties;
}

export const Badge = ({ children, variant = 'default', className, pulse = false, style }: BadgeProps) => {
    const variants = {
        default: "bg-white/5 text-gray-300 border-white/10",
        success: "bg-green-500/10 text-green-400 border-green-500/20",
        warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        error: "bg-red-500/10 text-red-400 border-red-500/20",
        info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        primary: "bg-primary/10 text-primary border-primary/20",
        offline: "bg-gray-800/80 text-gray-400 border-gray-600 border-dashed backdrop-blur-md",
    };
    return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-md", variants[variant], pulse && "animate-pulse", className)} style={style}>
            {pulse && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />}
            {children}
        </span>
    );
};
