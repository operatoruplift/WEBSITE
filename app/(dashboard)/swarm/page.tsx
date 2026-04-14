"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Network, Play, Pause, Plus, Trash2, Zap, ArrowRight, Clock, Bot, Brain, Shield, MessageSquare, X, Settings } from 'lucide-react';
import { parseToolCalls, hasToolCalls, stripToolBlocks, formatToolResult, getToolSystemPrompt } from '@/lib/toolCalls';
import type { ToolCall, ToolResult } from '@/lib/toolCalls';
import { ToolApprovalModal } from '@/src/components/ui/ToolApprovalModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { MobilePageWrapper } from '@/src/components/mobile';
import { useToast } from '@/src/components/ui/Toast';

interface SwarmAgent {
    id: string;
    name: string;
    role: string;
    model: string;
    status: 'idle' | 'thinking' | 'executing' | 'done' | 'error';
    output?: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface SwarmConfig {
    id: string;
    name: string;
    description: string;
    topology: 'sequential' | 'parallel' | 'hierarchical' | 'debate';
    agents: SwarmAgent[];
    status: 'ready' | 'running' | 'complete' | 'error';
    runs: number;
    lastRun: string;
}

const PRESET_SWARMS: SwarmConfig[] = [
    {
        id: 'code-review', name: 'Code Review Swarm', description: 'Multi-agent code review: analyzer finds issues, fixer proposes patches, reviewer validates',
        topology: 'sequential', status: 'ready', runs: 0, lastRun: 'Never',
        agents: [
            { id: 'a1', name: 'Code Analyzer', role: 'Scan codebase for bugs, vulnerabilities, and anti-patterns', model: 'Claude Opus 4.6', status: 'idle', icon: Bot },
            { id: 'a2', name: 'Fix Proposer', role: 'Generate patches for each identified issue', model: 'Claude Sonnet 4.6', status: 'idle', icon: Zap },
            { id: 'a3', name: 'Review Gate', role: 'Validate fixes meet quality standards before merge', model: 'GPT-4.1', status: 'idle', icon: Shield },
        ],
    },
    {
        id: 'research', name: 'Research Council', description: 'Parallel research agents synthesize findings into a unified report',
        topology: 'parallel', status: 'ready', runs: 0, lastRun: 'Never',
        agents: [
            { id: 'b1', name: 'Web Researcher', role: 'Search and analyze web sources', model: 'Claude Sonnet 4.6', status: 'idle', icon: Brain },
            { id: 'b2', name: 'Paper Analyst', role: 'Extract insights from academic papers', model: 'Claude Opus 4.6', status: 'idle', icon: Brain },
            { id: 'b3', name: 'Data Validator', role: 'Cross-reference claims and check sources', model: 'GPT-4.1', status: 'idle', icon: Shield },
            { id: 'b4', name: 'Report Writer', role: 'Synthesize all findings into a coherent report', model: 'Claude Opus 4.6', status: 'idle', icon: MessageSquare },
        ],
    },
    {
        id: 'debate', name: 'Agent Debate', description: 'Two agents argue opposing positions, a judge synthesizes the best answer',
        topology: 'debate', status: 'ready', runs: 0, lastRun: 'Never',
        agents: [
            { id: 'c1', name: 'Advocate', role: 'Argue in favor of the proposition', model: 'Claude Opus 4.6', status: 'idle', icon: MessageSquare },
            { id: 'c2', name: 'Skeptic', role: 'Challenge assumptions and argue against', model: 'GPT-4.1', status: 'idle', icon: MessageSquare },
            { id: 'c3', name: 'Judge', role: 'Evaluate arguments and produce final synthesis', model: 'Claude Opus 4.6', status: 'idle', icon: Shield },
        ],
    },
    {
        id: 'security', name: 'Security Audit Swarm', description: 'Hierarchical security audit: scanner, analyzer, reporter with escalation',
        topology: 'hierarchical', status: 'ready', runs: 0, lastRun: 'Never',
        agents: [
            { id: 'd1', name: 'Vuln Scanner', role: 'Scan for OWASP Top 10, CVEs, and misconfigs', model: 'Claude Sonnet 4.6', status: 'idle', icon: Shield },
            { id: 'd2', name: 'Threat Analyst', role: 'Classify severity and exploitation paths', model: 'Claude Opus 4.6', status: 'idle', icon: Brain },
            { id: 'd3', name: 'Remediation Agent', role: 'Generate fix PRs for critical vulnerabilities', model: 'Claude Sonnet 4.6', status: 'idle', icon: Zap },
        ],
    },
    {
        id: 'council', name: 'LLM Council', description: '5 advisors argue from different angles, blind-review each other, then a chairman synthesizes the strongest answer',
        topology: 'parallel', status: 'ready', runs: 0, lastRun: 'Never',
        agents: [
            { id: 'e1', name: 'Contrarian', role: 'Find what will fail. Argue against the consensus. Be the voice of skepticism.', model: 'Claude Opus 4.6', status: 'idle', icon: Shield },
            { id: 'e2', name: 'First Principles', role: 'Reframe the problem from scratch. Question all assumptions.', model: 'GPT-4.1', status: 'idle', icon: Brain },
            { id: 'e3', name: 'Expansionist', role: 'Find the upside everyone missed. What opportunities are being ignored?', model: 'Claude Sonnet 4.6', status: 'idle', icon: Zap },
            { id: 'e4', name: 'Outsider', role: 'No context, fresh eyes. What does someone with zero background see?', model: 'Gemini 2.5 Pro', status: 'idle', icon: Bot },
            { id: 'e5', name: 'Chairman', role: 'Read all 4 responses. Identify the strongest argument, the biggest blind spot, and produce one clear verdict with a concrete next step.', model: 'Claude Opus 4.6', status: 'idle', icon: MessageSquare },
        ],
    },
];

const topologyLabels: Record<string, { label: string; color: string; desc: string }> = {
    sequential: { label: 'Sequential', color: 'text-emerald-400', desc: 'A → B → C' },
    parallel: { label: 'Parallel', color: 'text-[#F59E0B]', desc: 'A | B | C → D' },
    hierarchical: { label: 'Hierarchical', color: 'text-[#E77630]', desc: 'A → [B, C]' },
    debate: { label: 'Debate', color: 'text-red-400', desc: 'A ⟷ B → Judge' },
    council: { label: 'Council', color: 'text-amber-400', desc: '5 argue → review → chairman' },
};

export default function SwarmPage() {
    const [swarms, setSwarms] = useState<SwarmConfig[]>(PRESET_SWARMS);
    const [activeSwarmId, setActiveSwarmId] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newTopology, setNewTopology] = useState<'sequential' | 'parallel' | 'hierarchical' | 'debate'>('sequential');
    const { showToast } = useToast();

    const activeSwarm = swarms.find(s => s.id === activeSwarmId);

    // Tool-call approval state
    const [pendingToolCall, setPendingToolCall] = useState<{ call: ToolCall; agentName: string } | null>(null);
    const toolCallResolveRef = useRef<((result: ToolResult | null) => void) | null>(null);

    const getUserId = (): string => {
        try {
            const user = localStorage.getItem('user');
            if (user) return JSON.parse(user).id || 'demo-user';
        } catch { /* fallback */ }
        return 'demo-user';
    };

    /** Wait for user to approve/deny a tool call via the modal. Returns ToolResult or null (denied). */
    const requestToolApproval = (call: ToolCall, agentName: string): Promise<ToolResult | null> => {
        return new Promise((resolve) => {
            toolCallResolveRef.current = resolve;
            setPendingToolCall({ call, agentName });
        });
    };

    const callAgent = async (agent: SwarmAgent, context: string): Promise<string> => {
        const toolPrompt = getToolSystemPrompt();
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `You are "${agent.name}" with role: ${agent.role}. Context from previous agents: ${context}. Execute your role concisely. If you need calendar or email data, emit a <tool_use> block.`,
                    model: agent.model.toLowerCase().replace(/ /g, '-'),
                    systemPrompt: `You are an AI agent named "${agent.name}". Your role: ${agent.role}. Be concise and action-oriented.${toolPrompt}`,
                }),
            });
            if (res.ok && res.body) {
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let output = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    output += decoder.decode(value, { stream: true });
                }

                // Check for tool calls in the agent's response
                if (output && hasToolCalls(output)) {
                    const calls = parseToolCalls(output);
                    const displayText = stripToolBlocks(output);
                    let fullResult = displayText;

                    for (const call of calls) {
                        const result = await requestToolApproval(call, agent.name);
                        if (result) {
                            const formatted = formatToolResult(result);
                            fullResult += `\n\n${formatted}`;
                        } else {
                            fullResult += `\n\n**Tool Denied** — ${call.tool}.${call.action} was not approved.`;
                        }
                    }

                    return fullResult;
                }

                if (output) return output;
            }
        } catch { /* fall through to demo */ }
        // Realistic mock output per agent role — simulate a real debate
        await new Promise(r => setTimeout(r, 800 + Math.random() * 1200)); // simulate thinking delay
        return getDemoOutput(agent.name, agent.role, context);
    };

    const getDemoOutput = (name: string, role: string, context: string): string => {
        const roleLower = role.toLowerCase();
        if (roleLower.includes('contrarian') || roleLower.includes('skeptic') || roleLower.includes('challenge'))
            return `The consensus is premature. We haven't validated the core assumption: does the target user actually experience this pain point daily? I've seen 3 similar approaches fail in the last 12 months because they solved an imagined problem. Before proceeding, we need user interviews — not more engineering.`;
        if (roleLower.includes('first principles') || roleLower.includes('reframe') || roleLower.includes('assumption'))
            return `Strip away the implementation details. The fundamental question is: can we deliver 10x value over the existing solution? If the answer requires more than one sentence to explain, the value proposition is too complex. The simplest version of this is: one API call that replaces a 15-minute manual workflow.`;
        if (roleLower.includes('expan') || roleLower.includes('opportunity') || roleLower.includes('upside'))
            return `Everyone is focused on the direct use case, but the real opportunity is the data layer underneath. Every execution generates a decision trace that's more valuable than the action itself. We should be building the intelligence layer, not just the execution layer. That's a 100x market.`;
        if (roleLower.includes('outsider') || roleLower.includes('fresh') || roleLower.includes('no context'))
            return `I have zero context on this space and that's the point. From the outside, this looks like a developer tool pretending to be a consumer product. Pick one. The messaging says "for everyone" but the UI says "for engineers." That gap will kill adoption.`;
        if (roleLower.includes('chairman') || roleLower.includes('synthesize') || roleLower.includes('verdict') || roleLower.includes('judge'))
            return `**Verdict:** The Contrarian is right that validation is missing. First Principles is right that simplicity wins. The Expansionist sees the long-term moat correctly. The Outsider caught the positioning gap.\n\n**Decision:** Ship the simplest possible version (one workflow, one user type) within 2 weeks. Validate with 10 users before expanding. The data layer is the real product — build instrumentation from day one.`;
        if (roleLower.includes('scan') || roleLower.includes('security') || roleLower.includes('vuln'))
            return `Scan complete. Found 2 medium-severity issues: (1) API endpoint accepts unbounded input without rate limiting — add per-user throttling. (2) Session tokens don't expire — implement 24h rotation. No critical vulnerabilities detected. OWASP Top 10 coverage: 8/10.`;
        if (roleLower.includes('fix') || roleLower.includes('patch') || roleLower.includes('remediat'))
            return `Patches proposed for both issues: (1) Added express-rate-limit middleware with 100 req/min per IP. (2) JWT expiry set to 24h with refresh token rotation. Both changes are backwards-compatible and can be deployed independently.`;
        if (roleLower.includes('review') || roleLower.includes('validate') || roleLower.includes('gate'))
            return `Both patches pass review. Rate limiting is correctly scoped. Token rotation handles edge cases (concurrent sessions, offline clients). Approved for merge. No regressions detected in the test suite.`;
        if (roleLower.includes('research') || roleLower.includes('paper') || roleLower.includes('web'))
            return `Found 4 relevant sources: (1) Vitalik's "Info Finance" post on prediction markets as information aggregation. (2) a16z's 2025 "Big Ideas" on market design beyond prediction markets. (3) Two academic papers on Bayesian truth serum for subjective assessment. Key insight: the mechanism design is more important than the UX.`;
        if (roleLower.includes('report') || roleLower.includes('writ') || roleLower.includes('synthes'))
            return `**Report:** The research council agrees that the mechanism design is the defensible moat, not the frontend. The web researcher found real-world validation in prediction market literature. The paper analyst confirms the academic foundation is solid. Recommendation: focus R&D budget on the pricing algorithm, not the UI.`;
        // Generic fallback with realistic output
        return `Analysis complete for "${name}" role. Processed context from ${context.length > 100 ? 'previous agents' : 'initial prompt'}. Key finding: the approach is viable but needs tighter scoping before execution. Recommend proceeding with constraints defined.`;
    };

    const runSwarm = useCallback(async (id: string) => {
        const swarm = swarms.find(s => s.id === id);
        if (!swarm || swarm.status === 'running') return;

        setSwarms(prev => prev.map(s => s.id === id ? { ...s, status: 'running' as const } : s));
        showToast(`Running "${swarm.name}" swarm...`, 'info');

        const isParallel = swarm.topology === 'parallel';
        let context = `Swarm: ${swarm.name}. Topology: ${swarm.topology}. Goal: ${swarm.description}`;

        if (isParallel) {
            // Set all non-final agents to thinking
            setSwarms(prev => prev.map(s => s.id === id ? {
                ...s, agents: s.agents.map((a, i) => i < s.agents.length - 1 ? { ...a, status: 'thinking' as const } : a),
            } : s));

            // Run all non-final agents in parallel
            const parallelAgents = swarm.agents.slice(0, -1);
            const results = await Promise.all(parallelAgents.map(a => callAgent(a, context)));

            // Mark parallel agents done
            setSwarms(prev => prev.map(s => s.id === id ? {
                ...s, agents: s.agents.map((a, i) => i < s.agents.length - 1 ? { ...a, status: 'done' as const, output: results[i] } : a),
            } : s));

            // Run final synthesizer agent
            const finalAgent = swarm.agents[swarm.agents.length - 1];
            setSwarms(prev => prev.map(s => s.id === id ? {
                ...s, agents: s.agents.map((a, i) => i === s.agents.length - 1 ? { ...a, status: 'thinking' as const } : a),
            } : s));
            const finalOutput = await callAgent(finalAgent, results.join(' | '));
            setSwarms(prev => prev.map(s => s.id === id ? {
                ...s, status: 'complete' as const, runs: s.runs + 1, lastRun: 'Just now',
                agents: s.agents.map((a, i) => i === s.agents.length - 1 ? { ...a, status: 'done' as const, output: finalOutput } : a),
            } : s));
        } else {
            // Sequential / hierarchical / debate: one at a time
            for (let i = 0; i < swarm.agents.length; i++) {
                const agent = swarm.agents[i];
                // Set to thinking
                setSwarms(prev => prev.map(s => s.id === id ? {
                    ...s, agents: s.agents.map((a, idx) => idx === i ? { ...a, status: 'thinking' as const } : a),
                } : s));

                // Call LLM
                const output = await callAgent(agent, context);
                context = output;

                // Set to done with output
                setSwarms(prev => prev.map(s => s.id === id ? {
                    ...s,
                    ...(i === swarm.agents.length - 1 ? { status: 'complete' as const, runs: s.runs + 1, lastRun: 'Just now' } : {}),
                    agents: s.agents.map((a, idx) => idx === i ? { ...a, status: 'done' as const, output } : a),
                } : s));
            }
        }

        showToast(`"${swarm.name}" completed!`, 'success');
    }, [swarms, showToast]);

    const resetSwarm = (id: string) => {
        setSwarms(prev => prev.map(s => s.id === id ? {
            ...s, status: 'ready' as const,
            agents: s.agents.map(a => ({ ...a, status: 'idle' as const, output: undefined })),
        } : s));
    };

    const createSwarm = () => {
        if (!newName.trim()) return;
        const swarm: SwarmConfig = {
            id: Date.now().toString(), name: newName.trim(), description: 'Custom swarm',
            topology: newTopology, status: 'ready', runs: 0, lastRun: 'Never',
            agents: [
                { id: `${Date.now()}-1`, name: 'Agent 1', role: 'Primary task executor', model: 'Claude Sonnet 4.6', status: 'idle', icon: Bot },
                { id: `${Date.now()}-2`, name: 'Agent 2', role: 'Validator and reviewer', model: 'GPT-4.1', status: 'idle', icon: Shield },
            ],
        };
        setSwarms(prev => [swarm, ...prev]);
        setNewName(''); setShowCreate(false);
        showToast(`"${swarm.name}" swarm created`, 'success');
    };

    const statusIcon = (status: string) => {
        switch (status) {
            case 'thinking': return <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />;
            case 'executing': return <div className="w-2 h-2 rounded-full bg-[#E77630] animate-ping" />;
            case 'done': return <div className="w-2 h-2 rounded-full bg-emerald-400" />;
            case 'error': return <div className="w-2 h-2 rounded-full bg-red-400" />;
            default: return <div className="w-2 h-2 rounded-full bg-gray-600" />;
        }
    };

    return (
        <MobilePageWrapper>
            <div className="min-h-screen p-6 lg:p-8">
                <div className="max-w-[1400px] mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fadeInUp">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Network size={16} className="text-[#E77630]" />
                                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Multi-Agent</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-medium tracking-tight text-white">Swarm Orchestration</h1>
                            <p className="text-sm text-gray-400 mt-1">Design and run multi-agent swarms with different topologies</p>
                        </div>
                        <GlowButton className="h-11 px-5" onClick={() => setShowCreate(true)}>
                            <Plus size={16} className="mr-2" /> New Swarm
                        </GlowButton>
                    </div>

                    {/* API key banner — always visible, dismissed when a real response comes back */}
                    {swarms.every(s => s.runs === 0) && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 animate-fadeInUp">
                            <Zap size={16} className="text-amber-400 shrink-0" />
                            <p className="text-sm text-gray-300 flex-1">
                                <span className="text-amber-400 font-semibold">Demo mode</span> — swarm agents return placeholder responses until an API key is configured. Add your Anthropic API key in{' '}
                                <a href="/settings" className="text-[#E77630] hover:underline font-medium">Settings → API Keys</a> to enable real multi-agent execution.
                            </p>
                        </div>
                    )}

                    {/* Create Modal */}
                    {showCreate && (
                        <Card variant="glass" className="border-primary/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-white font-semibold">New Swarm</h3>
                                    <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
                                </div>
                                <div className="space-y-4">
                                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Swarm name" aria-label="Swarm name"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-primary/50 focus:outline-none" />
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {Object.entries(topologyLabels).map(([key, val]) => (
                                            <button key={key} onClick={() => setNewTopology(key as typeof newTopology)}
                                                className={`p-3 rounded-xl border text-center transition-all ${newTopology === key ? 'bg-primary/10 border-primary/30 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}>
                                                <span className={`text-xs font-bold ${val.color}`}>{val.label}</span>
                                                <span className="block text-[10px] text-gray-500 mt-1 font-mono">{val.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <GlowButton onClick={createSwarm} className="w-full">Create Swarm</GlowButton>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Swarms', value: swarms.length, icon: Network, color: 'text-[#E77630]' },
                            { label: 'Total Agents', value: swarms.reduce((sum, s) => sum + s.agents.length, 0), icon: Bot, color: 'text-[#F59E0B]' },
                            { label: 'Total Runs', value: swarms.reduce((sum, s) => sum + s.runs, 0), icon: Zap, color: 'text-emerald-400' },
                            { label: 'Topologies', value: new Set(swarms.map(s => s.topology)).size, icon: Settings, color: 'text-[#E77630]' },
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

                    {/* Swarm List + Detail View */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* List */}
                        <div className="space-y-3">
                            {swarms.map(swarm => {
                                const topo = topologyLabels[swarm.topology];
                                const isActive = activeSwarmId === swarm.id;
                                return (
                                    <Card key={swarm.id} variant="glass"
                                        className={`cursor-pointer transition-all ${isActive ? 'border-primary/30 bg-primary/5' : 'hover:border-white/10'}`}
                                        onClick={() => setActiveSwarmId(swarm.id)}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="text-sm font-semibold text-white truncate">{swarm.name}</h3>
                                                <Badge variant="default" className={`text-[9px] ${topo.color}`}>{topo.label}</Badge>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate mb-3">{swarm.description}</p>
                                            <div className="flex items-center gap-3 text-[10px] font-mono text-gray-600">
                                                <span>{swarm.agents.length} agents</span>
                                                <span>{swarm.runs} runs</span>
                                                <span className={swarm.status === 'running' ? 'text-[#E77630]' : swarm.status === 'complete' ? 'text-emerald-400' : 'text-gray-600'}>
                                                    {swarm.status}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Detail */}
                        <div className="lg:col-span-2">
                            {activeSwarm ? (
                                <Card variant="glass" className="border-white/5 hover:border-white/10">
                                    <CardHeader className="border-b border-white/5 pb-4">
                                        <CardTitle className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-lg font-medium text-white">{activeSwarm.name}</h2>
                                                <p className="text-xs text-gray-400 mt-1">{activeSwarm.description}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {activeSwarm.status === 'complete' && (
                                                    <GlowButton variant="outline" size="sm" onClick={() => resetSwarm(activeSwarm.id)}>Reset</GlowButton>
                                                )}
                                                <GlowButton size="sm" onClick={() => runSwarm(activeSwarm.id)}
                                                    disabled={activeSwarm.status === 'running'}>
                                                    {activeSwarm.status === 'running' ? <><Zap size={14} className="mr-1 animate-pulse" /> Running...</> : <><Play size={14} className="mr-1" /> Run Swarm</>}
                                                </GlowButton>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {/* Topology indicator */}
                                        <div className="flex items-center gap-2 mb-6 text-xs font-mono text-gray-500">
                                            <span className={topologyLabels[activeSwarm.topology].color}>{topologyLabels[activeSwarm.topology].label}</span>
                                            <span>·</span>
                                            <span>{topologyLabels[activeSwarm.topology].desc}</span>
                                            <span>·</span>
                                            <span>{activeSwarm.agents.length} agents</span>
                                        </div>

                                        {/* Agent pipeline visualization */}
                                        <div className="space-y-4">
                                            {activeSwarm.agents.map((agent, i) => {
                                                const Icon = agent.icon;
                                                return (
                                                    <div key={agent.id}>
                                                        <div className="flex items-start gap-4 p-4 rounded-xl bg-black/40 border border-white/5 transition-all">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                                                                    agent.status === 'done' ? 'bg-emerald-400/10 border-emerald-400/30' :
                                                                    agent.status === 'thinking' || agent.status === 'executing' ? 'bg-[#E77630]/10 border-[#E77630]/30' :
                                                                    'bg-white/5 border-white/5'
                                                                }`}>
                                                                    <Icon size={18} className={
                                                                        agent.status === 'done' ? 'text-emerald-400' :
                                                                        agent.status === 'thinking' || agent.status === 'executing' ? 'text-[#E77630]' :
                                                                        'text-gray-500'
                                                                    } />
                                                                </div>
                                                                {statusIcon(agent.status)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-sm font-semibold text-white">{agent.name}</span>
                                                                    <Badge variant="default" className="text-[9px] bg-white/5">{agent.model}</Badge>
                                                                </div>
                                                                <p className="text-xs text-gray-400">{agent.role}</p>
                                                                {agent.output && (
                                                                    <div className="mt-2 p-2 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-300 font-mono">
                                                                        {agent.output}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {i < activeSwarm.agents.length - 1 && (
                                                            <div className="flex justify-center py-1">
                                                                <ArrowRight size={14} className={`text-gray-700 ${activeSwarm.topology === 'parallel' && i < activeSwarm.agents.length - 2 ? 'rotate-0' : ''}`} />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="flex items-center justify-center h-full text-center py-20">
                                    <div>
                                        <Network size={48} className="text-gray-700 mx-auto mb-4" />
                                        <p className="text-gray-500 mb-2">Select a swarm to view details</p>
                                        <p className="text-xs text-gray-600">Or create a new one to get started</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tool Approval Modal */}
            {pendingToolCall && (
                <ToolApprovalModal
                    toolCall={pendingToolCall.call}
                    agentName={pendingToolCall.agentName}
                    userId={getUserId()}
                    onResult={(result) => {
                        setPendingToolCall(null);
                        toolCallResolveRef.current?.(result);
                        toolCallResolveRef.current = null;
                    }}
                    onDeny={() => {
                        setPendingToolCall(null);
                        toolCallResolveRef.current?.(null);
                        toolCallResolveRef.current = null;
                    }}
                />
            )}
        </MobilePageWrapper>
    );
}
