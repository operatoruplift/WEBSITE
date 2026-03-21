"use client";

import { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Check, Bot, Brain, Code, FileText, Globe, Shield, Zap, MessageSquare } from 'lucide-react';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { Card, CardContent } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { MobilePageWrapper } from '@/src/components/mobile';
import { useToast } from '@/src/components/ui/Toast';

const TEMPLATES = [
    { id: 'general', name: 'General Assistant', icon: Sparkles, color: 'text-primary', desc: 'A versatile agent for everyday tasks', capabilities: ['Chat', 'Research', 'Writing'] },
    { id: 'code', name: 'Code Expert', icon: Code, color: 'text-emerald-400', desc: 'Specialized in code generation, review, and debugging', capabilities: ['Code Gen', 'Debug', 'Refactor'] },
    { id: 'research', name: 'Research Agent', icon: Brain, color: 'text-[#E77630]', desc: 'Deep research across papers, docs, and the web', capabilities: ['Papers', 'Citations', 'Summarize'] },
    { id: 'writer', name: 'Content Writer', icon: FileText, color: 'text-[#F59E0B]', desc: 'Blog posts, docs, social media, and more', capabilities: ['Blog', 'Social', 'Docs'] },
    { id: 'security', name: 'Security Analyst', icon: Shield, color: 'text-red-400', desc: 'Threat detection, vulnerability scanning, compliance', capabilities: ['OWASP', 'Audit', 'Monitor'] },
    { id: 'web', name: 'Web Agent', icon: Globe, color: 'text-amber-400', desc: 'Browse, scrape, and interact with the web', capabilities: ['Browse', 'Scrape', 'API'] },
];

const MODELS = [
    { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'Anthropic', badge: 'RECOMMENDED' },
    { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI', badge: 'FAST' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', badge: 'LONG CTX' },
    { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek', badge: 'OPEN' },
];

export default function AgentBuilderPage() {
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [template, setTemplate] = useState('');
    const [model, setModel] = useState('claude-4-sonnet');
    const [systemPrompt, setSystemPrompt] = useState('');
    const { showToast } = useToast();

    const steps = ['Template', 'Configure', 'Model', 'Review'];
    const selectedTemplate = TEMPLATES.find(t => t.id === template);

    const handleDeploy = () => {
        const agent = { name, description, template, model, systemPrompt, id: Date.now().toString(), createdAt: new Date().toISOString() };
        const existing = JSON.parse(localStorage.getItem('custom-agents') || '[]');
        existing.push(agent);
        localStorage.setItem('custom-agents', JSON.stringify(existing));
        showToast(`Agent "${name}" deployed successfully!`, 'success');
        setStep(0); setName(''); setDescription(''); setTemplate(''); setSystemPrompt('');
    };

    return (
        <MobilePageWrapper>
            <div className="min-h-screen p-6 lg:p-8">
                <div className="max-w-[900px] mx-auto space-y-8">
                    {/* Header */}
                    <div className="animate-fadeInUp">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(231,118,48,0.3)]" style={{ background: 'linear-gradient(135deg, #E77630, #E77630)' }}>
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
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i <= step ? 'bg-primary text-white shadow-[0_0_10px_rgba(231,118,48,0.4)]' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                                    {i < step ? <Check size={14} /> : i + 1}
                                </div>
                                <span className={`text-xs font-mono hidden sm:block ${i <= step ? 'text-white' : 'text-gray-600'}`}>{s}</span>
                                {i < steps.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-primary/50' : 'bg-white/5'}`} />}
                            </div>
                        ))}
                    </div>

                    {/* Step content */}
                    <Card variant="glass" className="p-8 border-white/5 bg-black/40 min-h-[400px]">
                        {step === 0 && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-white">Choose a template</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {TEMPLATES.map(t => {
                                        const Icon = t.icon;
                                        return (
                                            <button key={t.id} onClick={() => { setTemplate(t.id); setName(t.name); setDescription(t.desc); }}
                                                className={`p-5 rounded-xl border text-left transition-all ${template === t.id ? 'border-primary/50 bg-primary/10' : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'}`}>
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center ${t.color}`}><Icon size={18} /></div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-white">{t.name}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
                                                        <div className="flex gap-1.5 mt-2">{t.capabilities.map(c => <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-gray-400 font-mono">{c}</span>)}</div>
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
                                <h2 className="text-lg font-bold text-white">Configure your agent</h2>
                                <div><label className="text-sm text-gray-400 block mb-2">Agent Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 focus:outline-none" placeholder="My Agent" /></div>
                                <div><label className="text-sm text-gray-400 block mb-2">Description</label><input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 focus:outline-none" placeholder="What does this agent do?" /></div>
                                <div><label className="text-sm text-gray-400 block mb-2">System Prompt (optional)</label><textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={5} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 focus:outline-none resize-none font-mono text-sm" placeholder="You are a helpful assistant that..." /></div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-white">Select a model</h2>
                                <div className="space-y-3">
                                    {MODELS.map(m => (
                                        <button key={m.id} onClick={() => setModel(m.id)}
                                            className={`w-full p-5 rounded-xl border text-left transition-all flex items-center justify-between ${model === m.id ? 'border-primary/50 bg-primary/10' : 'border-white/5 bg-white/[0.02] hover:border-white/20'}`}>
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

                        {step === 3 && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-white">Review & Deploy</h2>
                                <div className="space-y-4 p-6 rounded-xl bg-white/[0.02] border border-white/5">
                                    <div className="flex items-center gap-4">
                                        {selectedTemplate && <div className={`w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center ${selectedTemplate.color}`}><selectedTemplate.icon size={22} /></div>}
                                        <div><p className="text-lg font-bold text-white">{name || 'Unnamed Agent'}</p><p className="text-xs text-gray-500">{description}</p></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                        <div><p className="text-[10px] text-gray-500 uppercase font-mono mb-1">Template</p><p className="text-sm text-white">{selectedTemplate?.name}</p></div>
                                        <div><p className="text-[10px] text-gray-500 uppercase font-mono mb-1">Model</p><p className="text-sm text-white">{MODELS.find(m => m.id === model)?.name}</p></div>
                                    </div>
                                    {systemPrompt && <div className="pt-4 border-t border-white/5"><p className="text-[10px] text-gray-500 uppercase font-mono mb-1">System Prompt</p><p className="text-xs text-gray-300 font-mono bg-black/40 p-3 rounded-lg border border-white/5">{systemPrompt}</p></div>}
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
