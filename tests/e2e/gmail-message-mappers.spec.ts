import { test, expect } from '@playwright/test';
import type { gmail_v1 } from 'googleapis';
import { getHeader, toGmailMessage } from '@/lib/google/gmail';

/**
 * Unit tests for the Gmail API → GmailMessage mapper.
 *
 * Every Gmail list/read response item flows through toGmailMessage()
 * before the inbox triage UI renders it. getHeader is the helper
 * that extracts case-insensitive header values from the Gmail
 * payload.headers array.
 *
 * A regression here means inbox cards show blank From/Subject
 * fields, or the Subject header lookup fails on case variations
 * (Gmail returns "Subject" but some MTAs send "subject").
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/gmail-message-mappers.spec.ts --reporter=list
 */

test.describe('getHeader', () => {
    const headers = [
        { name: 'From', value: 'alice@example.com' },
        { name: 'To', value: 'bob@example.com' },
        { name: 'Subject', value: 'Hello' },
        { name: 'Date', value: 'Mon, 29 Apr 2026 09:00:00 +0000' },
    ];

    test('returns the value for an exact-case match', () => {
        expect(getHeader(headers, 'From')).toBe('alice@example.com');
        expect(getHeader(headers, 'To')).toBe('bob@example.com');
        expect(getHeader(headers, 'Subject')).toBe('Hello');
    });

    test('match is case-insensitive (defends against MTA case-mangling)', () => {
        expect(getHeader(headers, 'from')).toBe('alice@example.com');
        expect(getHeader(headers, 'FROM')).toBe('alice@example.com');
        expect(getHeader(headers, 'sUbJeCt')).toBe('Hello');
    });

    test('returns empty string for missing header', () => {
        expect(getHeader(headers, 'Reply-To')).toBe('');
        expect(getHeader(headers, 'X-Custom')).toBe('');
    });

    test('returns empty string when headers is undefined', () => {
        expect(getHeader(undefined, 'From')).toBe('');
    });

    test('returns empty string when headers is empty array', () => {
        expect(getHeader([], 'From')).toBe('');
    });

    test('skips entries with null name', () => {
        const messy = [
            { name: null, value: 'should not match' },
            { name: 'From', value: 'real@example.com' },
        ];
        expect(getHeader(messy, 'From')).toBe('real@example.com');
    });

    test('returns empty string when header has null value', () => {
        const withNull = [{ name: 'X-Empty', value: null }];
        expect(getHeader(withNull, 'X-Empty')).toBe('');
    });

    test('returns first match when duplicate names exist (Gmail can have multiples for Received:)', () => {
        const dups = [
            { name: 'Received', value: 'first hop' },
            { name: 'Received', value: 'second hop' },
        ];
        expect(getHeader(dups, 'Received')).toBe('first hop');
    });
});

test.describe('toGmailMessage', () => {
    test('maps a fully-populated message correctly', () => {
        const msg: gmail_v1.Schema$Message = {
            id: 'msg-123',
            threadId: 'thread-456',
            snippet: 'Hi there...',
            payload: {
                headers: [
                    { name: 'From', value: 'sender@example.com' },
                    { name: 'To', value: 'recipient@example.com' },
                    { name: 'Subject', value: 'Test subject' },
                    { name: 'Date', value: 'Mon, 29 Apr 2026 09:00:00 +0000' },
                ],
            },
        };
        const result = toGmailMessage(msg);
        expect(result.id).toBe('msg-123');
        expect(result.threadId).toBe('thread-456');
        expect(result.from).toBe('sender@example.com');
        expect(result.to).toBe('recipient@example.com');
        expect(result.subject).toBe('Test subject');
        expect(result.snippet).toBe('Hi there...');
        expect(result.date).toBe('Mon, 29 Apr 2026 09:00:00 +0000');
    });

    test('returns empty strings for missing top-level fields', () => {
        const empty: gmail_v1.Schema$Message = {};
        const result = toGmailMessage(empty);
        expect(result.id).toBe('');
        expect(result.threadId).toBe('');
        expect(result.snippet).toBe('');
        expect(result.from).toBe('');
        expect(result.to).toBe('');
        expect(result.subject).toBe('');
        expect(result.date).toBe('');
    });

    test('returns empty strings when payload.headers is missing', () => {
        const noHeaders: gmail_v1.Schema$Message = {
            id: 'm1',
            threadId: 't1',
            snippet: 'preview',
            // payload absent entirely
        };
        const result = toGmailMessage(noHeaders);
        expect(result.id).toBe('m1');
        expect(result.from).toBe('');
        expect(result.subject).toBe('');
    });

    test('handles partial headers array (subject present, From missing)', () => {
        const msg: gmail_v1.Schema$Message = {
            id: 'm1',
            threadId: 't1',
            payload: {
                headers: [{ name: 'Subject', value: 'Just a subject' }],
            },
        };
        const result = toGmailMessage(msg);
        expect(result.subject).toBe('Just a subject');
        expect(result.from).toBe('');
        expect(result.to).toBe('');
        expect(result.date).toBe('');
    });

    test('case-insensitive lookup catches lowercased headers from non-standard MTAs', () => {
        const lowered: gmail_v1.Schema$Message = {
            id: 'm1',
            threadId: 't1',
            payload: {
                headers: [
                    { name: 'from', value: 'lower@example.com' },
                    { name: 'subject', value: 'lower-cased subject' },
                ],
            },
        };
        const result = toGmailMessage(lowered);
        expect(result.from).toBe('lower@example.com');
        expect(result.subject).toBe('lower-cased subject');
    });

    test('handles null id / threadId / snippet (SDK types are string | null)', () => {
        const nullish: gmail_v1.Schema$Message = {
            id: null,
            threadId: null,
            snippet: null,
        };
        const result = toGmailMessage(nullish);
        // Mapper coerces null -> empty string for all top-level fields
        expect(result.id).toBe('');
        expect(result.threadId).toBe('');
        expect(result.snippet).toBe('');
    });
});
