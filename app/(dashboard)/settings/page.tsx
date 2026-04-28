"use client";

import { useState, useEffect, useMemo } from 'react';
import { Settings, User, Bell, Palette, Shield, Key, Database, Save, Check, Copy, RefreshCw, Activity } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { MobilePageWrapper } from '@/src/components/mobile';
import { useToast } from '@/src/components/ui/Toast';

// Demo-only key generator. These keys never leave the browser
// (localStorage only) and no /api/* route accepts them. Math.random
// is fine here because nothing security-sensitive depends on the
// output. Replace with crypto.getRandomValues + a real allowlist
// when the auth backend ships.
function generateApiKey() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'sk-ou-demo-';
    for (let i = 0; i < 28; i++) key += chars[Math.floor(Math.random() * chars.length)];
    return key;
}

interface PersistedSettings {
    displayName?: string;
    email?: string;
    emailNotifs?: boolean;
    pushNotifs?: boolean;
    productUpdates?: boolean;
    marketing?: boolean;
    theme?: string;
    apiKeys?: { key: string; created: string; expires?: string }[];
}

// Lazy initializer reads localStorage once at first client render.
// Avoids the cascading-render warning that the old "useState defaults
// + useEffect setState" pattern triggered.
function loadSettings(): PersistedSettings {
    if (typeof window === 'undefined') return {};
    try {
        return JSON.parse(localStorage.getItem('ou-settings') || '{}') as PersistedSettings;
    } catch { return {}; }
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [saved, setSaved] = useState(false);
    const { showToast } = useToast();

    // All localStorage-derived state goes through a single lazy
    // initializer. The defaults below are what we use when there's no
    // saved value (fresh user) or during SSR.
    const persisted = useMemo(() => loadSettings(), []);
    const [displayName, setDisplayName] = useState(persisted.displayName ?? 'Friend');
    const [email, setEmail] = useState(persisted.email ?? 'user@operator.uplift');
    const [emailNotifs, setEmailNotifs] = useState(persisted.emailNotifs ?? true);
    const [pushNotifs, setPushNotifs] = useState(persisted.pushNotifs ?? true);
    const [productUpdates, setProductUpdates] = useState(persisted.productUpdates ?? true);
    const [marketing, setMarketing] = useState(persisted.marketing ?? false);
    const [theme, setTheme] = useState(persisted.theme ?? 'Dark');
    const [apiKeys, setApiKeys] = useState<{ key: string; created: string; expires?: string }[]>(persisted.apiKeys ?? []);

    // Theme is a real DOM side effect, this useEffect only applies the
    // already-resolved `theme` state to the document. No setState on
    // mount, no cascading render.
    useEffect(() => {
        if (theme === 'Light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else if (theme === 'System' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }, [theme]);

    const handleSave = () => {
        const settings = { displayName, email, emailNotifs, pushNotifs, productUpdates, marketing, theme, apiKeys };
        localStorage.setItem('ou-settings', JSON.stringify(settings));
        setSaved(true);
        showToast('Settings saved successfully', 'success');
        setTimeout(() => setSaved(false), 2000);
    };

    const handleGenerateKey = () => {
        // The generated key is stored in localStorage but no /api/* route
        // accepts it. Until the auth backend lands, mark the key as DEMO
        // so a user trying to use it knows it won't authenticate.
        const newKey = {
            key: generateApiKey(),
            created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            expires: undefined,
        };
        setApiKeys(prev => [...prev, newKey]);
        showToast('Demo key created. The API auth backend is not yet wired up, so this key will not authenticate against /api/* routes.', 'info');
    };

    const handleCopyKey = async (key: string) => {
        await navigator.clipboard.writeText(key);
        showToast('API key copied to clipboard', 'info');
    };

    const handleRevokeKey = (key: string) => {
        setApiKeys(prev => prev.filter(k => k.key !== key));
        showToast('API key revoked', 'warning');
    };

    const handleExportData = () => {
        const data = { settings: JSON.parse(localStorage.getItem('ou-settings') || '{}'), chatSessions: JSON.parse(localStorage.getItem('chat-sessions-v2') || '[]'), customAgents: JSON.parse(localStorage.getItem('custom-agents') || '[]') };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'operator-uplift-export.json'; a.click();
        URL.revokeObjectURL(url);
        showToast('Data exported successfully', 'success');
    };

    const handleDeleteAccount = () => {
        if (confirm('Are you sure? This will clear all local data.')) {
            localStorage.clear();
            showToast('All data cleared', 'warning');
            window.location.href = '/';
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'api', label: 'API Keys', icon: Key },
        { id: 'data', label: 'Data & Storage', icon: Database },
        { id: 'diagnostics', label: 'Status', icon: Activity },
        { id: 'advanced', label: 'Advanced', icon: Settings },
    ];

    const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
        <button onClick={() => onChange(!value)} className={`w-10 h-5 rounded-full flex items-center p-0.5 transition-all ${value ? 'bg-emerald-500/20 justify-end border border-emerald-500/30' : 'bg-gray-600/30 justify-start border border-white/10'}`}>
            <div className={`w-4 h-4 rounded-full transition-all ${value ? 'bg-emerald-400 shadow-[0_0_5px_currentColor]' : 'bg-gray-500'}`} />
        </button>
    );

    return (
        <MobilePageWrapper>
            <div className="min-h-screen p-6 lg:p-8">
                <div className="max-w-[1000px] mx-auto space-y-8">
                    <div className="animate-fadeInUp">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-800 border border-white/10"><Settings size={20} className="text-white" /></div>
                        </div>
                        <h1 className="text-4xl font-medium tracking-tight text-white">Settings</h1>
                        <p className="text-sm text-gray-400 mt-2 font-mono">Configure your Operator Uplift experience</p>
                    </div>
                    <div className="flex gap-6">
                        <div className="w-48 shrink-0 hidden md:block">
                            <nav className="space-y-1">
                                {tabs.map(tab => { const Icon = tab.icon; return (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeTab === tab.id ? 'bg-white/10 text-white border border-white/10' : 'text-gray-400 hover:text-white hover:bg-foreground/[0.06]'}`}>
                                        <Icon size={16} />{tab.label}
                                    </button>
                                ); })}
                            </nav>
                        </div>
                        <div className="flex-1">
                            {/* Mobile tab selector */}
                            <div className="md:hidden mb-4 flex gap-1 overflow-x-auto pb-2 scrollbar-none">
                                {tabs.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === tab.id ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-foreground/[0.04] text-gray-400'}`}>{tab.label}</button>)}
                            </div>
                            <Card variant="glass" className="p-8 border-foreground/10 bg-foreground/[0.04]">
                                {activeTab === 'profile' && (
                                    <div className="space-y-6">
                                        <h2 className="text-lg font-medium text-white">Profile</h2>
                                        <div className="flex items-center gap-6"><div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #F97316, #F97316)' }}>{displayName.charAt(0).toUpperCase()}</div><div><p className="text-sm text-white font-medium">{displayName}</p><p className="text-xs text-gray-500">{email}</p></div></div>
                                        <div className="space-y-4">
                                            <div><label className="text-sm text-gray-400 block mb-2">Display Name</label><input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-foreground/[0.04] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 focus:outline-none" /></div>
                                            <div><label className="text-sm text-gray-400 block mb-2">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-foreground/[0.04] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 focus:outline-none" /></div>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'notifications' && (
                                    <div className="space-y-6">
                                        <h2 className="text-lg font-medium text-white">Notifications</h2>
                                        {[
                                            { label: 'Email notifications', value: emailNotifs, set: setEmailNotifs },
                                            { label: 'Push notifications', value: pushNotifs, set: setPushNotifs },
                                            { label: 'Product updates', value: productUpdates, set: setProductUpdates },
                                            { label: 'Marketing emails', value: marketing, set: setMarketing },
                                        ].map(item => (
                                            <div key={item.label} className="flex items-center justify-between py-3 border-b border-foreground/10">
                                                <span className="text-sm text-gray-300">{item.label}</span>
                                                <Toggle value={item.value} onChange={item.set} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {activeTab === 'appearance' && (
                                    <div className="space-y-6">
                                        <h2 className="text-lg font-medium text-white">Appearance</h2>
                                        <div className="grid grid-cols-3 gap-4">
                                            {['Dark', 'Light', 'System'].map(t => (
                                                <button key={t} onClick={() => {
                                                    setTheme(t);
                                                    const root = document.documentElement;
                                                    if (t === 'Light') root.setAttribute('data-theme', 'light');
                                                    else if (t === 'System' && window.matchMedia('(prefers-color-scheme: light)').matches) root.setAttribute('data-theme', 'light');
                                                    else root.removeAttribute('data-theme');
                                                }} className={`p-4 rounded-xl border text-center transition-all ${theme === t ? 'bg-primary/10 border-primary/30 text-white' : 'bg-foreground/[0.04] border-white/10 text-gray-400 hover:border-primary/30'}`}>
                                                    <div className={`w-12 h-8 rounded-lg mx-auto mb-2 ${t === 'Dark' ? 'bg-gray-900 border border-white/20' : t === 'Light' ? 'bg-white border border-gray-300' : 'bg-gradient-to-r from-gray-900 to-white border border-white/20'}`} />
                                                    <span className="text-sm font-medium">{t}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'security' && (
                                    <div className="space-y-6">
                                        <h2 className="text-lg font-medium text-white">Security</h2>
                                        <PasswordChangeForm showToast={showToast} />
                                        <EncryptionSetup showToast={showToast} />
                                        <div className="p-4 rounded-xl bg-foreground/[0.04] border border-foreground/10"><div className="flex items-center justify-between"><div><p className="text-sm text-white font-medium">Two-Factor Authentication</p><p className="text-xs text-gray-500 mt-1">Add an extra layer of security</p></div><GlowButton variant="outline" size="sm" onClick={() => showToast('2FA requires a connected backend. Coming soon.', 'info')}>Enable 2FA</GlowButton></div></div>
                                    </div>
                                )}
                                {activeTab === 'api' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-medium text-white">API Keys</h2>
                                            <span className="text-[8px] font-mono font-bold tracking-widest uppercase px-1.5 py-0.5 rounded border bg-amber-400/10 text-amber-400 border-amber-400/20">DEMO</span>
                                        </div>
                                        <p className="text-xs text-gray-500 -mt-2">Generated keys are stored locally for UI testing. The auth backend that accepts them isn&apos;t live yet, so these keys won&apos;t authenticate against the API.</p>
                                        {apiKeys.length > 0 ? (
                                            <div className="space-y-3">
                                                {apiKeys.map(k => (
                                                    <div key={k.key} className="p-4 rounded-xl bg-foreground/[0.04] border border-foreground/10 flex items-center justify-between">
                                                        <div><p className="text-sm text-gray-400 font-mono">{k.key.substring(0, 12)}••••••••{k.key.substring(k.key.length - 4)}</p><p className="text-[10px] text-gray-600 mt-1">Created {k.created} · Demo key, not yet active</p></div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleCopyKey(k.key)} className="text-xs text-primary hover:underline flex items-center gap-1"><Copy size={12} /> Copy</button>
                                                            <button onClick={() => handleRevokeKey(k.key)} className="text-xs text-red-400 hover:underline">Revoke</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-6 rounded-xl bg-white/[0.02] border border-foreground/10 text-center"><p className="text-sm text-gray-500">No API keys generated yet</p></div>
                                        )}
                                        <GlowButton variant="outline" onClick={handleGenerateKey}><Key size={16} className="mr-2" /> Generate Demo Key</GlowButton>
                                    </div>
                                )}
                                {activeTab === 'data' && (
                                    <div className="space-y-6">
                                        <h2 className="text-lg font-medium text-white">Data & Storage</h2>
                                        <div className="p-4 rounded-xl bg-foreground/[0.04] border border-foreground/10"><div className="flex items-center justify-between"><div><p className="text-sm text-white">Export your data</p><p className="text-xs text-gray-500 mt-1">Download all your data as JSON</p></div><GlowButton variant="outline" size="sm" onClick={handleExportData}>Export</GlowButton></div></div>
                                        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20"><div className="flex items-center justify-between"><div><p className="text-sm text-red-400 font-medium">Delete All Data</p><p className="text-xs text-gray-500 mt-1">Clear all local storage data</p></div><GlowButton variant="outline" size="sm" className="border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={handleDeleteAccount}>Delete</GlowButton></div></div>
                                    </div>
                                )}
                                {activeTab === 'diagnostics' && <DiagnosticsPanel showToast={showToast} />}
                                {activeTab === 'advanced' && <AdvancedSettings showToast={showToast} />}
                                <div className="mt-8 pt-6 border-t border-foreground/10 flex justify-end">
                                    <GlowButton onClick={handleSave} className="px-6">{saved ? <><Check size={16} className="mr-2" /> Saved</> : <><Save size={16} className="mr-2" /> Save Changes</>}</GlowButton>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </MobilePageWrapper>
    );
}

function PasswordChangeForm({ showToast }: { showToast: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void }) {
    const [current, setCurrent] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirm, setConfirm] = useState('');

    const handleSubmit = () => {
        if (!current || !newPw) { showToast('Please fill in all fields', 'warning'); return; }
        if (newPw.length < 6) { showToast('Password must be at least 6 characters', 'warning'); return; }
        if (newPw !== confirm) { showToast('Passwords do not match', 'error'); return; }
        // Demo: just show success and clear
        setCurrent(''); setNewPw(''); setConfirm('');
        showToast('Password updated successfully', 'success');
    };

    return (
        <div className="space-y-4">
            <div><label htmlFor="current-pw" className="text-sm text-gray-400 block mb-2">Current Password</label><input id="current-pw" type="password" value={current} onChange={e => setCurrent(e.target.value)} className="w-full bg-foreground/[0.04] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 focus:outline-none" placeholder="••••••••" aria-label="Current password" /></div>
            <div><label htmlFor="new-pw" className="text-sm text-gray-400 block mb-2">New Password</label><input id="new-pw" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="w-full bg-foreground/[0.04] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 focus:outline-none" placeholder="••••••••" aria-label="New password" /></div>
            <div><label htmlFor="confirm-pw" className="text-sm text-gray-400 block mb-2">Confirm Password</label><input id="confirm-pw" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full bg-foreground/[0.04] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 focus:outline-none" placeholder="••••••••" aria-label="Confirm password" /></div>
            <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm hover:bg-primary/20 transition-colors">Update Password</button>
        </div>
    );
}

type ShowToast = (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;

/**
 * Diagnostics panel, lets a user (or support) see the connection and
 * capability state behind Real Mode without leaving /settings. Read-only.
 *
 * Surfaces:
 *   - capability_real / capability_google / capability_key
 *   - authenticated flag
 *   - lastRequestId written by /chat + /paywall on any failure
 *
 * Copy of the last requestId is one click, the reference support
 * asks for when something breaks.
 */

// Hoisted out of DiagnosticsPanel so React doesn't remount these on
// every refresh (fixes react-hooks/static-components).
const DiagRow = ({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-foreground/5 last:border-b-0">
        <div>
            <p className="text-sm text-white">{label}</p>
            {hint ? <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p> : null}
        </div>
        <div className="text-xs font-mono text-gray-300">{value}</div>
    </div>
);

const DiagPill = ({ ok, onLabel, offLabel }: { ok: boolean; onLabel: string; offLabel: string }) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest ${ok ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-gray-500/15 text-gray-400 border border-white/10'}`}>
        {ok ? onLabel : offLabel}
    </span>
);

function DiagnosticsPanel({ showToast }: { showToast: ShowToast }) {
    const [caps, setCaps] = useState<{ capability_real: boolean; capability_google: boolean; capability_key: boolean; authenticated: boolean } | null>(null);
    const [lastRequestId, setLastRequestId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        try {
            const res = await fetch('/api/capabilities', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: 'no-store',
            });
            const data = await res.json();
            setCaps({
                capability_real: !!data.capability_real,
                capability_google: !!data.capability_google,
                capability_key: !!data.capability_key,
                authenticated: !!data.authenticated,
            });
        } catch {
            setCaps({ capability_real: false, capability_google: false, capability_key: false, authenticated: false });
        }
        try { setLastRequestId(localStorage.getItem('lastRequestId') || ''); } catch { setLastRequestId(''); }
        setLoading(false);
    };

    useEffect(() => { refresh(); }, []);

    const copyRef = async () => {
        if (!lastRequestId) return;
        try { await navigator.clipboard.writeText(lastRequestId); showToast('Reference ID copied', 'success'); }
        catch { showToast('Could not access clipboard', 'warning'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-medium text-white">Status</h2>
                    <p className="text-[11px] text-gray-500 mt-0.5">Real Mode, connected accounts, and your last reference ID for support.</p>
                </div>
                <button
                    onClick={refresh}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono uppercase tracking-wider text-gray-400 hover:text-white bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/10 transition-all"
                >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            <div className="p-4 rounded-xl bg-foreground/[0.04] border border-foreground/10">
                <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-2">Mode</p>
                <DiagRow
                    label="Real Mode"
                    hint="Write actions + signed receipts. Off = Demo (simulated, no writes)."
                    value={<DiagPill ok={!!caps?.capability_real} onLabel="On" offLabel="Demo" />}
                />
                <DiagRow
                    label="Authenticated"
                    hint="Signed in with a verified Privy session."
                    value={<DiagPill ok={!!caps?.authenticated} onLabel="Yes" offLabel="No" />}
                />
            </div>

            <div className="p-4 rounded-xl bg-foreground/[0.04] border border-foreground/10">
                <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-2">Connected accounts</p>
                <DiagRow
                    label="Google (Calendar + Gmail)"
                    hint="OAuth row in user_integrations with a refresh token."
                    value={<DiagPill ok={!!caps?.capability_google} onLabel="Connected" offLabel="Not connected" />}
                />
                <DiagRow
                    label="LLM provider key"
                    hint="Server env or a BYO key has been supplied."
                    value={<DiagPill ok={!!caps?.capability_key} onLabel="Available" offLabel="Missing" />}
                />
            </div>

            <div className="p-4 rounded-xl bg-foreground/[0.04] border border-foreground/10">
                <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-2">Support</p>
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm text-white">Last request ID</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Most recent reference from /chat or /paywall, paste when contacting support.</p>
                        <p className="mt-2 text-[11px] font-mono text-gray-300 truncate">{lastRequestId || <span className="text-gray-500">No failures captured yet.</span>}</p>
                    </div>
                    <button
                        onClick={copyRef}
                        disabled={!lastRequestId}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/10 transition-all"
                    >
                        <Copy size={12} /> Copy
                    </button>
                </div>
            </div>
        </div>
    );
}

function AdvancedSettings({ showToast }: { showToast: ShowToast }) {
    const [advancedMode, setAdvancedMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('advanced_mode') === '1';
    });

    const toggleAdvanced = () => {
        const next = !advancedMode;
        setAdvancedMode(next);
        localStorage.setItem('advanced_mode', next ? '1' : '0');
        showToast(next ? 'Advanced mode enabled' : 'Advanced mode disabled', 'success');
        // Reload to show/hide advanced dock items
        setTimeout(() => window.location.reload(), 400);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-medium text-white">Advanced</h2>
            <p className="text-sm text-gray-400">
                Power-user features for building and running multi-agent swarms. Hidden by default to keep the interface simple.
            </p>
            <div className="p-4 rounded-xl bg-foreground/[0.04] border border-foreground/10">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-white">Advanced mode</p>
                        <p className="text-xs text-gray-500 mt-1">Show Swarm, Recent, and Workspace tabs in the sidebar</p>
                    </div>
                    <button
                        onClick={toggleAdvanced}
                        className={`w-11 h-6 rounded-full flex items-center p-0.5 transition-colors ${advancedMode ? 'bg-primary/40 justify-end' : 'bg-foreground/10 justify-start'}`}
                        aria-label="Toggle advanced mode"
                    >
                        <div className={`w-5 h-5 rounded-full transition-colors ${advancedMode ? 'bg-primary' : 'bg-foreground/40'}`} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function EncryptionSetup({ showToast }: { showToast: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void }) {
    const [isConfigured, setIsConfigured] = useState(false);
    const [encPassword, setEncPassword] = useState('');
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        import('@/lib/encryption').then(({ isEncryptionConfigured }) => {
            setIsConfigured(isEncryptionConfigured());
        });
    }, []);

    const handleSetup = async () => {
        if (encPassword.length < 8) { showToast('Encryption password must be at least 8 characters', 'warning'); return; }
        setVerifying(true);
        try {
            const { setupEncryption } = await import('@/lib/encryption');
            await setupEncryption(encPassword);
            setIsConfigured(true);
            setEncPassword('');
            showToast('AES-256 encryption enabled for local data', 'success');
        } catch {
            showToast('Failed to set up encryption', 'error');
        }
        setVerifying(false);
    };

    return (
        <div className="p-4 rounded-xl bg-foreground/[0.04] border border-foreground/10">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-white font-medium flex items-center gap-2">
                        AES-256 Encryption
                        {isConfigured && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 uppercase font-mono">Active</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {isConfigured ? 'Local data encrypted with AES-256-GCM via Web Crypto API' : 'Encrypt agent configs, chat sessions, and memory with AES-256-GCM'}
                    </p>
                </div>
            </div>
            {!isConfigured && (
                <div className="mt-4 flex gap-3">
                    <input type="password" value={encPassword} onChange={e => setEncPassword(e.target.value)} placeholder="Encryption password (min 8 chars)" aria-label="Encryption password"
                        className="flex-1 bg-foreground/[0.04] border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-primary/50 focus:outline-none" />
                    <button onClick={handleSetup} disabled={verifying}
                        className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm hover:bg-primary/20 transition-colors whitespace-nowrap">
                        {verifying ? 'Setting up...' : 'Enable'}
                    </button>
                </div>
            )}
        </div>
    );
}
