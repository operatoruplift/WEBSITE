"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
    Sparkles, MessageSquare, LayoutGrid, Activity, Shield,
    ScrollText, Puzzle, User, Settings, LogOut,
} from 'lucide-react';
import { Logo } from '@/src/components/Icons';
import { cn } from '@/lib/utils';

/**
 * Narrow icon dock — matches the uplift.exe Electron app layout.
 * w-14 fixed, icon-only with hover tooltip appearing to the right.
 */

interface DockItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
}

const DOCK_ITEMS: DockItem[] = [
    { href: '/chat', label: 'Chat', icon: MessageSquare },
    { href: '/marketplace', label: 'Agents', icon: LayoutGrid },
    { href: '/memory', label: 'Memory', icon: ScrollText },
    { href: '/security', label: 'Security', icon: Shield },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/profile', label: 'Profile', icon: User },
];

// Swarm, Workspace, Recent are advanced — shown only when
// localStorage.getItem('advanced_mode') === '1'
const ADVANCED_DOCK_ITEMS: DockItem[] = [
    { href: '/app', label: 'Recent', icon: Sparkles },
    { href: '/swarm', label: 'Swarm', icon: Activity },
    { href: '/integrations', label: 'Workspace', icon: Puzzle },
];

function DockIcon({ item, isActive }: { item: DockItem; isActive: boolean }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            className="relative group"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div className={cn(
                "flex w-10 h-10 items-center justify-center rounded-xl border transition-all duration-200",
                isActive
                    ? "bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316]"
                    : "bg-[#FAFAFA]/[0.04] border-[#FAFAFA]/10 text-[#FAFAFA]/60 hover:bg-[#FAFAFA]/[0.08] hover:border-[#F97316]/30 hover:text-[#F97316] hover:scale-105"
            )}>
                <Icon size={18} />
            </div>

            {/* Tooltip — appears to the right */}
            {showTooltip && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1 rounded-lg border border-[#FAFAFA]/10 bg-[#0A0A0A]/95 backdrop-blur-sm shadow-lg whitespace-nowrap">
                    <span className="text-xs font-medium text-[#FAFAFA]">{item.label}</span>
                </div>
            )}
        </Link>
    );
}

export function CockpitSidebar() {
    const pathname = usePathname();
    const [advancedMode, setAdvancedMode] = useState(false);

    // Read advanced mode flag from localStorage on mount and poll for changes
    // (cheap — only runs client-side and it's a single read)
    useState(() => {
        if (typeof window !== 'undefined') {
            setAdvancedMode(localStorage.getItem('advanced_mode') === '1');
        }
    });

    const isActive = (href: string) => {
        if (href === '/app') return pathname === '/app';
        return pathname?.startsWith(href) ?? false;
    };

    const items = advancedMode ? [...DOCK_ITEMS, ...ADVANCED_DOCK_ITEMS] : DOCK_ITEMS;

    return (
        <aside className="w-14 flex-shrink-0 flex flex-col h-full relative z-20 border-r border-[#FAFAFA]/5 bg-[#0A0A0A]/50 hidden md:flex">
            {/* Logo at top */}
            <div className="flex items-center justify-center py-4">
                <Link href="/chat" aria-label="Home">
                    <Logo className="w-7 h-7" />
                </Link>
            </div>

            {/* Dock icons */}
            <nav className="flex-1 flex flex-col items-center gap-1.5 px-2 pt-2 overflow-y-auto">
                {items.map(item => (
                    <DockIcon key={item.href} item={item} isActive={isActive(item.href)} />
                ))}
            </nav>

            {/* Logout at bottom */}
            <div className="flex items-center justify-center py-3">
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                    }}
                    className="flex w-10 h-10 items-center justify-center rounded-xl text-[#FAFAFA]/30 hover:text-red-400 hover:bg-red-400/5 transition-all"
                    title="Sign Out"
                    aria-label="Sign out"
                >
                    <LogOut size={16} />
                </button>
            </div>
        </aside>
    );
}
