"use client";

import { useState } from 'react';
import { Shield, Calendar, Mail, Check, X, Loader2, AlertTriangle } from 'lucide-react';
import type { ToolCall, ToolResult } from '@/lib/toolCalls';
import { executeToolCall, formatToolResult } from '@/lib/toolCalls';
import { logAction } from '@/lib/auditLog';

interface ToolApprovalModalProps {
    toolCall: ToolCall;
    agentName?: string;
    userId: string;
    onResult: (result: ToolResult) => void;
    onDeny: () => void;
}

const TOOL_META: Record<string, { label: string; icon: typeof Calendar; color: string; risk: string }> = {
    calendar: { label: 'Google Calendar', icon: Calendar, color: 'text-[#F97316]', risk: 'MEDIUM' },
    gmail: { label: 'Gmail', icon: Mail, color: 'text-[#F97316]', risk: 'HIGH' },
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

export function ToolApprovalModal({ toolCall, agentName, userId, onResult, onDeny }: ToolApprovalModalProps) {
    const [isExecuting, setIsExecuting] = useState(false);
    const meta = TOOL_META[toolCall.tool] || { label: toolCall.tool, icon: Shield, color: 'text-gray-400', risk: 'UNKNOWN' };
    const Icon = meta.icon;
    const actionLabel = ACTION_LABELS[toolCall.action] || toolCall.action;

    const handleApprove = async () => {
        setIsExecuting(true);
        logAction(
            toolCall.tool === 'calendar' ? 'calendar' : 'gmail',
            `approved:${toolCall.action}`,
            JSON.stringify(toolCall.params).slice(0, 200),
            agentName,
            true,
        );

        const result = await executeToolCall(toolCall, userId);

        logAction(
            toolCall.tool === 'calendar' ? 'calendar' : 'gmail',
            `executed:${toolCall.action}`,
            result.success ? 'success' : `error: ${result.error}`,
            agentName,
            result.success,
        );

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

    // Build a human-readable summary of what the tool wants to do
    const paramSummary = buildParamSummary(toolCall);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl bg-[#0c0c0c] border border-white/10 shadow-2xl overflow-hidden animate-fadeInUp">
                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-white/5 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                        meta.risk === 'HIGH' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-[#F97316]/10 border-[#F97316]/30'
                    }`}>
                        <Icon size={22} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-base font-semibold text-white">Tool Permission Request</h3>
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                                meta.risk === 'HIGH'
                                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            }`}>{meta.risk}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                            {agentName ? `Agent "${agentName}" requests access` : 'An agent requests access'}
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* What it wants to do */}
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

                    {/* Parameters */}
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

                    {/* Warning for write actions */}
                    {(toolCall.action === 'create' || toolCall.action === 'send' || toolCall.action === 'send_draft') && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/15">
                            <AlertTriangle size={14} className="text-orange-400 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                This action will {toolCall.action === 'create' ? 'create a real calendar event' : 'send a real email'} on your connected Google account. This cannot be undone from within Operator Uplift.
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
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
                        className="flex-[2] h-10 rounded-xl flex items-center justify-center gap-2 text-white text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-60 shadow-[0_0_20px_rgba(231,118,48,0.2)]"
                        style={{ background: 'linear-gradient(135deg, #F97316, #F97316)' }}
                    >
                        {isExecuting ? (
                            <><Loader2 size={14} className="animate-spin" /> Executing...</>
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
