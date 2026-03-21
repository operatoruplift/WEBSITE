"use client";

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Zap, Clock, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { MobilePageWrapper } from '@/src/components/mobile';

interface MetricCard { label: string; value: string; change: string; positive: boolean; icon: any; }

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

    const metrics: MetricCard[] = [
        { label: 'Total Sessions', value: '2,847', change: '+12.3%', positive: true, icon: Activity },
        { label: 'Active Users', value: '342', change: '+8.1%', positive: true, icon: Users },
        { label: 'Agent Invocations', value: '18.2K', change: '+24.7%', positive: true, icon: Zap },
        { label: 'Avg Response Time', value: '1.2s', change: '-15%', positive: true, icon: Clock },
    ];

    const topAgents = [
        { name: 'Code Reviewer', invocations: 4200, trend: '+18%', bar: 85 },
        { name: 'Research Assistant', invocations: 3100, trend: '+12%', bar: 63 },
        { name: 'Writing Coach', invocations: 2800, trend: '+9%', bar: 57 },
        { name: 'Data Analyst', invocations: 2100, trend: '+22%', bar: 43 },
        { name: 'Security Scanner', invocations: 1800, trend: '+5%', bar: 37 },
    ];

    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        value: Math.floor(Math.random() * 80 + 20 + (i > 8 && i < 20 ? 60 : 0)),
    }));

    return (
        <MobilePageWrapper>
            <div className="min-h-screen p-6 lg:p-8">
                <div className="max-w-[1400px] mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fadeInUp">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <BarChart3 size={16} className="text-[#F59E0B]" />
                                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Insights</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-medium tracking-tight text-white">Analytics</h1>
                            <p className="text-sm text-gray-400 mt-1">Platform usage, agent performance, and trends</p>
                        </div>
                        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                            {(['24h', '7d', '30d'] as const).map(range => (
                                <button key={range} onClick={() => setTimeRange(range)} className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${timeRange === range ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>{range}</button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {metrics.map((m, i) => {
                            const Icon = m.icon;
                            return (
                                <Card key={m.label} variant="glass" className="card-animate" style={{ animationDelay: `${i * 80}ms` }}>
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"><Icon size={18} className="text-[#F59E0B]" /></div>
                                            <div className={`flex items-center gap-1 text-xs font-mono ${m.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {m.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{m.change}
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-white mb-1">{m.value}</div>
                                        <div className="text-xs text-gray-500">{m.label}</div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card variant="glass" className="lg:col-span-2 card-animate" style={{ animationDelay: '300ms' }}>
                            <CardHeader className="border-b border-white/5 pb-4">
                                <CardTitle className="flex items-center gap-2 text-sm text-gray-300 font-mono uppercase tracking-widest">
                                    <Activity size={14} className="text-[#F59E0B]" /> Session Activity (Today)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex items-end gap-1 h-40">
                                    {hourlyData.map((d, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                            <div className="w-full rounded-t transition-all duration-300 group-hover:bg-[#F59E0B] bg-[#F59E0B]/40" style={{ height: `${d.value}%` }} />
                                            {i % 4 === 0 && <span className="text-[8px] text-gray-600 font-mono">{d.hour}</span>}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card variant="glass" className="card-animate" style={{ animationDelay: '400ms' }}>
                            <CardHeader className="border-b border-white/5 pb-4">
                                <CardTitle className="flex items-center gap-2 text-sm text-gray-300 font-mono uppercase tracking-widest">
                                    <TrendingUp size={14} className="text-[#E77630]" /> Top Agents
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-4">
                                    {topAgents.map((agent, i) => (
                                        <div key={agent.name} className="group">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-mono text-gray-600 w-4">{i + 1}.</span>
                                                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{agent.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-gray-500">{agent.invocations.toLocaleString()}</span>
                                                    <Badge variant="default" className="text-[9px] bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">{agent.trend}</Badge>
                                                </div>
                                            </div>
                                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-[#E77630] to-[#E77630] rounded-full transition-all duration-700" style={{ width: `${agent.bar}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </MobilePageWrapper>
    );
}
