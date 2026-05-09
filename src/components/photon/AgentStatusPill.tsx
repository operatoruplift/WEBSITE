'use client';

import { useEffect, useState } from 'react';

/**
 * Sanitized agent-status pill for the IMessageVerifyCard.
 *
 * Pulls /api/health/imessage and renders a 3-state pill:
 *   operational  green dot, "Agent ready"
 *   degraded     amber dot, "Agent ack-only" (LLM key missing on server)
 *   down         red dot,   "Agent unavailable"
 *
 * Displays nothing while loading so the card stays calm. The route
 * deliberately leaks no env-var names; this component does the same.
 */

type Status = 'operational' | 'degraded' | 'down';

interface HealthResponse {
    ok?: boolean;
    status?: Status;
}

const LABELS: Record<Status, string> = {
    operational: 'Agent ready',
    degraded: 'Agent ack-only',
    down: 'Agent unavailable',
};

const PILL_CLASS: Record<Status, string> = {
    operational: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    degraded: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    down: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const DOT_CLASS: Record<Status, string> = {
    operational: 'bg-emerald-400',
    degraded: 'bg-amber-400',
    down: 'bg-red-400',
};

interface Props {
    className?: string;
}

export function AgentStatusPill({ className }: Props) {
    const [status, setStatus] = useState<Status | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/health/imessage', { cache: 'no-store' })
            .then(r => r.ok ? r.json() : null)
            .then((data: HealthResponse | null) => {
                if (cancelled) return;
                if (data?.ok && (data.status === 'operational' || data.status === 'degraded' || data.status === 'down')) {
                    setStatus(data.status);
                }
            })
            .catch(() => { /* leave null, render nothing */ });
        return () => { cancelled = true; };
    }, []);

    if (!status) return null;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-widest ${PILL_CLASS[status]} ${className ?? ''}`}
            title={LABELS[status]}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${DOT_CLASS[status]}`} aria-hidden />
            {LABELS[status]}
        </span>
    );
}
