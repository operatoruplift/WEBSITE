/**
 * ElevenLabs text-to-speech adapter.
 *
 * Per the deck (docs/deck-objections.md): "voice is not a product
 * feature. The demo voiceover may use ElevenLabs but that is
 * presentation, not pillar." This module backs the
 * `/api/voice/synth` route used to generate the demo recording's
 * narration MP3 (not a runtime user feature).
 *
 * Single env: ELEVENLABS_API_KEY. Optional: ELEVENLABS_VOICE_ID
 * (defaults to "Rachel", ElevenLabs' canonical clear-narration
 * voice). The route is admin-only via the existing capabilities
 * gate so non-admins can't burn the API quota.
 */

import { safeLog, safeWarn } from '../safeLog';

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel
const DEFAULT_MODEL = 'eleven_turbo_v2_5';

export interface ElevenLabsStatus {
    active: boolean;
    voiceId: string;
    model: string;
    reason: string;
}

export function elevenLabsStatus(): ElevenLabsStatus {
    const hasKey = Boolean(process.env.ELEVENLABS_API_KEY?.trim());
    const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_VOICE_ID;
    const model = process.env.ELEVENLABS_MODEL?.trim() || DEFAULT_MODEL;

    if (hasKey) {
        return {
            active: true,
            voiceId,
            model,
            reason: `ELEVENLABS_API_KEY present; /api/voice/synth will route to ${model}.`,
        };
    }
    return {
        active: false,
        voiceId,
        model,
        reason: 'ELEVENLABS_API_KEY missing; /api/voice/synth returns 503 until set in Vercel env.',
    };
}

export interface SynthResult {
    ok: boolean;
    /** Audio bytes on success, undefined on failure. */
    audio?: ArrayBuffer;
    /** MIME type returned by the TTS endpoint (always audio/mpeg today). */
    contentType?: string;
    reason?: string;
    httpStatus?: number;
}

interface SynthArgs {
    text: string;
    /** Optional override; falls back to ELEVENLABS_VOICE_ID env or DEFAULT_VOICE_ID. */
    voiceId?: string;
}

/** Synthesize speech from text using ElevenLabs TTS. */
export async function synthesizeSpeech(args: SynthArgs): Promise<SynthResult> {
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    if (!apiKey) {
        return { ok: false, reason: 'not_configured' };
    }

    const voiceId =
        args.voiceId?.trim() || process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_VOICE_ID;
    const model = process.env.ELEVENLABS_MODEL?.trim() || DEFAULT_MODEL;

    // Defensive: ElevenLabs caps free-tier characters per minute. If
    // a caller passes an unbounded string the API will reject; we
    // surface a typed reason without round-tripping the API call.
    if (!args.text || !args.text.trim()) {
        return { ok: false, reason: 'empty_text' };
    }
    if (args.text.length > 5000) {
        return { ok: false, reason: 'text_too_long' };
    }

    try {
        const res = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
            {
                method: 'POST',
                headers: {
                    'xi-api-key': apiKey,
                    'Content-Type': 'application/json',
                    Accept: 'audio/mpeg',
                },
                body: JSON.stringify({
                    text: args.text,
                    model_id: model,
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                        style: 0,
                        use_speaker_boost: true,
                    },
                }),
            },
        );

        if (!res.ok) {
            return { ok: false, reason: 'http_error', httpStatus: res.status };
        }

        const audio = await res.arrayBuffer();
        const contentType = res.headers.get('content-type') || 'audio/mpeg';

        safeLog({
            at: 'elevenlabs.synth',
            event: 'synthesized',
            chars: args.text.length,
            bytes: audio.byteLength,
            voiceId,
        });

        return { ok: true, audio, contentType };
    } catch (err) {
        safeWarn({
            at: 'elevenlabs.synth',
            event: 'synth_failed',
            error: err instanceof Error ? err.message : String(err),
        });
        return { ok: false, reason: 'unknown' };
    }
}
