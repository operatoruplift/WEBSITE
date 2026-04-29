import { test, expect } from '@playwright/test';
import crypto from 'crypto';
import {
    hmacHex,
    constantTimeEq,
    verifyWebhookSignature,
    computeProviderMessageId,
    normalizeWebhookPayload,
    makeFallbackAckGate,
    ACK_WINDOW_MS,
    FALLBACK_MS,
} from '@/lib/photon/webhook-helpers';

/**
 * Unit tests for the pure helpers backing the inbound Photon webhook
 * route at app/api/webhooks/photon/route.ts.
 *
 * A regression in:
 *   verifyWebhookSignature — Spectrum-signed deliveries get rejected
 *                            (legitimate inbound messages dropped) OR
 *                            unsigned bodies get accepted (spoofing)
 *   computeProviderMessageId — duplicate webhooks insert duplicate
 *                            inbound rows (idempotency broken)
 *   normalizeWebhookPayload — sender extracted as 'unknown' for valid
 *                            payloads, breaking the agent reply path
 *   makeFallbackAckGate    — every message in a burst gets its own
 *                            ack, spamming the user
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/photon-webhook-helpers.spec.ts --reporter=list
 */

test.describe('hmacHex', () => {
    test('produces stable HMAC-SHA256 hex for known input', () => {
        // Verify against an independent computation.
        const expected = crypto.createHmac('sha256', 'secret').update('body').digest('hex');
        expect(hmacHex('secret', 'body')).toBe(expected);
    });

    test('output is 64 hex chars (SHA-256)', () => {
        const out = hmacHex('any-secret', 'any-body');
        expect(out).toMatch(/^[0-9a-f]{64}$/);
    });

    test('different secrets produce different hashes', () => {
        expect(hmacHex('s1', 'body')).not.toBe(hmacHex('s2', 'body'));
    });

    test('different bodies produce different hashes', () => {
        expect(hmacHex('secret', 'a')).not.toBe(hmacHex('secret', 'b'));
    });
});

test.describe('constantTimeEq', () => {
    test('returns true for equal strings', () => {
        expect(constantTimeEq('hello', 'hello')).toBe(true);
    });

    test('returns false for different-length strings (no buffer comparison)', () => {
        expect(constantTimeEq('a', 'aa')).toBe(false);
    });

    test('returns false for same-length but different strings', () => {
        expect(constantTimeEq('abcd', 'efgh')).toBe(false);
    });

    test('returns false on Buffer construction failure (non-equal weird input)', () => {
        // Same length, different content. Should still go through
        // timingSafeEqual and return false.
        expect(constantTimeEq('hex0', 'hex1')).toBe(false);
    });

    test('returns true for empty strings', () => {
        expect(constantTimeEq('', '')).toBe(true);
    });
});

test.describe('verifyWebhookSignature', () => {
    test('returns ok:true when secret is undefined (demo mode)', () => {
        const result = verifyWebhookSignature({ secret: undefined, body: '{}', provided: null });
        expect(result.ok).toBe(true);
    });

    test('returns ok:false reason:missing_signature when secret set but no header', () => {
        const result = verifyWebhookSignature({ secret: 'sec', body: '{}', provided: null });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('missing_signature');
    });

    test('returns ok:false reason:missing_signature on empty header', () => {
        const result = verifyWebhookSignature({ secret: 'sec', body: '{}', provided: '' });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('missing_signature');
    });

    test('returns ok:true when provided signature matches', () => {
        const body = '{"a":1}';
        const sig = hmacHex('sec', body);
        const result = verifyWebhookSignature({ secret: 'sec', body, provided: sig });
        expect(result.ok).toBe(true);
    });

    test('strips "sha256=" prefix from provided header', () => {
        const body = '{"a":1}';
        const sig = hmacHex('sec', body);
        const result = verifyWebhookSignature({ secret: 'sec', body, provided: `sha256=${sig}` });
        expect(result.ok).toBe(true);
    });

    test('returns ok:false reason:mismatch on bad signature', () => {
        const result = verifyWebhookSignature({
            secret: 'sec',
            body: '{}',
            provided: 'a'.repeat(64),
        });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('mismatch');
    });

    test('rejects when body has been tampered after signing', () => {
        const body = '{"a":1}';
        const sig = hmacHex('sec', body);
        const result = verifyWebhookSignature({
            secret: 'sec',
            body: '{"a":2}', // tampered
            provided: sig,
        });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('mismatch');
    });
});

test.describe('computeProviderMessageId', () => {
    test('prefers body.message_id when present', () => {
        const id = computeProviderMessageId({ message_id: 'abc-123' }, 'sender', 'text');
        expect(id).toBe('abc-123');
    });

    test('falls back to body.id', () => {
        const id = computeProviderMessageId({ id: 'fallback-1' }, 's', 't');
        expect(id).toBe('fallback-1');
    });

    test('falls back to body.event_id', () => {
        const id = computeProviderMessageId({ event_id: 'evt-9' }, 's', 't');
        expect(id).toBe('evt-9');
    });

    test('falls back to body.data.message_id (nested)', () => {
        const id = computeProviderMessageId({ data: { message_id: 'nested-7' } }, 's', 't');
        expect(id).toBe('nested-7');
    });

    test('priority: message_id beats id beats event_id beats data.message_id', () => {
        const id = computeProviderMessageId(
            { message_id: 'top', id: 'middle', event_id: 'low', data: { message_id: 'nested' } },
            's',
            't',
        );
        expect(id).toBe('top');
    });

    test('falls back to hash:<digest> when no provider id present', () => {
        const id = computeProviderMessageId({}, 'sender', 'text');
        expect(id).toMatch(/^hash:[0-9a-f]{24}$/);
    });

    test('hash fallback is stable within the same 5s bucket', () => {
        const id1 = computeProviderMessageId({}, 'alice', 'hi');
        const id2 = computeProviderMessageId({}, 'alice', 'hi');
        expect(id1).toBe(id2);
    });

    test('hash fallback differs for different sender / text', () => {
        const idA = computeProviderMessageId({}, 'alice', 'hi');
        const idB = computeProviderMessageId({}, 'bob', 'hi');
        const idC = computeProviderMessageId({}, 'alice', 'bye');
        expect(idA).not.toBe(idB);
        expect(idA).not.toBe(idC);
    });
});

test.describe('normalizeWebhookPayload', () => {
    test('extracts platform / sender / text / eventType from canonical shape', () => {
        const out = normalizeWebhookPayload({
            platform: 'telegram',
            sender: '@alice',
            text: 'hi',
            event: 'message_received',
        });
        expect(out).toEqual({
            platform: 'telegram',
            sender: '@alice',
            text: 'hi',
            eventType: 'message_received',
        });
    });

    test('defaults platform to imessage when missing', () => {
        const out = normalizeWebhookPayload({ sender: 's', text: 't' });
        expect(out.platform).toBe('imessage');
    });

    test('falls back through sender alternatives: from / phone / user.phone', () => {
        expect(normalizeWebhookPayload({ from: '+1' }).sender).toBe('+1');
        expect(normalizeWebhookPayload({ phone: '+2' }).sender).toBe('+2');
        expect(normalizeWebhookPayload({ user: { phone: '+3' } }).sender).toBe('+3');
    });

    test('falls back through text alternatives: message / content.text', () => {
        expect(normalizeWebhookPayload({ message: 'hi' }).text).toBe('hi');
        expect(normalizeWebhookPayload({ content: { text: 'nested' } }).text).toBe('nested');
    });

    test('eventType falls back to body.type when event missing', () => {
        expect(normalizeWebhookPayload({ type: 'callback' }).eventType).toBe('callback');
    });

    test('eventType defaults to "message" when both event and type are missing', () => {
        expect(normalizeWebhookPayload({}).eventType).toBe('message');
    });

    test('sender defaults to "unknown" when no source matches', () => {
        expect(normalizeWebhookPayload({}).sender).toBe('unknown');
    });

    test('text defaults to empty string when no source matches', () => {
        expect(normalizeWebhookPayload({}).text).toBe('');
    });
});

test.describe('makeFallbackAckGate', () => {
    test('first call for a sender returns true', () => {
        const gate = makeFallbackAckGate();
        expect(gate.shouldSend('alice')).toBe(true);
    });

    test('second call for the same sender within window returns false', () => {
        const gate = makeFallbackAckGate();
        gate.shouldSend('alice');
        expect(gate.shouldSend('alice')).toBe(false);
    });

    test('different senders are independent', () => {
        const gate = makeFallbackAckGate();
        expect(gate.shouldSend('alice')).toBe(true);
        expect(gate.shouldSend('bob')).toBe(true);
        // Both still in window
        expect(gate.shouldSend('alice')).toBe(false);
        expect(gate.shouldSend('bob')).toBe(false);
    });

    test('returns true again after windowMs has elapsed (clock-injectable)', () => {
        let now = 1000;
        const gate = makeFallbackAckGate({ windowMs: 60_000, now: () => now });
        expect(gate.shouldSend('alice')).toBe(true);
        now += 30_000; // halfway
        expect(gate.shouldSend('alice')).toBe(false);
        now += 30_001; // past window
        expect(gate.shouldSend('alice')).toBe(true);
    });

    test('size cap triggers cleanup (gate prunes expired entries)', () => {
        let now = 1000;
        const gate = makeFallbackAckGate({ windowMs: 1000, maxEntries: 3, now: () => now });
        gate.shouldSend('a');
        gate.shouldSend('b');
        gate.shouldSend('c');
        expect(gate.size()).toBe(3);
        now += 5000; // expire all 3
        // Adding a 4th triggers cleanup of expired entries
        gate.shouldSend('d');
        expect(gate.size()).toBeLessThanOrEqual(1);
    });

    test('exposes ACK_WINDOW_MS = 60s and FALLBACK_MS = 5s as documented constants', () => {
        expect(ACK_WINDOW_MS).toBe(60_000);
        expect(FALLBACK_MS).toBe(5_000);
    });
});
