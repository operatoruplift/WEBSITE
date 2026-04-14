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

export interface CouncilResult {
    synthesis: string;         // The Chairman's final response (what the user sees)
    transcript: AgentOutput[]; // Full debate log (accessible via toggle)
    durationMs: number;
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
        systemPrompt: `You are the Contrarian. Your job is to find what will fail. Challenge every assumption. Point out risks, blind spots, and overconfidence. You are skeptical by nature — if something sounds too good to be true, it is. Never agree with the consensus unless forced to by overwhelming evidence. Be specific about what could go wrong. 2-3 sentences max.`,
    },
    {
        id: 'first-principles',
        name: 'First Principles',
        model: 'claude-sonnet-4-6',
        systemPrompt: `You are the First Principles thinker. Strip away all assumptions and reframe the problem from scratch. Ask: what is fundamentally true here? What would we do if we started from zero? Ignore conventions and existing solutions — reason from the ground up. Your answers should make people reconsider their framing. 2-3 sentences max.`,
    },
    {
        id: 'expansionist',
        name: 'Expansionist',
        model: 'claude-sonnet-4-6',
        systemPrompt: `You are the Expansionist. Find the upside everyone missed. What opportunities are being ignored? What's the 10x version of this idea? You see possibilities where others see constraints. Think bigger, think adjacent markets, think second-order effects. Your job is to stretch the vision. 2-3 sentences max.`,
    },
    {
        id: 'outsider',
        name: 'Outsider',
        model: 'claude-sonnet-4-6',
        systemPrompt: `You are the Outsider. You have zero context on this space and that's your superpower. What does someone with fresh eyes see? Point out the obvious thing insiders are blind to. Question jargon. Challenge complexity. If you can't understand something in 10 seconds, it's probably too complicated. 2-3 sentences max.`,
    },
    {
        id: 'chairman',
        name: 'Chairman',
        model: 'claude-sonnet-4-6',
        systemPrompt: `You are the Chairman. You've just read 4 different perspectives on the user's question — from a Contrarian (risk-finder), a First Principles thinker (reframer), an Expansionist (opportunity-finder), and an Outsider (fresh eyes). Your job: identify the strongest argument, the biggest blind spot, and produce ONE clear, actionable response. Do not list all 4 views — synthesize them into a single coherent answer that serves the user. Be direct and practical. If the user asked for an action (schedule, send, create), DO the action — emit the appropriate <tool_use> block. Don't just discuss it.`,
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

    const chairmanOutput: AgentOutput = {
        agentId: 'chairman',
        agentName: 'Chairman',
        output: synthesis,
        durationMs: Date.now() - chairStart,
    };

    return {
        synthesis,
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
