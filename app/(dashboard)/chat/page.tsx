"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, User, Send, Plus, Trash2, Copy, Check, Loader2, Sparkles, Zap, ChevronDown, Mic, Paperclip, Search, Code, FileText, Brain, Globe, MessageSquare } from 'lucide-react';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { Badge } from '@/src/components/ui/Badge';
import { MobilePageWrapper } from '@/src/components/mobile';
import { useToast } from '@/src/components/ui/Toast';

interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date; model?: string; }
interface ChatSession { id: string; title: string; messages: Message[]; createdAt: Date; model: string; }

const MODELS = [
    { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', provider: 'Anthropic', color: 'text-[#9945FF]', badge: 'SMART' },
    { id: 'gpt-4.1', label: 'GPT-4.1', provider: 'OpenAI', color: 'text-emerald-400', badge: 'FAST' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'Google', color: 'text-[#00D4FF]', badge: 'LONG CTX' },
    { id: 'deepseek-v3', label: 'DeepSeek V3', provider: 'DeepSeek', color: 'text-amber-400', badge: 'OPEN' },
    { id: 'grok-3', label: 'Grok 3', provider: 'xAI', color: 'text-red-400', badge: 'REASON' },
];

const AGENTS = [
    { id: 'default', label: 'General Assistant', icon: Sparkles },
    { id: 'code', label: 'Code Expert', icon: Code },
    { id: 'research', label: 'Research Agent', icon: Brain },
];

const PROMPT_SUGGESTIONS = [
    { category: 'Code', icon: Code, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', prompts: ['Analyze my codebase for security issues', 'Write a REST API in TypeScript'] },
    { category: 'Research', icon: Brain, color: 'text-[#9945FF] bg-[#9945FF]/10 border-[#9945FF]/20', prompts: ['Summarize recent AI research papers', 'Compare top vector databases'] },
    { category: 'Write', icon: FileText, color: 'text-[#00D4FF] bg-[#00D4FF]/10 border-[#00D4FF]/20', prompts: ['Write a blog post about AI agents', 'Draft a technical README'] },
    { category: 'Analyze', icon: Zap, color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', prompts: ['Build an AI agent swarm workflow', 'Generate documentation for this code'] },
];

function renderMarkdown(text: string): React.ReactNode {
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeLines: string[] = [];
    let codeLang = '';
    const elements: React.ReactNode[] = [];
    lines.forEach((line, i) => {
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                elements.push(<div key={`code-${i}`} className="my-3 rounded-xl overflow-hidden border border-white/10 bg-black/60">{codeLang && <div className="px-4 py-1.5 bg-white/5 border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest">{codeLang}</div>}<pre className="p-4 overflow-x-auto text-sm text-green-300 font-mono leading-relaxed"><code>{codeLines.join('\n')}</code></pre></div>);
                codeLines = []; codeLang = ''; inCodeBlock = false;
            } else { codeLang = line.slice(3).trim(); inCodeBlock = true; }
            return;
        }
        if (inCodeBlock) { codeLines.push(line); return; }
        if (line.startsWith('### ')) elements.push(<h3 key={i} className="text-base font-bold text-white mt-4 mb-1">{line.slice(4)}</h3>);
        else if (line.startsWith('## ')) elements.push(<h2 key={i} className="text-lg font-bold text-white mt-5 mb-2">{line.slice(3)}</h2>);
        else if (line.startsWith('- ') || line.startsWith('* ')) elements.push(<div key={i} className="flex gap-2 text-[15px] leading-relaxed"><span className="text-[#9945FF] mt-1.5">•</span><span dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(2)) }} /></div>);
        else if (line.trim() === '') elements.push(<div key={i} className="h-2" />);
        else elements.push(<p key={i} className="text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineMarkdown(line) }} />);
    });
    return <div className="space-y-1">{elements}</div>;
}

function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inlineMarkdown(text: string): string {
    const safe = escapeHtml(text);
    return safe.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>').replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-black/60 text-green-300 font-mono text-[13px] border border-white/10">$1</code>');
}

export default function ChatPage() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
    const [selectedAgent, setSelectedAgent] = useState(AGENTS[0].id);
    const [showModelPicker, setShowModelPicker] = useState(false);
    const [sidebarSearch, setSidebarSearch] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const { showToast } = useToast();
    const activeSession = sessions.find(s => s.id === activeSessionId);
    const activeModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

    useEffect(() => {
        const saved = localStorage.getItem('chat-sessions-v2');
        if (saved) { try { const parsed = JSON.parse(saved); setSessions(parsed.map((s: any) => ({ ...s, createdAt: new Date(s.createdAt), messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) }))); if (parsed.length > 0) setActiveSessionId(parsed[0].id); } catch {} }
    }, []);

    useEffect(() => { if (sessions.length > 0) localStorage.setItem('chat-sessions-v2', JSON.stringify(sessions)); }, [sessions]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeSession?.messages]);

    const createNewSession = () => {
        const session: ChatSession = { id: Date.now().toString(), title: 'New Chat', messages: [], createdAt: new Date(), model: selectedModel };
        setSessions(prev => [session, ...prev]); setActiveSessionId(session.id); setInput('');
    };
    const deleteSession = (id: string) => { setSessions(prev => prev.filter(s => s.id !== id)); if (activeSessionId === id) { const remaining = sessions.filter(s => s.id !== id); setActiveSessionId(remaining[0]?.id || null); } };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        let sessionId = activeSessionId;
        if (!sessionId) { const session: ChatSession = { id: Date.now().toString(), title: input.slice(0, 30) + (input.length > 30 ? '...' : ''), messages: [], createdAt: new Date(), model: selectedModel }; setSessions(prev => [session, ...prev]); sessionId = session.id; setActiveSessionId(sessionId); }
        const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim(), timestamp: new Date() };
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, userMessage], title: s.messages.length === 0 ? input.slice(0, 30) : s.title } : s));
        setInput(''); setIsLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/api/chat/stream`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }, body: JSON.stringify({ sessionId, message: userMessage.content, model: selectedModel }) });
            let content = '';
            if (response.ok) { const data = await response.json(); content = data.response || data.content || getFallbackResponse(userMessage.content); } else { content = getFallbackResponse(userMessage.content); }
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, { id: (Date.now() + 1).toString(), role: 'assistant', content, timestamp: new Date(), model: selectedModel }] } : s));
        } catch {
            const content = `I'm running in **demo mode**. Here's what **${activeModel.label}** can help with:\n\n- **Code Analysis** — Review and debug your codebase\n- **Agent Workflows** — Design multi-agent pipelines\n- **Research** — Summarize and synthesize information\n- **Writing** — Draft technical docs and content\n\nConnect your API keys in Settings to enable live AI responses.`;
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, { id: (Date.now() + 1).toString(), role: 'assistant', content, timestamp: new Date(), model: selectedModel }] } : s));
        } finally { setIsLoading(false); }
    };

    const getFallbackResponse = (msg: string) => `You asked: **"${msg.slice(0, 60)}${msg.length > 60 ? '...' : ''}"**\n\nI'm your **${activeModel.label}** powered assistant running via the Operator Uplift platform.\n\nHere's what I can help with:\n\n- **Code Analysis**: Understand and navigate your codebase\n- **Documentation**: Generate docs for your projects\n- **Agent Workflows**: Create and manage AI agent pipelines\n- **Research**: Synthesize information from multiple sources\n\nTo enable real AI responses, configure your API keys in **Settings**.`;
    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
    const copyMessage = async (content: string, id: string) => { await navigator.clipboard.writeText(content); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };
    const filteredSessions = sessions.filter(s => !sidebarSearch || s.title.toLowerCase().includes(sidebarSearch.toLowerCase()));

    return (
        <MobilePageWrapper>
            <div className="flex h-[calc(100vh-48px)] relative">
                <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-[#9945FF]/5 blur-[120px] rounded-full pointer-events-none z-0" />
                <aside className="hidden md:flex w-72 flex-col border-r border-white/5 bg-black/60 relative z-10 shrink-0">
                    <div className="p-4 border-b border-white/5 space-y-3">
                        <GlowButton onClick={createNewSession} className="w-full justify-center bg-gradient-to-r from-[#9945FF]/20 to-[#00D4FF]/20 border-[#9945FF]/30 hover:from-[#9945FF]/30 hover:to-[#00D4FF]/30 text-white h-10"><Plus size={16} className="mr-2" /> New Chat</GlowButton>
                        <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)} placeholder="Search sessions..." aria-label="Search chat sessions" className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-400 placeholder-gray-600 focus:outline-none focus:border-white/20 transition-all" /></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none">
                        {filteredSessions.length === 0 ? <div className="text-center py-8"><MessageSquare size={24} className="text-gray-700 mx-auto mb-2" /><p className="text-xs text-gray-600">No sessions yet</p></div> :
                            filteredSessions.map(session => (
                                <div key={session.id} className={`group flex items-start gap-2 p-3 rounded-xl cursor-pointer transition-all ${activeSessionId === session.id ? 'bg-[#9945FF]/10 border border-[#9945FF]/20' : 'hover:bg-white/5 border border-transparent'}`} onClick={() => setActiveSessionId(session.id)}>
                                    <Bot size={14} className={`shrink-0 mt-0.5 ${activeSessionId === session.id ? 'text-[#9945FF]' : 'text-gray-500'}`} />
                                    <div className="flex-1 min-w-0"><p className={`text-sm truncate font-medium ${activeSessionId === session.id ? 'text-white' : 'text-gray-400'}`}>{session.title}</p><p className="text-[10px] text-gray-600 font-mono mt-0.5">{session.messages.length} msgs · {MODELS.find(m => m.id === session.model)?.label || 'Claude'}</p></div>
                                    <button onClick={e => { e.stopPropagation(); deleteSession(session.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-gray-600 transition-all shrink-0"><Trash2 size={12} /></button>
                                </div>
                            ))
                        }
                    </div>
                </aside>
                <main className="flex-1 flex flex-col min-w-0 relative z-10">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40 backdrop-blur-sm shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
                                {AGENTS.map(agent => { const Icon = agent.icon; return (
                                    <button key={agent.id} onClick={() => setSelectedAgent(agent.id)} className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${selectedAgent === agent.id ? 'bg-[#9945FF]/20 text-[#9945FF] border border-[#9945FF]/30' : 'text-gray-500 hover:text-white'}`}>
                                        <Icon size={10} /> {agent.label.split(' ')[0]}
                                    </button>
                                ); })}
                            </div>
                        </div>
                        <div className="relative">
                            <button onClick={() => setShowModelPicker(!showModelPicker)} className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm ${activeModel.color}`}>
                                <span className="font-bold text-xs">{activeModel.label}</span>
                                <Badge variant="default" className={`text-[8px] font-mono px-1.5 py-0 ${activeModel.color}`}>{activeModel.badge}</Badge>
                                <ChevronDown size={14} className={`text-gray-500 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
                            </button>
                            {showModelPicker && <div className="absolute top-full right-0 mt-2 w-56 bg-[#0a0a0f] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                {MODELS.map(model => (
                                    <button key={model.id} onClick={() => { setSelectedModel(model.id); setShowModelPicker(false); }} className={`w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left ${selectedModel === model.id ? 'bg-white/5' : ''}`}>
                                        <div><p className={`text-sm font-bold ${model.color}`}>{model.label}</p><p className="text-[10px] text-gray-600 font-mono">{model.provider}</p></div>
                                        <div className="flex items-center gap-2"><Badge variant="default" className={`text-[8px] font-mono px-1.5 ${model.color}`}>{model.badge}</Badge>{selectedModel === model.id && <Check size={14} className={model.color} />}</div>
                                    </button>
                                ))}
                            </div>}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-none" onClick={() => setShowModelPicker(false)}>
                        {!activeSession || activeSession.messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-8">
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(153,69,255,0.3)]" style={{ background: 'linear-gradient(135deg, #9945FF, #00D4FF)' }}><Sparkles size={36} className="text-white" /></div>
                                <h1 className="text-3xl font-bold text-white mb-2 text-center">How can I help you?</h1>
                                <p className="text-gray-500 text-sm text-center mb-8 max-w-md">Powered by <span className={activeModel.color + ' font-bold'}>{activeModel.label}</span> · Ask me anything</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
                                    {PROMPT_SUGGESTIONS.map(cat => { const Icon = cat.icon; return cat.prompts.map((prompt, pi) => (
                                        <button key={`${cat.category}-${pi}`} onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                                            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-lg group ${cat.color} bg-transparent`}>
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cat.color}`} style={{ background: 'currentColor', opacity: 0.15 }}><Icon size={16} className={cat.color.split(' ')[0]} style={{ opacity: 1 }} /></div>
                                            <div><p className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-0.5">{cat.category}</p><p className="text-sm text-gray-300 group-hover:text-white transition-colors leading-tight">{prompt}</p></div>
                                        </button>
                                    )); }).flat()}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
                                {activeSession.messages.map((msg, index) => (
                                    <div key={msg.id} className={`flex gap-4 animate-fadeInUp ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}>
                                        {msg.role === 'assistant' && <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(153,69,255,0.3)]" style={{ background: 'linear-gradient(135deg, #9945FF, #00D4FF)' }}><Bot size={20} className="text-white" /></div>}
                                        <div className={`group relative max-w-[80%] md:max-w-[72%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                                            {msg.role === 'assistant' && msg.model && <p className="text-[10px] font-mono text-gray-600 mb-1 ml-1">{MODELS.find(m => m.id === msg.model)?.label || msg.model}</p>}
                                            <div className={`p-5 rounded-2xl ${msg.role === 'user' ? 'bg-gradient-to-br from-[#9945FF] to-[#6633CC] text-white rounded-br-md shadow-[0_0_20px_rgba(153,69,255,0.2)]' : 'bg-white/5 border border-white/10 text-white rounded-bl-md'}`}>
                                                {msg.role === 'assistant' ? renderMarkdown(msg.content) : <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                                            </div>
                                            {msg.role === 'assistant' && <button onClick={() => copyMessage(msg.content, msg.id)} className="absolute -bottom-3 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/80 border border-white/10 text-gray-400 hover:text-white transition-all text-[10px] font-mono shadow-xl">{copiedId === msg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}{copiedId === msg.id ? 'Copied' : 'Copy'}</button>}
                                        </div>
                                        {msg.role === 'user' && <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0"><User size={20} className="text-white" /></div>}
                                    </div>
                                ))}
                                {isLoading && <div className="flex gap-4 animate-fadeInUp"><div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #9945FF, #00D4FF)' }}><Bot size={20} className="text-white" /></div><div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md p-5"><div className="flex items-center gap-2"><div className="flex gap-1">{[0,150,300].map(delay => <span key={delay} className="w-2 h-2 rounded-full bg-[#9945FF] animate-bounce" style={{ animationDelay: `${delay}ms` }} />)}</div><span className="text-[10px] font-mono text-gray-600">{activeModel.label} is thinking...</span></div></div></div>}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t border-white/5 bg-black/40 backdrop-blur-sm shrink-0">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-end gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 focus-within:border-[#9945FF]/40 transition-all">
                                <button onClick={createNewSession} className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-all md:hidden shrink-0"><Plus size={20} /></button>
                                <button onClick={() => showToast('File attachments coming soon', 'info')} className="p-2 rounded-xl text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-all shrink-0"><Paperclip size={18} /></button>
                                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Message ${activeModel.label}...`} aria-label="Chat message input" rows={1}
                                    className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none resize-none text-[15px] leading-relaxed min-h-[40px] max-h-40" style={{ height: 'auto' }}
                                    onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 160) + 'px'; }} />
                                <button onClick={() => showToast('Voice input coming soon', 'info')} className="p-2 rounded-xl text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-all shrink-0"><Mic size={18} /></button>
                                <button onClick={handleSend} disabled={!input.trim() || isLoading} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(153,69,255,0.3)] hover:shadow-[0_0_20px_rgba(153,69,255,0.5)]" style={{ background: 'linear-gradient(135deg, #9945FF, #00D4FF)' }}>
                                    {isLoading ? <Loader2 size={18} className="animate-spin text-white" /> : <Send size={18} className="text-white" />}
                                </button>
                            </div>
                            <p className="text-center text-[10px] font-mono text-gray-600 mt-2">Enter to send · Shift+Enter for new line · {activeModel.label} powered by Operator Uplift</p>
                        </div>
                    </div>
                </main>
            </div>
        </MobilePageWrapper>
    );
}
