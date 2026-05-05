/**
 * Keyword-triggered canned replies for the iMessage agent.
 *
 * Why bother:
 *   - SMS / iMessage convention is "STOP" to opt out. We honor it.
 *   - "HELP" is the standard "what is this thing?" trigger.
 *   - Common one-word pings ("ping", "status", "test") don't need
 *     a Claude Haiku round trip; canned replies save spend and
 *     respond instantly (~50ms vs ~3s).
 *
 * Match is case-insensitive, whitespace-tolerant, and only fires
 * when the message is essentially the keyword (no other content).
 * "stop please" matches stop; "stop the timer" does NOT (the agent
 * should LLM-route that one because it's a real request).
 *
 * Each entry returns a short, plain-text reply suitable for
 * iMessage. Stop/unsubscribe carry the same opt-out semantics for
 * the future opt-out table; today they just send the canned reply.
 */

export interface KeywordMatch {
    /** Stable identifier for telemetry (e.g. 'stop', 'help'). */
    keyword: string;
    /** The reply text to send back via the Photon adapter. */
    reply: string;
    /** True if this match should also flag the sender as opted out
     *  for any future opt-out table. Caller decides what to do
     *  with the flag. */
    optOut: boolean;
}

const TABLE: Array<{
    keyword: string;
    /** Lowercase strings that count as a full match. */
    triggers: string[];
    reply: string;
    optOut: boolean;
}> = [
    {
        keyword: 'stop',
        triggers: ['stop', 'stop please', 'stop now', 'unsubscribe', 'cancel', 'opt out', 'opt-out'],
        reply: 'Got it, no more replies from this number. Text START at any time to turn replies back on.',
        optOut: true,
    },
    {
        keyword: 'start',
        triggers: ['start', 'resume', 'unstop'],
        reply: 'Welcome back. Text me anything and I\'ll reply.',
        optOut: false,
    },
    {
        keyword: 'help',
        triggers: ['help', '?', 'what is this', 'who is this', 'who are you'],
        reply: 'I\'m Operator Uplift. Text me anything and I\'ll reply with a short answer. To unlock Gmail and Calendar actions, sign up at operatoruplift.com.',
        optOut: false,
    },
    {
        keyword: 'ping',
        triggers: ['ping', 'test', 'are you there', 'you there', 'hello', 'hi'],
        reply: 'Yes, I\'m here. What can I help you with?',
        optOut: false,
    },
    {
        keyword: 'status',
        triggers: ['status', 'health', 'health check'],
        reply: 'Up and running.',
        optOut: false,
    },
];

/**
 * Returns the canned reply if the message matches a known keyword
 * exactly (case-insensitive, whitespace-trimmed), otherwise null.
 */
export function matchKeyword(text: string | null | undefined): KeywordMatch | null {
    if (!text) return null;
    const trimmed = text.trim().toLowerCase();
    if (!trimmed) return null;
    if (trimmed.length > 32) return null; // Long messages are real requests.
    // Try the message as-is first so a bare '?' still matches the
    // help trigger; then try with trailing !/./? stripped so 'help!'
    // and 'STOP.' also map cleanly. Keep this path narrow so we
    // don't end up matching keywords inside multi-word requests.
    const candidates = [trimmed];
    const stripped = trimmed.replace(/[!.?]+$/, '');
    if (stripped && stripped !== trimmed) candidates.push(stripped);
    for (const candidate of candidates) {
        for (const entry of TABLE) {
            if (entry.triggers.includes(candidate)) {
                return {
                    keyword: entry.keyword,
                    reply: entry.reply,
                    optOut: entry.optOut,
                };
            }
        }
    }
    return null;
}
