import { test, expect } from '@playwright/test';
import { streamToString } from '@/lib/llm';

/**
 * Unit tests for streamToString — the helper that drains a
 * ReadableStream<Uint8Array> into a single utf-8 string.
 *
 * Used by the /api/chat handler (and tests) when a caller wants to
 * consume callLLM()'s streaming response synchronously instead of
 * piping it back to the client.
 *
 * A regression here would silently truncate or corrupt LLM responses
 * — the worst kind of bug because the chat UI would still render
 * something plausible.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/llm-streamToString.spec.ts --reporter=list
 */

function streamFromChunks(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
    return new ReadableStream<Uint8Array>({
        start(controller) {
            for (const chunk of chunks) controller.enqueue(chunk);
            controller.close();
        },
    });
}

function utf8(s: string): Uint8Array {
    return new TextEncoder().encode(s);
}

test.describe('streamToString', () => {
    test('drains a single-chunk stream', async () => {
        const stream = streamFromChunks([utf8('hello world')]);
        expect(await streamToString(stream)).toBe('hello world');
    });

    test('concatenates multiple chunks in order', async () => {
        const stream = streamFromChunks([utf8('hello '), utf8('streaming '), utf8('world')]);
        expect(await streamToString(stream)).toBe('hello streaming world');
    });

    test('returns empty string for an empty stream', async () => {
        const stream = streamFromChunks([]);
        expect(await streamToString(stream)).toBe('');
    });

    test('handles utf-8 multibyte characters split across chunks', async () => {
        // 'é' is 0xc3 0xa9 in utf-8. Split it across two chunks. A
        // naive implementation that decodes each chunk independently
        // would emit replacement characters; streamToString uses
        // TextDecoder with stream:true to keep state.
        const eAcute = utf8('é'); // [0xc3, 0xa9]
        const stream = streamFromChunks([
            new Uint8Array([eAcute[0]]),
            new Uint8Array([eAcute[1]]),
        ]);
        expect(await streamToString(stream)).toBe('é');
    });

    test('handles emoji split across chunks (4-byte utf-8)', async () => {
        const rocket = utf8('🚀'); // [0xf0, 0x9f, 0x9a, 0x80]
        const stream = streamFromChunks([
            new Uint8Array([rocket[0], rocket[1]]),
            new Uint8Array([rocket[2], rocket[3]]),
        ]);
        expect(await streamToString(stream)).toBe('🚀');
    });

    test('preserves a long mixed-language string', async () => {
        const text = 'Hello, world! こんにちは 世界 — Привет мир — 你好 — 🚀✨';
        const bytes = utf8(text);
        // Split into 16-byte chunks so multibyte characters land on
        // chunk boundaries. The TextDecoder stream contract is what
        // makes this work.
        const chunks: Uint8Array[] = [];
        for (let i = 0; i < bytes.length; i += 16) {
            chunks.push(bytes.slice(i, i + 16));
        }
        const stream = streamFromChunks(chunks);
        expect(await streamToString(stream)).toBe(text);
    });

    test('preserves empty chunks interleaved with content', async () => {
        const stream = streamFromChunks([
            utf8('A'),
            new Uint8Array(0),
            utf8('B'),
            new Uint8Array(0),
            utf8('C'),
        ]);
        expect(await streamToString(stream)).toBe('ABC');
    });

    test('handles streams with many small chunks', async () => {
        const text = 'the quick brown fox jumps over the lazy dog';
        const chunks = Array.from(text).map(c => utf8(c));
        const stream = streamFromChunks(chunks);
        expect(await streamToString(stream)).toBe(text);
    });

    test('preserves newlines and special characters', async () => {
        const text = 'line 1\nline 2\r\nline 3\ttabbed\\backslash"quote';
        const stream = streamFromChunks([utf8(text)]);
        expect(await streamToString(stream)).toBe(text);
    });

    test('reads to completion even when source closes immediately after enqueue', async () => {
        // The reader.read() loop should hit done:true after consuming
        // the last enqueue, not block waiting for more.
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(utf8('done'));
                controller.close();
            },
        });
        expect(await streamToString(stream)).toBe('done');
    });

    test('propagates errors from the source stream', async () => {
        const failing = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(utf8('partial'));
                controller.error(new Error('source upstream failure'));
            },
        });
        // streamToString does not catch, so the rejection should bubble.
        await expect(streamToString(failing)).rejects.toThrow('source upstream failure');
    });
});
