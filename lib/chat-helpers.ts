/**
 * Pure helpers for the /api/chat route handler.
 *
 * Extracted from app/api/chat/route.ts so they can be unit-tested
 * without spinning up a Next.js Request, capabilities, rate limit,
 * or LLM provider.
 *
 * The handler uses these to:
 *   - getClientIp:           pull a stable IP for Demo-mode rate limiting
 *   - resolveModelDisplayName: turn the lowercase model id into the
 *                              human-readable label that the LLM is
 *                              told to identify as in its system prompt
 *   - buildSystemPrompt:     compose the system message that pins the
 *                              model's identity (defends against an LLM
 *                              that, asked "are you GPT-4?", says "yes")
 */

const MODEL_DISPLAY_NAMES: Record<string, string> = {
    // Anthropic
    'claude-opus-4-7': 'Claude Opus 4.7 (Anthropic)',
    'claude-opus-4-6': 'Claude Opus 4.7 (Anthropic)',
    'claude-sonnet-4-6': 'Claude Sonnet 4.6 (Anthropic)',
    'claude-haiku-4-5': 'Claude Haiku 4.5 (Anthropic)',
    // OpenAI: GPT-5.5 + GPT-5.5 Pro shipped 2026-04-23. Older 4.x
    // entries kept so legacy chat sessions still resolve a name.
    'gpt-5.5': 'GPT-5.5 (OpenAI)',
    'gpt-5.5-pro': 'GPT-5.5 Pro (OpenAI)',
    'gpt-4.1': 'GPT-4.1 (OpenAI)',
    'gpt-4.1-mini': 'GPT-4.1 Mini (OpenAI)',
    'gpt-4o': 'GPT-4o (OpenAI)',
    // Google: Gemini 3.1 Pro + 3 Flash shipped 2026-04-22.
    'gemini-3.1-pro': 'Gemini 3.1 Pro (Google)',
    'gemini-3-flash': 'Gemini 3 Flash (Google)',
    'gemini-2.5-pro': 'Gemini 2.5 Pro (Google)',
    'gemini-2.5-flash': 'Gemini 2.5 Flash (Google)',
    // xAI: Grok 4.3 API GA 2026-04-30.
    'grok-4.3': 'Grok 4.3 (xAI)',
    'grok-3': 'Grok 3 (xAI)',
    'grok-3-mini': 'Grok 3 Mini (xAI)',
    // DeepSeek: V4 Pro + V4 Flash shipped 2026-04-24.
    'deepseek-v4-pro': 'DeepSeek V4 Pro (DeepSeek)',
    'deepseek-v4-flash': 'DeepSeek V4 Flash (DeepSeek)',
    'deepseek-r1': 'DeepSeek R1 (DeepSeek)',
    'deepseek-v3': 'DeepSeek V3 (DeepSeek)',
};

/**
 * Extract the originating client IP from the request headers.
 *
 * Falls through x-forwarded-for (first hop) → x-real-ip → 'unknown'.
 * On Vercel, x-forwarded-for is always present; the fallback is
 * defensive for local dev and direct-fetch tests.
 */
export function getClientIp(request: Request): string {
    const xff = request.headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0]?.trim() || 'unknown';
    const real = request.headers.get('x-real-ip');
    return real?.trim() || 'unknown';
}

/**
 * Map a lowercase model id to its display name. Falls through to the
 * raw key when unknown so a regression on the table doesn't surface
 * as an empty string in the system prompt.
 */
export function resolveModelDisplayName(modelKey: string): string {
    return MODEL_DISPLAY_NAMES[modelKey] || modelKey;
}

/**
 * Compose the system message for a chat turn.
 *
 * If the caller passed a custom systemPrompt, append the model-pinning
 * line so the model still identifies correctly. Otherwise, use the
 * default prompt that includes a concise + accurate + helpful framing.
 */
export function buildSystemPrompt(modelDisplayName: string, customSystemPrompt?: string): string {
    if (customSystemPrompt) {
        return `${customSystemPrompt}\n\nYou are ${modelDisplayName}. Never identify as a different model.`;
    }
    return `You are ${modelDisplayName}, running on the Operator Uplift platform. You are concise, accurate, and helpful. You can assist with coding, research, writing, analysis, and general questions. When showing code, use markdown code blocks with language tags. Never claim to be a different model than ${modelDisplayName}.`;
}

/** Default model id when the client doesn't pick one. */
export const DEFAULT_MODEL_KEY = 'claude-sonnet-4-6';

/** Lowercase the model id and apply the default. */
export function normalizeModelKey(model: unknown): string {
    return (typeof model === 'string' && model ? model : DEFAULT_MODEL_KEY).toLowerCase();
}

/** Snapshot of the documented model ids — exported for tests + docs. */
export function listKnownModelIds(): string[] {
    return Object.keys(MODEL_DISPLAY_NAMES);
}
