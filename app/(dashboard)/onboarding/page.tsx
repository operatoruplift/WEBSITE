"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bot, Code, Brain, Shield, Sparkles, Check, Zap, MessageSquare, User } from 'lucide-react';
import { Logo } from '@/src/components/Icons';
import { GlowButton } from '@/src/components/ui/GlowButton';

const USE_CASES = [
    { id: 'dev', label: 'Software Development', icon: Code, desc: 'Code generation, debugging, PR reviews' },
    { id: 'research', label: 'Research & Analysis', icon: Brain, desc: 'Papers, data analysis, reports' },
    { id: 'security', label: 'Security & Compliance', icon: Shield, desc: 'Threat detection, audits, monitoring' },
    { id: 'automation', label: 'Workflow Automation', icon: Zap, desc: 'Task automation, integrations, scheduling' },
    { id: 'content', label: 'Content & Writing', icon: MessageSquare, desc: 'Blogs, docs, social media, emails' },
    { id: 'personal', label: 'Personal Assistant', icon: Sparkles, desc: 'Daily tasks, calendar, reminders' },
];

const STARTER_AGENTS = [
    { id: 'codepilot', name: 'CodePilot', desc: 'Code generation and debugging', model: 'Claude Sonnet 4.6', prompt: 'You are an expert software engineer.' },
    { id: 'researcher', name: 'Research Bot', desc: 'Multi-source research and synthesis', model: 'Claude Opus 4.6', prompt: 'You are a thorough research assistant.' },
    { id: 'writer', name: 'Content Writer', desc: 'Blog posts, docs, and copy', model: 'Claude Sonnet 4.6', prompt: 'You are a skilled content writer.' },
    { id: 'guard', name: 'Security Guard', desc: 'Threat detection and monitoring', model: 'Claude Opus 4.6', prompt: 'You are a security analyst.' },
];

export default function OnboardingPage() {
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
    const [selectedAgent, setSelectedAgent] = useState('');
    const router = useRouter();

    const toggleCase = (id: string) => {
        setSelectedCases(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const finishOnboarding = () => {
        // Save onboarding data
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.name = name || user.name || 'Commander';
        user.useCases = [...selectedCases];
        user.onboarded = true;
        localStorage.setItem('user', JSON.stringify(user));

        // Install starter agent if selected
        if (selectedAgent) {
            const agent = STARTER_AGENTS.find(a => a.id === selectedAgent);
            if (agent) {
                const custom = JSON.parse(localStorage.getItem('custom-agents') || '[]');
                custom.push({ name: agent.name, description: agent.desc, model: agent.model, systemPrompt: agent.prompt, id: Date.now().toString(), createdAt: new Date().toISOString() });
                localStorage.setItem('custom-agents', JSON.stringify(custom));
            }
        }

        localStorage.setItem('onboarded', 'true');
        router.push('/chat');
    };

    const steps = [
        // Step 0: Welcome
        <div key="welcome" className="text-center max-w-lg mx-auto">
            <Logo className="w-16 h-16 mx-auto mb-8" />
            <h1 className="text-3xl font-medium text-white mb-4">Welcome to Operator Uplift</h1>
            <p className="text-gray-400 mb-8">Let&apos;s set up your workspace in 60 seconds.</p>
            <div className="space-y-4">
                <div>
                    <label htmlFor="onboard-name" className="text-sm text-gray-400 block mb-2 text-left">What should we call you?</label>
                    <input id="onboard-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" aria-label="Your name"
                        className="w-full bg-foreground/[0.04] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 focus:outline-none text-center" autoFocus />
                </div>
                <GlowButton onClick={() => setStep(1)} className="w-full" disabled={!name.trim()}>
                    Continue <ArrowRight size={16} className="ml-2" />
                </GlowButton>
            </div>
        </div>,

        // Step 1: Use cases
        <div key="usecases" className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-medium text-white mb-2">What will you use Uplift for?</h2>
                <p className="text-gray-400 text-sm">Select all that apply. This helps us personalize your experience.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {USE_CASES.map(uc => {
                    const Icon = uc.icon;
                    const selected = selectedCases.has(uc.id);
                    return (
                        <button key={uc.id} onClick={() => toggleCase(uc.id)}
                            className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                                selected ? 'bg-primary/10 border-primary/30' : 'bg-foreground/[0.04] border-white/10 hover:border-primary/30'
                            }`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selected ? 'bg-primary/20' : 'bg-foreground/[0.04]'}`}>
                                <Icon size={18} className={selected ? 'text-primary' : 'text-gray-500'} />
                            </div>
                            <div>
                                <h3 className={`text-sm font-semibold ${selected ? 'text-white' : 'text-gray-300'}`}>{uc.label}</h3>
                                <p className="text-xs text-gray-500">{uc.desc}</p>
                            </div>
                            {selected && <Check size={16} className="text-primary ml-auto flex-shrink-0 mt-1" />}
                        </button>
                    );
                })}
            </div>
            <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="px-4 py-3 rounded-lg bg-foreground/[0.04] text-gray-400 text-sm hover:bg-white/10 transition-colors">Back</button>
                <GlowButton onClick={() => setStep(2)} className="flex-1" disabled={selectedCases.size === 0}>
                    Continue <ArrowRight size={16} className="ml-2" />
                </GlowButton>
            </div>
        </div>,

        // Step 2: First agent
        <div key="agent" className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-medium text-white mb-2">Deploy your first agent</h2>
                <p className="text-gray-400 text-sm">Pick a starter agent or skip to build your own later.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {STARTER_AGENTS.map(agent => (
                    <button key={agent.id} onClick={() => setSelectedAgent(selectedAgent === agent.id ? '' : agent.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                            selectedAgent === agent.id ? 'bg-primary/10 border-primary/30' : 'bg-foreground/[0.04] border-white/10 hover:border-primary/30'
                        }`}>
                        <div className="flex items-center gap-3 mb-2">
                            <Bot size={18} className={selectedAgent === agent.id ? 'text-primary' : 'text-gray-500'} />
                            <h3 className="text-sm font-semibold text-white">{agent.name}</h3>
                            {selectedAgent === agent.id && <Check size={14} className="text-primary ml-auto" />}
                        </div>
                        <p className="text-xs text-gray-500">{agent.desc}</p>
                        <p className="text-[10px] text-gray-600 font-mono mt-2">{agent.model}</p>
                    </button>
                ))}
            </div>
            <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-4 py-3 rounded-lg bg-foreground/[0.04] text-gray-400 text-sm hover:bg-white/10 transition-colors">Back</button>
                <GlowButton onClick={finishOnboarding} className="flex-1">
                    {selectedAgent ? 'Deploy & Launch' : 'Skip & Launch'} <ArrowRight size={16} className="ml-2" />
                </GlowButton>
            </div>
        </div>,
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#050508' }}>
            <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 30%, rgba(231,118,48,0.15) 0%, transparent 50%)' }} />

            {/* Progress dots */}
            <div className="fixed top-8 left-1/2 -translate-x-1/2 flex gap-2 z-50">
                {[0, 1, 2].map(i => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-primary w-6' : i < step ? 'bg-primary/50' : 'bg-white/10'}`} />
                ))}
            </div>

            <div className="relative z-10 w-full max-w-2xl animate-fadeInUp">
                {steps[step]}
            </div>
        </div>
    );
}
