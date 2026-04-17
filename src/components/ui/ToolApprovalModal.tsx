"use client";

import { useState } from 'react';
import { Shield, Calendar, Mail, Bell, Globe, NotebookPen, ListTodo, Check, X, Loader2, AlertTriangle, Coins, Sparkles } from 'lucide-react';
import type { ToolCall, ToolResult } from '@/lib/toolCalls';
import { executeToolCall, executeMock } from '@/lib/toolCalls';
import { logAction } from '@/lib/auditLog';
import { getToolPrice } from '@/lib/x402/pricing';

interface ToolApprovalModalProps {
    toolCall: ToolCall;
    agentName?: string;
    agentId?: string | null;
    userId: string;
    /** When true, approvals route to executeMock (no side-effects, no receipt). */
    demoMode?: boolean;
    onResult: (result: ToolResult) => void;
    onDeny: () => void;
}

const TOOL_META: Record<string, { label: string; icon: typeof Calendar; color: string; risk: string }> = {
    calendar: { label: 'Google Calendar', icon: Calendar, color: 'text-[#F97316]', risk: 'MEDIUM' },
    gmail: { label: 'Gmail', icon: Mail, color: 'text-[#F97316]', risk: 'HIGH' },
    reminders: { label: 'Reminders', icon: Bell, color: 'text-[#F97316]', risk: 'LOW' },
    web: { label: 'Web', icon: Globe, color: 'text-[#F97316]', risk: 'LOW' },
    notes: { label: 'Notes', icon: NotebookPen, color: 'text-[#F97316]', risk: 'LOW' },
    tasks: { label: 'Tasks', icon: ListTodo, color: 'text-[#F97316]', risk: 'LOW' },
};

const ACTION_LABELS: Record<string, string> = {
    list: 'Read data',
    free_slots: 'Check availability',
    create: 'Create event',
    read: 'Read message',
    draft: 'Create draft',
    send_draft: 'Send draft',
    send: 'Send email',
};

export function ToolApprovalModal({
    toolCall,
    agentName,
    agentId,
    userId,
    demoMode = false,
    onResult,
    onDeny,
}: ToolApprovalModalProps) {
    const [isExecuting, setIsExecuting] = useState(false);
    const [phase, setPhase] = useState<'idle' | 'requesting' | 'paying' | 'executing' | 'done' | 'failed'>('idle');

    const meta = TOOL_META[toolCall.tool] || { label: toolCall.tool, icon: Shield, color: 'text-gray-400', risk: 'UNKNOWN' };
    const Icon = meta.icon;
    const actionLabel = ACTION_LABELS[toolCall.action] || toolCall.action;

    // Price comes from the central server/client pricing config — no per-agent
    // lookup. Gated actions: calendar.create, gmail.draft/send/send_draft.
    const price = getToolPrice(toolCall.tool, toolCall.action);
    // Demo mode never incurs a payment — the mock result is free.
    const isPaid = !demoMode && price !== null;

    const auditTool = toolCall.tool === 'calendar' ? 'calendar' : toolCall.tool === 'gmail' ? 'gmail' : 'calendar';

    const handleApprove = async () => {
        setIsExecuting(true);
        setPhase(isPaid ? 'requesting' : 'executing');

        logAction(
            auditTool,
            `approved:${toolCall.action}${demoMode ? ':simulated' : ''}`,
            JSON.stringify(toolCall.params).slice(0, 200),
            agentName,
            true,
        );

        // Demo mode: never call the real backend. No side-effect, no receipt.
        // Real mode: executeToolCall handles the 402 → pay → retry flow.
        const result = demoMode
            ? await executeMock(toolCall)
            : await executeToolCall(toolCall, userId, { agentId });

        logAction(
            auditTool,
            `executed:${toolCall.action}${result.simulated ? ':simulated' : ''}`,
            result.success ? (result.simulated ? 'simulated' : 'success') : `error: ${result.error}`,
            agentName,
            result.success,
        );

        setPhase(result.success ? 'done' : 'failed');
        setIsExecuting(false);
        onResult(result);
    };

    const handleDeny = () => {
        logAction(
            toolCall.tool === 'calendar' ? 'calendar' : 'gmail',
            `denied:${toolCall.action}`,
            JSON.stringify(toolCall.params).slice(0, 200),
            agentName,
            false,
        );
        onDeny();
    };

    const paramSummary = buildParamSummary(toolCall);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl bg-[#0c0c0c] border border-white/10 shadow-2xl overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-white/5 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                        meta.risk === 'HIGH' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-[#F97316]/10 border-[#F97316]/30'
                    }`}>
                        <Icon size={22} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <h3 className="text-base font-semibold text-white">Tool Permission Request</h3>
                            {demoMode ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border bg-white/5 border-white/15 text-gray-400">
                                    <Sparkles size={10} /> Simulated
                                </span>
                            ) : (
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                                    meta.risk === 'HIGH'
                                        ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                }`}>{meta.risk}</span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            {demoMode
                                ? 'Demo — Approve runs a simulated call. No real side-effect. No receipt.'
                                : (agentName ? `Agent "${agentName}" requests access` : 'An agent requests access')}
                        </p>
                    </div>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Action</div>
                        <div className="flex items-center gap-3">
                            <Icon size={16} className={meta.color} />
                            <div>
                                <div className="text-sm font-semibold text-white">
                                    {meta.label} — {actionLabel}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">{toolCall.tool}.{toolCall.action}</div>
                            </div>
                        </div>
                    </div>

                    {paramSummary.length > 0 && (
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Details</div>
                            <div className="space-y-1.5">
                                {paramSummary.map(({ label, value }) => (
                                    <div key={label} className="flex items-start justify-between gap-4">
                                        <span className="text-xs text-gray-500 shrink-0">{label}</span>
                                        <span className="text-xs text-white font-mono text-right break-all">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* x402 price block — only on gated actions */}
                    {isPaid && price && (
                        <div className="flex items-center justify-between p-4 rounded-xl bg-[#F97316]/5 border border-[#F97316]/20">
                            <div className="flex items-center gap-2">
                                <Coins size={14} className="text-[#F97316]" />
                                <div>
                                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-0.5">Cost</div>
                                    <div className="text-sm font-bold text-white">
                                        ${price.amount} {price.currency}
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-0.5">on {price.chain}</div>
                                </div>
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316]">
                                x402
                            </span>
                        </div>
                    )}

                    {demoMode && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/10">
                            <Sparkles size={14} className="text-gray-400 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                You&rsquo;re on the demo. Approve returns a simulated result labelled <strong className="text-gray-200">Simulated</strong>. Nothing gets created, sent, or charged.
                                {' '}
                                <a href="/integrations" className="underline hover:text-white">Connect Google</a>
                                {' or '}
                                <a href="/settings" className="underline hover:text-white">add an API key</a>
                                {' to run this for real.'}
                            </p>
                        </div>
                    )}

                    {!demoMode && (toolCall.action === 'create' || toolCall.action === 'send' || toolCall.action === 'send_draft') && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/15">
                            <AlertTriangle size={14} className="text-orange-400 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                This action will {toolCall.action === 'create' ? 'create a real calendar event' : 'send a real email'} on your connected Google account. This cannot be undone from within Operator Uplift.
                            </p>
                        </div>
                    )}

                    {/* Phase indicator during execution */}
                    {isExecuting && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                            <Loader2 size={14} className="animate-spin text-[#F97316]" />
                            <span className="text-xs text-gray-300">
                                {phase === 'requesting' && 'Requesting invoice…'}
                                {phase === 'paying' && 'Paying invoice on devnet…'}
                                {phase === 'executing' && 'Executing tool…'}
                                {phase === 'idle' && 'Preparing…'}
                            </span>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-white/5 flex items-center gap-3 bg-white/[0.02]">
                    <button
                        onClick={handleDeny}
                        disabled={isExecuting}
                        className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-40"
                    >
                        <X size={14} /> Deny
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={isExecuting}
                        className="flex-[2] h-10 rounded-xl flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-60"
                    >
                        {isExecuting ? (
                            <><Loader2 size={14} className="animate-spin" /> Executing…</>
                        ) : demoMode ? (
                            <><Check size={14} /> Approve (Simulated)</>
                        ) : isPaid ? (
                            <><Check size={14} /> Pay &amp; Allow Once</>
                        ) : (
                            <><Check size={14} /> Allow Once</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function buildParamSummary(call: ToolCall): { label: string; value: string }[] {
    const p = call.params;
    const items: { label: string; value: string }[] = [];

    if (p.summary) items.push({ label: 'Event', value: String(p.summary) });
    if (p.to) items.push({ label: 'To', value: String(p.to) });
    if (p.subject) items.push({ label: 'Subject', value: String(p.subject) });
    if (p.body) items.push({ label: 'Body', value: String(p.body).slice(0, 120) + (String(p.body).length > 120 ? '...' : '') });
    if (p.start) items.push({ label: 'Start', value: new Date(String(p.start)).toLocaleString() });
    if (p.end) items.push({ label: 'End', value: new Date(String(p.end)).toLocaleString() });
    if (p.attendees && Array.isArray(p.attendees)) items.push({ label: 'Attendees', value: (p.attendees as string[]).join(', ') });
    if (p.duration_minutes) items.push({ label: 'Duration', value: `${p.duration_minutes} minutes` });
    if (p.days_ahead) items.push({ label: 'Window', value: `Next ${p.days_ahead} days` });
    if (p.query) items.push({ label: 'Query', value: String(p.query) });
    if (p.max_results) items.push({ label: 'Limit', value: String(p.max_results) });

    return items;
}
