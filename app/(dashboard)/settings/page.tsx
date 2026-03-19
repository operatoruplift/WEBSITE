"use client";

import { useState, useEffect } from 'react';
import { Settings, User, Bell, Palette, Shield, Key, Database, Save, Check, Copy, RefreshCw } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { MobilePageWrapper } from '@/src/components/mobile';
import { useToast } from '@/src/components/ui/Toast';

function generateApiKey() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'sk-ou-';
    for (let i = 0; i < 32; i++) key += chars[Math.floor(Math.random() * chars.length)];
    return key;
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [saved, setSaved] = useState(false);
    const { showToast } = useToast();

    // Profile
    const [displayName, setDisplayName] = useState('Commander');
    const [email, setEmail] = useState('user@operator.uplift');

    // Notifications
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [pushNotifs, setPushNotifs] = useState(true);
    const [productUpdates, setProductUpdates] = useState(true);
    const [marketing, setMarketing] = useState(false);

    // Appearance
    const [theme, setTheme] = useState('Dark');

    // API Keys
    const [apiKeys, setApiKeys] = useState<{ key: string; created: string }[]>([]);

    // Load from localStorage
    useEffect(() => {
        try {
            const settings = JSON.parse(localStorage.getItem('ou-settings') || '{}');
            if (settings.displayName) setDisplayName(settings.displayName);
            if (settings.email) setEmail(settings.email);
            if (settings.emailNotifs !== undefined) setEmailNotifs(settings.emailNotifs);
            if (settings.pushNotifs !== undefined) setPushNotifs(settings.pushNotifs);
            if (settings.productUpdates !== undefined) setProductUpdates(settings.productUpdates);
            if (settings.marketing !== undefined) setMarketing(settings.marketing);
            if (settings.theme) setTheme(settings.theme);
            if (settings.apiKeys) setApiKeys(settings.apiKeys);
        } catch {}
    }, []);

    const handleSave = () => {
        const settings = { displayName, email, emailNotifs, pushNotifs, productUpdates, marketing, theme, apiKeys };
        localStorage.setItem('ou-settings', JSON.stringify(settings));
        setSaved(true);
        showToast('Settings saved successfully', 'success');
        setTimeout(() => setSaved(false), 2000);
    };

    const handleGenerateKey = () => {
        const newKey = { key: generateApiKey(), created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) };
        setApiKeys(prev => [...prev, newKey]);
        showToast('New API key generated', 'success');
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
                        <h1 className="text-4xl font-bold tracking-tight text-white">Settings</h1>
                        <p className="text-sm text-gray-400 mt-2 font-mono">Configure your Operator Uplift experience</p>
                    </div>
                    <div className="flex gap-6">
                        <div className="w-48 shrink-0 hidden md:block">
                            <nav className="space-y-1">
                                {tabs.map(tab => { const Icon = tab.icon; return (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeTab === tab.id ? 'bg-white/10 text-white border border-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                        <Icon size={16} />{tab.label}
                                    </button>
                                ); })}
                            </nav>
                        </div>
                        <div className="flex-1">
                            {/* Mobile tab selector */}
                            <div className="md:hidden mb-4 flex gap-1 overflow-x-auto pb-2 scrollbar-none">
                                {tabs.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === tab.id ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-gray-400'}`}>{tab.label}</button>)}
                            </div>
                            <Card variant="glass" className="p-8 border-white/5 bg-black/40">
                                {activeTab === 'profile' && (
                                    <div className="space-y-6">
                                        <h2 className="text-lg font-bold text-white">Profile</h2>
                                        <div className="flex items-center gap-6"><div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #E77630, #9945FF)' }}>{displayName.charAt(0).toUpperCase()}</div><div><p className="text-sm text-white font-medium">{displayName}</p><p className="text-xs text-gray-500">{email}</p></div></div>
                                        <div className="space-y-4">
                                            <div><label className="text-sm text-gray-400 block mb-2">Display Name</label><input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 focus:outline-none" /></div>
                                            <div><label className="text-sm text-gray-400 block mb-2">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 focus:outline-none" /></div>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'notifications' && (
                                    <div className="space-y-6">
                                        <h2 className="text-lg font-bold text-white">Notifications</h2>
                                        {[
                                            { label: 'Email notifications', value: emailNotifs, set: setEmailNotifs },
                                            { label: 'Push notifications', value: pushNotifs, set: setPushNotifs },
                                            { label: 'Product updates', value: productUpdates, set: setProductUpdates },
                                            { label: 'Marketing emails', value: marketing, set: setMarketing },
                                        ].map(item => (
                                            <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/5">
                                                <span className="text-sm text-gray-300">{item.label}</span>
                                                <Toggle value={item.value} onChange={item.set} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {activeTab === 'appearance' && (
                                    <div className="space-y-6">
                                        <h2 className="text-lg font-bold text-white">Appearance</h2>
                                        <div className="grid grid-cols-3 gap-4">
                                            {['Dark', 'Light', 'System'].map(t => (
                                                <button key={t} onClick={() => setTheme(t)} className={`p-4 rounded-xl border text-center transition-all ${theme === t ? 'bg-primary/10 border-primary/30 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}>
                                                    <div className={`w-12 h-8 rounded-lg mx-auto mb-2 ${t === 'Dark' ? 'bg-gray-900 border border-white/20' : t === 'Light' ? 'bg-white border border-gray-300' : 'bg-gradient-to-r from-gray-900 to-white border border-white/20'}`} />
                                                    <span className="text-sm font-medium">{t}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'security' && (
                                    <div className="space-y-6">
                                        <h2 className="text-lg font-bold text-white">Security</h2>
                                        <div className="space-y-4">
                                            <div><label className="text-sm text-gray-400 block mb-2">Current Password</label><input type="password" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 focus:outline-none" placeholder="••••••••" /></div>
                                            <div><label className="text-sm text-gray-400 block mb-2">New Password</label><input type="password" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 focus:outline-none" placeholder="••••••••" /></div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5"><div className="flex items-center justify-between"><div><p className="text-sm text-white font-medium">Two-Factor Authentication</p><p className="text-xs text-gray-500 mt-1">Add an extra layer of security</p></div><GlowButton variant="outline" size="sm" onClick={() => showToast('2FA setup will be available when the backend is connected', 'info')}>Enable 2FA</GlowButton></div></div>
                                    </div>
                                )}
                                {activeTab === 'api' && (
                                    <div className="space-y-6">
                                        <h2 className="text-lg font-bold text-white">API Keys</h2>
                                        {apiKeys.length > 0 ? (
                                            <div className="space-y-3">
                                                {apiKeys.map(k => (
                                                    <div key={k.key} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                                                        <div><p className="text-sm text-gray-400 font-mono">{k.key.substring(0, 12)}••••••••{k.key.substring(k.key.length - 4)}</p><p className="text-[10px] text-gray-600 mt-1">Created {k.created}</p></div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleCopyKey(k.key)} className="text-xs text-primary hover:underline flex items-center gap-1"><Copy size={12} /> Copy</button>
                                                            <button onClick={() => handleRevokeKey(k.key)} className="text-xs text-red-400 hover:underline">Revoke</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center"><p className="text-sm text-gray-500">No API keys generated yet</p></div>
                                        )}
                                        <GlowButton variant="outline" onClick={handleGenerateKey}><Key size={16} className="mr-2" /> Generate New Key</GlowButton>
                                    </div>
                                )}
                                {activeTab === 'data' && (
                                    <div className="space-y-6">
                                        <h2 className="text-lg font-bold text-white">Data & Storage</h2>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5"><div className="flex items-center justify-between"><div><p className="text-sm text-white">Export your data</p><p className="text-xs text-gray-500 mt-1">Download all your data as JSON</p></div><GlowButton variant="outline" size="sm" onClick={handleExportData}>Export</GlowButton></div></div>
                                        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20"><div className="flex items-center justify-between"><div><p className="text-sm text-red-400 font-medium">Delete All Data</p><p className="text-xs text-gray-500 mt-1">Clear all local storage data</p></div><GlowButton variant="outline" size="sm" className="border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={handleDeleteAccount}>Delete</GlowButton></div></div>
                                    </div>
                                )}
                                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
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
