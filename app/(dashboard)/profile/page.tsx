"use client";

import { useState, useEffect } from 'react';
import { Mail, Calendar, Shield, Key, LogOut, Edit3, Camera, X, Check } from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { MobilePageWrapper } from '@/src/components/mobile';

export default function ProfilePage() {
    const [user, setUser] = useState({ name: 'Commander', email: 'you@example.com', plan: 'Pro', joined: 'March 2026' });
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');

    useEffect(() => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                setUser(prev => ({ ...prev, ...parsed }));
            }
        } catch { /* demo mode */ }
    }, []);

    const startEdit = () => {
        setEditName(user.name);
        setEditEmail(user.email);
        setEditing(true);
    };

    const saveEdit = () => {
        const updated = { ...user, name: editName.trim() || user.name, email: editEmail.trim() || user.email };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        setEditing(false);
    };

    const [stats, setStats] = useState([
        { label: 'Chat Sessions', value: '0' },
        { label: 'Installed Agents', value: '0' },
        { label: 'Custom Agents', value: '0' },
        { label: 'API Keys', value: '0' },
    ]);

    useEffect(() => {
        try {
            const sessions = JSON.parse(localStorage.getItem('chat-sessions-v2') || '[]');
            const installed = JSON.parse(localStorage.getItem('installed-agents') || '[]');
            const custom = JSON.parse(localStorage.getItem('custom-agents') || '[]');
            const settings = JSON.parse(localStorage.getItem('ou-settings') || '{}');
            const keys = settings.apiKeys || [];
            setStats([
                { label: 'Chat Sessions', value: String(sessions.length) },
                { label: 'Installed Agents', value: String(installed.length) },
                { label: 'Custom Agents', value: String(custom.length) },
                { label: 'API Keys', value: String(keys.length) },
            ]);
        } catch { /* demo mode */ }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <MobilePageWrapper>
            <div className="min-h-screen p-6 lg:p-8">
                <div className="max-w-3xl mx-auto space-y-8">
                    <div className="animate-fadeInUp">
                        <h1 className="text-3xl font-medium tracking-tight text-white">Profile</h1>
                        <p className="text-sm text-gray-400 mt-1">Manage your account and preferences</p>
                    </div>

                    <Card variant="glass" className="overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-[#E77630]/20 via-[#E77630]/20 to-[#F59E0B]/20 relative">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />
                        </div>
                        <CardContent className="p-6 -mt-16 relative">
                            <div className="flex flex-col md:flex-row md:items-end gap-6">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#E77630] to-[#E77630] flex items-center justify-center text-3xl font-bold text-white shadow-2xl border-4 border-[#050508]">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all">
                                        <Camera size={12} />
                                    </button>
                                </div>
                                <div className="flex-1">
                                    {editing ? (
                                        <div className="space-y-2">
                                            <input value={editName} onChange={e => setEditName(e.target.value)} aria-label="Name"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-lg font-bold focus:border-primary/50 focus:outline-none" />
                                            <input value={editEmail} onChange={e => setEditEmail(e.target.value)} aria-label="Email"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-sm focus:border-primary/50 focus:outline-none" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                                                <Badge variant="default" className="bg-primary/10 text-primary border border-primary/20">{user.plan}</Badge>
                                            </div>
                                            <p className="text-sm text-gray-400">{user.email}</p>
                                        </>
                                    )}
                                </div>
                                {editing ? (
                                    <div className="flex gap-2">
                                        <button onClick={saveEdit} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all text-sm"><Check size={14} /> Save</button>
                                        <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all text-sm"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <button onClick={startEdit} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm">
                                        <Edit3 size={14} /> Edit Profile
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                                {stats.map(stat => (
                                    <div key={stat.label} className="text-center p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="glass">
                        <CardContent className="p-6 space-y-5">
                            <h3 className="text-sm font-mono text-gray-400 uppercase tracking-widest">Account Details</h3>
                            {[
                                { icon: Mail, label: 'Email', value: user.email },
                                { icon: Calendar, label: 'Member Since', value: user.joined },
                                { icon: Shield, label: 'Security', value: 'Password Protected' },
                                { icon: Key, label: 'API Keys', value: `${stats[3]?.value || '0'} active` },
                            ].map(item => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <Icon size={16} className="text-gray-500" />
                                            <span className="text-sm text-gray-400">{item.label}</span>
                                        </div>
                                        <span className="text-sm text-white font-medium">{item.value}</span>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <Card variant="glass" className="border-red-500/10">
                        <CardContent className="p-6">
                            <h3 className="text-sm font-mono text-red-400 uppercase tracking-widest mb-4">Danger Zone</h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-white">Sign Out</div>
                                    <div className="text-xs text-gray-500">End your current session</div>
                                </div>
                                <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-sm">
                                    <LogOut size={14} /> Sign Out
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MobilePageWrapper>
    );
}
