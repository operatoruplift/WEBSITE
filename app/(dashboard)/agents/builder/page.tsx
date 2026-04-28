"use client";

import { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Check, Bot, Brain, Code, FileText, Globe, Shield, Zap, MessageSquare } from 'lucide-react';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { addNotification } from '@/lib/notifications';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { MobilePageWrapper } from '@/src/components/mobile';
import { useToast } from '@/src/components/ui/Toast';

const TEMPLATES = [
    { id: 'general', name: 'General Assistant', icon: Sparkles, color: 'text-primary', desc: 'A versatile agent for everyday tasks', capabilities: ['Chat', 'Research', 'Writing'] },
    { id: 'code', name: 'Code Expert', icon: Code, color: 'text-emerald-400', desc: 'Specialized in code generation, review, and debugging', capabilities: ['Code Gen', 'Debug', 'Refactor'] },
    { id: 'research', name: 'Research Agent', icon: Brain, color: 'text-[#F97316]', desc: 'Deep research across papers, docs, and the web', capabilities: ['Papers', 'Citations', 'Summarize'] },
    { id: 'writer', name: 'Content Writer', icon: FileText, color: 'text-[#F97316]', desc: 'Blog posts, docs, social media, and more', capabilities: ['Blog', 'Social', 'Docs'] },
    { id: 'security', name: 'Security Analyst', icon: Shield, color: 'text-red-400', desc: 'Threat detection, vulnerability scanning, compliance', capabilities: ['OWASP', 'Audit', 'Monitor'] },
    { id: 'web', name: 'Web Agent', icon: Globe, color: 'text-amber-400', desc: 'Browse, scrape, and interact with the web', capabilities: ['Browse', 'Scrape', 'API'] },
    { id: 'devops', name: 'DevOps Engineer', icon: Zap, color: 'text-emerald-400', desc: 'CI/CD pipelines, monitoring, incident response', capabilities: ['Deploy', 'Monitor', 'Alert'] },
    { id: 'data', name: 'Data Analyst', icon: Bot, color: 'text-[#F97316]', desc: 'SQL queries, data viz, insight extraction', capabilities: ['SQL', 'Charts', 'Reports'] },
    { id: 'support', name: 'Customer Support', icon: MessageSquare, color: 'text-primary', desc: 'Ticket triage, auto-responses, escalation workflows', capabilities: ['Triage', 'Reply', 'Escalate'] },
];

const MODELS = [
    { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'Anthropic', badge: 'BEST' },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic', badge: 'FAST' },
    { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI', badge: 'VERSATILE' },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'OpenAI', badge: 'CHEAP' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', badge: 'LONG CTX' },
    { id: 'grok-3', name: 'Grok 3', provider: 'xAI', badge: 'REASONING' },
    { id: 'llama-4-maverick', name: 'Llama 4 Maverick', provider: 'Meta', badge: 'OPEN' },
    { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', badge: 'LOCAL' },
];

const AGENT_DIRECTIVES = `## Agent Directives
- After every action, verify the result before reporting success
- Re-read any data before modifying it (never trust cached context)
- Break complex tasks into phases of 5 or fewer steps
- If architecture is flawed, propose and implement structural fixes
- State explicitly when you cannot verify something
- Search exhaustively when renaming or changing references`;

export default function AgentBuilderPage() {
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [template, setTemplate] = useState('');
    const [model, setModel] = useState('claude-sonnet-4-6');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [selectedTools, setSelectedTools] = useState<string[]>([]);
    const [enableDirectives, setEnableDirectives] = useState(true);
    const { showToast } = useToast();

    const TOOLS = [
        // Core
        { id: 'web-search', name: 'Web Search', desc: 'Search the internet in real-time', category: 'Core' },
        { id: 'web-scrape', name: 'Web Scraper', desc: 'Extract content from URLs', category: 'Core' },
        { id: 'code-exec', name: 'Code Executor', desc: 'Run Python/JS code in sandbox', category: 'Core' },
        { id: 'file-system', name: 'File System', desc: 'Read, write, and manage files', category: 'Core' },
        { id: 'memory', name: 'Memory Bank', desc: 'Read/write to knowledge base', category: 'Core' },
        // Developer
        { id: 'database', name: 'Database', desc: 'Query SQL/NoSQL databases', category: 'Dev' },
        { id: 'api-call', name: 'HTTP/API', desc: 'Make REST/GraphQL API calls', category: 'Dev' },
        { id: 'github', name: 'GitHub', desc: 'PRs, issues, repos, and actions', category: 'Dev' },
        { id: 'shell', name: 'Shell', desc: 'Execute terminal commands', category: 'Dev' },
        { id: 'grep', name: 'Code Search', desc: 'Search codebases with regex', category: 'Dev' },
        // Communication
        { id: 'email', name: 'Email', desc: 'Send and read emails', category: 'Comm' },
        { id: 'calendar', name: 'Calendar', desc: 'Manage calendar events', category: 'Comm' },
        { id: 'slack', name: 'Slack', desc: 'Send messages and manage channels', category: 'Comm' },
        { id: 'notion', name: 'Notion', desc: 'Read/write pages and databases', category: 'Comm' },
        // Blockchain
        { id: 'solana', name: 'Solana', desc: 'On-chain transactions and wallet ops', category: 'Chain' },
        { id: 'oro-grail', name: 'Oro GRAIL', desc: 'Gold-backed asset management', category: 'Chain' },
        { id: 'dd-xyz', name: 'DD.xyz Risk', desc: 'Real-time risk scoring and due diligence', category: 'Chain' },
        { id: 'x402', name: 'x402 Payments', desc: 'Agent-to-agent micropayments', category: 'Chain' },
        // Creative
        { id: 'image-gen', name: 'Image Gen', desc: 'Generate images with DALL-E/Flux', category: 'Creative' },
        { id: 'voice', name: 'Voice', desc: 'Text-to-speech and speech-to-text', category: 'Creative' },
    ];

    const toggleTool = (id: string) => {
        setSelectedTools(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
    };

    const steps = ['Template', 'Configure', 'Tools', 'Model', 'Review'];
    const selectedTemplate = TEMPLATES.find(t => t.id === template);

    const handleDeploy = async () => {
        // Try API first, fall back to localStorage
        const token = localStorage.getItem('token');
        if (token && token !== 'demo-token') {
            try {
                const res = await fetch('/api/agents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ name, description, template, model, systemPrompt: enableDirectives ? `${systemPrompt}\n\n${AGENT_DIRECTIVES}` : systemPrompt, tools: selectedTools }),
                });
                if (res.ok) {
                    showToast(`Agent "${name}" deployed to cloud!`, 'success');
                    setStep(0); setName(''); setDescription(''); setTemplate(''); setSystemPrompt('');
                    return;
                }
            } catch { /* fall through to localStorage */ }
        }
        // Fallback: localStorage
        const finalPrompt = enableDirectives ? `${systemPrompt}\n\n${AGENT_DIRECTIVES}` : systemPrompt;
        const agent = { name, description, template, model, systemPrompt: finalPrompt, tools: selectedTools, id: Date.now().toString(), createdAt: new Date().toISOString() };
        const existing = JSON.parse(localStorage.getItem('custom-agents') || '[]');
        existing.push(agent);
        localStorage.setItem('custom-agents', JSON.stringify(existing));
        showToast(`Agent "${name}" deployed locally!`, 'success');
        addNotification({ type: 'agent', title: `Agent "${name}" deployed`, message: `${model} agent with ${selectedTools.length} tools`, icon: 'bot', color: 'text-[#F97316]' });
        setStep(0); setName(''); setDescription(''); setTemplate(''); setSystemPrompt('');
    };

    return (
        <MobilePageWrapper>
            <div className="min-h-screen p-6 lg:p-8">
                <div className="max-w-[900px] mx-auto space-y-8">
                    {/* Header */}
                    <div className="animate-fadeInUp">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F97316, #F97316)' }}>
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <Badge variant="primary" className="text-[10px] tracking-widest font-mono">WIZARD</Badge>
                        </div>
                        <h1 className="text-4xl font-medium tracking-tight text-white">Agent Builder</h1>
                        <p className="text-sm text-gray-400 mt-2 font-mono">Create and deploy custom AI agents in minutes</p>
                    </div>

                    {/* Step indicators */}
                    <div className="flex items-center gap-2">
                        {steps.map((s, i) => (
                            <div key={s} className="flex items-center gap-2 flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i <= step ? 'bg-primary text-white shadow-[0_0_10px_rgba(231,118,48,0.4)]' : 'bg-foreground/[0.04] text-gray-500 border border-white/10'}`}>
                                    {i < step ? <Check size={14} /> : i + 1}
                                </div>
                                <span className={`text-xs font-mono hidden sm:block ${i <= step ? 'text-white' : 'text-gray-600'}`}>{s}</span>
                                {i < steps.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-primary/50' : 'bg-foreground/[0.04]'}`} />}
                            </div>
                        ))}
                    </div>

                    {/* Step content */}
                    <Card variant="glass" className="p-8 border-foreground/10 bg-foreground/[0.04] min-h-[400px]">
                        {step === 0 && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-medium text-white">Choose a template</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {TEMPLATES.map(t => {
                                        const Icon = t.icon;
                                        return (
                                            <button key={t.id} onClick={() => { setTemplate(t.id); setName(t.name); setDescription(t.desc); }}
                                                className={`p-5 rounded-xl border text-left transition-all ${template === t.id ? 'border-primary/50 bg-primary/10' : 'border-foreground/10 bg-white/[0.02] hover:border-primary/30 hover:bg-foreground/[0.06]'}`}>
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-10 h-10 rounded-lg bg-foreground/[0.04] border border-white/10 flex items-center justify-center ${t.color}`}><Icon size={18} /></div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-white">{t.name}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
                                                        <div className="flex gap-1.5 mt-2">{t.capabilities.map(c => <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-foreground/[0.04] border border-foreground/10 text-gray-400 font-mono">{c}</span>)}</div>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-medium text-white">Configure your agent</h2>
                                <div><label className="text-sm text-gray-400 block mb-2">Agent Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-foreground/[0.04] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 focus:outline-none" placeholder="My Agent" /></div>
                                <div><label className="text-sm text-gray-400 block mb-2">Description</label><input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-foreground/[0.04] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 focus:outline-none" placeholder="What does this agent do?" /></div>
                                <div><label className="text-sm text-gray-400 block mb-2">System Prompt (optional)</label><textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={4} className="w-full bg-foreground/[0.04] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 focus:outline-none resize-none font-mono text-sm" placeholder="You are a helpful assistant that..." /></div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-foreground/[0.04] border border-foreground/10">
                                    <div>
                                        <p className="text-sm text-white font-medium">Verification Directives</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">Auto-verify results, re-read before editing, break tasks into phases</p>
                                    </div>
                                    <button onClick={() => setEnableDirectives(!enableDirectives)} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${enableDirectives ? 'bg-primary' : 'bg-gray-700'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${enableDirectives ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-medium text-white">Select tools</h2>
                                <p className="text-sm text-gray-400">Choose what your agent can interact with. Each tool grants a specific capability.</p>
                                {(['Core', 'Dev', 'Comm', 'Chain', 'Creative'] as const).map(cat => {
                                    const catTools = TOOLS.filter(t => t.category === cat);
                                    const labels: Record<string, string> = { Core: 'Core', Dev: 'Developer', Comm: 'Communication', Chain: 'Blockchain', Creative: 'Creative' };
                                    return (
                                        <div key={cat}>
                                            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-2">{labels[cat]}</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {catTools.map(tool => (
                                                    <button key={tool.id} onClick={() => toggleTool(tool.id)}
                                                        className={`p-3 rounded-xl border text-left transition-all ${selectedTools.includes(tool.id) ? 'border-primary/50 bg-primary/10' : 'border-foreground/10 bg-white/[0.02] hover:border-primary/30'}`}>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs font-bold text-white">{tool.name}</p>
                                                            {selectedTools.includes(tool.id) && <Check size={10} className="text-primary" />}
                                                        </div>
                                                        <p className="text-[9px] text-gray-500 mt-1">{tool.desc}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                {selectedTools.length > 0 && <p className="text-xs text-gray-500 font-mono">{selectedTools.length} tool{selectedTools.length !== 1 ? 's' : ''} selected</p>}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-medium text-white">Select a model</h2>
                                <div className="space-y-3">
                                    {MODELS.map(m => (
                                        <button key={m.id} onClick={() => setModel(m.id)}
                                            className={`w-full p-5 rounded-xl border text-left transition-all flex items-center justify-between ${model === m.id ? 'border-primary/50 bg-primary/10' : 'border-foreground/10 bg-white/[0.02] hover:border-primary/30'}`}>
                                            <div><p className="text-sm font-bold text-white">{m.name}</p><p className="text-xs text-gray-500 font-mono">{m.provider}</p></div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant={model === m.id ? 'primary' : 'default'} className="text-[9px] font-mono">{m.badge}</Badge>
                                                {model === m.id && <Check size={16} className="text-primary" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-medium text-white">Review & Deploy</h2>
                                <div className="space-y-4 p-6 rounded-xl bg-white/[0.02] border border-foreground/10">
                                    <div className="flex items-center gap-4">
                                        {selectedTemplate && <div className={`w-12 h-12 rounded-xl bg-foreground/[0.04] border border-white/10 flex items-center justify-center ${selectedTemplate.color}`}><selectedTemplate.icon size={22} /></div>}
                                        <div><p className="text-lg font-medium text-white">{name || 'Unnamed Agent'}</p><p className="text-xs text-gray-500">{description}</p></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-foreground/10">
                                        <div><p className="text-[10px] text-gray-500 uppercase font-mono mb-1">Template</p><p className="text-sm text-white">{selectedTemplate?.name}</p></div>
                                        <div><p className="text-[10px] text-gray-500 uppercase font-mono mb-1">Model</p><p className="text-sm text-white">{MODELS.find(m => m.id === model)?.name}</p></div>
                                        <div className="col-span-2"><p className="text-[10px] text-gray-500 uppercase font-mono mb-1">Tools ({selectedTools.length})</p><p className="text-sm text-white">{selectedTools.length > 0 ? selectedTools.map(t => TOOLS.find(tool => tool.id === t)?.name).join(', ') : 'None'}</p></div>
                                    </div>
                                    {systemPrompt && <div className="pt-4 border-t border-foreground/10"><p className="text-[10px] text-gray-500 uppercase font-mono mb-1">System Prompt</p><p className="text-xs text-gray-300 font-mono bg-foreground/[0.04] p-3 rounded-lg border border-foreground/10">{systemPrompt}</p></div>}
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Navigation */}
                    <div className="flex justify-between">
                        <GlowButton variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="px-6">
                            <ArrowLeft size={16} className="mr-2" /> Back
                        </GlowButton>
                        {step < 3 ? (
                            <GlowButton onClick={() => setStep(step + 1)} disabled={step === 0 && !template} className="px-6">
                                Next <ArrowRight size={16} className="ml-2" />
                            </GlowButton>
                        ) : (
                            <GlowButton onClick={handleDeploy} disabled={!name} className="px-8">
                                <Zap size={16} className="mr-2" /> Deploy Agent
                            </GlowButton>
                        )}
                    </div>
                </div>
            </div>
        </MobilePageWrapper>
    );
}
