/**
 * LLM Council — routes every user message through 5 specialist agents
 * who debate in parallel, then a Chairman synthesizes the final response.
 *
 * Each agent uses Claude Sonnet but with a distinct system prompt that
 * defines their reasoning style and persona.
 *
 * Flow:
 * 1. User message arrives
 * 2. 4 advisors process in parallel (Contrarian, First Principles, Expansionist, Outsider)
 * 3. Chairman receives all 4 outputs + original message, synthesizes
 * 4. User sees the Chairman's synthesis
 * 5. Full debate transcript accessible via "View Council reasoning"
 */

export interface CouncilAgent {
    id: string;
    name: string;
    systemPrompt: string;
    model: string;
}

export interface ExtractedToolCall {
    tool: string;
    action: string;
    params: Record<string, unknown>;
}

export interface CouncilResult {
    synthesis: string;                   // Clean text (tool JSON stripped)
    toolCalls: ExtractedToolCall[];      // Parsed tool calls from Chairman
    transcript: AgentOutput[];           // Full debate log
    durationMs: number;
}

/**
 * Aggressively extract tool calls from Chairman output.
 * Strips all markdown, code fences, XML wrappers, and finds any JSON
 * substring that looks like {"tool": "...", "action": "...", "params": {...}}.
 * Returns the clean text and extracted tool calls separately.
 */
function extractToolCallsFromText(text: string): { cleanText: string; toolCalls: ExtractedToolCall[] } {
    const toolCalls: ExtractedToolCall[] = [];

    // Step 1: Try to find <tool_use> blocks (any variant)
    let cleaned = text;
    const xmlPattern = /(?:```\w*\n?)?<tool_use>\s*([\s\S]*?)\s*<\/tool_use>(?:\n?```)?/g;
    let xmlMatch: RegExpExecArray | null;
    while ((xmlMatch = xmlPattern.exec(text)) !== null) {
        try {
            const parsed = JSON.parse(xmlMatch[1]);
            if (parsed.tool && parsed.action) {
                toolCalls.push({ tool: parsed.tool, action: parsed.action, params: parsed.params || {} });
                cleaned = cleaned.replace(xmlMatch[0], '');
            }
        } catch {}
    }

    // Step 2: If nothing found, try bare JSON objects
    if (toolCalls.length === 0) {
        // Match any JSON that has "tool" and "action" keys
        const jsonPattern = /\{[^{}]*"tool"\s*:\s*"(calendar|gmail|x402)"[^{}]*"action"\s*:\s*"[^"]*"[^{}]*\}/g;
        let jsonMatch: RegExpExecArray | null;
        while ((jsonMatch = jsonPattern.exec(text)) !== null) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.tool && parsed.action) {
                    toolCalls.push({ tool: parsed.tool, action: parsed.action, params: parsed.params || {} });
                    cleaned = cleaned.replace(jsonMatch[0], '');
                }
            } catch {}
        }
    }

    // Step 3: If still nothing, try stripping ALL markdown formatting first and re-scan
    if (toolCalls.length === 0) {
        const stripped = text
            .replace(/```[\s\S]*?```/g, (match) => {
                // Check inside code blocks for tool JSON
                const inner = match.replace(/```\w*\n?/g, '').replace(/\n?```/g, '');
                try {
                    const parsed = JSON.parse(inner.trim());
                    if (parsed.tool && parsed.action) {
                        toolCalls.push({ tool: parsed.tool, action: parsed.action, params: parsed.params || {} });
                        return ''; // Remove this code block from output
                    }
                } catch {}
                return match;
            });
        if (toolCalls.length > 0) cleaned = stripped;
    }

    return { cleanText: cleaned.replace(/\n{3,}/g, '\n\n').trim(), toolCalls };
}

export interface AgentOutput {
    agentId: string;
    agentName: string;
    output: string;
    durationMs: number;
}

export const COUNCIL_AGENTS: CouncilAgent[] = [
    {
        id: 'contrarian',
        name: 'Contrarian',
        model: 'claude-sonnet-4-6',
        systemPrompt: `You are the Contrarian. Your job is to reason and debate — find what will fail. Challenge every assumption. Point out risks, blind spots, and overconfidence. Be specific about what could go wrong. 2-3 sentences max. You do NOT call tools or take actions. The Chairman handles all execution.`,
    },
    {
        id: 'first-principles',
        name: 'First Principles',
        model: 'claude-sonnet-4-6',
        systemPrompt: `You are the First Principles thinker. Your job is to reason and debate — strip away all assumptions and reframe from scratch. What is fundamentally true? What would we do if starting from zero? 2-3 sentences max. You do NOT call tools or take actions. The Chairman handles all execution.`,
    },
    {
        id: 'expansionist',
        name: 'Expansionist',
        model: 'claude-sonnet-4-6',
        systemPrompt: `You are the Expansionist. Your job is to reason and debate — find the upside everyone missed. What opportunities are being ignored? Think bigger, think second-order effects. 2-3 sentences max. You do NOT call tools or take actions. The Chairman handles all execution.`,
    },
    {
        id: 'outsider',
        name: 'Outsider',
        model: 'claude-sonnet-4-6',
        systemPrompt: `You are the Outsider. Your job is to reason and debate — fresh eyes, zero context. Point out the obvious thing insiders are blind to. Question jargon and complexity. 2-3 sentences max. You do NOT call tools or take actions. The Chairman handles all execution.`,
    },
    {
        id: 'chairman',
        name: 'Chairman',
        model: 'claude-sonnet-4-6',
        systemPrompt: `You are the Chairman. You've read 4 advisor perspectives. Synthesize into ONE clear response.

RULES:
1. Do NOT list the 4 views. Produce one synthesized answer.
2. If the user asked for an ACTION (schedule, send, create, check), you MUST emit a tool call NOW.
3. Tool call format — output EXACTLY this, no backticks, no code fences:

<tool_use>
{"tool": "calendar", "action": "free_slots", "params": {"duration_minutes": 30, "days_ahead": 7, "start_day_offset": 0}}
</tool_use>

4. NEVER wrap the <tool_use> tags in markdown code blocks or backticks.
5. 2-4 sentences of synthesis, then the tool call if an action is needed.`,
    },
];

/**
 * Run the full Council debate. Returns the Chairman's synthesis + transcript.
 * Calls /api/chat for each agent. Advisors run in parallel, Chairman runs last.
 */
export async function runCouncil(
    userMessage: string,
    history: { role: string; content: string }[],
    toolPrompt: string,
): Promise<CouncilResult> {
    const start = Date.now();
    const advisors = COUNCIL_AGENTS.filter(a => a.id !== 'chairman');
    const chairman = COUNCIL_AGENTS.find(a => a.id === 'chairman')!;

    // Run all 4 advisors in parallel
    const advisorResults = await Promise.all(
        advisors.map(async (agent): Promise<AgentOutput> => {
            const agentStart = Date.now();
            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: userMessage,
                        model: agent.model,
                        history: history.slice(-10),
                        systemPrompt: agent.systemPrompt,
                    }),
                });
                if (res.ok && res.body) {
                    const reader = res.body.getReader();
                    const decoder = new TextDecoder();
                    let output = '';
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        output += decoder.decode(value, { stream: true });
                    }
                    return { agentId: agent.id, agentName: agent.name, output, durationMs: Date.now() - agentStart };
                }
            } catch { /* fallback below */ }
            return {
                agentId: agent.id,
                agentName: agent.name,
                output: `[${agent.name}] Unable to process — API unavailable.`,
                durationMs: Date.now() - agentStart,
            };
        })
    );

    // Build context for Chairman
    const advisorContext = advisorResults
        .map(r => `**${r.agentName}:** ${r.output}`)
        .join('\n\n');

    const chairmanPrompt = `${chairman.systemPrompt}\n\n${toolPrompt}\n\n## Advisor Perspectives\n\n${advisorContext}\n\n## User's Original Message\n\n${userMessage}`;

    // Run Chairman with all advisor outputs as context
    const chairStart = Date.now();
    let synthesis = '';
    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Synthesize the advisor perspectives above and respond to the user. If they asked for an action, do it now.`,
                model: chairman.model,
                history: history.slice(-10),
                systemPrompt: chairmanPrompt,
            }),
        });
        if (res.ok && res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                synthesis += decoder.decode(value, { stream: true });
            }
        }
    } catch {
        synthesis = 'The Council was unable to synthesize a response. Please try again.';
    }

    // Extract tool calls from Chairman's raw output — user never sees the JSON
    const { cleanText, toolCalls: extractedCalls } = extractToolCallsFromText(synthesis);

    const chairmanOutput: AgentOutput = {
        agentId: 'chairman',
        agentName: 'Chairman',
        output: cleanText, // Clean text only, no tool JSON
        durationMs: Date.now() - chairStart,
    };

    return {
        synthesis: cleanText,  // User sees clean text only
        toolCalls: extractedCalls,  // Passed to tool execution pipeline
        transcript: [...advisorResults, chairmanOutput],
        durationMs: Date.now() - start,
    };
}

/**
 * Check if Council mode should be used for a given message.
 * Returns true for substantive questions, false for simple greetings/commands.
 */
export function shouldUseCouncil(message: string): boolean {
    const lower = message.toLowerCase().trim();
    // Skip council for very short messages, greetings, and simple commands
    if (lower.length < 15) return false;
    if (/^(hi|hello|hey|thanks|ok|yes|no|sure)\b/.test(lower)) return false;
    return true;
}
