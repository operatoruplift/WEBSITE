import { NextResponse } from 'next/server';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';
import { getCapabilities } from '@/lib/capabilities';
import { synthesizeSpeech, elevenLabsStatus } from '@/lib/elevenlabs/synth';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/voice/synth
 *
 * Server-side text-to-speech via ElevenLabs. Used to generate
 * voiceover MP3 for the demo recording, not a runtime user-facing
 * feature.
 *
 * Auth: any signed-in user. ElevenLabs is rate-limited and metered
 * per-character, so anonymous access would let scanners burn the
 * quota. Non-admin signed-in users CAN call this (so a non-admin
 * editor could regenerate narration if needed) but the deck note
 * about voice not being a product pillar still applies, so this
 * endpoint never appears in /chat or any other consumer flow.
 *
 * Request:
 *   { text: string, voice_id?: string }
 *
 * Response (200): MP3 binary, Content-Type: audio/mpeg
 * Response (4xx/5xx): JSON envelope
 *   401: not signed in
 *   400: text missing/empty/too_long (>5000 chars)
 *   503: ELEVENLABS_API_KEY not set OR upstream returned non-2xx
 */
export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'voice.synth');
    try {
        const caps = await getCapabilities(request);
        if (!caps.userId) {
            return NextResponse.json(
                {
                    error: 'unauthorized',
                    errorClass: 'reauth_required',
                    reason: 'not_authenticated',
                    recovery: 'reauth',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    message: 'Sign in to use voice synthesis.',
                    nextAction: 'Sign in with Privy and retry.',
                },
                { status: 401, headers: meta.headers },
            );
        }

        const body = await request.json().catch(() => ({}));
        const text: unknown = (body as { text?: unknown }).text;
        const voiceId: unknown = (body as { voice_id?: unknown }).voice_id;

        if (typeof text !== 'string' || text.trim().length === 0) {
            return validationError(
                'text required',
                'Pass `text` as a non-empty string in the JSON body.',
                meta,
                { missing: ['text'] },
            );
        }
        if (text.length > 5000) {
            return validationError(
                'text too long',
                'ElevenLabs TTS caps at 5000 characters per request. Split into chunks and stitch client-side.',
                meta,
                { field: 'text' },
            );
        }

        const status = elevenLabsStatus();
        if (!status.active) {
            return errorResponse(
                new Error('elevenlabs_not_configured'),
                meta,
                { errorClass: 'provider_unavailable' },
            );
        }

        const result = await synthesizeSpeech({
            text,
            voiceId: typeof voiceId === 'string' ? voiceId : undefined,
        });
        if (!result.ok || !result.audio) {
            return errorResponse(
                new Error(result.reason || 'synth_failed'),
                meta,
                { errorClass: 'provider_unavailable' },
            );
        }

        return new NextResponse(Buffer.from(result.audio), {
            status: 200,
            headers: {
                ...meta.headers,
                'Content-Type': result.contentType || 'audio/mpeg',
                // Suggest a filename for `curl -O` operators recording demo narration.
                'Content-Disposition': 'attachment; filename="voice.mp3"',
                'Cache-Control': 'no-store',
            },
        });
    } catch (err) {
        return errorResponse(err, meta);
    }
}
