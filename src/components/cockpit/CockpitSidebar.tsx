"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Bot, MessageSquare, Settings, LayoutDashboard, ChevronDown, Sparkles, Shield, Search, Plus, Cpu, Store, Bell, GitBranch, Brain, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem { href: string; label: string; icon: any; gradient: string; }
interface NavSection { title: string; items: NavItem[]; }

const NAV_SECTIONS: NavSection[] = [
    {
        title: 'Core',
        items: [
            { href: '/app', label: 'Cockpit', icon: LayoutDashboard, gradient: 'from-primary/20 to-orange-500/10' },
            { href: '/chat', label: 'Chat', icon: MessageSquare, gradient: 'from-blue-500/20 to-cyan-500/10' },
        ],
    },
    {
        title: 'AI',
        items: [
            { href: '/marketplace', label: 'Agent Store', icon: Store, gradient: 'from-purple-500/20 to-blue-500/10' },
            { href: '/agents/builder', label: 'Builder', icon: Sparkles, gradient: 'from-pink-500/20 to-rose-500/10' },
            { href: '/workflows', label: 'Workflows', icon: GitBranch, gradient: 'from-violet-500/20 to-purple-500/10' },
            { href: '/memory', label: 'Memory Bank', icon: Brain, gradient: 'from-amber-500/20 to-orange-500/10' },
        ],
    },
    {
        title: 'Account',
        items: [
            { href: '/analytics', label: 'Analytics', icon: BarChart3, gradient: 'from-cyan-500/20 to-blue-500/10' },
            { href: '/notifications', label: 'Notifications', icon: Bell, gradient: 'from-sky-500/20 to-blue-500/10' },
            { href: '/profile', label: 'Profile', icon: User, gradient: 'from-indigo-500/20 to-blue-500/10' },
            { href: '/security', label: 'Security', icon: Shield, gradient: 'from-red-500/20 to-rose-500/10' },
            { href: '/settings', label: 'Settings', icon: Settings, gradient: 'from-gray-500/20 to-slate-500/10' },
        ],
    },
];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
    const Icon = item.icon;
    return (
        <Link href={item.href} className={cn("flex items-center space-x-3 px-3 py-2 rounded-lg transition-all group relative",
            isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-gray-400 hover:bg-white/5 hover:text-white")}>
            <div className={cn("p-1 rounded transition-all", isActive ? "bg-primary/20" : `bg-gradient-to-br ${item.gradient} group-hover:opacity-80`)}>
                <Icon size={16} />
            </div>
            <span className="text-sm font-medium truncate">{item.label}</span>
            {isActive && <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(231,118,48,0.5)]" />}
        </Link>
    );
}

export function CockpitSidebar() {
    const pathname = usePathname();
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
    const [customAgents, setCustomAgents] = useState<any[]>([]);

    useEffect(() => {
        const load = () => { try { setCustomAgents(JSON.parse(localStorage.getItem('custom-agents') || '[]')); } catch {} };
        load();
        window.addEventListener('storage', load);
        const interval = setInterval(load, 2000);
        return () => { window.removeEventListener('storage', load); clearInterval(interval); };
    }, []);

    const toggleSection = (title: string) => {
        setCollapsedSections(prev => { const next = new Set(prev); if (next.has(title)) next.delete(title); else next.add(title); return next; });
    };
    const isActive = (href: string) => { if (href === '/app') return pathname === '/app'; return pathname?.startsWith(href) ?? false; };

    return (
        <aside className="w-60 flex flex-col h-full relative z-20 border-r border-white/5 hidden md:flex"
            style={{ background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(20px)' }}>
            <div className="px-5 py-4 border-b border-white/5">
                <Link href="/" className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E77630, #9945FF)' }}>
                        <Cpu size={16} className="text-white" />
                    </div>
                    <span className="font-bold text-base text-white tracking-tight">Operator<span style={{ color: '#E77630' }}>Uplift</span></span>
                </Link>
            </div>
            <div className="px-3 py-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                    <input type="text" placeholder="Search..." className="w-full bg-white/3 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-white/10 transition-all" />
                </div>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}>
                {NAV_SECTIONS.map(section => {
                    const isCollapsed = collapsedSections.has(section.title);
                    return (
                        <div key={section.title} className="mb-1">
                            <button onClick={() => toggleSection(section.title)}
                                className="flex items-center justify-between w-full px-2 py-1.5 text-[10px] text-gray-500 uppercase tracking-widest font-mono hover:text-gray-400 transition-colors">
                                <span>{section.title}</span>
                                <ChevronDown size={12} className={cn("transition-transform", isCollapsed && "-rotate-90")} />
                            </button>
                            {!isCollapsed && <div className="space-y-0.5 mt-0.5">{section.items.map(item => <NavLink key={item.href} item={item} isActive={isActive(item.href)} />)}</div>}
                        </div>
                    );
                })}
            </nav>
            <div className="border-t border-white/5 px-4 py-2 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">My Agents</span>
                <Link href="/agents/builder" className="p-1 text-gray-600 hover:text-white hover:bg-white/5 rounded transition-all" title="Create New Agent"><Plus size={12} /></Link>
            </div>
            <div className="px-3 pb-3 space-y-0.5 max-h-32 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}>
                {customAgents.length === 0 ? (
                    <p className="text-xs text-gray-600 px-3 py-2">No active agents</p>
                ) : customAgents.map((agent: any) => (
                    <div key={agent.id} className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm">
                        <Bot size={14} className="text-primary shrink-0" />
                        <span className="truncate text-xs font-medium">{agent.name}</span>
                        <span className="ml-auto w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                    </div>
                ))}
            </div>
        </aside>
    );
}
