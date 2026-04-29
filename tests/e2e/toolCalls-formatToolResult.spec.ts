import { test, expect } from '@playwright/test';
import { formatToolResult, type ToolResult } from '@/lib/toolCalls';

/**
 * Unit tests for formatToolResult — the chat-rendering pipeline that
 * turns a ToolResult into the markdown the user sees inline.
 *
 * Per-tool-action branches it formats:
 *   calendar.free_slots / .create / .list
 *   gmail.draft / .send / .send_draft / .list
 *   reminders.schedule
 *   tokens.search / .price / .risk / .markets
 *   imessage.send
 *   error path with nextAction + Ref
 *   simulated tag prefix
 *
 * A regression here means the chat shows "[object Object]" or a
 * blank result card after a tool call completes — which makes it
 * look like the action failed even when it didn't.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/toolCalls-formatToolResult.spec.ts --reporter=list
 */

function ok(tool: string, action: string, data: unknown, extra: Partial<ToolResult> = {}): ToolResult {
    return { toolCallId: 'tc-1', tool, action, success: true, data, ...extra };
}

test.describe('error path', () => {
    test('renders error with bold tool.action header and right-single-quote in "didn\'t"', () => {
        const result: ToolResult = {
            toolCallId: 'tc-1',
            tool: 'calendar',
            action: 'create',
            success: false,
            error: 'Something broke',
        };
        const out = formatToolResult(result);
        expect(out).toContain('**calendar.create didn\u2019t complete.**');
        expect(out).toContain('Something broke');
    });

    test('renders error with nextAction + Ref when both present', () => {
        const result: ToolResult = {
            toolCallId: 'tc-1',
            tool: 'gmail',
            action: 'send',
            success: false,
            error: 'Recipient bounced',
            nextAction: 'Try again with a verified address.',
            requestId: 'req-abc-123',
        };
        const out = formatToolResult(result);
        expect(out).toContain('Try again with a verified address.');
        expect(out).toContain('*Ref:* `req-abc-123`');
    });

    test('renders error without nextAction/Ref when omitted', () => {
        const result: ToolResult = {
            toolCallId: 'tc-1',
            tool: 'gmail',
            action: 'list',
            success: false,
            error: 'no creds',
        };
        const out = formatToolResult(result);
        expect(out).not.toContain('*Ref:*');
        expect(out).toContain('no creds');
    });
});

test.describe('simulated tag', () => {
    test('prefixes a Simulated banner when result.simulated is true', () => {
        const result = ok('calendar', 'create', { event: { summary: 'X', start: '2026-04-29T10:00:00Z' } }, { simulated: true });
        const out = formatToolResult(result);
        expect(out).toContain('Simulated, sign in to make it real');
    });

    test('omits the Simulated banner when simulated is false/undefined', () => {
        const result = ok('calendar', 'create', { event: { summary: 'X', start: '2026-04-29T10:00:00Z' } });
        const out = formatToolResult(result);
        expect(out).not.toContain('Simulated');
    });
});

test.describe('calendar formatting', () => {
    test('free_slots renders a numbered list with bolded date', () => {
        const result = ok('calendar', 'free_slots', {
            slots: [
                { start: '2026-04-29T09:00:00Z', end: '2026-04-29T09:30:00Z', durationMinutes: 30 },
                { start: '2026-04-29T11:00:00Z', end: '2026-04-29T11:30:00Z', durationMinutes: 30 },
            ],
        });
        const out = formatToolResult(result);
        expect(out).toContain('**Calendar, Free Slots Found:**');
        expect(out).toMatch(/^1\.\s+\*\*/m);
        expect(out).toMatch(/^2\.\s+\*\*/m);
        expect(out).toContain('(30min)');
    });

    test('create renders summary + formatted start with optional View link', () => {
        const result = ok('calendar', 'create', {
            event: {
                summary: 'Team standup',
                start: '2026-04-29T09:00:00Z',
                htmlLink: 'https://cal.google.com/event/abc',
            },
        });
        const out = formatToolResult(result);
        expect(out).toContain('**Calendar Event Created:**');
        expect(out).toContain('"Team standup"');
        expect(out).toContain('[View](https://cal.google.com/event/abc)');
    });

    test('create without htmlLink omits the View link', () => {
        const result = ok('calendar', 'create', {
            event: { summary: 'Lunch', start: '2026-04-29T12:00:00Z' },
        });
        const out = formatToolResult(result);
        expect(out).not.toContain('[View]');
    });

    test('list renders up to 5 events with a bullet', () => {
        const events = Array.from({ length: 7 }, (_, i) => ({
            summary: `Event ${i + 1}`,
            start: `2026-04-${(i + 1).toString().padStart(2, '0')}T10:00:00Z`,
        }));
        const result = ok('calendar', 'list', { events });
        const out = formatToolResult(result);
        expect(out).toContain('**Upcoming Events (7):**');
        // Only 5 lines rendered out of 7 events
        const bulletLines = out.split('\n').filter(l => l.startsWith('- '));
        expect(bulletLines).toHaveLength(5);
    });

    test('list with empty events renders the "no events" copy', () => {
        const result = ok('calendar', 'list', { events: [] });
        const out = formatToolResult(result);
        expect(out).toContain('No upcoming events found.');
    });
});

test.describe('gmail formatting', () => {
    test('draft renders the truncated draft id', () => {
        const result = ok('gmail', 'draft', {
            draft: { draftId: 'r-1234567890abcdef' },
        });
        const out = formatToolResult(result);
        expect(out).toContain('**Gmail Draft Created**');
        expect(out).toContain('r-123456'); // first 8 chars
        expect(out).toContain('Ready to send on approval.');
    });

    test('send renders the truncated message id', () => {
        const result = ok('gmail', 'send', {
            result: { messageId: 'msg-9876543210abcdef' },
        });
        const out = formatToolResult(result);
        expect(out).toContain('**Email Sent**');
        expect(out).toContain('msg-9876');
    });

    test('send_draft uses the same template as send', () => {
        const result = ok('gmail', 'send_draft', {
            result: { messageId: 'msg-ABCDEFGHIJK' },
        });
        const out = formatToolResult(result);
        expect(out).toContain('**Email Sent**');
        expect(out).toContain('msg-ABCD');
    });

    test('list renders subject + sender (strips email after <)', () => {
        const result = ok('gmail', 'list', {
            messages: [
                { from: 'Alice <alice@example.com>', subject: 'Hi', date: 'today' },
                { from: 'no-name@example.com', subject: 'Note', date: 'today' },
            ],
        });
        const out = formatToolResult(result);
        expect(out).toContain('**Recent Emails (2):**');
        expect(out).toContain('**Hi** from Alice');
        expect(out).toContain('**Note** from no-name@example.com');
    });

    test('list with empty messages renders "no messages"', () => {
        const result = ok('gmail', 'list', { messages: [] });
        const out = formatToolResult(result);
        expect(out).toContain('No messages found.');
    });
});

test.describe('reminders + tokens + imessage', () => {
    test('reminders.schedule uses the data.message when present', () => {
        const result = ok('reminders', 'schedule', { message: 'Reminder set for tomorrow.' });
        const out = formatToolResult(result);
        expect(out).toContain('**Reminder scheduled**');
        expect(out).toContain('Reminder set for tomorrow.');
    });

    test('reminders.schedule falls back to the default copy when message is missing', () => {
        const result = ok('reminders', 'schedule', {});
        const out = formatToolResult(result);
        expect(out).toContain('Nudge queued for tomorrow.');
    });

    test('tokens.search renders bullets from results', () => {
        const result = ok('tokens', 'search', {
            results: [
                { assetId: 'sol-1', symbol: 'SOL', name: 'Solana' },
                { assetId: 'usdc-1', symbol: 'USDC', name: 'USD Coin' },
            ],
        });
        const out = formatToolResult(result);
        expect(out).toContain('**Token search (2):**');
        expect(out).toContain('**SOL**, Solana');
        expect(out).toContain('**USDC**, USD Coin');
    });

    test('tokens.search with empty results renders "no matches"', () => {
        const result = ok('tokens', 'search', { results: [] });
        const out = formatToolResult(result);
        expect(out).toContain('no matches');
    });

    test('tokens.markets with empty markets renders "none found"', () => {
        const result = ok('tokens', 'markets', { markets: [] });
        const out = formatToolResult(result);
        expect(out).toContain('none found');
    });

    test('imessage.send renders the truncated provider message id', () => {
        const result = ok('imessage', 'send', {
            sent: { messageId: 'photon-abc123def456', provider: 'photon' },
        });
        const out = formatToolResult(result);
        expect(out).toContain('**iMessage sent**');
        expect(out).toContain('photon-abc');
    });
});

test.describe('generic fallback', () => {
    test('unknown tool.action renders a JSON-block fallback', () => {
        const result = ok('unknown', 'noop', { foo: 'bar', baz: 42 });
        const out = formatToolResult(result);
        expect(out).toContain('**unknown.noop** completed:');
        expect(out).toContain('"foo": "bar"');
        expect(out).toContain('"baz": 42');
        expect(out).toContain('```json');
    });

    test('completed tool with no data renders a one-line success', () => {
        const result: ToolResult = {
            toolCallId: 'tc-1',
            tool: 'tasks',
            action: 'create',
            success: true,
            // data omitted
        };
        const out = formatToolResult(result);
        expect(out).toContain('**tasks.create**, completed.');
    });
});
