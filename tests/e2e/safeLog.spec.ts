import { test, expect } from '@playwright/test';
import { redact, SENSITIVE_KEY_RE, safeLog, safeWarn, safeError } from '@/lib/safeLog';

/**
 * Unit tests for the safeLog observability contract used across lib/ and
 * app/api/. The redact() helper does the heavy lifting, so most asserts
 * are about what it scrubs vs. what it lets through. The safeLog/safeWarn/
 * safeError wrappers each shell out to console.log/warn/error after
 * redacting; they're tested via console-spy.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/safeLog.spec.ts --reporter=list
 */

test.describe('SENSITIVE_KEY_RE', () => {
    test('matches every documented sensitive key', () => {
        const sensitive = [
            'authorization', 'Authorization', 'AUTHORIZATION',
            'cookie', 'Cookie', 'set-cookie', 'Set-Cookie',
            'token', 'Token', 'apiKey', 'api_key', 'api-key', 'API_KEY',
            'privy-token', 'privy_token', 'privyToken',
            'jwt', 'JWT', 'bearer', 'Bearer',
            'secret', 'password', 'private-key', 'private_key',
            'access-token', 'access_token', 'accessToken',
            'refresh-token', 'refresh_token', 'refreshToken',
            'session-token', 'session_token', 'sessionToken',
            'x-api-key', 'X-API-Key', 'x-auth-token',
        ];
        for (const key of sensitive) {
            expect(SENSITIVE_KEY_RE.test(key), `should match: ${key}`).toBe(true);
        }
    });

    test('does not match non-sensitive keys', () => {
        const safe = [
            'requestId', 'event', 'at', 'ts',
            'route', 'status', 'error', 'message',
            'userId', 'user_id', 'agentId',
            'amount', 'count', 'duration',
        ];
        for (const key of safe) {
            expect(SENSITIVE_KEY_RE.test(key), `should NOT match: ${key}`).toBe(false);
        }
    });
});

test.describe('redact() on objects', () => {
    test('replaces values for sensitive keys with [REDACTED]', () => {
        const input = {
            authorization: 'Bearer secret-jwt-here',
            cookie: 'sid=abc; tracking=xyz',
            token: 'jwt.payload.sig',
            requestId: 'req_abc123',
            userId: 'did:privy:test',
            event: 'auth-failed',
        };
        const output = redact(input) as Record<string, unknown>;
        expect(output.authorization).toBe('[REDACTED]');
        expect(output.cookie).toBe('[REDACTED]');
        expect(output.token).toBe('[REDACTED]');
        expect(output.requestId).toBe('req_abc123');
        expect(output.userId).toBe('did:privy:test');
        expect(output.event).toBe('auth-failed');
    });

    test('walks into nested objects', () => {
        const input = {
            user: {
                id: 'user-1',
                authorization: 'Bearer abc',
                profile: {
                    name: 'Alice',
                    apiKey: 'sk-secret',
                },
            },
        };
        const output = redact(input) as { user: { id: string; authorization: string; profile: { name: string; apiKey: string } } };
        expect(output.user.id).toBe('user-1');
        expect(output.user.authorization).toBe('[REDACTED]');
        expect(output.user.profile.name).toBe('Alice');
        expect(output.user.profile.apiKey).toBe('[REDACTED]');
    });

    test('walks into arrays', () => {
        const input = {
            tokens: [
                { name: 'one', token: 'jwt-1' },
                { name: 'two', token: 'jwt-2' },
            ],
        };
        const output = redact(input) as { tokens: Array<{ name: string; token: string }> };
        expect(output.tokens[0].name).toBe('one');
        expect(output.tokens[0].token).toBe('[REDACTED]');
        expect(output.tokens[1].name).toBe('two');
        expect(output.tokens[1].token).toBe('[REDACTED]');
    });

    test('caps recursion depth at 8 levels', () => {
        type Nested = { v: number; child?: Nested };
        const deep: Nested = { v: 0 };
        let cur: Nested = deep;
        for (let i = 1; i < 12; i++) {
            cur.child = { v: i };
            cur = cur.child;
        }
        const output = redact(deep);
        expect(JSON.stringify(output)).toContain('[DEPTH_EXCEEDED]');
    });
});

test.describe('redact() on strings', () => {
    test('replaces bearer tokens inline', () => {
        const input = 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig';
        const output = redact(input);
        expect(output).toContain('Bearer [REDACTED]');
        expect(output).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    });

    test('redacts JWS-shaped substrings', () => {
        const input = 'token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.signature-here-with-stuff failed';
        const output = redact(input) as string;
        expect(output).toContain('[JWS_REDACTED]');
    });

    test('truncates strings longer than 4000 chars', () => {
        const long = 'x'.repeat(5000);
        const output = redact(long) as string;
        expect(output.length).toBeLessThan(4000);
        expect(output).toContain('[TRUNCATED]');
    });

    test('passes through ordinary short strings unchanged', () => {
        expect(redact('hello world')).toBe('hello world');
        expect(redact('error: connection refused')).toBe('error: connection refused');
    });
});

test.describe('redact() on primitives', () => {
    test('passes through numbers / booleans / null / undefined unchanged', () => {
        expect(redact(42)).toBe(42);
        expect(redact(true)).toBe(true);
        expect(redact(false)).toBe(false);
        expect(redact(null)).toBe(null);
        expect(redact(undefined)).toBe(undefined);
        expect(redact(0)).toBe(0);
    });
});

test.describe('safeLog/safeWarn/safeError emit structured JSON', () => {
    test('safeLog writes JSON via console.log with at/event/ts fields', () => {
        const orig = console.log;
        const captured: string[] = [];
        console.log = (msg: unknown) => { captured.push(String(msg)); };
        try {
            safeLog({ at: 'test', event: 'hello', extra: 1 });
        } finally {
            console.log = orig;
        }
        expect(captured).toHaveLength(1);
        const parsed = JSON.parse(captured[0]);
        expect(parsed.at).toBe('test');
        expect(parsed.event).toBe('hello');
        expect(parsed.extra).toBe(1);
        expect(parsed.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('safeWarn writes JSON via console.warn with level: warn', () => {
        const orig = console.warn;
        const captured: string[] = [];
        console.warn = (msg: unknown) => { captured.push(String(msg)); };
        try {
            safeWarn({ at: 'test', event: 'careful' });
        } finally {
            console.warn = orig;
        }
        expect(captured).toHaveLength(1);
        const parsed = JSON.parse(captured[0]);
        expect(parsed.level).toBe('warn');
        expect(parsed.at).toBe('test');
        expect(parsed.event).toBe('careful');
    });

    test('safeError writes JSON via console.error with level: error', () => {
        const orig = console.error;
        const captured: string[] = [];
        console.error = (msg: unknown) => { captured.push(String(msg)); };
        try {
            safeError({ at: 'test', event: 'bad', error: new Error('boom') });
        } finally {
            console.error = orig;
        }
        expect(captured).toHaveLength(1);
        const parsed = JSON.parse(captured[0]);
        expect(parsed.level).toBe('error');
        expect(parsed.at).toBe('test');
        expect(parsed.event).toBe('bad');
    });

    test('requestId passes through unredacted (operators need to grep it)', () => {
        const orig = console.log;
        const captured: string[] = [];
        console.log = (msg: unknown) => { captured.push(String(msg)); };
        try {
            safeLog({ at: 'test', event: 'with-request', requestId: 'req_abc-123' });
        } finally {
            console.log = orig;
        }
        const parsed = JSON.parse(captured[0]);
        expect(parsed.requestId).toBe('req_abc-123');
    });

    test('safeLog redacts a sensitive value embedded in the payload', () => {
        const orig = console.log;
        const captured: string[] = [];
        console.log = (msg: unknown) => { captured.push(String(msg)); };
        try {
            safeLog({
                at: 'test',
                event: 'with-secret',
                authorization: 'Bearer leaked-jwt',
                userId: 'user-1',
            });
        } finally {
            console.log = orig;
        }
        const parsed = JSON.parse(captured[0]);
        expect(parsed.authorization).toBe('[REDACTED]');
        expect(parsed.userId).toBe('user-1');
        expect(captured[0]).not.toContain('leaked-jwt');
    });
});
