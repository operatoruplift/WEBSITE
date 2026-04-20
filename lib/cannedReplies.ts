/**
 * Canned-reply library for Demo mode (zero API spend).
 *
 * Demo mode is triggered when /api/chat receives a request with
 * capability_real === false (anonymous visitor or logged-in user with
 * neither Google connected nor a server LLM key configured).
 *
 * The responses are deliberately narrow: they only cover the three
 * Demo Day beats.
 *   1. Daily briefing ("what's on my calendar today")
 *   2. Inbox triage  ("draft replies to these emails")
 *   3. Reminders vibe ("iMessage-style nudges: weather, calendar, horoscope")
 *
 * Anything else returns a short nudge toward one of the beats. Do not
 * add canned replies for unrelated prompts, they leak surface area we
 * cannot deliver on in the real product.
 */

export type DemoBeat = 'briefing' | 'inbox' | 'reminders' | 'fallback';

export interface CannedReply {
    beat: DemoBeat;
    text: string;
}

const BEAT_KEYWORDS: Record<Exclude<DemoBeat, 'fallback'>, RegExp> = {
    briefing: /\b(brief(?:ing)?|calendar today|what'?s on|agenda|my day|today'?s (events|meetings))\b/i,
    inbox: /\b(inbox|email|emails|reply|replies|draft|unread)\b/i,
    reminders: /\b(reminder|reminders|nudge|nudges|tomorrow morning|horoscope|weather brief)\b/i,
};

export function detectBeat(userMessage: string): DemoBeat {
    if (!userMessage) return 'fallback';
    for (const [beat, rx] of Object.entries(BEAT_KEYWORDS) as [Exclude<DemoBeat, 'fallback'>, RegExp][]) {
        if (rx.test(userMessage)) return beat;
    }
    return 'fallback';
}

/**
 * Deterministic canned responses for each beat.
 *
 * Each response ends with one or more <tool_use> blocks the chat UI
 * will intercept and route through ToolApprovalModal. In Demo mode the
 * modal's Approve button runs `executeMock` (see lib/toolCalls.ts),
 * which returns a Simulated result with `simulated: true`.
 */
export function getCannedReply(userMessage: string): CannedReply {
    const beat = detectBeat(userMessage);

    if (beat === 'briefing') {
        return {
            beat,
            text: `Here's what's on your calendar today:

- **9:00 AM**, Standup with Engineering (30 min)
- **11:30 AM**, 1:1 with Sarah (45 min)
- **2:00 PM**, Product sync, *no agenda attached*

Your 2 PM product sync has no agenda. Want me to draft one and send it to the attendees?

<tool_use>
{"tool": "calendar", "action": "list", "params": {"days_ahead": 1, "max_results": 5, "simulated": true}}
</tool_use>`,
        };
    }

    if (beat === 'inbox') {
        return {
            beat,
            text: `Three emails need a reply. I've drafted each, approve to send, or deny to discard.

1. **Jane Chen**, "Re: design review Thursday"
2. **Ops team**, "Weekly expense report"
3. **Alex (recruiter)**, "Follow-up on intro call"

<tool_use>
{"tool": "gmail", "action": "draft", "params": {"to": "jane@example.com", "subject": "Re: Design review Thursday", "body": "Thursday at 2pm works, I'll bring the updated mocks., M", "simulated": true}}
</tool_use>

<tool_use>
{"tool": "gmail", "action": "draft", "params": {"to": "ops@example.com", "subject": "Re: Weekly expense report", "body": "Attached. Totals match the October reconciliation., M", "simulated": true}}
</tool_use>

<tool_use>
{"tool": "gmail", "action": "draft", "params": {"to": "alex@recruitfirm.example", "subject": "Re: Follow-up on intro call", "body": "Appreciate the note. Passing for now but let's stay in touch., M", "simulated": true}}
</tool_use>`,
        };
    }

    if (beat === 'reminders') {
        return {
            beat,
            text: `Ok, three iMessage-style nudges scheduled for tomorrow morning. Approve each one to set.

- **7:55 AM**, Weather for Kuala Lumpur
- **8:00 AM**, Today's calendar summary
- **8:05 AM**, One weird fun thing (horoscope)

<tool_use>
{"tool": "reminders", "action": "schedule", "params": {"kind": "weather", "time": "07:55", "location": "auto", "simulated": true}}
</tool_use>

<tool_use>
{"tool": "reminders", "action": "schedule", "params": {"kind": "calendar_summary", "time": "08:00", "simulated": true}}
</tool_use>

<tool_use>
{"tool": "reminders", "action": "schedule", "params": {"kind": "horoscope", "time": "08:05", "simulated": true}}
</tool_use>`,
        };
    }

    return {
        beat: 'fallback',
        text: `Every reply here is simulated. Try one of these:

- **"What's on my calendar today?"**, daily briefing
- **"Draft replies to my inbox"**, email triage
- **"Set iMessage-style reminders for tomorrow morning"**, daily nudges

Sign in with Google or add an API key to make it real.`,
    };
}

/**
 * Wrap a canned reply as a ReadableStream so /api/chat can return it
 * in the same shape as a live LLM stream. Chunks are emitted in small
 * pieces to mimic streaming latency, feels real without burning API
 * budget.
 */
export function cannedReplyToStream(text: string): ReadableStream {
    const encoder = new TextEncoder();
    const chunkSize = 24;
    let offset = 0;

    return new ReadableStream({
        async pull(controller) {
            if (offset >= text.length) {
                controller.close();
                return;
            }
            const chunk = text.slice(offset, offset + chunkSize);
            controller.enqueue(encoder.encode(chunk));
            offset += chunkSize;
            await new Promise(r => setTimeout(r, 18));
        },
    });
}

/**
 * Deterministic mocks for tool calls emitted by the canned replies.
 * Keyed by `${tool}.${action}`. Anything not in this map falls back
 * to a generic `{ simulated: true, message: "Done (simulated)" }` result.
 */
export const DEMO_TOOL_MOCKS: Record<string, Record<string, unknown>> = {
    'calendar.list': {
        simulated: true,
        events: [
            { summary: 'Standup with Engineering', start: isoTodayAt(9, 0) },
            { summary: '1:1 with Sarah', start: isoTodayAt(11, 30) },
            { summary: 'Product sync', start: isoTodayAt(14, 0) },
        ],
    },
    'calendar.create': {
        simulated: true,
        event: {
            summary: 'Simulated event',
            start: isoTodayAt(15, 0),
            htmlLink: 'https://calendar.google.com/#demo',
        },
    },
    'calendar.free_slots': {
        simulated: true,
        slots: [
            { start: isoTodayAt(10, 0), end: isoTodayAt(10, 30), durationMinutes: 30 },
            { start: isoTodayAt(13, 0), end: isoTodayAt(13, 30), durationMinutes: 30 },
            { start: isoTodayAt(16, 0), end: isoTodayAt(16, 30), durationMinutes: 30 },
        ],
    },
    'gmail.draft': {
        simulated: true,
        draft: { draftId: 'demo-draft-0000000000' },
    },
    'gmail.send': {
        simulated: true,
        result: { messageId: 'demo-msg-0000000000' },
    },
    'gmail.list': {
        simulated: true,
        messages: [
            { from: 'Jane Chen <jane@example.com>', subject: 'Re: design review Thursday', date: new Date().toISOString() },
            { from: 'Ops Team <ops@example.com>', subject: 'Weekly expense report', date: new Date().toISOString() },
            { from: 'Alex <alex@recruitfirm.example>', subject: 'Follow-up on intro call', date: new Date().toISOString() },
        ],
    },
    'reminders.schedule': {
        simulated: true,
        scheduled: true,
        message: 'Nudge scheduled (simulated). Sign in to make it real.',
    },
    'tokens.search': {
        simulated: true,
        query: 'demo',
        results: [
            { assetId: 'solana', symbol: 'SOL', name: 'Solana', category: 'crypto' },
            { assetId: 'usdc', symbol: 'USDC', name: 'USD Coin', category: 'stablecoin' },
        ],
    },
    'tokens.price': {
        simulated: true,
        assetId: 'solana',
        interval: '1h',
        candles: [
            { t: Date.now() - 3 * 3600_000, o: 148.2, h: 149.8, l: 147.5, c: 149.0, v: 1200000 },
            { t: Date.now() - 2 * 3600_000, o: 149.0, h: 150.5, l: 148.7, c: 150.1, v: 1400000 },
            { t: Date.now() - 1 * 3600_000, o: 150.1, h: 151.2, l: 149.9, c: 150.6, v: 1100000 },
        ],
    },
    'tokens.risk': {
        simulated: true,
        mint: 'Demo1111111111111111111111111111111111111111',
        score: 72,
        grade: 'B',
        label: 'Low risk (simulated)',
    },
    'tokens.markets': {
        simulated: true,
        assetId: 'solana',
        mint: 'So11111111111111111111111111111111111111112',
        markets: [
            { dex: 'Jupiter', pair: 'SOL/USDC', liquidity_usd: 45_200_000 },
            { dex: 'Orca', pair: 'SOL/USDC', liquidity_usd: 22_800_000 },
        ],
    },
    'imessage.send': {
        simulated: true,
        messageId: 'demo-imsg-0000000000',
        provider: 'simulated-photon',
        message: 'iMessage queued (simulated). Sign in + connect Photon to send for real.',
    },
};

function isoTodayAt(hour: number, minute: number): string {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
}
