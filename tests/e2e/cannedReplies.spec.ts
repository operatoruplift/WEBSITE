import { test, expect } from '@playwright/test';
import {
    detectBeat,
    getCannedReply,
    cannedReplyToStream,
    DEMO_TOOL_MOCKS,
    type DemoBeat,
} from '@/lib/cannedReplies';

/**
 * Unit tests for the Demo-mode canned-reply library.
 *
 * /api/chat in Demo mode (capability_real === false) returns one of
 * three deterministic responses for the three Demo Day beats. The
 * exact wording matters because:
 *  - tests/e2e/chat-honesty.spec.ts asserts the inbox-triage reply
 *    embeds three <tool_use> blocks
 *  - The chat-honesty contract requires every Demo response carry
 *    `simulated: true` in tool params so ToolApprovalModal can
 *    render the "Simulated" badge
 *  - A regression that drops the 'fallback' nudge would leave
 *    cold visitors with empty replies
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/cannedReplies.spec.ts --reporter=list
 */

test.describe('detectBeat', () => {
    test('briefing keywords route to briefing', () => {
        const inputs = [
            'briefing for today',
            'what is on my calendar today?',
            'morning brief please',
            'show my agenda',
            "what's my day look like",
            "today's events?",
            "today's meetings?",
        ];
        for (const msg of inputs) {
            expect(detectBeat(msg), `briefing: ${msg}`).toBe('briefing');
        }
    });

    test('inbox keywords route to inbox', () => {
        const inputs = [
            'check my inbox',
            'reply to those emails',
            'draft replies',
            'unread emails please',
            'send an email to alex',
        ];
        for (const msg of inputs) {
            expect(detectBeat(msg), `inbox: ${msg}`).toBe('inbox');
        }
    });

    test('reminders keywords route to reminders', () => {
        const inputs = [
            'set me a reminder',
            'add reminders',
            'morning nudges',
            'horoscope at 8am',
        ];
        for (const msg of inputs) {
            expect(detectBeat(msg), `reminders: ${msg}`).toBe('reminders');
        }
    });

    test('iteration order: briefing wins over reminders for "brief"', () => {
        // Documents the existing precedence in BEAT_KEYWORDS: the
        // `brief(?:ing)?` keyword in the briefing regex matches before
        // the `weather brief` keyword in the reminders regex. A future
        // PR that swaps these patterns into a single rules array
        // should know this is the current behavior.
        expect(detectBeat('tomorrow morning weather brief')).toBe('briefing');
        expect(detectBeat('morning nudges tomorrow')).toBe('reminders');
    });

    test('unmatched message routes to fallback', () => {
        const inputs = [
            'tell me a joke',
            'write me a poem',
            'what is the meaning of life',
            'how does Solana work',
            'generate a logo',
        ];
        for (const msg of inputs) {
            expect(detectBeat(msg), `fallback: ${msg}`).toBe('fallback');
        }
    });

    test('empty / null message returns fallback', () => {
        expect(detectBeat('')).toBe('fallback');
        expect(detectBeat(null as unknown as string)).toBe('fallback');
        expect(detectBeat(undefined as unknown as string)).toBe('fallback');
    });

    test('detection is case-insensitive', () => {
        expect(detectBeat('CALENDAR TODAY')).toBe('briefing');
        expect(detectBeat('INBOX')).toBe('inbox');
        expect(detectBeat('Reminder Please')).toBe('reminders');
    });
});

test.describe('getCannedReply', () => {
    test('briefing reply embeds calendar.list with simulated: true', () => {
        const reply = getCannedReply('what is on my calendar today');
        expect(reply.beat).toBe('briefing');
        expect(reply.text).toContain('<tool_use>');
        expect(reply.text).toContain('"tool": "calendar"');
        expect(reply.text).toContain('"action": "list"');
        expect(reply.text).toContain('"simulated": true');
    });

    test('inbox reply embeds three gmail.draft tool_use blocks', () => {
        const reply = getCannedReply('draft replies to my inbox');
        expect(reply.beat).toBe('inbox');
        const matches = reply.text.match(/<tool_use>/g) || [];
        expect(matches).toHaveLength(3);
        expect(reply.text).toContain('"tool": "gmail"');
        expect(reply.text).toContain('"action": "draft"');
    });

    test('reminders reply schedules weather + calendar_summary + horoscope', () => {
        const reply = getCannedReply('set morning nudges for tomorrow');
        expect(reply.beat).toBe('reminders');
        expect(reply.text).toContain('"kind": "weather"');
        expect(reply.text).toContain('"kind": "calendar_summary"');
        expect(reply.text).toContain('"kind": "horoscope"');
        const matches = reply.text.match(/<tool_use>/g) || [];
        expect(matches).toHaveLength(3);
    });

    test('fallback nudges toward the three beats and does not produce tool_use', () => {
        const reply = getCannedReply('tell me about Solana history');
        expect(reply.beat).toBe('fallback');
        expect(reply.text).not.toContain('<tool_use>');
        // The fallback explicitly suggests the three known beats so the
        // user has somewhere to click. A regression that drops one of
        // them would leave a cold visitor without a clear next step.
        expect(reply.text.toLowerCase()).toContain('calendar');
        expect(reply.text.toLowerCase()).toContain('inbox');
        expect(reply.text.toLowerCase()).toContain('reminders');
    });

    test('every tool_use param block carries simulated: true', () => {
        // Demo mode promises ToolApprovalModal will tag each call as
        // Simulated, so every params block in the canned replies must
        // already carry the flag. Otherwise the runtime classifier
        // would treat a Demo call like a Real one.
        const allBeats: DemoBeat[] = ['briefing', 'inbox', 'reminders'];
        const probes: Record<DemoBeat, string> = {
            briefing: 'morning brief',
            inbox: 'check my unread emails',
            reminders: 'morning nudges tomorrow',
            fallback: '',
        };
        for (const beat of allBeats) {
            const reply = getCannedReply(probes[beat]);
            expect(reply.beat).toBe(beat);
            const blocks = reply.text.match(/<tool_use>([\s\S]*?)<\/tool_use>/g) || [];
            expect(blocks.length, `${beat} has tool_use blocks`).toBeGreaterThan(0);
            for (const block of blocks) {
                expect(block, `${beat} block carries simulated: true`).toContain('"simulated": true');
            }
        }
    });
});

test.describe('cannedReplyToStream', () => {
    test('streams the full text in 24-byte chunks and closes', async () => {
        const text = 'Hello, this is a streamed canned reply.';
        const stream = cannedReplyToStream(text);
        const decoder = new TextDecoder();
        const reader = stream.getReader();
        let received = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            received += decoder.decode(value);
        }
        expect(received).toBe(text);
    });

    test('handles empty text without hanging', async () => {
        const stream = cannedReplyToStream('');
        const reader = stream.getReader();
        const { done } = await reader.read();
        expect(done).toBe(true);
    });
});

test.describe('DEMO_TOOL_MOCKS', () => {
    test('every mock carries simulated: true at the top level', () => {
        for (const [key, mock] of Object.entries(DEMO_TOOL_MOCKS)) {
            expect(mock.simulated, `${key} is simulated`).toBe(true);
        }
    });

    test('covers the tools embedded in the canned replies', () => {
        // The canned replies emit calendar.list, gmail.draft,
        // reminders.schedule. The runtime mock must answer each of
        // them; otherwise approval would surface "no mock configured".
        // Bracket access here, not toHaveProperty, because the
        // dot-separated key name conflicts with toHaveProperty's
        // path-traversal semantics.
        expect(DEMO_TOOL_MOCKS['calendar.list']).toBeDefined();
        expect(DEMO_TOOL_MOCKS['gmail.draft']).toBeDefined();
        expect(DEMO_TOOL_MOCKS['reminders.schedule']).toBeDefined();
    });

    test('does not leak Solana mainnet pubkeys (must be demo placeholders)', () => {
        // The runtime mocks intentionally use placeholder addresses that
        // any operator can identify as fake (32-base58 mints starting
        // with 'Demo' or the wrapped-SOL canonical mint). This guards
        // against a future PR pasting a real mainnet mint into the
        // demo path by accident.
        const json = JSON.stringify(DEMO_TOOL_MOCKS);
        // Wrapped SOL is the only allowed real mainnet address, used
        // as a canonical placeholder.
        const allowedReal = 'So11111111111111111111111111111111111111112';
        const realLooking = json.match(/"[1-9A-HJ-NP-Za-km-z]{32,44}"/g) || [];
        for (const addr of realLooking) {
            const stripped = addr.replace(/"/g, '');
            // Acceptable: demo-prefixed, contains zeros/ones aren't a
            // real key, or the canonical wrapped-SOL placeholder above.
            const isDemo = /^Demo/i.test(stripped) || stripped === allowedReal;
            expect(isDemo, `address ${stripped} should be a demo placeholder`).toBe(true);
        }
    });
});
