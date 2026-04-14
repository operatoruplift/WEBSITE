"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, ExternalLink, Check, Plug, Github, Mail, MessageSquare, Calendar, Database, FileText, Globe, Shield, Zap, Code } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { MobilePageWrapper } from '@/src/components/mobile';
import { useToast } from '@/src/components/ui/Toast';

interface Integration {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    status: 'available' | 'connected' | 'coming_soon';
    howItWorks: string;
}

const LIVE_IDS = new Set(['gmail', 'gcal', 'supabase', 'web_search']);

type Tier = 'live' | 'demo' | 'wired';
function getTier(id: string, status: string): Tier {
    if (LIVE_IDS.has(id)) return 'live';
    if (status === 'connected') return 'live';
    return 'demo';
}

const TIER_BADGE: Record<string, { label: string; className: string }> = {
    live: { label: 'LIVE', className: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
    wired: { label: 'WIRED', className: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
    demo: { label: 'DEMO', className: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
};

const INTEGRATIONS: Integration[] = [
    // Developer Tools
    { id: 'github', name: 'GitHub', description: 'PR reviews, issue triage, code analysis, commit monitoring', category: 'Developer', icon: Github, status: 'available', howItWorks: 'Agent uses GitHub API via tool calls to read repos, create PRs, and manage issues.' },
    { id: 'gitlab', name: 'GitLab', description: 'CI/CD pipelines, merge requests, repository management', category: 'Developer', icon: Code, status: 'available', howItWorks: 'Agent uses GitLab REST API to manage projects, pipelines, and merge requests.' },
    { id: 'jira', name: 'Jira', description: 'Issue tracking, sprint management, story estimation', category: 'Developer', icon: Zap, status: 'available', howItWorks: 'Agent uses Jira Cloud REST API to create/update issues, manage sprints.' },
    { id: 'linear', name: 'Linear', description: 'Project tracking, issue management, cycle planning', category: 'Developer', icon: Zap, status: 'available', howItWorks: 'Agent uses Linear GraphQL API to manage issues and projects.' },

    // Communication
    { id: 'slack', name: 'Slack', description: 'Send messages, create channels, monitor conversations', category: 'Communication', icon: MessageSquare, status: 'available', howItWorks: 'Agent uses Slack Web API to post messages, read channels, and respond to events.' },
    { id: 'discord', name: 'Discord', description: 'Bot messages, server management, moderation', category: 'Communication', icon: MessageSquare, status: 'available', howItWorks: 'Agent uses Discord Bot API to send messages and manage servers.' },
    { id: 'gmail', name: 'Gmail', description: 'Read, draft, and send emails. Label and organize inbox', category: 'Communication', icon: Mail, status: 'available', howItWorks: 'Agent uses Gmail API via OAuth to read and compose emails.' },
    { id: 'outlook', name: 'Outlook', description: 'Email management, calendar events, contacts', category: 'Communication', icon: Mail, status: 'available', howItWorks: 'Agent uses Microsoft Graph API for email and calendar access.' },

    // Data & Storage
    { id: 'postgres', name: 'PostgreSQL', description: 'Query databases, generate reports, manage schemas', category: 'Data', icon: Database, status: 'available', howItWorks: 'Agent generates and executes SQL queries via secure database connection.' },
    { id: 'supabase', name: 'Supabase', description: 'Database CRUD, auth management, storage', category: 'Data', icon: Database, status: 'connected', howItWorks: 'Already connected — powers the Operator Uplift backend.' },
    { id: 'notion', name: 'Notion', description: 'Read and write pages, databases, and wikis', category: 'Data', icon: FileText, status: 'available', howItWorks: 'Agent uses Notion API to read/write pages and query databases.' },
    { id: 'gdrive', name: 'Google Drive', description: 'File management, document creation, sharing', category: 'Data', icon: FileText, status: 'available', howItWorks: 'Agent uses Google Drive API to manage files and folders.' },

    // Productivity
    { id: 'gcal', name: 'Google Calendar', description: 'Schedule events, check availability, set reminders', category: 'Productivity', icon: Calendar, status: 'available', howItWorks: 'Agent uses Google Calendar API to create/read events.' },
    { id: 'todoist', name: 'Todoist', description: 'Task management, project organization, reminders', category: 'Productivity', icon: Check, status: 'available', howItWorks: 'Agent uses Todoist REST API to manage tasks and projects.' },

    // Web & APIs
    { id: 'web_search', name: 'Web Search', description: 'Search the internet, scrape pages, extract data', category: 'Web', icon: Globe, status: 'connected', howItWorks: 'Built-in capability — agents can search and browse the web.' },
    { id: 'rest_api', name: 'Custom REST API', description: 'Connect to any REST API with custom endpoints', category: 'Web', icon: Globe, status: 'available', howItWorks: 'Configure custom API endpoints as agent tools.' },
    { id: 'webhooks', name: 'Webhooks', description: 'Receive and send webhooks for event-driven automation', category: 'Web', icon: Zap, status: 'available', howItWorks: 'Set up webhook endpoints that trigger agent workflows.' },

    // Security
    { id: 'sentry', name: 'Sentry', description: 'Error tracking, performance monitoring, alerting', category: 'Security', icon: Shield, status: 'available', howItWorks: 'Agent monitors Sentry API for new errors and creates fix PRs.' },
    { id: 'cloudflare', name: 'Cloudflare', description: 'DNS management, WAF rules, performance analytics', category: 'Security', icon: Shield, status: 'available', howItWorks: 'Agent uses Cloudflare API to manage DNS and security rules.' },

    // Blockchain & Finance
    { id: 'solana', name: 'Solana', description: 'On-chain transactions, wallet management, dApp interactions, agent registry', category: 'Blockchain', icon: Zap, status: 'available', howItWorks: 'Agent uses Solana Web3.js to sign transactions, check balances, and interact with on-chain programs.' },
    { id: 'zcash', name: 'Zcash', description: 'Privacy-preserving payments, shielded transactions, z-addr support', category: 'Blockchain', icon: Shield, status: 'available', howItWorks: 'Agent uses Zcash RPC API for shielded (z-addr) and transparent transactions. Full privacy for agent-to-agent payments.' },
    { id: 'prime_intellect', name: 'Prime Intellect', description: 'Decentralized AI compute, GPU marketplace, distributed training', category: 'Blockchain', icon: Zap, status: 'coming_soon', howItWorks: 'Agents can provision decentralized GPU compute for model inference and fine-tuning via Prime Intellect API.' },
    { id: 'oro_grail', name: 'Oro GRAIL', description: 'Gold-backed digital assets, tokenized gold transactions, treasury management', category: 'Blockchain', icon: Database, status: 'coming_soon', howItWorks: 'Agent uses Oro GRAIL API to interact with gold as easily as USDC. Treasury agents can diversify into gold-backed assets.' },
    { id: 'dd_xyz', name: 'DD.xyz', description: 'Real-time risk data, due diligence reports, compliance scoring', category: 'Blockchain', icon: Shield, status: 'available', howItWorks: 'Agent queries DD.xyz APIs for the most extensive risk-related data available. Powers Blackwall threat assessment and compliance checks.' },
    { id: 'x402', name: 'x402 Protocol', description: 'Agent-to-agent payments, HTTP 402 micropayments, multi-chain support', category: 'Blockchain', icon: Zap, status: 'coming_soon', howItWorks: 'Enables machine-to-machine payments via HTTP 402 protocol. Zero processing fees beyond on-chain gas. Supports Solana, Ethereum, Base.' },
];

const CATEGORIES = ['All', ...new Set(INTEGRATIONS.map(i => i.category))];

export default function IntegrationsPage() {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set(INTEGRATIONS.filter(i => i.status === 'connected').map(i => i.id)));
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const { showToast } = useToast();

    const filtered = INTEGRATIONS
        .filter(i => category === 'All' || i.category === category)
        .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()));

    const [googleConnected, setGoogleConnected] = useState(false);
    const callbackHandled = useRef(false);

    // Check URL params for OAuth callback result (ref guard prevents strict-mode double-fire)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (callbackHandled.current) return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('google') === 'connected') {
            callbackHandled.current = true;
            setGoogleConnected(true);
            setConnectedIds(prev => { const next = new Set(prev); next.add('gmail'); next.add('gcal'); return next; });
            showToast('Google Calendar + Gmail connected!', 'success');
            window.history.replaceState({}, '', '/integrations');
        } else if (params.get('error')) {
            callbackHandled.current = true;
            showToast(`Google connection failed: ${params.get('error')}`, 'error');
            window.history.replaceState({}, '', '/integrations');
        }
    }, [showToast]);

    const handleConnect = (id: string, name: string) => {
        // Real OAuth flow for Google integrations
        if (id === 'gmail' || id === 'gcal') {
            // Guard: require a real Privy session, not a demo user
            const userRaw = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            const userId = userRaw ? JSON.parse(userRaw).id : null;
            if (!token || token === 'demo-token' || !userId || userId === 'demo-user' || userId === 'anon') {
                showToast('Sign in with Google, GitHub, or a wallet first to connect.', 'warning');
                window.location.href = '/login';
                return;
            }
            window.location.href = `/api/integrations/google/connect?user_id=${encodeURIComponent(userId)}`;
            return;
        }

        // Demo toggle for everything else
        const wasConnected = connectedIds.has(id);
        setConnectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
        // Toast outside the updater to prevent double-fire from batched re-renders
        if (wasConnected) showToast(`${name} disconnected`, 'info');
        else showToast(`${name} connected! Configure in agent tools.`, 'success');
    };

    return (
        <MobilePageWrapper>
            <div className="min-h-screen p-6 lg:p-8">
                <div className="max-w-[1400px] mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fadeInUp">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Plug size={16} className="text-[#E77630]" />
                                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Connect</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-medium tracking-tight text-white">Integrations</h1>
                            <p className="text-sm text-gray-400 mt-1">Connect your agents to the tools you already use</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> {connectedIds.size} connected</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-600" /> {INTEGRATIONS.length - connectedIds.size} available</span>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search integrations..." aria-label="Search integrations"
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:border-primary/50 focus:outline-none" />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {CATEGORIES.map(cat => (
                                <button key={cat} onClick={() => setCategory(cat)}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all ${
                                        category === cat ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                                    }`}>{cat}</button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(integration => {
                            const Icon = integration.icon;
                            const isConnected = connectedIds.has(integration.id);
                            const isExpanded = expandedId === integration.id;
                            return (
                                <Card key={integration.id} variant="glass" className={`group transition-all cursor-pointer ${isConnected ? 'border-emerald-400/20' : 'hover:border-white/10'}`}
                                    onClick={() => setExpandedId(isExpanded ? null : integration.id)}>
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isConnected ? 'bg-emerald-400/10' : 'bg-white/5'}`}>
                                                    <Icon size={18} className={isConnected ? 'text-emerald-400' : 'text-gray-400'} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-semibold text-white">{integration.name}</h3>
                                                    <span className="text-[10px] font-mono text-gray-500">{integration.category}</span>
                                                </div>
                                            </div>
                                            {isConnected && <Badge variant="default" className="text-[9px] bg-emerald-400/10 text-emerald-400 border-emerald-400/20">Connected</Badge>}
                            {(() => { const t = getTier(integration.id, integration.status); const b = TIER_BADGE[t]; return <Badge variant="default" className={`text-[8px] font-mono border ${b.className}`}>{b.label}</Badge>; })()}
                                        </div>
                                        <p className="text-xs text-gray-400 mb-4">{integration.description}</p>

                                        {isExpanded && (
                                            <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-300">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">How it works</span>
                                                {integration.howItWorks}
                                            </div>
                                        )}

                                        <button onClick={e => { e.stopPropagation(); handleConnect(integration.id, integration.name); }}
                                            className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                                                isConnected ? 'bg-white/5 text-gray-400 hover:text-red-400 hover:bg-red-400/10' : 'bg-primary/10 text-primary hover:bg-primary/20'
                                            }`}>
                                            {isConnected ? 'Disconnect' : 'Connect'}
                                        </button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {filtered.length === 0 && (
                        <div className="text-center py-20">
                            <Plug size={48} className="text-gray-700 mx-auto mb-4" />
                            <p className="text-gray-500">No integrations found</p>
                        </div>
                    )}
                </div>
            </div>
        </MobilePageWrapper>
    );
}
