"use client";

import { useState } from 'react';
import { Plus, Play, Pause, Trash2, Zap, ArrowRight, Clock, GitBranch, X } from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { MobilePageWrapper } from '@/src/components/mobile';
import { useToast } from '@/src/components/ui/Toast';
import { addNotification } from '@/lib/notifications';

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
    const [workflows, setWorkflows] = useState<Workflow[]>(DEMO_WORKFLOWS);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newTrigger, setNewTrigger] = useState('Manual');
    const { showToast } = useToast();

    const toggleStatus = (id: string) => {
        setWorkflows(prev => prev.map(wf => {
            if (wf.id !== id) return wf;
            const newStatus = wf.status === 'active' ? 'paused' : 'active';
            showToast(`${wf.name} ${newStatus === 'active' ? 'activated' : 'paused'}`, newStatus === 'active' ? 'success' : 'info');
            return { ...wf, status: newStatus };
        }));
    };

    const [runningId, setRunningId] = useState<string | null>(null);
    const [runProgress, setRunProgress] = useState(0);

    const runWorkflow = (id: string) => {
        const wf = workflows.find(w => w.id === id);
        if (!wf || runningId) return;
        setRunningId(id);
        setRunProgress(0);
        showToast(`Running "${wf.name}"...`, 'info');
        // Simulate step-by-step execution
        let step = 0;
        const totalSteps = wf.steps;
        const interval = setInterval(() => {
            step++;
            setRunProgress(Math.round((step / totalSteps) * 100));
            if (step >= totalSteps) {
                clearInterval(interval);
                setRunningId(null);
                setRunProgress(0);
                setWorkflows(prev => prev.map(w => w.id === id ? { ...w, runs: w.runs + 1, lastRun: 'Just now', status: 'active' as const } : w));
                showToast(`"${wf.name}" completed successfully! (${totalSteps} steps)`, 'success');
                addNotification({ type: 'workflow', title: `${wf.name} completed`, message: `${totalSteps} steps executed successfully`, icon: 'workflow', color: 'text-emerald-400' });
            }
        }, 1200);
    };

    const deleteWorkflow = (id: string) => {
        const wf = workflows.find(w => w.id === id);
        setWorkflows(prev => prev.filter(w => w.id !== id));
        showToast(`${wf?.name || 'Workflow'} deleted`, 'info');
    };

    const createWorkflow = () => {
        if (!newName.trim()) return;
        const wf: Workflow = {
            id: Date.now().toString(),
            name: newName.trim(),
            description: newDesc.trim() || 'New workflow',
            status: 'draft',
            steps: 1,
            lastRun: 'Never',
            runs: 0,
            trigger: newTrigger,
        };
        setWorkflows(prev => [wf, ...prev]);
        setNewName(''); setNewDesc(''); setNewTrigger('Manual');
        setShowCreate(false);
        showToast(`${wf.name} created`, 'success');
    };

    return (
        <MobilePageWrapper>
            <div className="min-h-screen p-6 lg:p-8">
                <div className="max-w-[1400px] mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fadeInUp">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <GitBranch size={16} className="text-[#E77630]" />
                                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Automation</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-medium tracking-tight text-white">Workflows</h1>
                            <p className="text-sm text-gray-400 mt-1">Design and manage multi-step agent pipelines</p>
                        </div>
                        <GlowButton className="h-11 px-5" onClick={() => setShowCreate(true)}>
                            <Plus size={16} className="mr-2" /> New Workflow
                        </GlowButton>
                    </div>

                    {/* Create Modal */}
                    {showCreate && (
                        <Card variant="glass" className="border-primary/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-white font-semibold">New Workflow</h3>
                                    <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
                                </div>
                                <div className="space-y-4">
                                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Workflow name" aria-label="Workflow name"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-primary/50 focus:outline-none" />
                                    <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description" aria-label="Workflow description"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-primary/50 focus:outline-none" />
                                    <select value={newTrigger} onChange={e => setNewTrigger(e.target.value)} aria-label="Trigger type"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-primary/50 focus:outline-none">
                                        <option value="Manual">Manual</option>
                                        <option value="Cron: Daily">Cron: Daily</option>
                                        <option value="Webhook: GitHub">Webhook: GitHub</option>
                                        <option value="Event: signup">Event: signup</option>
                                    </select>
                                    <GlowButton onClick={createWorkflow} className="w-full">Create Workflow</GlowButton>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { label: 'Active Workflows', value: workflows.filter(w => w.status === 'active').length, icon: Play, color: 'text-emerald-400' },
                            { label: 'Total Runs', value: workflows.reduce((sum, w) => sum + w.runs, 0).toLocaleString(), icon: Zap, color: 'text-[#E77630]' },
                            { label: 'Total Steps', value: workflows.reduce((sum, w) => sum + w.steps, 0), icon: GitBranch, color: 'text-[#E77630]' },
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
                        {workflows.length === 0 ? (
                            <div className="text-center py-20"><GitBranch size={48} className="text-gray-700 mx-auto mb-4" /><p className="text-gray-500">No workflows yet</p></div>
                        ) : workflows.map((wf, i) => {
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
                                                <button onClick={() => runWorkflow(wf.id)} disabled={runningId === wf.id || !!runningId}
                                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${runningId === wf.id ? 'bg-[#E77630]/20 text-[#E77630] cursor-wait' : 'bg-[#E77630]/10 text-[#E77630] hover:bg-[#E77630]/20'}`}>
                                                    {runningId === wf.id ? `${runProgress}%` : <><Zap size={12} className="inline mr-1" />Run</>}
                                                </button>
                                                {(wf.status === 'active' || wf.status === 'paused') && (
                                                    <button onClick={() => toggleStatus(wf.id)} className={`p-2 rounded-lg transition-colors ${wf.status === 'active' ? 'bg-amber-400/10 text-amber-400 hover:bg-amber-400/20' : 'bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'}`}>
                                                        {wf.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                                                    </button>
                                                )}
                                                {wf.status === 'draft' && (
                                                    <button onClick={() => toggleStatus(wf.id)} className="p-2 rounded-lg bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 transition-colors"><Play size={14} /></button>
                                                )}
                                                <button onClick={() => deleteWorkflow(wf.id)} className="p-2 rounded-lg bg-white/5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 size={14} /></button>
                                            </div>
                                            {runningId === wf.id && (
                                                <div className="w-full mt-3"><div className="w-full h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-[#E77630] rounded-full transition-all duration-500" style={{ width: `${runProgress}%` }} /></div></div>
                                            )}
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
