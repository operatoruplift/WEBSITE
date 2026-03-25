"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquare, Store, Network, Settings } from 'lucide-react';

const navItems = [
    { href: '/app', icon: <Home size={22} />, label: 'Home' },
    { href: '/chat', icon: <MessageSquare size={22} />, label: 'Chat' },
    { href: '/marketplace', icon: <Store size={22} />, label: 'Agents' },
    { href: '/swarm', icon: <Network size={22} />, label: 'Swarm' },
    { href: '/settings', icon: <Settings size={22} />, label: 'More' },
];

export function MobileNav() {
    const pathname = usePathname();
    if (pathname?.startsWith('/auth')) return null;
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black via-black/95 to-black/80 backdrop-blur-xl border-t border-white/10 md:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
            <div className="flex items-center justify-around px-2 py-2">
                {navItems.map(item => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                        <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-[64px] ${isActive ? 'text-primary' : 'text-gray-500 hover:text-white'}`}>
                            <div className={`p-1.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-primary/20 scale-110' : ''}`}>{item.icon}</div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

export function MobileHeader({ title }: { title?: string }) {
    return (<><header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 md:hidden">
        <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"><span className="text-black font-bold text-sm">OU</span></div><span className="font-semibold text-white">Uplift</span></div>
            {title && <h1 className="text-lg font-semibold text-white">{title}</h1>}
        </div>
    </header><div className="h-14 md:hidden" /></>);
}

export function MobilePageWrapper({ children }: { children: React.ReactNode }) {
    return <div className="min-h-screen pb-20 md:pb-0">{children}</div>;
}
