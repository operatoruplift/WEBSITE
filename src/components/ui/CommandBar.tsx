"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MessageSquare, Workflow, Bot, Code, Settings, Brain, Layers, Bell, Coins, Network, Sparkles, LayoutDashboard, ArrowRight, Command, Shield } from 'lucide-react';

interface CommandItem { id: string; label: string; description: string; icon: React.ComponentType<{ size?: number; className?: string }>; href?: string; action?: () => void; category: string; }

const COMMANDS: CommandItem[] = [
    { id: 'nav-cockpit', label: 'Go to Cockpit', description: 'Dashboard overview', icon: LayoutDashboard, href: '/app', category: 'Navigation' },
    { id: 'nav-chat', label: 'Go to Chat', description: 'Start or continue conversations', icon: MessageSquare, href: '/chat', category: 'Navigation' },
    { id: 'nav-marketplace', label: 'Go to Agent Store', description: 'Browse & install agents', icon: Bot, href: '/marketplace', category: 'Navigation' },
    { id: 'nav-builder', label: 'Go to Agent Builder', description: 'Create custom agents', icon: Sparkles, href: '/agents/builder', category: 'Navigation' },
    { id: 'nav-notifications', label: 'Go to Notifications', description: 'View alerts', icon: Shield, href: '/notifications', category: 'Navigation' },
    { id: 'nav-security', label: 'Go to Security', description: 'Blackwall security dashboard', icon: Shield, href: '/security', category: 'Navigation' },
    { id: 'nav-settings', label: 'Go to Settings', description: 'Account preferences', icon: Settings, href: '/settings', category: 'Navigation' },
    { id: 'nav-home', label: 'Go to Website', description: 'Marketing homepage', icon: Bot, href: '/', category: 'Navigation' },
    { id: 'act-new-chat', label: 'New Chat', description: 'Start a fresh conversation', icon: MessageSquare, href: '/chat', category: 'Actions' },
    { id: 'act-build-agent', label: 'Build Agent', description: 'Create an agent from scratch', icon: Sparkles, href: '/agents/builder', category: 'Actions' },
];

export function CommandBar() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(prev => !prev); }
            if (e.key === 'Escape') setOpen(false);
            // Global shortcuts (only when not typing in an input)
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); router.push('/chat'); }
            if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); router.push('/agents/builder'); }
            if ((e.metaKey || e.ctrlKey) && e.key === ',') { e.preventDefault(); router.push('/settings'); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [router]);

    useEffect(() => { if (open) { setQuery(''); setSelectedIndex(0); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);

    const filtered = query.trim() ? COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.description.toLowerCase().includes(query.toLowerCase())) : COMMANDS;
    const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => { if (!acc[item.category]) acc[item.category] = []; acc[item.category].push(item); return acc; }, {});
    const flatFiltered = Object.values(grouped).flat();

    const executeCommand = useCallback((item: CommandItem) => { if (item.href) router.push(item.href); if (item.action) item.action(); setOpen(false); }, [router]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, flatFiltered.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
        else if (e.key === 'Enter' && flatFiltered[selectedIndex]) executeCommand(flatFiltered[selectedIndex]);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="relative w-full max-w-xl mx-4 rounded-2xl border border-white/10 overflow-hidden shadow-2xl" style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(24px)' }}>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                    <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <input ref={inputRef} type="text" value={query} onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }} onKeyDown={handleKeyDown}
                        placeholder="Search commands, navigate, or take action..." className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none" />
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-gray-500 border border-white/10 bg-white/5 font-mono">ESC</kbd>
                </div>
                <div className="max-h-80 overflow-y-auto py-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}>
                    {flatFiltered.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">No results for &quot;{query}&quot;</div>
                    ) : (
                        Object.entries(grouped).map(([category, items]) => (
                            <div key={category}>
                                <div className="px-4 py-1.5 text-[10px] text-gray-600 uppercase tracking-widest font-mono">{category}</div>
                                {items.map(item => {
                                    const globalIdx = flatFiltered.indexOf(item);
                                    const isSelected = globalIdx === selectedIndex;
                                    const Icon = item.icon;
                                    return (
                                        <button key={item.id} onClick={() => executeCommand(item)} onMouseEnter={() => setSelectedIndex(globalIdx)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isSelected ? 'bg-white/5 text-white' : 'text-gray-400 hover:bg-white/3'}`}>
                                            <Icon size={16} className={isSelected ? 'text-primary' : ''} />
                                            <div className="flex-1 min-w-0"><span className="text-sm font-medium">{item.label}</span><span className="text-xs text-gray-600 ml-2">{item.description}</span></div>
                                            {isSelected && <ArrowRight size={14} className="text-primary flex-shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>
                <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-600">
                    <span>↑↓ navigate · ↵ select · esc close</span>
                    <span className="flex items-center gap-1"><Command size={10} />K to toggle</span>
                </div>
            </div>
        </div>
    );
}
