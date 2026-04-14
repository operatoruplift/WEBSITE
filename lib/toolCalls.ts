/**
 * Tool call interceptor — parses LLM output for tool-call intent,
 * executes approved calls, logs to the audit trail.
 *
 * The LLM emits tool calls as <tool_use> JSON blocks in its text output.
 * This module extracts them, presents them for approval, and executes.
 */

export interface ToolCall {
    id: string;
    tool: 'calendar' | 'gmail' | 'x402';
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
}

const TOOL_USE_REGEX = /<tool_use>\s*([\s\S]*?)\s*<\/tool_use>/g;

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
            // Malformed JSON in tool block — skip
        }
    }

    return calls;
}

/** Remove tool-call blocks from the display text. */
export function stripToolBlocks(text: string): string {
    return text.replace(/<tool_use>[\s\S]*?<\/tool_use>/g, '').trim();
}

/** Check if a response contains any tool-call blocks. */
export function hasToolCalls(text: string): boolean {
    return /<tool_use>/.test(text);
}

/** Execute a single approved tool call against the backend. */
export async function executeToolCall(
    call: ToolCall,
    userId: string,
): Promise<ToolResult> {
    const endpoint = call.tool === 'calendar'
        ? '/api/tools/calendar'
        : call.tool === 'gmail'
            ? '/api/tools/gmail'
            : '/api/tools/x402';

    try {
        // Auto-inject the client's local date for calendar calls so timezone
        // offsets (e.g., "tomorrow" in MYT UTC+8) resolve correctly server-side
        const enrichedParams = { ...call.params };
        if (call.tool === 'calendar' && !enrichedParams.local_date) {
            const d = new Date();
            enrichedParams.local_date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: call.action,
                params: enrichedParams,
                user_id: userId,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            return {
                toolCallId: call.id,
                tool: call.tool,
                action: call.action,
                success: false,
                error: humanizeToolError(data.error, call.tool, res.status),
            };
        }

        return {
            toolCallId: call.id,
            tool: call.tool,
            action: call.action,
            success: true,
            data,
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
function humanizeToolError(rawError: string | undefined, tool: string, status: number): string {
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
        return `**Tool Error** (${result.tool}.${result.action}): ${result.error}`;
    }

    const data = result.data as Record<string, unknown> | undefined;
    if (!data) return `**${result.tool}.${result.action}** — completed.`;

    // Calendar results
    if (result.tool === 'calendar' && result.action === 'free_slots' && Array.isArray(data.slots)) {
        const slots = data.slots as { start: string; end: string; durationMinutes: number }[];
        const lines = slots.map((s, i) => {
            const start = new Date(s.start);
            return `${i + 1}. **${start.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}** at ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} (${s.durationMinutes}min)`;
        });
        return `**Calendar — Free Slots Found:**\n${lines.join('\n')}`;
    }

    if (result.tool === 'calendar' && result.action === 'create' && data.event) {
        const evt = data.event as { summary: string; start: string; htmlLink?: string };
        const start = new Date(evt.start);
        return `**Calendar Event Created:** "${evt.summary}" on ${start.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}${evt.htmlLink ? ` — [View](${evt.htmlLink})` : ''}`;
    }

    if (result.tool === 'calendar' && result.action === 'list' && Array.isArray(data.events)) {
        const events = data.events as { summary: string; start: string }[];
        if (events.length === 0) return '**Calendar:** No upcoming events found.';
        const lines = events.slice(0, 5).map(e => {
            const d = new Date(e.start);
            return `- ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} — ${e.summary}`;
        });
        return `**Upcoming Events (${events.length}):**\n${lines.join('\n')}`;
    }

    // Gmail results
    if (result.tool === 'gmail' && result.action === 'draft' && data.draft) {
        const draft = data.draft as { draftId: string };
        return `**Gmail Draft Created** (ID: \`${draft.draftId.slice(0, 8)}...\`). Ready to send on approval.`;
    }

    if (result.tool === 'gmail' && (result.action === 'send' || result.action === 'send_draft') && data.result) {
        const r = data.result as { messageId: string };
        return `**Email Sent** (Message ID: \`${r.messageId.slice(0, 8)}...\`). Delivered to recipient.`;
    }

    if (result.tool === 'gmail' && result.action === 'list' && Array.isArray(data.messages)) {
        const msgs = data.messages as { from: string; subject: string; date: string }[];
        if (msgs.length === 0) return '**Gmail:** No messages found.';
        const lines = msgs.slice(0, 5).map(m => `- **${m.subject}** from ${m.from.split('<')[0].trim()}`);
        return `**Recent Emails (${msgs.length}):**\n${lines.join('\n')}`;
    }

    // Generic fallback
    return `**${result.tool}.${result.action}** completed:\n\`\`\`json\n${JSON.stringify(data, null, 2).slice(0, 500)}\n\`\`\``;
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
{"tool": "gmail", "action": "draft", "params": {"to": "recipient@example.com", "subject": "Subject", "body": "Email body text"}}
</tool_use>

<tool_use>
{"tool": "gmail", "action": "send", "params": {"to": "recipient@example.com", "subject": "Subject", "body": "Email body text"}}
</tool_use>

## Behavioral Rules

1. ACT FIRST, then ask. When the user wants to schedule a meeting, immediately emit a calendar.free_slots tool call. Do NOT ask for details first. Present 2-3 available slots, THEN ask "Who should I invite?" — one question only.
2. Maximum 1 clarifying question per response. Never ask 2+ questions before acting. If you can infer reasonable defaults, use them and act.
3. ALWAYS use <tool_use> blocks for actions. Do not describe what you would do — emit the tool call.
4. Each tool call will be shown to the user for approval before executing.
5. After the tool executes, you'll receive the result and can continue your response.
6. Only emit ONE tool call per response. Wait for the result before emitting another.
7. When presenting calendar slots, format them clearly with day, date, and time. Bold the recommended option.
8. For calendar tool calls, ALWAYS include "local_date" set to today's date in YYYY-MM-DD format. Use start_day_offset: 0 for today, 1 for tomorrow, etc. The offset is relative to the local_date, not UTC.
`;
}
