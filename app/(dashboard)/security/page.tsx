"use client";

import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Lock, Key, FileText, Clock, Trash2, Download, AlertTriangle, Eye, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { Badge } from '@/src/components/ui/Badge';
import { MobilePageWrapper } from '@/src/components/mobile';
import { useToast } from '@/src/components/ui/Toast';
import { AnimatedCard, NumberTicker, BorderBeam, StaggerChildren } from '@/src/components/effects/MagicUI';
import { isEncryptionConfigured } from '@/lib/encryption';
import { getAuditLog, getAuditStats, clearAuditLog, getOnChainRecord, publishMerkleRoot, type AuditEntry } from '@/lib/auditLog';

const CATEGORY_META: Record<string, { label: string; color: string; icon: typeof Shield }> = {
    calendar: { label: 'Calendar', color: 'text-[#F97316]', icon: Clock },
    gmail: { label: 'Gmail', color: 'text-[#F97316]', icon: FileText },
    agent: { label: 'Agent', color: 'text-[#F59E0B]', icon: Activity },
    approval: { label: 'Approval', color: 'text-emerald-400', icon: ShieldCheck },
    encryption: { label: 'Encryption', color: 'text-emerald-400', icon: Lock },
    auth: { label: 'Auth', color: 'text-blue-400', icon: Key },
};

export default function SecurityPage() {
    const [encConfigured, setEncConfigured] = useState(false);
    const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
    const [auditStats, setAuditStats] = useState<Record<string, number>>({});
    const [filter, setFilter] = useState<string>('all');
    const { showToast } = useToast();

    const [onChainRecord, setOnChainRecord] = useState<ReturnType<typeof getOnChainRecord>>(null);
    const [publishing, setPublishing] = useState(false);

    useEffect(() => {
        setEncConfigured(isEncryptionConfigured());
        setAuditLog(getAuditLog(100));
        setAuditStats(getAuditStats());
        setOnChainRecord(getOnChainRecord());
    }, []);

    const refresh = () => {
        setAuditLog(getAuditLog(100));
        setAuditStats(getAuditStats());
    };

    const handleClearLog = () => {
        if (!confirm('Clear the entire audit log? This cannot be undone.')) return;
        clearAuditLog();
        refresh();
        showToast('Audit log cleared', 'info');
    };

    const handleExportLog = () => {
        const blob = new Blob([JSON.stringify(auditLog, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'operator-uplift-audit-log.json'; a.click();
        URL.revokeObjectURL(url);
        showToast('Audit log exported', 'success');
    };

    const handleWipeData = () => {
        if (!confirm('WIPE ALL LOCAL DATA? This clears chat sessions, agents, memory, settings, and encryption keys. Cannot be undone.')) return;
        localStorage.clear();
        showToast('All local data wiped', 'warning');
        window.location.href = '/';
    };

    const filtered = filter === 'all' ? auditLog : auditLog.filter(e => e.category === filter);
    const totalActions = auditLog.length;
    const approvedCount = auditLog.filter(e => e.approved === true).length;
    const deniedCount = auditLog.filter(e => e.approved === false).length;

    return (
        <MobilePageWrapper>
            <div className="min-h-screen p-6 lg:p-8 relative">
                <div className="absolute top-0 right-0 w-[600px] h-[300px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none" />
                <div className="max-w-7xl mx-auto space-y-8 relative z-10">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeInUp">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.2)] bg-gradient-to-br from-emerald-500 to-emerald-900 border border-emerald-500/50">
                                    <Shield size={20} className="text-white" />
                                </div>
                                <Badge variant="default" className="text-[10px] bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-mono tracking-widest">LIVE</Badge>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-medium tracking-tight text-white">Security</h1>
                            <p className="text-sm text-gray-400 mt-2 font-mono flex items-center gap-2">
                                <ShieldCheck size={14} className="text-emerald-400" />
                                On-device encryption · Cryptographic audit trail · Zero cloud storage
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <GlowButton variant="outline" onClick={handleExportLog} className="text-gray-300 h-10">
                                <Download size={14} className="mr-2" /> Export Log
                            </GlowButton>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                        {[
                            { label: 'Encryption', value: encConfigured ? 'AES-256-GCM' : 'Not Set', icon: Lock, color: encConfigured ? 'text-emerald-400' : 'text-amber-400', gradient: 'from-emerald-500/20 to-transparent', numeric: false },
                            { label: 'Key Derivation', value: encConfigured ? 'PBKDF2 100K' : '—', icon: Key, color: 'text-emerald-400', gradient: 'from-emerald-500/20 to-transparent', numeric: false },
                            { label: 'Total Actions', value: String(totalActions), icon: Activity, color: 'text-[#F97316]', gradient: 'from-[#F97316]/20 to-transparent', numeric: true, numVal: totalActions },
                            { label: 'Approved', value: String(approvedCount), icon: ShieldCheck, color: 'text-emerald-400', gradient: 'from-emerald-500/20 to-transparent', numeric: true, numVal: approvedCount },
                            { label: 'Denied', value: String(deniedCount), icon: AlertTriangle, color: deniedCount > 0 ? 'text-red-400' : 'text-gray-500', gradient: deniedCount > 0 ? 'from-red-500/20 to-transparent' : 'from-gray-500/20 to-transparent', numeric: true, numVal: deniedCount },
                        ].map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <AnimatedCard key={stat.label} className="p-5 overflow-hidden" hoverGlow>
                                    <div className={`absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-bl ${stat.gradient} blur-2xl opacity-50 group-hover:opacity-100 transition-opacity`} />
                                    <div className="relative z-10 flex flex-col items-center text-center h-full justify-center">
                                        <div className="w-10 h-10 rounded-xl bg-foreground/[0.04] border border-foreground/10 flex items-center justify-center mb-3">
                                            <Icon size={18} className={stat.color} />
                                        </div>
                                        <p className="text-2xl font-bold text-white tracking-tight">
                                            {stat.numeric && stat.numVal ? <NumberTicker value={stat.numVal} durationMs={1000} /> : stat.value}
                                        </p>
                                        <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mt-1">{stat.label}</p>
                                    </div>
                                </AnimatedCard>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                        {/* Left column — encryption status + emergency controls */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Encryption Status */}
                            <Card variant="glass" className="p-6 border-foreground/10 bg-foreground/[0.04]">
                                <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Lock size={12} className="text-emerald-400" /> Encryption Status
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Algorithm', value: 'AES-256-GCM', active: encConfigured },
                                        { label: 'Key Derivation', value: 'PBKDF2-HMAC-SHA256', active: encConfigured },
                                        { label: 'Iterations', value: '100,000', active: encConfigured },
                                        { label: 'Salt', value: encConfigured ? '16-byte random' : 'Not generated', active: encConfigured },
                                        { label: 'IV', value: encConfigured ? '12-byte per operation' : 'Not active', active: encConfigured },
                                        { label: 'Integrity', value: 'AEAD authenticated', active: encConfigured },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-foreground/[0.03] border border-foreground/10">
                                            <span className="text-xs text-gray-400">{item.label}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-white font-mono">{item.value}</span>
                                                <div className={`w-2 h-2 rounded-full ${item.active ? 'bg-emerald-400 shadow-[0_0_5px_currentColor]' : 'bg-gray-600'}`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {!encConfigured && (
                                    <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs text-amber-300 font-medium">Encryption not configured</p>
                                                <p className="text-[10px] text-gray-500 mt-1">Go to Settings → Security to set up AES-256 encryption for local data.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>

                            {/* Audit Summary */}
                            <Card variant="glass" className="p-6 border-foreground/10 bg-foreground/[0.04]">
                                <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Audit by Category</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(CATEGORY_META).map(([key, meta]) => {
                                        const count = auditStats[key] || 0;
                                        const Icon = meta.icon;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setFilter(filter === key ? 'all' : key)}
                                                className={`p-3 rounded-xl text-center transition-all border ${
                                                    filter === key
                                                        ? 'bg-emerald-500/10 border-emerald-500/30'
                                                        : 'bg-foreground/[0.06] border-foreground/10 hover:border-primary/30 hover:bg-foreground/[0.06]'
                                                }`}
                                            >
                                                <Icon size={16} className={`mx-auto mb-1 ${filter === key ? 'text-emerald-400' : meta.color}`} />
                                                <p className={`text-[9px] font-bold uppercase tracking-wider ${filter === key ? 'text-emerald-300' : 'text-gray-400'}`}>{meta.label}</p>
                                                <p className={`text-sm font-bold ${filter === key ? 'text-emerald-400' : 'text-white'}`}>{count}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </Card>

                            {/* On-Chain Audit Root */}
                            <Card variant="glass" className="p-6 border-foreground/10 bg-foreground/[0.04] group relative overflow-hidden">
                                <BorderBeam size={180} duration={10} colorFrom="#34d399" colorTo="#10b981" />
                                <h3 className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                                    <Shield size={12} className="text-emerald-400" /> On-Chain Merkle Root
                                </h3>
                                {onChainRecord ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-400/5 border border-emerald-400/20">
                                            <span className="text-xs text-gray-400">Status</span>
                                            <span className="text-xs font-bold text-emerald-400">Published to Solana Devnet</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-foreground/[0.03] border border-foreground/10">
                                            <span className="text-xs text-gray-400">Actions anchored</span>
                                            <span className="text-xs text-white font-mono">{onChainRecord.actionCount}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-foreground/[0.03] border border-foreground/10">
                                            <span className="text-xs text-gray-400">Last published</span>
                                            <span className="text-xs text-white font-mono">{new Date(onChainRecord.publishedAt).toLocaleString()}</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-foreground/[0.03] border border-foreground/10">
                                            <span className="text-xs text-gray-400 block mb-1">Merkle Root</span>
                                            <span className="text-[10px] text-white font-mono break-all">{onChainRecord.merkleRoot.slice(0, 32)}...</span>
                                        </div>
                                        <a
                                            href={onChainRecord.explorerUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs font-bold uppercase tracking-widest hover:bg-emerald-400/20 transition-all"
                                        >
                                            <Eye size={12} /> View on Solana Explorer
                                        </a>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-xs text-gray-500">No audit root published yet. Roots are auto-published every 5 agent actions, or you can publish manually.</p>
                                        <button
                                            onClick={async () => {
                                                setPublishing(true);
                                                const result = await publishMerkleRoot();
                                                if (result) {
                                                    setOnChainRecord(result);
                                                    showToast('Merkle root published to Solana devnet!', 'success');
                                                } else {
                                                    showToast('No actions to publish or API unavailable', 'warning');
                                                }
                                                setPublishing(false);
                                            }}
                                            disabled={publishing || totalActions === 0}
                                            className="w-full h-9 rounded-lg flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary/20 transition-all disabled:opacity-40"
                                        >
                                            {publishing ? 'Publishing...' : 'Publish Root Now'}
                                        </button>
                                    </div>
                                )}
                            </Card>

                            {/* Emergency Controls */}
                            <Card variant="glass" className="p-6 border-red-500/10 bg-foreground/[0.04]">
                                <h3 className="text-xs font-mono text-red-400 uppercase tracking-widest mb-4">Emergency Controls</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={handleClearLog}
                                        className="w-full p-3 rounded-xl bg-foreground/[0.03] border border-foreground/10 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Trash2 size={14} className="text-amber-400" />
                                            <span className="text-xs text-gray-300">Clear Audit Log</span>
                                        </div>
                                        <span className="text-[9px] text-gray-600 font-mono">{totalActions} entries</span>
                                    </button>
                                    <button
                                        onClick={handleWipeData}
                                        className="w-full p-3 rounded-xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-all flex items-center gap-2"
                                    >
                                        <AlertTriangle size={14} className="text-red-400" />
                                        <span className="text-xs text-red-300 font-medium">Wipe All Local Data</span>
                                    </button>
                                </div>
                            </Card>
                        </div>

                        {/* Right column — live audit log */}
                        <div className="lg:col-span-8">
                            <Card variant="glass" className="p-6 h-full border-emerald-500/10 flex flex-col relative overflow-hidden bg-foreground/[0.06]">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                                <div className="flex items-center justify-between mb-6 relative z-10">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Eye size={18} className="text-emerald-400" /> AUDIT TRAIL
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="default" className="text-[10px] font-mono bg-foreground/[0.06] border-white/10 text-gray-400 px-3 py-1">{filtered.length} ENTRIES</Badge>
                                        <button onClick={refresh} className="text-[10px] font-mono text-gray-500 hover:text-white transition-colors">Refresh</button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto pr-2 relative z-10 scrollbar-none">
                                    {filtered.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <Shield size={48} className="text-gray-700 mb-4" />
                                            <p className="text-gray-500 text-sm">No audit entries yet</p>
                                            <p className="text-gray-600 text-xs mt-1">Actions will appear here when agents use Calendar or Gmail tools</p>
                                        </div>
                                    ) : (
                                        <StaggerChildren delayMs={40} className="space-y-2">
                                        {filtered.map(entry => {
                                            const meta = CATEGORY_META[entry.category] || { label: entry.category, color: 'text-gray-400', icon: Activity };
                                            const Icon = meta.icon;
                                            return (
                                                <div key={entry.id} className="p-4 rounded-xl bg-foreground/[0.04] border border-foreground/10 hover:border-primary/30 transition-all group">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                                                            entry.approved === true ? 'bg-emerald-400/10 border-emerald-400/20' :
                                                            entry.approved === false ? 'bg-red-400/10 border-red-400/20' :
                                                            'bg-foreground/[0.04] border-white/10'
                                                        }`}>
                                                            <Icon size={16} className={
                                                                entry.approved === true ? 'text-emerald-400' :
                                                                entry.approved === false ? 'text-red-400' :
                                                                meta.color
                                                            } />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                <span className="text-sm font-semibold text-white">{entry.action}</span>
                                                                <span className={`text-[9px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded border ${
                                                                    entry.approved === true ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' :
                                                                    entry.approved === false ? 'bg-red-400/10 border-red-400/20 text-red-400' :
                                                                    'bg-foreground/[0.04] border-white/10 text-gray-400'
                                                                }`}>
                                                                    {entry.approved === true ? 'APPROVED' : entry.approved === false ? 'DENIED' : 'INFO'}
                                                                </span>
                                                                <span className={`text-[9px] font-mono ${meta.color} bg-foreground/[0.04] px-1.5 py-0.5 rounded border border-foreground/10`}>{meta.label}</span>
                                                            </div>
                                                            {entry.agentName && (
                                                                <p className="text-[10px] text-gray-500 font-mono mb-1">Agent: {entry.agentName}</p>
                                                            )}
                                                            <p className="text-xs text-gray-400 break-all">{entry.details}</p>
                                                            <p className="text-[10px] text-gray-600 font-mono mt-1.5">
                                                                {new Date(entry.timestamp).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        </StaggerChildren>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </MobilePageWrapper>
    );
}
