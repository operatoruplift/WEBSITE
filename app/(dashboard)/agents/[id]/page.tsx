"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bot, ArrowLeft, Play, Pause, Trash2, Star, Settings, MessageSquare, Clock, Zap, Brain, Shield, Save, Activity, FileJson, KeyRound, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { MobilePageWrapper } from '@/src/components/mobile';
import { useToast } from '@/src/components/ui/Toast';

/**
 * Map a display agent name/id to its published registration slug.
 * Only Calendar and Gmail have /agents/{slug}.json right now.
 */
function getRegistrationSlug(agent: { id: string; name: string; tools?: string[] }): string | null {
    const id = agent.id.toLowerCase();
    const name = agent.name.toLowerCase();
    if (id.includes('calendar') || name.includes('calendar')) return 'calendar';
    if (id.includes('gmail') || name.includes('gmail') || name.includes('email')) return 'gmail';
    if (agent.tools?.some(t => t.toLowerCase() === 'calendar')) return 'calendar';
    if (agent.tools?.some(t => t.toLowerCase() === 'gmail')) return 'gmail';
    return null;
}

/**
 * Verify panel, shown only on agents that have a registration
 * document. Links to the ERC-8004-style manifest and the receipt
 * public key so a judge can verify both without leaving this page.
 */
function VerifyPanel({ slug }: { slug: string }) {
    const [checksum, setChecksum] = useState<string | null>(null);
    const [pubkey, setPubkey] = useState<string | null>(null);

    useEffect(() => {
        // Fetch registration to display checksum
        fetch(`/agents/${slug}.json`)
            .then(r => r.ok ? r.json() : null)
            .then((d: { checksum?: string } | null) => setChecksum(d?.checksum || null))
            .catch(() => setChecksum(null));

        fetch('/api/receipts/public-key')
            .then(r => r.ok ? r.json() : null)
            .then((d: { public_key_base64?: string } | null) => setPubkey(d?.public_key_base64 || null))
            .catch(() => setPubkey(null));
    }, [slug]);

    return (
        <Card variant="glass" className="border-[#F97316]/20">
            <CardHeader className="border-b border-foreground/10 pb-4">
                <CardTitle className="flex items-center gap-2 text-sm font-mono text-[#F97316] uppercase tracking-widest">
                    <CheckCircle2 size={14} /> Verify Agent
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
                <p className="text-xs text-gray-400 leading-relaxed">
                    This agent publishes an ERC-8004-style registration document and signs every paid action with an ed25519 key. Both are independently verifiable.
                </p>

                <a
                    href={`/agents/${slug}.json`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-xl bg-foreground/[0.03] border border-foreground/10 hover:border-[#F97316]/30 transition-colors"
                >
                    <FileJson size={16} className="text-[#F97316] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                            Agent manifest <ExternalLink size={11} className="text-[#52525B]" />
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono truncate">/agents/{slug}.json</div>
                        {checksum && (
                            <div className="text-[10px] text-[#52525B] font-mono mt-1.5 break-all">
                                sha256: <span className="text-[#A1A1AA]">{checksum.slice(0, 32)}…</span>
                            </div>
                        )}
                    </div>
                </a>

                <a
                    href="/api/receipts/public-key"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-xl bg-foreground/[0.03] border border-foreground/10 hover:border-[#F97316]/30 transition-colors"
                >
                    <KeyRound size={16} className="text-[#F97316] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                            Receipt public key <ExternalLink size={11} className="text-[#52525B]" />
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono truncate">/api/receipts/public-key</div>
                        {pubkey && (
                            <div className="text-[10px] text-[#52525B] font-mono mt-1.5 break-all">
                                ed25519: <span className="text-[#A1A1AA]">{pubkey.slice(0, 32)}…</span>
                            </div>
                        )}
                    </div>
                </a>

                <p className="text-[10px] text-[#52525B] leading-relaxed">
                    Verify a receipt: take the signed JSON from{' '}
                    <Link href="/security" className="text-[#F97316] hover:underline">Security</Link>
                   , canonicalize the <code className="text-[#A1A1AA]">receipt</code> field, and ed25519-verify against the public key.
                </p>
            </CardContent>
        </Card>
    );
}

interface AgentConfig {
    id: string;
    name: string;
    description: string;
    model: string;
    systemPrompt: string;
    status: 'running' | 'idle' | 'error' | 'stopped';
    temperature: number;
    maxTokens: number;
    tools: string[];
    createdAt: string;
    sessions: number;
    memoryUsage: string;
}

const DEMO_AGENTS: Record<string, AgentConfig> = {
    '1': { id: '1', name: 'CodePilot Pro', description: 'Full-stack code generation and debugging assistant', model: 'Claude Opus 4.6', systemPrompt: 'You are an expert software engineer. Analyze code, find bugs, suggest improvements, and generate clean, production-ready code.', status: 'running', temperature: 0.3, maxTokens: 4096, tools: ['code_exec', 'file_read', 'web_search'], createdAt: '2026-01-15', sessions: 142, memoryUsage: '2.4GB' },
    '2': { id: '2', name: 'Research Assistant', description: 'Multi-source academic research and synthesis', model: 'GPT-4.1', systemPrompt: 'You are a research assistant. Find, analyze, and synthesize information from multiple sources. Always cite sources and highlight key findings.', status: 'running', temperature: 0.5, maxTokens: 8192, tools: ['web_search', 'file_read', 'memory_search'], createdAt: '2026-02-03', sessions: 89, memoryUsage: '1.8GB' },
    '3': { id: '3', name: 'Blackwall Guard', description: 'Real-time API security and threat detection', model: 'Claude Opus 4.6', systemPrompt: 'You are a security analyst. Monitor API traffic, detect threats, and respond to incidents. Flag suspicious patterns and recommend mitigations.', status: 'running', temperature: 0.1, maxTokens: 2048, tools: ['api_monitor', 'threat_scan', 'alert_send'], createdAt: '2026-01-01', sessions: 2847, memoryUsage: '512MB' },
};

const ACTIVITY_LOG = [
    { time: '2m ago', event: 'Completed task: "Refactor auth middleware"', type: 'success' },
    { time: '15m ago', event: 'Started code analysis on 3 repos', type: 'info' },
    { time: '1h ago', event: 'Memory indexed: 847 new embeddings', type: 'info' },
    { time: '3h ago', event: 'Session timeout, auto-paused', type: 'warning' },
    { time: '1d ago', event: 'Deployed from Agent Builder', type: 'success' },
];

export default function AgentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const agentId = params.id as string;

    const [agent, setAgent] = useState<AgentConfig | null>(null);
    const [editedPrompt, setEditedPrompt] = useState('');
    const [editedTemp, setEditedTemp] = useState(0.5);
    const [editedMaxTokens, setEditedMaxTokens] = useState(4096);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        // Try custom agents from localStorage first
        try {
            const custom = JSON.parse(localStorage.getItem('custom-agents') || '[]');
            const found = custom.find((a: { id?: string; name: string }, i: number) => (a.id || `custom-${i}`) === agentId);
            if (found) {
                const config: AgentConfig = {
                    id: agentId, name: found.name, description: found.description || 'Custom agent',
                    model: found.model || 'Claude Sonnet 4.6', systemPrompt: found.systemPrompt || '',
                    status: 'idle', temperature: 0.5, maxTokens: 4096, tools: [],
                    createdAt: found.createdAt || new Date().toISOString().split('T')[0],
                    sessions: 0, memoryUsage: '0MB',
                };
                setAgent(config);
                setEditedPrompt(config.systemPrompt);
                setEditedTemp(config.temperature);
                setEditedMaxTokens(config.maxTokens);
                return;
            }
        } catch { /* fall through */ }

        // Fall back to demo agents
        const demo = DEMO_AGENTS[agentId];
        if (demo) {
            setAgent(demo);
            setEditedPrompt(demo.systemPrompt);
            setEditedTemp(demo.temperature);
            setEditedMaxTokens(demo.maxTokens);
        }
    }, [agentId]);

    const handleSave = () => {
        if (!agent) return;
        setAgent({ ...agent, systemPrompt: editedPrompt, temperature: editedTemp, maxTokens: editedMaxTokens });
        setHasChanges(false);
        showToast(`${agent.name} configuration saved`, 'success');
    };

    const toggleStatus = () => {
        if (!agent) return;
        const newStatus = agent.status === 'running' ? 'idle' : 'running';
        setAgent({ ...agent, status: newStatus });
        showToast(`${agent.name} ${newStatus === 'running' ? 'started' : 'paused'}`, newStatus === 'running' ? 'success' : 'info');
    };

    const deleteAgent = () => {
        if (!agent) return;
        if (!confirm(`Delete "${agent.name}"? This cannot be undone.`)) return;
        showToast(`${agent.name} deleted`, 'warning');
        router.push('/agents');
    };

    if (!agent) {
        return (
            <MobilePageWrapper>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <Bot size={48} className="text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">Agent not found</p>
                        <Link href="/agents" className="text-primary hover:underline text-sm">Back to agents</Link>
                    </div>
                </div>
            </MobilePageWrapper>
        );
    }

    const statusColors: Record<string, string> = {
        running: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
        idle: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
        error: 'text-red-400 bg-red-400/10 border-red-400/20',
        stopped: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
    };

    return (
        <MobilePageWrapper>
            <div className="min-h-screen p-6 lg:p-8">
                <div className="max-w-[1200px] mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link href="/agents" className="p-2 rounded-lg bg-foreground/[0.04] text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                <ArrowLeft size={18} />
                            </Link>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl lg:text-3xl font-medium tracking-tight text-white">{agent.name}</h1>
                                    <Badge variant="default" className={`text-[10px] border ${statusColors[agent.status]}`}>
                                        {agent.status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 inline-block" />}
                                        {agent.status.toUpperCase()}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-400">{agent.description}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {hasChanges && <GlowButton size="sm" onClick={handleSave}><Save size={14} className="mr-1" /> Save Changes</GlowButton>}
                            <GlowButton variant="outline" size="sm" onClick={toggleStatus}>
                                {agent.status === 'running' ? <><Pause size={14} className="mr-1" /> Pause</> : <><Play size={14} className="mr-1" /> Start</>}
                            </GlowButton>
                            <button onClick={deleteAgent} className="p-2 rounded-lg bg-foreground/[0.04] text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors" aria-label="Delete agent"><Trash2 size={16} /></button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Sessions', value: agent.sessions.toLocaleString(), icon: MessageSquare, color: 'text-[#F97316]' },
                            { label: 'Memory', value: agent.memoryUsage, icon: Brain, color: 'text-[#F97316]' },
                            { label: 'Model', value: agent.model.split(' ').pop(), icon: Zap, color: 'text-emerald-400' },
                            { label: 'Created', value: agent.createdAt, icon: Clock, color: 'text-gray-400' },
                        ].map(stat => {
                            const Icon = stat.icon;
                            return (
                                <Card key={stat.label} variant="glass">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <Icon size={16} className={stat.color} />
                                        <div><div className="text-lg font-bold text-white">{stat.value}</div><div className="text-[10px] text-gray-500 uppercase">{stat.label}</div></div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Configuration */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card variant="glass">
                                <CardHeader className="border-b border-foreground/10 pb-4">
                                    <CardTitle className="flex items-center gap-2 text-sm font-mono text-gray-400 uppercase tracking-widest">
                                        <Settings size={14} className="text-[#F97316]" /> Configuration
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div>
                                        <label htmlFor="system-prompt" className="text-sm text-gray-400 block mb-2">System Prompt</label>
                                        <textarea id="system-prompt" value={editedPrompt} onChange={e => { setEditedPrompt(e.target.value); setHasChanges(true); }}
                                            rows={5} className="w-full bg-foreground/[0.04] border border-white/10 rounded-lg px-4 py-3 text-white text-sm font-mono focus:border-primary/50 focus:outline-none resize-none" aria-label="System prompt" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="temperature" className="text-sm text-gray-400 block mb-2">Temperature: {editedTemp}</label>
                                            <input id="temperature" type="range" min={0} max={1} step={0.1} value={editedTemp} onChange={e => { setEditedTemp(parseFloat(e.target.value)); setHasChanges(true); }}
                                                className="w-full accent-primary" aria-label="Temperature" />
                                            <div className="flex justify-between text-[10px] text-gray-600 mt-1"><span>Precise</span><span>Creative</span></div>
                                        </div>
                                        <div>
                                            <label htmlFor="max-tokens" className="text-sm text-gray-400 block mb-2">Max Tokens</label>
                                            <select id="max-tokens" value={editedMaxTokens} onChange={e => { setEditedMaxTokens(parseInt(e.target.value)); setHasChanges(true); }}
                                                className="w-full bg-foreground/[0.04] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-primary/50 focus:outline-none" aria-label="Max tokens">
                                                <option value={1024}>1,024</option>
                                                <option value={2048}>2,048</option>
                                                <option value={4096}>4,096</option>
                                                <option value={8192}>8,192</option>
                                                <option value={16384}>16,384</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 block mb-2">Tools</label>
                                        <div className="flex flex-wrap gap-2">
                                            {(agent.tools.length > 0 ? agent.tools : ['code_exec', 'file_read', 'web_search', 'memory_search']).map(tool => (
                                                <Badge key={tool} variant="default" className="text-xs bg-foreground/[0.04] border border-white/10">{tool}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Verify panel, only for agents with a published registration doc */}
                            {(() => {
                                const slug = getRegistrationSlug(agent);
                                return slug ? <VerifyPanel slug={slug} /> : null;
                            })()}

                            {/* Chat shortcut */}
                            <Card variant="glass" className="group cursor-pointer hover:border-primary/20 transition-all" onClick={() => router.push('/chat')}>
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <MessageSquare size={20} className="text-primary" />
                                        <div>
                                            <h3 className="text-white font-medium">Chat with {agent.name}</h3>
                                            <p className="text-xs text-gray-500">Open a new session with this agent</p>
                                        </div>
                                    </div>
                                    <ArrowLeft size={16} className="text-gray-600 rotate-180 group-hover:text-primary transition-colors" />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Activity Log */}
                        <div>
                            <Card variant="glass">
                                <CardHeader className="border-b border-foreground/10 pb-4">
                                    <CardTitle className="flex items-center gap-2 text-sm font-mono text-gray-400 uppercase tracking-widest">
                                        <Activity size={14} className="text-[#F97316]" /> Activity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-white/5">
                                        {ACTIVITY_LOG.map((entry, i) => (
                                            <div key={i} className="px-4 py-3">
                                                <p className="text-xs text-gray-300">{entry.event}</p>
                                                <span className="text-[10px] text-gray-600 font-mono">{entry.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </MobilePageWrapper>
    );
}
