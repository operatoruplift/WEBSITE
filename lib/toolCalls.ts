/**
 * Tool call interceptor, parses LLM output for tool-call intent,
 * executes approved calls, logs to the audit trail.
 *
 * The LLM emits tool calls as <tool_use> JSON blocks in its text output.
 * This module extracts them, presents them for approval, and executes.
 */

/** Tools known to the chat runtime. Unknown tools fall through to generic handling. */
export type ToolKind =
    | 'calendar'
    | 'gmail'
    | 'x402'
    | 'reminders'
    | 'notes'
    | 'tasks'
    | 'web'
    | 'tokens'
    | 'imessage';

export interface ToolCall {
    id: string;
    tool: ToolKind;
    action: string;
    params: Record<string, unknown>;
    rawBlock: string;
}

export interface ToolResult {
    toolCallId: string;
    tool: string;
    action: string;
    success: boolean;
    data?: unknown;
    error?: string;
    /** True when the result came from a Demo-mode mock (executeMock). */
    simulated?: boolean;
    /** Propagated from the tool route's X-Request-Id header or envelope. */
    requestId?: string;
    /** Envelope `nextAction` so the chat UI can render a concrete next step. */
    nextAction?: string;
}

// Match <tool_use> blocks, also handles cases where LLM wraps in backticks or code fences
const TOOL_USE_REGEX = /(?:```\w*\n?)?<tool_use>\s*([\s\S]*?)\s*<\/tool_use>(?:\n?```)?/g;

/** Extract tool-call blocks from LLM output text. */
export function parseToolCalls(text: string): ToolCall[] {
    const calls: ToolCall[] = [];
    let match: RegExpExecArray | null;
    const regex = new RegExp(TOOL_USE_REGEX.source, 'g');

    while ((match = regex.exec(text)) !== null) {
        try {
            const parsed = JSON.parse(match[1]);
            if (parsed.tool && parsed.action) {
                calls.push({
                    id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    tool: parsed.tool,
                    action: parsed.action,
                    params: parsed.params || {},
                    rawBlock: match[0],
                });
            }
        } catch {
            // Malformed JSON in tool block, skip
        }
    }

    // Fallback: if no <tool_use> blocks found, try matching raw JSON tool objects
    // (LLM sometimes drops the XML tags and outputs bare JSON)
    if (calls.length === 0) {
        const jsonRegex = /\{\s*"tool"\s*:\s*"(calendar|gmail|x402|reminders|notes|tasks|web|tokens|imessage)"\s*,\s*"action"\s*:\s*"[^"]+"\s*,\s*"params"\s*:\s*\{[^}]*\}\s*\}/g;
        let jsonMatch: RegExpExecArray | null;
        while ((jsonMatch = jsonRegex.exec(text)) !== null) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.tool && parsed.action) {
                    calls.push({
                        id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                        tool: parsed.tool,
                        action: parsed.action,
                        params: parsed.params || {},
                        rawBlock: jsonMatch[0],
                    });
                }
            } catch {}
        }
    }

    return calls;
}

/** Remove tool-call blocks from the display text. */
export function stripToolBlocks(text: string): string {
    return text
        .replace(/(?:```\w*\n?)?<tool_use>[\s\S]*?<\/tool_use>(?:\n?```)?/g, '')
        .trim();
}

/** Check if a response contains any tool-call blocks. */
export function hasToolCalls(text: string): boolean {
    return /<tool_use>/.test(text) || /\{"tool"\s*:\s*"(calendar|gmail|x402|reminders|notes|tasks|web|tokens|imessage)"/.test(text);
}

/**
 * Minimal shape for extracted tool calls. Matches ToolCall's public
 * surface (tool + action + params) without the runtime-only id + rawBlock.
 * Used when we want to know "did the LLM emit a tool call and what was
 * it?" without committing to a specific ToolCall.id format.
 */
export interface ExtractedToolCall {
    tool: string;
    action: string;
    params: Record<string, unknown>;
}

/**
 * Aggressively extract tool_use blocks from a mixed text+JSON response.
 *
 * Falls back through three matching strategies:
 *   1. Regular <tool_use>{...}</tool_use> blocks (any markdown wrapping)
 *   2. Bare JSON objects with tool+action keys for known tool names
 *   3. JSON objects inside fenced code blocks
 *
 * Returns both the cleaned text (with tool blocks removed) + the
 * extracted calls. The caller can render cleanText to the user and
 * route the calls through the approval modal.
 *
 * Moved here from lib/council.ts. Lives alongside parseToolCalls +
 * stripToolBlocks since both operate on the same text.
 */
export function extractToolCallsFromText(text: string): {
    cleanText: string;
    toolCalls: ExtractedToolCall[];
} {
    const toolCalls: ExtractedToolCall[] = [];
    let cleaned = text;

    // Step 1: <tool_use> blocks with any wrapping
    const xmlPattern = /(?:```\w*\n?)?<tool_use>\s*([\s\S]*?)\s*<\/tool_use>(?:\n?```)?/g;
    let xmlMatch: RegExpExecArray | null;
    while ((xmlMatch = xmlPattern.exec(text)) !== null) {
        try {
            const parsed = JSON.parse(xmlMatch[1]);
            if (parsed.tool && parsed.action) {
                toolCalls.push({ tool: parsed.tool, action: parsed.action, params: parsed.params || {} });
                cleaned = cleaned.replace(xmlMatch[0], '');
            }
        } catch {
            // malformed JSON inside tool_use; fall through
        }
    }

    // Step 2: bare JSON objects with tool+action for known tools
    if (toolCalls.length === 0) {
        const jsonPattern = /\{[^{}]*"tool"\s*:\s*"(calendar|gmail|x402|reminders|notes|tasks|web|tokens|imessage)"[^{}]*"action"\s*:\s*"[^"]*"[^{}]*\}/g;
        let jsonMatch: RegExpExecArray | null;
        while ((jsonMatch = jsonPattern.exec(text)) !== null) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.tool && parsed.action) {
                    toolCalls.push({ tool: parsed.tool, action: parsed.action, params: parsed.params || {} });
                    cleaned = cleaned.replace(jsonMatch[0], '');
                }
            } catch {
                // bare JSON parse failure; fall through
            }
        }
    }

    // Step 3: JSON inside fenced code blocks
    if (toolCalls.length === 0) {
        const stripped = text.replace(/```[\s\S]*?```/g, (match) => {
            const inner = match.replace(/```\w*\n?/g, '').replace(/\n?```/g, '');
            try {
                const parsed = JSON.parse(inner.trim());
                if (parsed.tool && parsed.action) {
                    toolCalls.push({ tool: parsed.tool, action: parsed.action, params: parsed.params || {} });
                    return '';
                }
            } catch {
                // fenced block isn't JSON; leave it
            }
            return match;
        });
        if (toolCalls.length > 0) cleaned = stripped;
    }

    return { cleanText: cleaned.replace(/\n{3,}/g, '\n\n').trim(), toolCalls };
}

/**
 * Execute a tool call in Demo mode, returns a deterministic Simulated result.
 *
 * Never hits any external API. Never writes to Supabase. Never produces a
 * receipt. Safe to call from anonymous visitors and from authenticated
 * users who have no capability_real. The result carries `simulated: true`
 * so downstream renderers can show the gray Simulated chip.
 */
export async function executeMock(call: ToolCall): Promise<ToolResult> {
    // Lazy import avoids pulling the canned-replies module into the real
    // tool-execution path when not needed.
    const { DEMO_TOOL_MOCKS } = await import('@/lib/cannedReplies');
    const key = `${call.tool}.${call.action}`;
    const mock = DEMO_TOOL_MOCKS[key] ?? { simulated: true, message: 'Done (simulated).' };

    // Small latency so the Approve → result transition feels like a real
    // round-trip instead of an instant flicker.
    await new Promise(r => setTimeout(r, 400));

    return {
        toolCallId: call.id,
        tool: call.tool,
        action: call.action,
        success: true,
        data: mock,
        simulated: true,
    };
}

/**
 * Execute a single approved tool call against the backend.
 *
 * Supports the x402 payment flow: if the endpoint returns 402, we hit
 * `/api/tools/x402/pay` with the `invoice_reference`, then retry the
 * same request with `X-Payment-Proof` header. Retries once on 402.
 */
export async function executeToolCall(
    call: ToolCall,
    userId: string,
    opts: { agentId?: string | null } = {},
): Promise<ToolResult> {
    // Route every known tool to its handler. Unknown tools fall through
    // to /api/tools/<tool> so the registry can add entries without a
    // code change in this switch.
    const endpointByTool: Record<string, string> = {
        calendar: '/api/tools/calendar',
        gmail: '/api/tools/gmail',
        x402: '/api/tools/x402',
        reminders: '/api/tools/reminders',
        notes: '/api/tools/notes',
        tasks: '/api/tools/tasks',
        web: '/api/tools/web',
        tokens: '/api/tools/tokens',
        imessage: '/api/tools/imessage',
    };
    const endpoint = endpointByTool[call.tool as string] ?? `/api/tools/${call.tool}`;

    const authToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const authHeader: Record<string, string> = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    try {
        // Auto-inject the client's local date for calendar calls so timezone
        // offsets (e.g., "tomorrow" in MYT UTC+8) resolve correctly server-side
        const enrichedParams: Record<string, unknown> = { ...call.params };
        if (call.tool === 'calendar' && !enrichedParams.local_date) {
            const d = new Date();
            enrichedParams.local_date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        const body = JSON.stringify({
            action: call.action,
            params: enrichedParams,
            user_id: userId,
            agent_id: opts.agentId ?? null,
        });

        // First attempt, no payment proof
        let res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader },
            body,
        });

        // x402 flow: pay invoice, retry once
        if (res.status === 402) {
            const invoiceData = await res.clone().json().catch(() => ({}));
            const invoiceRef: string | undefined = invoiceData.invoice_reference;
            if (!invoiceRef) {
                return {
                    toolCallId: call.id,
                    tool: call.tool,
                    action: call.action,
                    success: false,
                    error: 'Payment required but no invoice reference returned',
                };
            }

            // Pay the invoice (devnet: simulated; production: on-chain tx)
            const payRes = await fetch('/api/tools/x402/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeader },
                body: JSON.stringify({ invoice_reference: invoiceRef }),
            });
            if (!payRes.ok) {
                const payErr = await payRes.json().catch(() => ({}));
                const payRequestId: string | undefined = payErr.requestId || payRes.headers.get('x-request-id') || undefined;
                return {
                    toolCallId: call.id,
                    tool: call.tool,
                    action: call.action,
                    success: false,
                    requestId: payRequestId,
                    nextAction: payErr.nextAction,
                    // Prefer the envelope's calm `message` / `nextAction` over raw
                    // bucket codes. Fall back to the old shape for older deploys.
                    error: [
                        payErr.message || `Payment failed: ${payErr.error || payRes.status}`,
                        payErr.reason && !payErr.message ? `, ${payErr.reason}` : null,
                        payErr.action_required ? `(${payErr.action_required})` : null,
                    ].filter(Boolean).join(' '),
                };
            }

            // Retry with proof
            res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Payment-Proof': invoiceRef,
                    ...authHeader,
                },
                body,
            });
        }

        const data = await res.json();
        const requestId: string | undefined = data.requestId || res.headers.get('x-request-id') || undefined;

        if (!res.ok) {
            return {
                toolCallId: call.id,
                tool: call.tool,
                action: call.action,
                success: false,
                requestId,
                nextAction: data.nextAction,
                // Prefer the envelope's `message` (calm) over the raw `error`
                // bucket code. Fall back to the legacy humanizer when older
                // deploys return the ad-hoc shape.
                error: data.message || humanizeToolError(data.error, call.tool, res.status),
            };
        }

        return {
            toolCallId: call.id,
            tool: call.tool,
            action: call.action,
            success: true,
            data,
            requestId,
        };
    } catch (err) {
        return {
            toolCallId: call.id,
            tool: call.tool,
            action: call.action,
            success: false,
            error: err instanceof Error ? err.message : 'Network error',
        };
    }
}

/** Map raw API error codes to clean user-facing messages. */
export function humanizeToolError(rawError: string | undefined, tool: string, status: number): string {
    const code = rawError || '';
    if (code === 'google_not_connected' || status === 403)
        return `Google ${tool === 'calendar' ? 'Calendar' : 'Gmail'} not connected. Go to Integrations to connect your Google account.`;
    if (code === 'ANTHROPIC_API_KEY not configured' || code === 'OPENAI_API_KEY not configured')
        return 'API key missing. Add your provider key in Settings → API Keys.';
    if (status === 401)
        return 'Session expired. Please sign in again.';
    if (status === 429)
        return 'Rate limited. Please wait a moment and try again.';
    if (status === 503)
        return 'Service temporarily unavailable. Check your connection and try again.';
    if (code.includes('refresh token') || code.includes('token has been expired'))
        return 'Google session expired. Reconnect your Google account in Integrations.';
    return code || `Something went wrong (HTTP ${status}). Please try again.`;
}

/** Format a tool result as markdown for display in chat / swarm output. */
export function formatToolResult(result: ToolResult): string {
    if (!result.success) {
        // Calm-copy trailer: `result.nextAction` is surfaced inline and the
        // Ref appears as inline code. The chat UI's Copy Request ID button
        // picks up the requestId from the message metadata, not this string.
        const nextActionLine = result.nextAction ? ` ${result.nextAction}` : '';
        const refLine = result.requestId ? ` *Ref:* \`${result.requestId}\`` : '';
        return `**${result.tool}.${result.action} didn\u2019t complete.** ${result.error}${nextActionLine}${refLine}`.trim();
    }

    // Demo-mode: prefix every rendered result with a Simulated tag so the
    // viewer never confuses a mock call with a real side-effect.
    const simulatedTag = result.simulated ? '*(Simulated, sign in to make it real)*\n\n' : '';

    const data = result.data as Record<string, unknown> | undefined;
    if (!data) return `${simulatedTag}**${result.tool}.${result.action}**, completed.`;

    // Calendar results
    if (result.tool === 'calendar' && result.action === 'free_slots' && Array.isArray(data.slots)) {
        const slots = data.slots as { start: string; end: string; durationMinutes: number }[];
        const lines = slots.map((s, i) => {
            const start = new Date(s.start);
            return `${i + 1}. **${start.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}** at ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} (${s.durationMinutes}min)`;
        });
        return `${simulatedTag}**Calendar, Free Slots Found:**\n${lines.join('\n')}`;
    }

    if (result.tool === 'calendar' && result.action === 'create' && data.event) {
        const evt = data.event as { summary: string; start: string; htmlLink?: string };
        const start = new Date(evt.start);
        return `${simulatedTag}**Calendar Event Created:** "${evt.summary}" on ${start.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}${evt.htmlLink ? `, [View](${evt.htmlLink})` : ''}`;
    }

    if (result.tool === 'calendar' && result.action === 'list' && Array.isArray(data.events)) {
        const events = data.events as { summary: string; start: string }[];
        if (events.length === 0) return `${simulatedTag}**Calendar:** No upcoming events found.`;
        const lines = events.slice(0, 5).map(e => {
            const d = new Date(e.start);
            return `- ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}, ${e.summary}`;
        });
        return `${simulatedTag}**Upcoming Events (${events.length}):**\n${lines.join('\n')}`;
    }

    // Gmail results
    if (result.tool === 'gmail' && result.action === 'draft' && data.draft) {
        const draft = data.draft as { draftId: string };
        return `${simulatedTag}**Gmail Draft Created** (ID: \`${draft.draftId.slice(0, 8)}...\`). Ready to send on approval.`;
    }

    if (result.tool === 'gmail' && (result.action === 'send' || result.action === 'send_draft') && data.result) {
        const r = data.result as { messageId: string };
        return `${simulatedTag}**Email Sent** (Message ID: \`${r.messageId.slice(0, 8)}...\`). Delivered to recipient.`;
    }

    if (result.tool === 'gmail' && result.action === 'list' && Array.isArray(data.messages)) {
        const msgs = data.messages as { from: string; subject: string; date: string }[];
        if (msgs.length === 0) return `${simulatedTag}**Gmail:** No messages found.`;
        const lines = msgs.slice(0, 5).map(m => `- **${m.subject}** from ${m.from.split('<')[0].trim()}`);
        return `${simulatedTag}**Recent Emails (${msgs.length}):**\n${lines.join('\n')}`;
    }

    // Reminders, the 3rd demo beat
    if (result.tool === 'reminders' && result.action === 'schedule') {
        return `${simulatedTag}**Reminder scheduled**, ${data.message ?? 'Nudge queued for tomorrow.'}`;
    }

    // Tokens API, market + price + risk
    if (result.tool === 'tokens' && result.action === 'search' && Array.isArray(data.results)) {
        const hits = data.results as { assetId?: string; symbol?: string; name?: string }[];
        if (hits.length === 0) return `${simulatedTag}**Tokens:** no matches.`;
        const lines = hits.slice(0, 6).map(h => `- **${h.symbol ?? h.assetId}**, ${h.name ?? h.assetId}`);
        return `${simulatedTag}**Token search (${hits.length}):**\n${lines.join('\n')}`;
    }
    if (result.tool === 'tokens' && result.action === 'price' && Array.isArray(data.candles)) {
        const candles = data.candles as { c: number; t: number }[];
        const last = candles[candles.length - 1];
        const first = candles[0];
        const change = first && last ? ((last.c - first.c) / first.c) * 100 : 0;
        const arrow = change >= 0 ? '▲' : '▼';
        return `${simulatedTag}**${data.assetId} price (${data.interval ?? '1h'}):** $${last?.c?.toFixed(2) ?? ','} ${arrow} ${change.toFixed(2)}% (${candles.length} candles).`;
    }
    if (result.tool === 'tokens' && result.action === 'risk') {
        return `${simulatedTag}**Risk score:** ${data.grade ?? ','} (${data.score ?? ','}/100), ${data.label ?? 'no label'}.`;
    }
    if (result.tool === 'tokens' && result.action === 'markets' && Array.isArray(data.markets)) {
        const mkts = data.markets as { dex?: string; pair?: string; liquidity_usd?: number }[];
        if (mkts.length === 0) return `${simulatedTag}**Markets:** none found.`;
        const lines = mkts.slice(0, 5).map(m =>
            `- ${m.dex ?? 'DEX'} · ${m.pair ?? '?/?'}${m.liquidity_usd ? ` · $${(m.liquidity_usd / 1_000_000).toFixed(2)}M liq` : ''}`,
        );
        return `${simulatedTag}**DEX markets (${mkts.length}):**\n${lines.join('\n')}`;
    }

    // iMessage (via Photon adapter)
    if (result.tool === 'imessage' && result.action === 'send') {
        const sent = (data.sent ?? data) as { messageId?: string; provider?: string };
        return `${simulatedTag}**iMessage sent** (id: \`${(sent.messageId ?? ',').slice(0, 10)}...\`).`;
    }

    // Generic fallback
    return `${simulatedTag}**${result.tool}.${result.action}** completed:\n\`\`\`json\n${JSON.stringify(data, null, 2).slice(0, 500)}\n\`\`\``;
}

/**
 * System prompt addition that teaches the LLM how to emit tool calls.
 * Injected when the user has connected Google (Calendar + Gmail).
 */
export function getToolSystemPrompt(): string {
    return `

## Available Tools

You have access to the user's Google Calendar and Gmail. When you need to take an action, emit a tool call using this exact format (the system will intercept it and ask the user for approval):

<tool_use>
{"tool": "calendar", "action": "free_slots", "params": {"duration_minutes": 30, "days_ahead": 7, "start_day_offset": 0, "local_date": "YYYY-MM-DD"}}
</tool_use>

<tool_use>
{"tool": "calendar", "action": "list", "params": {"days_ahead": 7, "max_results": 10}}
</tool_use>

<tool_use>
{"tool": "calendar", "action": "create", "params": {"summary": "Meeting title", "start": "2026-04-15T14:00:00", "end": "2026-04-15T14:30:00", "description": "Notes", "attendees": ["email@example.com"]}}
</tool_use>

<tool_use>
{"tool": "gmail", "action": "list", "params": {"query": "in:inbox", "max_results": 10}}
</tool_use>

<tool_use>
{"tool": "gmail", "action": "draft", "params": {"to": "recipient@example.com", "subject": "Subject", "body": "Plain-text fallback", "html": "<p>Optional HTML body. Include this when the user asks for a formatted/HTML email.</p>"}}
</tool_use>

<tool_use>
{"tool": "gmail", "action": "send", "params": {"to": "recipient@example.com", "subject": "Subject", "body": "Plain-text fallback", "html": "<p>Optional HTML body.</p>"}}
</tool_use>

When the user asks for an HTML-formatted / professional / presentable email, populate BOTH the "body" field (short plain-text fallback for clients that strip HTML) and the "html" field (the full styled message). Do NOT put raw HTML tags in "body" alone, that sends the tags as literal text.

### Tokens (Solana market + price + risk data)

<tool_use>
{"tool": "tokens", "action": "search", "params": {"query": "sol"}}
</tool_use>

<tool_use>
{"tool": "tokens", "action": "price", "params": {"assetId": "solana", "interval": "1h"}}
</tool_use>

<tool_use>
{"tool": "tokens", "action": "risk", "params": {"mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"}}
</tool_use>

<tool_use>
{"tool": "tokens", "action": "markets", "params": {"assetId": "solana", "mint": "So11111111111111111111111111111111111111112"}}
</tool_use>

Use tokens.search first when the user mentions a token by name/symbol; feed the resulting assetId into tokens.price or tokens.markets. Use tokens.risk when the user asks whether a mint is safe.

### iMessage (via Photon)

<tool_use>
{"tool": "imessage", "action": "send", "params": {"to": "+15551234567", "text": "Plain-text fallback", "subject": "Optional"}}
</tool_use>

Only emit this when the user explicitly asks to text someone. The recipient should be an E.164 phone number or the user's known iMessage alias. Never auto-bundle a text with an email, ask the user which channel they want.

## Behavioral Rules

1. ACT FIRST, then ask. When the user wants to schedule a meeting, immediately emit a calendar.free_slots tool call. Do NOT ask for details first. Present 2-3 available slots, THEN ask "Who should I invite?", one question only.
2. Maximum 1 clarifying question per response. Never ask 2+ questions before acting. If you can infer reasonable defaults, use them and act.
3. ALWAYS use <tool_use> blocks for actions. Do not describe what you would do, emit the tool call.
4. Each tool call will be shown to the user for approval before executing.
5. After the tool executes, you'll receive the result and can continue your response.
6. Only emit ONE tool call per response. Wait for the result before emitting another.
7. When presenting calendar slots, format them clearly with day, date, and time. Bold the recommended option.
8. For calendar tool calls, ALWAYS include "local_date" set to today's date in YYYY-MM-DD format. Use start_day_offset: 0 for today, 1 for tomorrow, etc. The offset is relative to the local_date, not UTC.
`;
}
