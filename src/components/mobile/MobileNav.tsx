"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquare, Store, Network, MoreHorizontal, Bot, Sparkles, GitBranch, Brain, Shield, BarChart3, User, Settings, Bell, X } from 'lucide-react';

const mainNav = [
    { href: '/app', icon: Home, label: 'Home' },
    { href: '/chat', icon: MessageSquare, label: 'Chat' },
    { href: '/marketplace', icon: Store, label: 'Agents' },
    { href: '/swarm', icon: Network, label: 'Swarm' },
];

const moreItems = [
    { href: '/agents', icon: Bot, label: 'My Agents' },
    { href: '/agents/builder', icon: Sparkles, label: 'Agent Builder' },
    { href: '/workflows', icon: GitBranch, label: 'Workflows' },
    { href: '/memory', icon: Brain, label: 'Memory Bank' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/security', icon: Shield, label: 'Security' },
    { href: '/notifications', icon: Bell, label: 'Notifications' },
    { href: '/profile', icon: User, label: 'Profile' },
    { href: '/settings', icon: Settings, label: 'Settings' },
];

export function MobileNav() {
    const pathname = usePathname();
    const [showMore, setShowMore] = useState(false);

    if (pathname?.startsWith('/auth') || pathname === '/login' || pathname === '/signup' || pathname === '/onboarding') return null;

    const isMoreActive = moreItems.some(item => pathname === item.href || pathname?.startsWith(item.href + '/'));

    return (
        <>
            {/* More menu overlay */}
            {showMore && (
                <div className="fixed inset-0 z-[60] md:hidden" onClick={() => setShowMore(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="absolute bottom-[72px] left-4 right-4 bg-[#0a0a0f] border border-white/10 rounded-2xl p-4 shadow-2xl z-10"
                        onClick={e => e.stopPropagation()}
                        style={{ marginBottom: 'env(safe-area-inset-bottom, 0)' }}>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">More</span>
                            <button onClick={() => setShowMore(false)} className="text-gray-500 hover:text-white p-1"><X size={16} /></button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {moreItems.map(item => {
                                const Icon = item.icon;
                                const active = pathname === item.href;
                                return (
                                    <Link key={item.href} href={item.href} onClick={() => setShowMore(false)}
                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${active ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                                        <Icon size={20} />
                                        <span className="text-[10px] font-medium">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom nav bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#050508]/95 backdrop-blur-xl border-t border-white/10 md:hidden"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
                <div className="flex items-center justify-around px-2 py-1.5">
                    {mainNav.map(item => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                            <Link key={item.href} href={item.href}
                                className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 min-w-[56px] active:scale-95 ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                                <div className={`p-1 rounded-lg transition-all duration-200 ${isActive ? 'bg-primary/15' : ''}`}>
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                                </div>
                                <span className={`text-[9px] font-medium ${isActive ? 'text-primary' : 'text-gray-600'}`}>{item.label}</span>
                            </Link>
                        );
                    })}
                    {/* More button */}
                    <button onClick={() => setShowMore(!showMore)}
                        className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 min-w-[56px] active:scale-95 ${isMoreActive || showMore ? 'text-primary' : 'text-gray-500'}`}>
                        <div className={`p-1 rounded-lg transition-all duration-200 ${isMoreActive || showMore ? 'bg-primary/15' : ''}`}>
                            <MoreHorizontal size={20} strokeWidth={isMoreActive || showMore ? 2.5 : 1.5} />
                        </div>
                        <span className={`text-[9px] font-medium ${isMoreActive || showMore ? 'text-primary' : 'text-gray-600'}`}>More</span>
                    </button>
                </div>
            </nav>
        </>
    );
}

export function MobileHeader({ title }: { title?: string }) {
    return (<><header className="fixed top-0 left-0 right-0 z-40 bg-[#050508]/90 backdrop-blur-xl border-b border-white/10 md:hidden">
        <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"><span className="text-black font-bold text-sm">OU</span></div><span className="font-semibold text-white">Uplift</span></div>
            {title && <h1 className="text-lg font-semibold text-white">{title}</h1>}
        </div>
    </header><div className="h-14 md:hidden" /></>);
}

export function MobilePageWrapper({ children }: { children: React.ReactNode }) {
    return <div className="min-h-screen pb-20 md:pb-0">{children}</div>;
}
