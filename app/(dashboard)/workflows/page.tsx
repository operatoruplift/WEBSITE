"use client";

import { useState } from 'react';
import { Plus, Play, Pause, Trash2, Zap, ArrowRight, Clock, CheckCircle2, AlertCircle, GitBranch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { MobilePageWrapper } from '@/src/components/mobile';

interface Workflow {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'paused' | 'draft';
    steps: number;
    lastRun: string;
    runs: number;
    trigger: string;
}

const DEMO_WORKFLOWS: Workflow[] = [
    { id: '1', name: 'Daily Code Review', description: 'Scans PRs, runs analysis, posts summaries to Slack', status: 'active', steps: 5, lastRun: '2h ago', runs: 142, trigger: 'Cron: 9am daily' },
    { id: '2', name: 'Issue Triage Bot', description: 'Classifies new GitHub issues by severity and assigns teams', status: 'active', steps: 3, lastRun: '15m ago', runs: 891, trigger: 'Webhook: GitHub' },
    { id: '3', name: 'Customer Onboarding', description: 'Sends welcome sequence, provisions accounts, schedules demo', status: 'paused', steps: 7, lastRun: '3d ago', runs: 56, trigger: 'Event: signup' },
    { id: '4', name: 'Security Scan Pipeline', description: 'Weekly dependency audit with CVE matching and PR creation', status: 'active', steps: 4, lastRun: '1d ago', runs: 23, trigger: 'Cron: Monday 6am' },
    { id: '5', name: 'Content Pipeline', description: 'Draft blog posts from research notes using RAG + editing agents', status: 'draft', steps: 6, lastRun: 'Never', runs: 0, trigger: 'Manual' },
];

const statusConfig = {
    active: { color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', dot: 'bg-emerald-400', label: 'Active' },
    paused: { color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', dot: 'bg-amber-400', label: 'Paused' },
    draft: { color: 'text-gray-400', bg: 'bg-gray-400/10 border-gray-400/20', dot: 'bg-gray-400', label: 'Draft' },
};

export default function WorkflowsPage() {
    const [workflows] = useState<Workflow[]>(DEMO_WORKFLOWS);

    return (
        <MobilePageWrapper>
            <div className="min-h-screen p-6 lg:p-8">
                <div className="max-w-[1400px] mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fadeInUp">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <GitBranch size={16} className="text-[#9945FF]" />
                                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Automation</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-white">Workflows</h1>
                            <p className="text-sm text-gray-400 mt-1">Design and manage multi-step agent pipelines</p>
                        </div>
                        <GlowButton className="h-11 px-5">
                            <Plus size={16} className="mr-2" /> New Workflow
                        </GlowButton>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { label: 'Active Workflows', value: workflows.filter(w => w.status === 'active').length, icon: Play, color: 'text-emerald-400' },
                            { label: 'Total Runs', value: workflows.reduce((sum, w) => sum + w.runs, 0).toLocaleString(), icon: Zap, color: 'text-[#E77630]' },
                            { label: 'Total Steps', value: workflows.reduce((sum, w) => sum + w.steps, 0), icon: GitBranch, color: 'text-[#9945FF]' },
                        ].map(stat => {
                            const Icon = stat.icon;
                            return (
                                <Card key={stat.label} variant="glass" className="group">
                                    <CardContent className="p-5 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"><Icon size={18} className={stat.color} /></div>
                                        <div><div className="text-2xl font-bold text-white">{stat.value}</div><div className="text-xs text-gray-500">{stat.label}</div></div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="space-y-3">
                        {workflows.map((wf, i) => {
                            const status = statusConfig[wf.status];
                            return (
                                <Card key={wf.id} variant="glass" className="card-animate group hover:border-white/10 transition-all" style={{ animationDelay: `${i * 80}ms` }}>
                                    <CardContent className="p-5">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl ${status.bg} border flex items-center justify-center flex-shrink-0`}>
                                                    <span className={`w-2 h-2 rounded-full ${status.dot} ${wf.status === 'active' ? 'animate-pulse' : ''}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-white font-semibold truncate">{wf.name}</h3>
                                                        <Badge variant="default" className={`text-[9px] ${status.bg} ${status.color} border`}>{status.label}</Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-400 truncate">{wf.description}</p>
                                                    <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-gray-500">
                                                        <span className="flex items-center gap-1"><GitBranch size={10} /> {wf.steps} steps</span>
                                                        <span className="flex items-center gap-1"><Clock size={10} /> {wf.lastRun}</span>
                                                        <span className="flex items-center gap-1"><Zap size={10} /> {wf.runs} runs</span>
                                                        <span className="flex items-center gap-1"><ArrowRight size={10} /> {wf.trigger}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {wf.status === 'active' && <button className="p-2 rounded-lg bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors"><Pause size={14} /></button>}
                                                {wf.status === 'paused' && <button className="p-2 rounded-lg bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 transition-colors"><Play size={14} /></button>}
                                                {wf.status === 'draft' && <button className="p-2 rounded-lg bg-[#E77630]/10 text-[#E77630] hover:bg-[#E77630]/20 transition-colors"><Play size={14} /></button>}
                                                <button className="p-2 rounded-lg bg-white/5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 size={14} /></button>
                                            </div>
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
