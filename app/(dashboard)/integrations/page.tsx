"use client";

import { useState, useEffect, useRef } from 'react';
import { Plug, Mail, Calendar, Database, Globe } from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { MobilePageWrapper } from '@/src/components/mobile';
import { useToast } from '@/src/components/ui/Toast';
import { IMessageVerifyCard } from '@/src/components/integrations/IMessageVerifyCard';
import { IMessageRecentPanel } from '@/src/components/integrations/IMessageRecentPanel';

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

// Status semantics:
//   'connected'   = wired up + working out of the box (no user action)
//   'available'   = wired up but requires a connect step (Google OAuth)
//
// Only items that ship today appear here. Future integrations don't
// get a placeholder row; they get a real `/api/tools/*` route + a row
// at the same time. The grid was previously full of `coming_soon`
// stubs which (per user feedback 2026-05-08) read as vaporware.
const INTEGRATIONS: Integration[] = [
    // Communication
    { id: 'gmail', name: 'Gmail', description: 'Read, draft, and send emails from /chat or iMessage. Approval-gated, signed receipt per action.', category: 'Communication', icon: Mail, status: 'available', howItWorks: 'OAuth scope grants the agent read+compose access. Drafts and sends are staged for your tap; we never auto-send.' },

    // Productivity
    { id: 'gcal', name: 'Google Calendar', description: 'Create events from natural language ("schedule a meeting tomorrow at 3pm"). Same approval gate.', category: 'Productivity', icon: Calendar, status: 'available', howItWorks: 'OAuth scope for events.write. The natural-language event-time parser turns "tomorrow at 3" into a real ISO range.' },

    // Web & APIs
    { id: 'web_search', name: 'Web Search', description: 'Search the internet, browse pages, extract structured data when the agent needs facts beyond your inbox.', category: 'Web', icon: Globe, status: 'connected', howItWorks: 'Built-in. No connect step needed.' },

    // Data & Storage
    { id: 'supabase', name: 'Supabase', description: 'Powers the Operator Uplift backend (auth, receipts, opt-outs, audit log). Already wired; nothing to connect.', category: 'Data', icon: Database, status: 'connected', howItWorks: 'Internal. Surfaced here so admins can see which storage layers the agent reads from.' },
];

export default function IntegrationsPage() {
    const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set(INTEGRATIONS.filter(i => i.status === 'connected').map(i => i.id)));
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const { showToast } = useToast();

    // No filtering: with 4 integrations a search box + category chips
    // are noise. Render the full list. Reinstate the filter row when
    // the grid grows past ~8 entries.
    const filtered = INTEGRATIONS;

    const callbackHandled = useRef(false);

    // Check URL params for OAuth callback result (ref guard prevents strict-mode double-fire)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (callbackHandled.current) return;
        const params = new URLSearchParams(window.location.search);

        // Always clear the short-lived privy-token cookie we set before the
        // redirect, we only need it during the OAuth flow.
        const clearPrivyCookie = () => {
            document.cookie = `privy-token=; Path=/; Max-Age=0; SameSite=Lax`;
        };

        if (params.get('google') === 'connected') {
            callbackHandled.current = true;
            clearPrivyCookie();
            setConnectedIds(prev => { const next = new Set(prev); next.add('gmail'); next.add('gcal'); return next; });
            showToast('Google Calendar + Gmail connected!', 'success');
            window.history.replaceState({}, '', '/integrations');
        } else if (params.get('error')) {
            callbackHandled.current = true;
            clearPrivyCookie();
            const err = params.get('error') || 'unknown';
            // Clean up known error codes into human language
            const humanized =
                err === 'not_authenticated' ? 'Your session expired during the Google redirect. Please try again.' :
                err === 'invalid_state' ? 'Security check failed, please start the Google connection again.' :
                err === 'missing_code_or_state' ? 'Google did not return a valid response. Please try again.' :
                err === 'access_denied' ? 'You declined the Google consent prompt.' :
                `Google connection failed: ${err}`;
            showToast(humanized, 'error');
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
            // The Google connect endpoint is a top-level browser navigation,
            // so the Authorization header isn't sent. We write the Privy JWT
            // into a short-lived `privy-token` cookie BEFORE navigating so
            // the middleware + route handler can verify it.
            //
            // SameSite=Lax so it survives the round-trip via Google (Google
            // redirects back to /callback via a GET, Lax allows this).
            // Secure set when on HTTPS. Max-Age 5 minutes, only needs to
            // live for the duration of the OAuth flow.
            if (typeof document !== 'undefined') {
                const secure = window.location.protocol === 'https:' ? '; Secure' : '';
                document.cookie = `privy-token=${token}; Path=/; Max-Age=300; SameSite=Lax${secure}`;
            }
            window.location.href = '/api/integrations/google/connect';
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
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Plug size={16} className="text-[#F97316]" />
                                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Connect</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-medium tracking-tight text-white">Integrations</h1>
                            <p className="text-sm text-gray-400 mt-1">Connect your agents to the tools you already use</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> {INTEGRATIONS.filter(i => getTier(i.id, i.status) === 'live').length} live</span>
                        </div>
                    </div>

                    {/* iMessage verification card. Lives ABOVE the integrations
                        grid because the iMessage agent's pending YES/NO replies
                        point users here to authorize, and Gmail/Calendar tool
                        calls over iMessage will require this row before they
                        can fire. */}
                    <IMessageVerifyCard />

                    {/* Personal recent-traffic panel. Collapsed by default
                        so it doesn't fetch on every dashboard mount. Opens
                        to show the calling user's own inbound rows + bot
                        replies, scoped server-side to senders they own. */}
                    <IMessageRecentPanel />

                    {/* Grid. Search + category filters were trimmed alongside
                        the grid trim from 23 -> 4 integrations: filtering 4
                        cards by name or by 4 single-card categories was UX
                        noise. When a new integration ships and the count
                        passes ~8, restore the filter row above this grid. */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(integration => {
                            const Icon = integration.icon;
                            const isConnected = connectedIds.has(integration.id);
                            const isExpanded = expandedId === integration.id;
                            return (
                                <Card key={integration.id} variant="glass" className={`group transition-all cursor-pointer ${isConnected ? 'border-emerald-400/20' : 'hover:border-primary/30'}`}
                                    onClick={() => setExpandedId(isExpanded ? null : integration.id)}>
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isConnected ? 'bg-emerald-400/10' : 'bg-foreground/[0.04]'}`}>
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
                                            <div className="mb-4 p-3 rounded-lg bg-foreground/[0.04] border border-foreground/10 text-xs text-gray-300">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">How it works</span>
                                                {integration.howItWorks}
                                            </div>
                                        )}

                                        <button onClick={e => { e.stopPropagation(); handleConnect(integration.id, integration.name); }}
                                            className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                                                isConnected ? 'bg-foreground/[0.04] text-gray-400 hover:text-red-400 hover:bg-red-400/10' : 'bg-primary/10 text-primary hover:bg-primary/20'
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
