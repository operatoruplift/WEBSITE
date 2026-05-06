/**
 * Cheap intent detector for the iMessage agent.
 *
 * Pattern-matches user text against a small set of typed intents
 * we can handle without an LLM round-trip:
 *
 *   - set_zodiac     "I'm a leo" / "set my sign to virgo"
 *   - set_location   "I'm in San Francisco" / "my location is Austin"
 *   - set_model      "switch to sonnet" / "use claude-haiku-4-5"
 *   - weather        "what's the weather" / "forecast in SF" / "temp in Tokyo"
 *
 * `classifyIntent(text)` returns a discriminated union so the
 * webhook can dispatch to the right typed handler. Anything we
 * don't recognize returns intent:'chat' and falls through to the
 * keyword + agent path, which is the pre-PR behavior.
 *
 * Conservative on purpose: a borderline match becomes 'chat' so
 * the LLM gets a chance, rather than misrouting "weather permitting
 * we should ship Friday" into the weather handler.
 */
import { normalizeSign, parseSignFromText, type ZodiacSign } from './horoscope';

export type IntentResult =
    | { intent: 'chat' }
    | { intent: 'set_zodiac'; sign: ZodiacSign }
    | { intent: 'set_location'; location: string }
    | { intent: 'set_model'; model: string }
    | { intent: 'weather'; location: string | null }
    | { intent: 'email_draft'; to: string; body: string };

const KNOWN_MODELS: Record<string, string> = {
    'sonnet': 'claude-sonnet-4-6',
    'haiku': 'claude-haiku-4-5-20251001',
    'opus': 'claude-opus-4-7',
    'gpt-5.5': 'gpt-5.5',
    'gpt-5.5 pro': 'gpt-5.5-pro',
    'gemini': 'gemini-3-flash',
    'gemini pro': 'gemini-3.1-pro',
    'grok': 'grok-4.3',
    'deepseek': 'deepseek-v4-flash',
    'llama': 'llama-4-maverick',
    'mistral': 'mistral-large',
};

function tryZodiac(text: string): IntentResult | null {
    // Explicit "set my sign to X"
    const setMatch = text.match(/(?:set|change|update)\s+(?:my\s+)?(?:zodiac|sign)\s+(?:to\s+)?([a-z]+)/i);
    if (setMatch) {
        const sign = normalizeSign(setMatch[1]);
        if (sign) return { intent: 'set_zodiac', sign };
    }
    // "I'm a leo", "I am a virgo", "Aries here"
    const idMatch = text.match(/\b(?:i'?m|i am)\s+(?:an?\s+)?([a-z]+)/i);
    if (idMatch) {
        const sign = normalizeSign(idMatch[1]);
        if (sign) return { intent: 'set_zodiac', sign };
    }
    // "make me a libra"
    const makeMatch = text.match(/\bmake\s+me\s+(?:an?\s+)?([a-z]+)/i);
    if (makeMatch) {
        const sign = normalizeSign(makeMatch[1]);
        if (sign) return { intent: 'set_zodiac', sign };
    }
    // "X here" only when X is unambiguously a sign
    const standaloneSign = parseSignFromText(text);
    if (standaloneSign && /\b(?:here|sign|zodiac)\b/i.test(text)) {
        return { intent: 'set_zodiac', sign: standaloneSign };
    }
    return null;
}

function tryLocation(text: string): IntentResult | null {
    // "I'm in X", "I am in X", "my location is X", "set location to X"
    const patterns = [
        /(?:i'?m|i am)\s+in\s+([^.!?,]+)/i,
        /(?:my\s+)?location\s+is\s+([^.!?,]+)/i,
        /set\s+(?:my\s+)?location\s+(?:to\s+)?([^.!?,]+)/i,
        /i\s+live\s+in\s+([^.!?,]+)/i,
    ];
    for (const p of patterns) {
        const m = text.match(p);
        if (m) {
            const loc = m[1].trim();
            if (loc && loc.length >= 2 && loc.length <= 80 && !/\b\d{2,}\b/.test(loc)) {
                return { intent: 'set_location', location: loc };
            }
        }
    }
    return null;
}

function tryModel(text: string): IntentResult | null {
    // "switch to X", "use X", "set model to X"
    const patterns = [
        /(?:switch|change|set\s+model)\s+(?:to\s+)?([a-z0-9.-]+(?:\s+[a-z0-9.-]+)?)/i,
        /\buse\s+([a-z0-9.-]+(?:\s+[a-z0-9.-]+)?)/i,
    ];
    for (const p of patterns) {
        const m = text.match(p);
        if (m) {
            const raw = m[1].trim().toLowerCase();
            const resolved = KNOWN_MODELS[raw];
            if (resolved) return { intent: 'set_model', model: resolved };
            // Allow direct model ids that look like vendor prefixes.
            if (/^(claude|gpt|gemini|grok|deepseek|llama|mistral|ollama)/.test(raw)) {
                return { intent: 'set_model', model: raw };
            }
        }
    }
    return null;
}

function tryEmailDraft(text: string): IntentResult | null {
    // Conservative match: requires an explicit recipient email address
    // AND an imperative verb (draft, email, send) AND a body separator
    // (saying / about / that / "). Doing param extraction without any of
    // these dimensions would be too noisy, so we just bail to chat and
    // let the LLM handle ambiguous cases.
    //
    // Examples that match:
    //   "draft an email to mom@example.com saying I'll be late"
    //   "email john@x.io saying lunch tomorrow at noon"
    //   "send an email to support@a.com about the broken link"
    //
    // Examples that do NOT match (fall through to chat):
    //   "email me when this is done" (no address)
    //   "draft an email" (no recipient or body)
    //   "send John an email" (named recipient, no address)
    if (!/\b(?:draft|email|send)\b/i.test(text)) return null;

    // Email shape: very loose, matches anything with @ and a TLD.
    // We just stage the draft for confirmation, the connector layer
    // does the real validation before sending.
    const addrMatch = text.match(/\b([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})\b/i);
    if (!addrMatch) return null;
    const to = addrMatch[1];

    // Body separator: " saying X", " about X", " that says X", or
    // a quoted string. Anchor on the address position so we don't
    // pick up text that appears BEFORE the address.
    const afterAddr = text.slice(text.indexOf(to) + to.length);
    const sayingMatch = afterAddr.match(/(?:\s+(?:saying|that\s+says?|about|re:|regarding))\s+(.+?)(?=$|[.!?])/i);
    const quotedMatch = afterAddr.match(/[\"']([^\"']{1,500})[\"']/);
    const body = (sayingMatch?.[1] ?? quotedMatch?.[1] ?? '').trim();
    if (!body || body.length > 500) return null;

    return { intent: 'email_draft', to, body };
}

function tryWeather(text: string): IntentResult | null {
    // Trigger words must be present as standalone words. "weather" /
    // "forecast" / "temperature" / "temp" / "raining" / "snowing" /
    // "how hot is it" / "how cold is it"
    if (!/\b(?:weather|forecast|temperature|temp|raining|snowing|hot is it|cold is it|sunny|cloudy)\b/i.test(text)) {
        return null;
    }
    // Reject "weather permitting" style figurative usages.
    if (/\bweather\s+permitting\b/i.test(text)) return null;

    // Try to extract "in <location>" / "for <location>"
    const locMatch = text.match(/\b(?:in|for|at)\s+([A-Z][^.!?,]*?)(?=[.!?,]|$|\s+(?:today|tomorrow|now|right\s+now))/);
    const trimmed = locMatch?.[1]?.trim() ?? null;
    return { intent: 'weather', location: trimmed && trimmed.length <= 80 ? trimmed : null };
}

export function classifyIntent(text: string | null | undefined): IntentResult {
    if (!text) return { intent: 'chat' };
    const trimmed = text.trim();
    if (!trimmed) return { intent: 'chat' };

    // Order matters: more specific patterns win. set_* commands
    // before weather so "switch to my Tokyo location" doesn't
    // misfire as weather.
    const zodiac = tryZodiac(trimmed);
    if (zodiac) return zodiac;

    const location = tryLocation(trimmed);
    if (location) return location;

    const model = tryModel(trimmed);
    if (model) return model;

    const weather = tryWeather(trimmed);
    if (weather) return weather;

    // email_draft is intentionally LAST in the priority chain because
    // its trigger words ("send", "email") overlap with normal chat
    // and the recipient + body match is the strict gate that keeps
    // false positives down.
    const emailDraft = tryEmailDraft(trimmed);
    if (emailDraft) return emailDraft;

    return { intent: 'chat' };
}
