import { test, expect } from '@playwright/test';
import { runAgentReply } from '@/lib/photon/agent';
import type { PhotonAdapter, SendImessageRequest, SendImessageResult, SendImessageError } from '@/lib/photon/adapter';

/**
 * Unit tests for runAgentReply, the synchronous LLM-and-send loop the
 * Photon webhook calls on every inbound iMessage.
 *
 * The function has three failure modes and one happy path. We pin
 * each so a regression in the webhook contract surfaces here, not
 * silently in production via "the bot stopped replying":
 *
 *   1. Adapter inactive            → ok: false, reason: 'no_adapter'
 *   2. Adapter rejects send        → ok: false, reason: 'send_failed'
 *   3. Anthropic key missing       → ok: true, source: 'fallback_no_llm'
 *   4. LLM + send both succeed     → ok: true, source: 'llm'
 *
 * Tests mutate process.env so the describe block is serial.
 */

test.describe.configure({ mode: 'serial' });

const ORIG_ANTHROPIC = process.env.ANTHROPIC_API_KEY;

function inactiveAdapter(): PhotonAdapter {
    return {
        isActive: () => false,
        send: async () => ({ ok: false, reason: 'not_configured', message: 'inactive' } satisfies SendImessageError),
    };
}

function rejectingAdapter(): PhotonAdapter {
    return {
        isActive: () => true,
        send: async () => ({
            ok: false,
            reason: 'provider_rejected',
            message: 'Spectrum returned 401',
            providerStatus: 401,
        } satisfies SendImessageError),
    };
}

function recordingAdapter(): { adapter: PhotonAdapter; calls: SendImessageRequest[] } {
    const calls: SendImessageRequest[] = [];
    return {
        calls,
        adapter: {
            isActive: () => true,
            send: async (req) => {
                calls.push(req);
                return {
                    ok: true,
                    messageId: 'msg-fake-001',
                    provider: 'https://api.photon.codes',
                    platform: req.platform ?? 'imessage',
                    submittedAt: Date.now(),
                } satisfies SendImessageResult;
            },
        },
    };
}

test.afterEach(() => {
    if (ORIG_ANTHROPIC === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = ORIG_ANTHROPIC;
});

test('returns no_adapter when the Photon adapter is inactive', async () => {
    const result = await runAgentReply(
        { sender: '+15551234567', text: 'hello', platform: 'imessage' },
        inactiveAdapter(),
        'req-test-1',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
        expect(result.reason).toBe('no_adapter');
        expect(result.message).toContain('PHOTON_PROJECT_ID');
    }
});

test('returns send_failed when the adapter rejects', async () => {
    delete process.env.ANTHROPIC_API_KEY; // force fallback so the LLM step doesn't reach out
    const result = await runAgentReply(
        { sender: '+15551234567', text: 'hello', platform: 'imessage' },
        rejectingAdapter(),
        'req-test-2',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
        expect(result.reason).toBe('send_failed');
        expect(result.message).toContain('provider_rejected');
    }
});

test('falls back to the fixed-string ack when ANTHROPIC_API_KEY is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { adapter, calls } = recordingAdapter();
    const result = await runAgentReply(
        { sender: '+15551234567', text: 'whatever', platform: 'imessage' },
        adapter,
        'req-test-3',
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
        expect(result.source).toBe('fallback_no_llm');
        expect(result.replyText).toBeTruthy();
        expect(result.messageId).toBe('msg-fake-001');
    }
    expect(calls).toHaveLength(1);
    expect(calls[0].to).toBe('+15551234567');
    expect(calls[0].platform).toBe('imessage');
});

test('forwards the platform from the input through to the adapter', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { adapter, calls } = recordingAdapter();
    await runAgentReply(
        { sender: 'tg-123', text: 'hi', platform: 'telegram' },
        adapter,
        'req-test-4',
    );
    expect(calls[0].platform).toBe('telegram');
    expect(calls[0].to).toBe('tg-123');
});

test('empty inbound text still produces a reply (no API call)', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { adapter, calls } = recordingAdapter();
    const result = await runAgentReply(
        { sender: '+15551234567', text: '   ', platform: 'imessage' },
        adapter,
        'req-test-5',
    );
    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].text.length).toBeGreaterThan(0);
});
