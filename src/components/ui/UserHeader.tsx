"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Settings, Search, Command, ChevronDown, LogOut, User, Building2 } from 'lucide-react';

export function UserHeader() {
    const [showProfile, setShowProfile] = useState(false);
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);
    const currentPage = segments[segments.length - 1] || 'Dashboard';
    const formattedPage = currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace(/-/g, ' ');

    return (
        <header className="h-12 flex items-center justify-between px-5 border-b border-white/5 relative z-30 flex-shrink-0"
            style={{ background: 'rgba(5,5,8,0.6)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center gap-2 text-sm capitalize">
                <span className="flex items-center gap-1 text-gray-400 font-mono text-xs">
                    <Building2 size={12} className="text-primary/70" /> Operator
                </span>
                <span className="text-gray-700">/</span>
                <span className="text-gray-400 font-medium">{formattedPage}</span>
            </div>
            <div className="flex items-center gap-1">
                <button onClick={() => { const ev = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }); window.dispatchEvent(ev); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-500 bg-white/3 border border-white/5 hover:bg-white/5 hover:text-gray-300 transition-all" title="Search (⌘K)">
                    <Search size={12} /><span className="hidden md:inline">Search</span>
                    <kbd className="hidden md:inline-flex items-center gap-0.5 ml-1 text-[10px] font-mono text-gray-600"><Command size={9} />K</kbd>
                </button>
                <Link href="/notifications" className="relative p-2 rounded-lg text-gray-500 hover:bg-white/5 hover:text-white transition-all">
                    <Bell size={16} /><span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
                </Link>
                <Link href="/settings" className="p-2 rounded-lg text-gray-500 hover:bg-white/5 hover:text-white transition-all"><Settings size={16} /></Link>
                <div className="relative ml-1">
                    <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-all">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #E77630, #E77630)' }}>U</div>
                        <ChevronDown size={12} className={`text-gray-500 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
                    </button>
                    {showProfile && (
                        <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-white/10 py-1 shadow-2xl" style={{ background: 'rgba(15,15,20,0.95)', backdropFilter: 'blur(20px)' }}>
                            <div className="px-3 py-2 border-b border-white/5">
                                <div className="text-sm font-medium text-white">User</div>
                                <div className="text-[10px] text-gray-500">user@operator.uplift</div>
                            </div>
                            <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"><User size={14} /> Profile</Link>
                            <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"><Settings size={14} /> Settings</Link>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"><LogOut size={14} /> Sign Out</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
