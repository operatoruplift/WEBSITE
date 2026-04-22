"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, User, Send, Plus, Trash2, Copy, Check, Loader2, Sparkles, Zap, ChevronDown, Mic, Paperclip, Search, Code, FileText, Brain, Globe, MessageSquare, Pin, X as XIcon } from 'lucide-react';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { Badge } from '@/src/components/ui/Badge';
import { MobilePageWrapper } from '@/src/components/mobile';
import { useToast } from '@/src/components/ui/Toast';
import { hasToolCalls, parseToolCalls, stripToolBlocks, formatToolResult, getToolSystemPrompt, extractToolCallsFromText } from '@/lib/toolCalls';
import type { ToolCall, ToolResult } from '@/lib/toolCalls';
import { ToolApprovalModal } from '@/src/components/ui/ToolApprovalModal';
import { findAgent } from '@/config/agents';

interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date; model?: string; requestId?: string; }
interface ChatSession { id: string; title: string; messages: Message[]; createdAt: Date; model: string; }

interface Capabilities {
    capability_google: boolean;
    capability_key: boolean;
    capability_real: boolean;
    authenticated: boolean;
}

const DEMO_CAPABILITIES: Capabilities = {
    capability_google: false,
    capability_key: false,
    capability_real: false,
    authenticated: false,
};

const MODELS = [
    { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', provider: 'Anthropic', color: 'text-[#F97316]', badge: 'SMART' },
    { id: 'gpt-4.1', label: 'GPT-4.1', provider: 'OpenAI', color: 'text-emerald-400', badge: 'FAST' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'Google', color: 'text-[#F97316]', badge: 'LONG CTX' },
    { id: 'deepseek-v3', label: 'DeepSeek V3', provider: 'DeepSeek', color: 'text-amber-400', badge: 'OPEN' },
    { id: 'grok-3', label: 'Grok 3', provider: 'xAI', color: 'text-red-400', badge: 'REASON' },
];

const AGENTS = [
    { id: 'default', label: 'General Assistant', icon: Sparkles },
    { id: 'code', label: 'Code Expert', icon: Code },
    { id: 'research', label: 'Research Agent', icon: Brain },
];

/**
 * Consumer-first prompt suggestions (May 14 positioning).
 *
 * The three demo beats, daily briefing, inbox triage, reminders vibe ,  * lead. These are the first things a cold visitor sees on /chat and each
 * maps to a real workflow the product can actually run (approval modal,
 * Google tool, or Tier 1 tool in demo mode). Dev-focused prompts demoted
 * to the bottom so they don't steal the first impression.
 */
const PROMPT_SUGGESTIONS = [
    { category: 'Briefing', icon: Sparkles, color: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20', prompts: ['What\u2019s on my calendar today and what should I worry about?', 'Summarize my day in 3 bullets'] },
    { category: 'Inbox', icon: MessageSquare, color: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20', prompts: ['Draft replies to my last 3 emails, ask me before sending', 'Which emails need a reply today?'] },
    { category: 'Reminders', icon: Pin, color: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20', prompts: ['Turn tomorrow morning into iMessage-style nudges: weather, calendar, one fun thing', 'Remind me to follow up with Alex next Tuesday'] },
    { category: 'Dev', icon: Code, color: 'text-gray-400 bg-foreground/[0.04] border-foreground/10', prompts: ['Analyze my codebase for security issues', 'Summarize recent AI research papers'] },
];

function renderMarkdown(text: string): React.ReactNode {
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeLines: string[] = [];
    let codeLang = '';
    const elements: React.ReactNode[] = [];

    const flushCodeBlock = (key: string) => {
        if (codeLines.length > 0 || inCodeBlock) {
            elements.push(
                <div key={key} className="my-3 rounded-lg overflow-hidden border border-foreground/10 bg-foreground/[0.04]">
                    {codeLang && <div className="px-3 py-1.5 bg-foreground/[0.04] border-b border-foreground/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest">{codeLang}</div>}
                    <pre className="p-3 overflow-x-auto text-xs text-[#F97316] font-mono leading-relaxed"><code>{codeLines.join('\n')}</code></pre>
                </div>
            );
        }
        codeLines = []; codeLang = ''; inCodeBlock = false;
    };

    // Match ``` or ~~~ fences, with optional leading whitespace
    const isFence = (line: string) => /^\s*(```|~~~)/.test(line);
    const getFenceLang = (line: string) => line.replace(/^\s*(```|~~~)\s*/, '').trim();

    lines.forEach((line, i) => {
        if (isFence(line)) {
            if (inCodeBlock) {
                flushCodeBlock(`code-${i}`);
            } else {
                codeLang = getFenceLang(line);
                inCodeBlock = true;
            }
            return;
        }
        if (inCodeBlock) { codeLines.push(line); return; }
        if (line.startsWith('### ')) elements.push(<h3 key={i} className="text-base font-bold text-white mt-4 mb-1">{line.slice(4)}</h3>);
        else if (line.startsWith('## ')) elements.push(<h2 key={i} className="text-lg font-bold text-white mt-5 mb-2">{line.slice(3)}</h2>);
        else if (line.startsWith('- ') || line.startsWith('* ')) elements.push(<div key={i} className="flex gap-2 text-[15px] leading-relaxed"><span className="text-[#F97316] mt-1.5">•</span><span dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(2)) }} /></div>);
        else if (line.trim() === '') elements.push(<div key={i} className="h-2" />);
        else elements.push(<p key={i} className="text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineMarkdown(line) }} />);
    });

    // Flush any unclosed code block (truncated stream, missing closing fence)
    if (inCodeBlock) flushCodeBlock('code-tail');

    return <div className="space-y-1">{elements}</div>;
}

function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inlineMarkdown(text: string): string {
    const safe = escapeHtml(text);
    return safe.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>').replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-foreground/[0.06] text-green-300 font-mono text-[13px] border border-foreground/10">$1</code>');
}

function CapabilityBadge({ capabilities, loaded }: { capabilities: Capabilities; loaded: boolean }) {
    if (!loaded) {
        return (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500" /> Loading
            </span>
        );
    }
    if (capabilities.capability_real) {
        const subLabel = capabilities.capability_google ? 'Google' : 'API key';
        return (
            <span
                title={`Real execution enabled (${subLabel})`}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
            >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Real · {subLabel}
            </span>
        );
    }
    return (
        <span
            title="Demo mode, every reply and tool action is simulated"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316]"
        >
            <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]" /> Demo · Simulated
        </span>
    );
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
    const [pendingToolCall, setPendingToolCall] = useState<ToolCall | null>(null);
    const toolCallResolveRef = useRef<((result: ToolResult | null) => void) | null>(null);
    const [capabilities, setCapabilities] = useState<Capabilities>(DEMO_CAPABILITIES);
    const [capsLoaded, setCapsLoaded] = useState(false);
    const [demoBannerDismissed, setDemoBannerDismissed] = useState(false);
    const [pinned, setPinned] = useState<{ id: string; type: string; title?: string; body?: string; pinned_until?: string }[]>([]);

    const getChatUserId = (): string => {
        try { const u = localStorage.getItem('user'); if (u) return JSON.parse(u).id || 'demo-user'; } catch {} return 'demo-user';
    };

    const requestChatToolApproval = (call: ToolCall): Promise<ToolResult | null> => {
        return new Promise((resolve) => {
            toolCallResolveRef.current = resolve;
            setPendingToolCall(call);
        });
    };
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const { showToast } = useToast();
    const activeSession = sessions.find(s => s.id === activeSessionId);
    const activeModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

    // Fetch capability state on mount so the Demo/Real badge renders correctly
    // and tool approvals know whether to route to executeMock or executeToolCall.
    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        fetch('/api/capabilities', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            cache: 'no-store',
        })
            .then(r => r.json())
            .then((data: Capabilities) => setCapabilities(data))
            .catch(() => setCapabilities(DEMO_CAPABILITIES))
            .finally(() => setCapsLoaded(true));

        // Pinned daily briefing, only fetched when authenticated. The
        // /api/notifications/pinned route returns rows from the
        // `notifications` table whose pinned_until > now(). Demo users
        // never get one because they can't opt in from Profile.
        if (token) {
            fetch('/api/notifications/pinned', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            })
                .then(r => r.ok ? r.json() : { pinned: [] })
                .then((data: { pinned: typeof pinned }) => setPinned(data.pinned ?? []))
                .catch(() => { /* non-fatal */ });
        }
    }, []);

    const dismissPinned = async (id: string) => {
        setPinned(prev => prev.filter(p => p.id !== id));
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;
        try {
            await fetch(`/api/notifications/pinned?id=${encodeURIComponent(id)}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch { /* non-fatal */ }
    };

    useEffect(() => {
        const saved = localStorage.getItem('chat-sessions-v2');
        if (saved) { try { const parsed = JSON.parse(saved); setSessions(parsed.map((s: ChatSession & { createdAt: string; messages: (Message & { timestamp: string })[] }) => ({ ...s, createdAt: new Date(s.createdAt), messages: s.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })) }))); if (parsed.length > 0) setActiveSessionId(parsed[0].id); } catch {} }
    }, []);

    // Post-payment greeting. Paywall redirects here with ?subscribed=1
    // on successful invoice confirmation (or dev_simulate). Show the
    // toast once, then strip the param from the URL so a refresh
    // doesn't re-fire it.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('subscribed') !== '1') return;
        showToast('Subscription active. Real Mode ready.', 'success');
        params.delete('subscribed');
        const search = params.toString();
        const url = window.location.pathname + (search ? `?${search}` : '') + window.location.hash;
        window.history.replaceState({}, '', url);
    }, [showToast]);

    // Agent deep-link. /agents → `Try in Chat` card passes ?agent=<id>&prompt=<text>.
    // We pre-fill the textarea and toast the agent name. The params are
    // stripped after read so a refresh doesn't re-seed.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const agentId = params.get('agent');
        const prompt = params.get('prompt');
        if (!agentId && !prompt) return;
        const agent = agentId ? findAgent(agentId) : undefined;
        if (prompt) setInput(prompt);
        if (agent) showToast(`${agent.name} ready. Edit the prompt or send as-is.`, 'info');
        params.delete('agent');
        params.delete('prompt');
        const search = params.toString();
        const url = window.location.pathname + (search ? `?${search}` : '') + window.location.hash;
        window.history.replaceState({}, '', url);
    }, [showToast]);

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
        const currentSession = sessions.find(s => s.id === sessionId);
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, userMessage], title: s.messages.length === 0 ? input.slice(0, 30) : s.title } : s));
        setInput(''); setIsLoading(true);

        // Inject memory context + tool instructions into the system prompt
        let memoryContext = '';
        try {
            const { buildMemoryContext } = await import('@/lib/memoryEngine');
            memoryContext = buildMemoryContext(userMessage.content);
        } catch { /* no memory available */ }

        const toolPrompt = getToolSystemPrompt();
        const baseSystemPrompt = `You are a helpful AI assistant on the Operator Uplift platform. You are concise, accurate, and helpful.${memoryContext}${toolPrompt}`;

        // Single deterministic execution flow (W1A-honesty-1). Every
        // message goes through one LLM call with the selected model.
        // Tool calls the model emits are routed through the approval
        // modal as before. No multi-persona debate, no fabricated
        // "Chairman" branding, no fake request IDs. If a tool call
        // fails, the failure is surfaced once, verbatim from the
        // envelope, with requestId.

        // Tool-call continuation loop: keeps calling the LLM until it returns a
        // final response with no <tool_use> blocks. Max 6 iterations to prevent
        // infinite loops. Each iteration: stream → check for tool calls → execute
        // approved tools → feed results back as context → call LLM again.
        const MAX_TOOL_ROUNDS = 6;

        try {
            // Build initial history from existing messages
            const history: { role: string; content: string }[] = (currentSession?.messages || []).map(m => ({ role: m.role, content: m.content }));
            // Add the new user message
            history.push({ role: 'user', content: userMessage.content });

            for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
                // Call the LLM
                const latestMessage = history[history.length - 1]?.content || '';
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: latestMessage,
                        model: selectedModel,
                        history: history.slice(0, -1),
                        systemPrompt: baseSystemPrompt,
                    }),
                });

                if (!response.ok || !response.body) {
                    // API error, show a calm, actionable message. Include
                    // the request ID so support can trace it.
                    let content: string;
                    const requestId = response.headers.get('x-request-id') || '';
                    if (requestId) {
                        try { localStorage.setItem('lastRequestId', requestId); } catch { /* noop */ }
                    }
                    const trailer = requestId ? `\n\n*Reference: \`${requestId}\`*` : '';
                    try {
                        const errBody = await response.json();
                        if (errBody.connectPrompt) {
                            content = `**${activeModel.label}** is not available right now.\n\n${errBody.connectPrompt}\n\n*${errBody.error}*${trailer}`;
                        } else if (errBody.retryAfterSeconds) {
                            content = `**Rate limit reached.** Try again in ${errBody.retryAfterSeconds} seconds.${trailer}`;
                        } else if (errBody.retryable) {
                            content = `**${activeModel.label} is temporarily unavailable.** ${errBody.error}${trailer}`;
                        } else {
                            content = `**${activeModel.label}** didn\u2019t respond. Try again, or switch to another model from the selector above.${trailer}`;
                        }
                    } catch {
                        content = `**${activeModel.label}** didn't respond. Try again in a moment, or switch to another model.${trailer}`;
                    }
                    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, { id: (Date.now() + 1).toString(), role: 'assistant', content, timestamp: new Date(), model: selectedModel, requestId: requestId || undefined }] } : s));
                    break;
                }

                // Stream the response
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                const assistantId = `${Date.now()}-r${round}`;
                let content = '';

                // Add empty assistant message bubble
                setSessions(prev => prev.map(s => s.id === sessionId ? {
                    ...s,
                    messages: [...s.messages, { id: assistantId, role: 'assistant' as const, content: '', timestamp: new Date(), model: selectedModel }],
                } : s));

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    content += decoder.decode(value, { stream: true });
                    const currentContent = content;
                    setSessions(prev => prev.map(s => s.id === sessionId ? {
                        ...s,
                        messages: s.messages.map(m => m.id === assistantId ? { ...m, content: currentContent } : m),
                    } : s));
                }

                // Check for tool calls
                if (!hasToolCalls(content)) {
                    // No tool calls, this is the final response. Add to history and stop.
                    history.push({ role: 'assistant', content });
                    break;
                }

                // Has tool calls, execute them, then continue the loop
                const calls = parseToolCalls(content);
                const cleanContent = stripToolBlocks(content);

                // Show pending state
                setSessions(prev => prev.map(s => s.id === sessionId ? {
                    ...s,
                    messages: s.messages.map(m => m.id === assistantId ? { ...m, content: cleanContent + '\n\n*Executing tool...*' } : m),
                } : s));

                // Execute each tool call with approval. Capture the first
                // failing result's requestId so the assistant message
                // carries it (Copy Request ID button renders only on
                // messages with msg.requestId set).
                let toolResults = '';
                let anyDenied = false;
                let firstFailureRequestId: string | undefined;
                for (const call of calls) {
                    const result = await requestChatToolApproval(call);
                    if (result) {
                        toolResults += '\n\n' + formatToolResult(result);
                        if (!result.success && !firstFailureRequestId && result.requestId) {
                            firstFailureRequestId = result.requestId;
                        }
                    } else {
                        toolResults += `\n\n**Tool denied.** ${call.tool}.${call.action} was not approved.`;
                        anyDenied = true;
                    }
                }
                if (firstFailureRequestId) {
                    try { localStorage.setItem('lastRequestId', firstFailureRequestId); } catch { /* noop */ }
                }

                // Update the message with clean text + tool results.
                // Attach requestId so the Copy Request ID button renders.
                const messageWithResults = cleanContent + toolResults;
                setSessions(prev => prev.map(s => s.id === sessionId ? {
                    ...s,
                    messages: s.messages.map(m => m.id === assistantId
                        ? { ...m, content: messageWithResults, requestId: firstFailureRequestId || m.requestId }
                        : m),
                } : s));

                // Add to history so the next LLM call sees the tool results
                history.push({ role: 'assistant', content: cleanContent });
                history.push({ role: 'user', content: `Tool results:\n${toolResults}` });

                // If a tool was denied, stop the chain, don't continue with partial context
                if (anyDenied) break;

                // Otherwise, loop continues, LLM gets called again with the tool results
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Network error';
            const content = `**Connection error:** ${errorMsg}\n\nCheck your internet connection and API keys in [Settings](/settings).`;
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, { id: (Date.now() + 1).toString(), role: 'assistant', content, timestamp: new Date(), model: selectedModel }] } : s));
        } finally { setIsLoading(false); }
    };
    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
    const copyMessage = async (content: string, id: string) => { await navigator.clipboard.writeText(content); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };
    const filteredSessions = sessions.filter(s => !sidebarSearch || s.title.toLowerCase().includes(sidebarSearch.toLowerCase()));

    return (
        <MobilePageWrapper>
            <div className="flex h-[calc(100vh-48px)] relative">
                <aside className="hidden md:flex w-72 flex-col border-r border-foreground/10 bg-foreground/[0.06] relative z-10 shrink-0">
                    <div className="p-4 border-b border-foreground/10 space-y-3">
                        <GlowButton onClick={createNewSession} className="w-full justify-center bg-gradient-to-r from-[#F97316]/20 to-[#F97316]/20 border-[#F97316]/30 hover:from-[#F97316]/30 hover:to-[#F97316]/30 text-white h-10"><Plus size={16} className="mr-2" /> New Chat</GlowButton>
                        <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)} placeholder="Search sessions..." aria-label="Search chat sessions" className="w-full bg-foreground/[0.04] border border-foreground/10 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-400 placeholder-gray-600 focus:outline-none focus:border-white/20 transition-all" /></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none">
                        {filteredSessions.length === 0 ? <div className="text-center py-8"><MessageSquare size={24} className="text-gray-700 mx-auto mb-2" /><p className="text-xs text-gray-600">No sessions yet</p></div> :
                            filteredSessions.map(session => (
                                <div key={session.id} className={`group flex items-start gap-2 p-3 rounded-xl cursor-pointer transition-all ${activeSessionId === session.id ? 'bg-[#F97316]/10 border border-[#F97316]/20' : 'hover:bg-foreground/[0.06] border border-transparent'}`} onClick={() => setActiveSessionId(session.id)}>
                                    <Bot size={14} className={`shrink-0 mt-0.5 ${activeSessionId === session.id ? 'text-[#F97316]' : 'text-gray-500'}`} />
                                    <div className="flex-1 min-w-0"><p className={`text-sm truncate font-medium ${activeSessionId === session.id ? 'text-white' : 'text-gray-400'}`}>{session.title}</p><p className="text-[10px] text-gray-600 font-mono mt-0.5">{session.messages.length} msgs · {MODELS.find(m => m.id === session.model)?.label || 'Claude'}</p></div>
                                    <button onClick={e => { e.stopPropagation(); deleteSession(session.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-gray-600 transition-all shrink-0"><Trash2 size={12} /></button>
                                </div>
                            ))
                        }
                    </div>
                </aside>
                <main className="flex-1 flex flex-col min-w-0 relative z-10">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10 bg-foreground/[0.04] backdrop-blur-sm shrink-0 sticky top-0 z-50">
                        <div className="flex items-center gap-3">
                            <CapabilityBadge capabilities={capabilities} loaded={capsLoaded} />
                            <div className="flex gap-1 p-1 bg-foreground/[0.04] rounded-xl border border-foreground/10">
                                {AGENTS.map(agent => { const Icon = agent.icon; return (
                                    <button key={agent.id} onClick={() => setSelectedAgent(agent.id)} className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${selectedAgent === agent.id ? 'bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30' : 'text-gray-500 hover:text-white'}`}>
                                        <Icon size={10} /> <span className="hidden sm:inline">{agent.label.split(' ')[0]}</span>
                                    </button>
                                ); })}
                            </div>
                        </div>
                        <div className="relative">
                            <button onClick={() => setShowModelPicker(!showModelPicker)} className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground/[0.04] border border-foreground/10 hover:bg-white/10 transition-all text-sm ${activeModel.color}`}>
                                <span className="font-bold text-xs truncate max-w-[80px] sm:max-w-none">{activeModel.label}</span>
                                <Badge variant="default" className={`text-[8px] font-mono px-1.5 py-0 ${activeModel.color}`}>{activeModel.badge}</Badge>
                                <ChevronDown size={14} className={`text-gray-500 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
                            </button>
                            {showModelPicker && <div className="absolute top-full right-0 mt-2 w-56 bg-surface border border-foreground/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-none" style={{ isolation: 'isolate' }}>
                                {MODELS.map(model => (
                                    <button key={model.id} onClick={() => { setSelectedModel(model.id); setShowModelPicker(false); }} className={`w-full flex items-center justify-between px-4 py-3 hover:bg-foreground/[0.06] transition-colors text-left ${selectedModel === model.id ? 'bg-foreground/[0.04]' : ''}`}>
                                        <div><p className={`text-sm font-bold ${model.color}`}>{model.label}</p><p className="text-[10px] text-gray-600 font-mono">{model.provider}</p></div>
                                        <div className="flex items-center gap-2"><Badge variant="default" className={`text-[8px] font-mono px-1.5 ${model.color}`}>{model.badge}</Badge>{selectedModel === model.id && <Check size={14} className={model.color} />}</div>
                                    </button>
                                ))}
                            </div>}
                        </div>
                    </div>
                    {capsLoaded && !capabilities.capability_real && !demoBannerDismissed && (
                        <div className="px-4 py-2 border-b border-[#F97316]/20 bg-[#F97316]/5 flex items-center gap-3 shrink-0">
                            <Sparkles size={14} className="text-[#F97316] shrink-0" />
                            <p className="text-xs text-[#F97316] flex-1">
                                {capabilities.authenticated
                                    ? 'You\'re signed in but no Google or API key is connected, every reply is simulated.'
                                    : 'Anonymous demo, every reply and tool action is simulated.'}
                                {' '}
                                <a href="/integrations" className="underline hover:text-white">Connect Google</a>
                                {' or '}
                                <a href="/settings" className="underline hover:text-white">add an API key</a>
                                {' to make it real.'}
                            </p>
                            <button
                                onClick={() => setDemoBannerDismissed(true)}
                                aria-label="Dismiss demo banner"
                                className="p-1 rounded text-[#F97316]/60 hover:text-[#F97316] hover:bg-[#F97316]/10"
                            >
                                <XIcon size={14} />
                            </button>
                        </div>
                    )}
                    {pinned.length > 0 && (
                        <div className="px-4 py-2 border-b border-emerald-500/20 bg-emerald-500/5 shrink-0 space-y-2">
                            {pinned.map(row => (
                                <div key={row.id} className="flex items-start gap-3">
                                    <Pin size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        {row.title && <p className="text-xs font-semibold text-emerald-300">{row.title}</p>}
                                        {row.body && <p className="text-xs text-emerald-100/80 leading-relaxed">{row.body}</p>}
                                    </div>
                                    <button
                                        onClick={() => dismissPinned(row.id)}
                                        aria-label="Dismiss pinned message"
                                        className="p-1 rounded text-emerald-300/60 hover:text-emerald-300 hover:bg-emerald-500/10"
                                    >
                                        <XIcon size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto scrollbar-none" onClick={() => setShowModelPicker(false)}>
                        {!activeSession || activeSession.messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-8">
                                <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-6 bg-primary/20"><Sparkles size={28} className="text-primary" /></div>
                                <h1 className="text-3xl font-medium tracking-tight text-white mb-2 text-center">How can I help you?</h1>
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
                                    <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}>
                                        {msg.role === 'assistant' && <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-foreground/[0.04]"><Bot size={16} className="text-gray-400" /></div>}
                                        <div className={`group relative max-w-[80%] md:max-w-[72%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                                            {msg.role === 'assistant' && msg.model && <p className="text-[10px] font-mono text-gray-600 mb-1 ml-1">{MODELS.find(m => m.id === msg.model)?.label || msg.model}</p>}
                                            <div className={`px-4 py-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-primary/20 text-white rounded-br-md' : 'bg-foreground/[0.04] border border-foreground/10 text-gray-200 rounded-bl-md'}`}>
                                                {msg.role === 'assistant' ? renderMarkdown(msg.content) : <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                                            </div>
                                            {msg.role === 'assistant' && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <button onClick={() => copyMessage(msg.content, msg.id)} className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/80 border border-foreground/10 text-gray-400 hover:text-white transition-all text-[10px] font-mono shadow-xl">{copiedId === msg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}{copiedId === msg.id ? 'Copied' : 'Copy'}</button>
                                                    {msg.requestId && (
                                                        <button
                                                            onClick={() => copyMessage(msg.requestId!, `${msg.id}-reqid`)}
                                                            title={`Copy ${msg.requestId}`}
                                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/80 border border-[#F97316]/30 text-[#F97316] hover:bg-[#F97316]/10 transition-all text-[10px] font-mono shadow-xl"
                                                        >
                                                            {copiedId === `${msg.id}-reqid` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                                            {copiedId === `${msg.id}-reqid` ? 'Copied' : 'Copy Request ID'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {msg.role === 'user' && <div className="h-8 w-8 rounded-full bg-foreground/[0.04] flex items-center justify-center shrink-0"><User size={16} className="text-white" /></div>}
                                    </div>
                                ))}
                                {isLoading && <div className="flex gap-4"><div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-foreground/[0.04]"><Bot size={16} className="text-gray-400" /></div><div className="bg-foreground/[0.04] border border-foreground/10 rounded-xl rounded-bl-md px-4 py-3"><div className="flex items-center gap-2"><div className="flex gap-1">{[0,150,300].map(delay => <span key={delay} className="w-2 h-2 rounded-full bg-[#F97316] animate-bounce" style={{ animationDelay: `${delay}ms` }} />)}</div><span className="text-[10px] font-mono text-gray-600">{`${activeModel.label} is thinking...`}</span></div></div></div>}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t border-foreground/10 bg-foreground/[0.04] backdrop-blur-sm shrink-0">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-end gap-3 p-3 rounded-lg bg-foreground/[0.04] border border-foreground/10 focus-within:border-[#F97316]/40 transition-all">
                                <button onClick={createNewSession} aria-label="New chat" className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-all md:hidden shrink-0"><Plus size={20} /></button>
                                {/* TODO: Agent selector, load installed agents from localStorage('installed-agents') + localStorage('custom-agents'),
                                   show a dropdown to pick an agent whose system prompt seeds the conversation.
                                   For now, the agent personas (General/Code/Research) in the top bar serve this role. */}
                                <button onClick={() => showToast('File attachments coming soon', 'info')} aria-label="Attach file" className="p-2 rounded-xl text-gray-600 hover:text-gray-400 hover:bg-foreground/[0.06] transition-all shrink-0"><Paperclip size={18} /></button>
                                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Message ${activeModel.label}...`} aria-label="Chat message input" rows={1}
                                    className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none resize-none text-[15px] leading-relaxed min-h-[40px] max-h-40" style={{ height: 'auto' }}
                                    onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 160) + 'px'; }} />
                                <button onClick={() => showToast('Voice input coming soon', 'info')} aria-label="Voice input" className="p-2 rounded-xl text-gray-600 hover:text-gray-400 hover:bg-foreground/[0.06] transition-all shrink-0"><Mic size={18} /></button>
                                <button onClick={handleSend} disabled={!input.trim() || isLoading} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed bg-primary hover:bg-primary/90">
                                    {isLoading ? <Loader2 size={18} className="animate-spin text-white" /> : <Send size={18} className="text-white" />}
                                </button>
                            </div>
                            <p className="text-center text-[10px] font-mono text-gray-600 mt-2">Enter to send · Shift+Enter for new line · {activeModel.label} powered by Operator Uplift</p>
                        </div>
                    </div>
                </main>
            </div>

            {/* Tool Approval Modal */}
            {pendingToolCall && (
                <ToolApprovalModal
                    toolCall={pendingToolCall}
                    userId={getChatUserId()}
                    demoMode={!capabilities.capability_real}
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
