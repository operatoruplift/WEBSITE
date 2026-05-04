/**
 * Photon Spectrum iMessage agent loop.
 *
 * Generates a Claude Haiku reply for an inbound webhook message and
 * sends it back via the Spectrum adapter. Keeps the round-trip
 * inside the webhook handler so the user gets a real LLM response
 * on iMessage in ~2-4 seconds, no cron required.
 *
 * Env:
 *   ANTHROPIC_API_KEY          required, picks up the Claude Haiku reply
 *   PHOTON_AGENT_MODEL         optional, default 'claude-haiku-4-5-20251001'
 *   PHOTON_AGENT_MAX_TOKENS    optional, default 200 (iMessage-friendly)
 *   PHOTON_AGENT_SYSTEM        optional, override the system prompt
 *
 * If ANTHROPIC_API_KEY is missing, the agent returns a 'no_llm' result
 * and falls back to the previous "Got it, working on it." style ack so
 * Spectrum still hears something. Honest-status: never produce a fake
 * message id; if Photon send fails, surface the reason in the result.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { PhotonAdapter } from './adapter';
import { safeLog, safeWarn } from '@/lib/safeLog';

export interface AgentInput {
    sender: string;
    text: string;
    platform: 'imessage' | 'telegram' | 'whatsapp' | 'x' | 'discord' | 'instagram';
}

export interface AgentSuccess {
    ok: true;
    replyText: string;
    messageId: string;
    elapsedMs: number;
    source: 'llm' | 'fallback_no_llm';
}

export interface AgentFailure {
    ok: false;
    reason: 'no_adapter' | 'llm_failed' | 'send_failed';
    message: string;
    elapsedMs: number;
}

export type AgentResult = AgentSuccess | AgentFailure;

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const DEFAULT_MAX_TOKENS = 200;
const DEFAULT_SYSTEM = [
    'You are Operator Uplift, replying over iMessage.',
    'Keep replies short, ideally one or two sentences. Plain text, no markdown.',
    'If the user asks for an action that needs Gmail, Calendar, or other connectors, tell them to open operatoruplift.com/chat in their browser to approve it.',
    'Be warm, direct, and human. Never invent receipts or claim you sent something you did not.',
].join(' ');

const FALLBACK_REPLY = 'Got it, working on it.';

function getModel(): string {
    return process.env.PHOTON_AGENT_MODEL?.trim() || DEFAULT_MODEL;
}

function getMaxTokens(): number {
    const raw = process.env.PHOTON_AGENT_MAX_TOKENS?.trim();
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_TOKENS;
}

function getSystem(): string {
    return process.env.PHOTON_AGENT_SYSTEM?.trim() || DEFAULT_SYSTEM;
}

async function generateReply(text: string, requestId?: string): Promise<{ ok: true; reply: string } | { ok: false; reason: string }> {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) return { ok: false, reason: 'ANTHROPIC_API_KEY missing' };

    const trimmed = text.trim().slice(0, 4000);
    if (!trimmed) return { ok: true, reply: FALLBACK_REPLY };

    try {
        const anthropic = new Anthropic({ apiKey });
        const response = await anthropic.messages.create({
            model: getModel(),
            max_tokens: getMaxTokens(),
            system: getSystem(),
            messages: [{ role: 'user', content: trimmed }],
        });
        const reply = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map(block => block.text)
            .join('\n')
            .trim();
        if (!reply) return { ok: false, reason: 'empty_response' };
        safeLog({ at: 'photon.agent', event: 'llm_ok', requestId, model: getModel(), inputLen: trimmed.length, outputLen: reply.length });
        return { ok: true, reply };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        safeWarn({ at: 'photon.agent', event: 'llm_failed', requestId, error: message.slice(0, 240) });
        return { ok: false, reason: message };
    }
}

/**
 * Generate an LLM reply for the inbound message and send it back via
 * the Spectrum adapter. Single round-trip; caller awaits.
 */
export async function runAgentReply(
    input: AgentInput,
    adapter: PhotonAdapter,
    requestId?: string,
): Promise<AgentResult> {
    const started = Date.now();

    if (!adapter.isActive()) {
        return {
            ok: false,
            reason: 'no_adapter',
            message: 'PHOTON_PROJECT_ID + PHOTON_API_KEY not set; cannot send reply.',
            elapsedMs: Date.now() - started,
        };
    }

    const llm = await generateReply(input.text, requestId);
    const replyText = llm.ok ? llm.reply : FALLBACK_REPLY;
    const source: AgentSuccess['source'] = llm.ok ? 'llm' : 'fallback_no_llm';

    const send = await adapter.send({
        to: input.sender,
        text: replyText,
        platform: input.platform,
    });
    if (!send.ok) {
        safeWarn({ at: 'photon.agent', event: 'send_failed', requestId, reason: send.reason, message: send.message?.slice(0, 240) });
        return {
            ok: false,
            reason: 'send_failed',
            message: `${send.reason}: ${send.message}`,
            elapsedMs: Date.now() - started,
        };
    }

    return {
        ok: true,
        replyText,
        messageId: send.messageId,
        elapsedMs: Date.now() - started,
        source,
    };
}
