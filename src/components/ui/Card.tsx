import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'glass' | 'glass-dark' | 'neo-brutalism' | 'gradient';
    hover?: boolean;
    onClick?: (e?: React.MouseEvent) => void;
    style?: React.CSSProperties;
}

export const Card = ({ children, className, variant = 'default', hover = true, onClick, style }: CardProps) => {
    const baseStyles = "rounded-xl transition-all duration-300";
    const variants = {
        default: "bg-dark-700 border border-white/5",
        glass: "glass",
        "glass-dark": "bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
        "neo-brutalism": "bg-dark-800 border-2 border-white/20 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] rounded-sm",
        gradient: "bg-gradient-to-br from-dark-800 to-black border border-white/5",
    };
    const hoverStyles = hover ? "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1" : "";
    return (
        <div className={cn(baseStyles, variants[variant], hoverStyles, onClick && "cursor-pointer", className)} onClick={onClick} style={style}>
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("p-6 border-b border-white/5", className)}>{children}</div>
);

export const CardContent = React.forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(({ children, className }, ref) => (
    <div ref={ref} className={cn("p-6", className)}>{children}</div>
));
CardContent.displayName = "CardContent";

export const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 className={cn("text-lg font-semibold text-white", className)}>{children}</h3>
);

export const CardDescription = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <p className={cn("text-sm text-gray-500 mt-1", className)}>{children}</p>
);
