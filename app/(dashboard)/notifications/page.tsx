"use client";

import { useState } from 'react';
import { Bell, Check, CheckCheck, Shield, Bot, MessageSquare, Workflow, Brain, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { MobilePageWrapper } from '@/src/components/mobile';

interface Notification { id: string; type: string; title: string; message: string; time: string; read: boolean; icon: any; color: string; }

const INITIAL_NOTIFICATIONS: Notification[] = [
    { id: '1', type: 'security', title: 'Blackwall: 3 threats blocked', message: 'Prompt injection attempts neutralized from 2 IPs', time: '5m ago', read: false, icon: Shield, color: 'text-red-400' },
    { id: '2', type: 'agent', title: 'CodePilot Pro updated', message: 'Version 2.4.1 available with TypeScript improvements', time: '1h ago', read: false, icon: Bot, color: 'text-[#F59E0B]' },
    { id: '3', type: 'chat', title: 'New message from Founder Ops', message: 'Weekly summary report is ready for review', time: '2h ago', read: false, icon: MessageSquare, color: 'text-[#E77630]' },
    { id: '4', type: 'workflow', title: 'Nightly sync completed', message: 'GitHub issue sync and embeddings updated successfully', time: '6h ago', read: true, icon: Workflow, color: 'text-emerald-400' },
    { id: '5', type: 'memory', title: 'Knowledge base indexed', message: '1,247 new documents processed and embedded', time: '1d ago', read: true, icon: Brain, color: 'text-primary' },
];

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const deleteNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

    return (
        <MobilePageWrapper>
            <div className="min-h-screen p-6 lg:p-8">
                <div className="max-w-[800px] mx-auto space-y-8">
                    <div className="flex items-center justify-between animate-fadeInUp">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-sky-500 to-blue-700 border border-sky-500/50"><Bell size={20} className="text-white" /></div>
                                {unreadCount > 0 && <Badge variant="primary" className="text-[10px] font-mono">{unreadCount} NEW</Badge>}
                            </div>
                            <h1 className="text-4xl font-medium tracking-tight text-white">Notifications</h1>
                        </div>
                        {unreadCount > 0 && <GlowButton variant="outline" size="sm" onClick={markAllRead}><CheckCheck size={14} className="mr-2" /> Mark all read</GlowButton>}
                    </div>
                    <div className="space-y-3">
                        {notifications.length === 0 ? (
                            <div className="text-center py-20"><Bell size={48} className="text-gray-700 mx-auto mb-4" /><p className="text-gray-500">No notifications</p></div>
                        ) : notifications.map(n => {
                            const Icon = n.icon;
                            return (
                                <Card key={n.id} variant="glass" className={`group cursor-pointer transition-all ${!n.read ? 'border-primary/20 bg-primary/[0.03]' : 'border-white/5'}`} onClick={() => markRead(n.id)}>
                                    <CardContent className="p-4 flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center shrink-0 ${n.color}`}><Icon size={18} /></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between mb-1">
                                                <h3 className={`text-sm font-semibold truncate ${!n.read ? 'text-white' : 'text-gray-400'}`}>{n.title}</h3>
                                                <span className="text-[10px] font-mono text-gray-600 shrink-0 ml-2">{n.time}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{n.message}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {!n.read && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                                            <button onClick={e => { e.stopPropagation(); deleteNotification(n.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        </MobilePageWrapper>
    );
}
