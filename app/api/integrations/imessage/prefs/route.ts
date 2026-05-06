import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession } from '@/lib/auth';
import { withRequestMeta } from '@/lib/apiHelpers';
import { normalizeSign } from '@/lib/photon/horoscope';
import { safeWarn, safeLog } from '@/lib/safeLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 5;

/**
 * PATCH /api/integrations/imessage/prefs
 *
 * Body (any subset):
 *   { zodiac?: string, location?: string, model_pref?: string,
 *     timezone?: string, system_prompt_override?: string | null }
 *
 * Auth: signed-in via Privy session token.
 *
 * Updates the imessage_users row(s) for the calling Privy user. Lets
 * a verified user edit prefs from the dashboard instead of texting
 * "I'm a leo" / "I'm in San Francisco" from iMessage.
 *
 * Honest-status:
 *   - 401 with errorClass: reauth_required when Privy token is missing.
 *   - 422 with the failing field name when zodiac is not a real sign,
 *     location is too long, or model_pref looks malformed.
 *   - 200 with { updated: 0 } when no row was bound (caller should
 *     hit /start + /confirm first).
 *   - 503 with the migration filename when imessage_users doesn't exist.
 *
 * Always scoped by privy_user_id so a stolen sender string can't
 * mutate someone else's prefs.
 */

interface PrefsBody {
    zodiac?: unknown;
    location?: unknown;
    model_pref?: unknown;
    timezone?: unknown;
    system_prompt_override?: unknown;
}

const TABLE_MISSING_RE = /relation .* does not exist|Could not find the table/i;

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}

interface ValidatedPatch {
    zodiac?: string | null;
    location?: string | null;
    model_pref?: string | null;
    timezone?: string | null;
    system_prompt_override?: string | null;
}

interface ValidationFailure {
    field: 'zodiac' | 'location' | 'model_pref' | 'timezone' | 'system_prompt_override';
    reason: string;
}

function validate(body: PrefsBody): { ok: true; patch: ValidatedPatch } | { ok: false; failure: ValidationFailure } {
    const patch: ValidatedPatch = {};

    if (body.zodiac !== undefined) {
        if (body.zodiac === null || body.zodiac === '') {
            patch.zodiac = null;
        } else if (typeof body.zodiac !== 'string') {
            return { ok: false, failure: { field: 'zodiac', reason: 'must be a string sign name' } };
        } else {
            const sign = normalizeSign(body.zodiac);
            if (!sign) return { ok: false, failure: { field: 'zodiac', reason: 'not a real zodiac sign' } };
            patch.zodiac = sign;
        }
    }

    if (body.location !== undefined) {
        if (body.location === null || body.location === '') {
            patch.location = null;
        } else if (typeof body.location !== 'string') {
            return { ok: false, failure: { field: 'location', reason: 'must be a string' } };
        } else {
            const trimmed = body.location.trim();
            if (trimmed.length === 0) {
                patch.location = null;
            } else if (trimmed.length > 80) {
                return { ok: false, failure: { field: 'location', reason: 'must be 80 chars or fewer' } };
            } else {
                patch.location = trimmed;
            }
        }
    }

    if (body.model_pref !== undefined) {
        if (body.model_pref === null || body.model_pref === '') {
            patch.model_pref = null;
        } else if (typeof body.model_pref !== 'string') {
            return { ok: false, failure: { field: 'model_pref', reason: 'must be a string model id' } };
        } else {
            const trimmed = body.model_pref.trim();
            if (trimmed.length === 0) {
                patch.model_pref = null;
            } else if (trimmed.length > 80 || !/^[a-z0-9.\-]+$/i.test(trimmed)) {
                return { ok: false, failure: { field: 'model_pref', reason: 'malformed model id' } };
            } else {
                patch.model_pref = trimmed;
            }
        }
    }

    if (body.timezone !== undefined) {
        if (body.timezone === null || body.timezone === '') {
            patch.timezone = null;
        } else if (typeof body.timezone !== 'string') {
            return { ok: false, failure: { field: 'timezone', reason: 'must be an IANA timezone string' } };
        } else {
            const trimmed = body.timezone.trim();
            if (trimmed.length === 0) {
                patch.timezone = null;
            } else if (trimmed.length > 64 || !/^[A-Za-z_+/\-0-9]+$/.test(trimmed)) {
                return { ok: false, failure: { field: 'timezone', reason: 'malformed timezone string' } };
            } else {
                patch.timezone = trimmed;
            }
        }
    }

    if (body.system_prompt_override !== undefined) {
        if (body.system_prompt_override === null || body.system_prompt_override === '') {
            patch.system_prompt_override = null;
        } else if (typeof body.system_prompt_override !== 'string') {
            return { ok: false, failure: { field: 'system_prompt_override', reason: 'must be a string or null' } };
        } else {
            const trimmed = body.system_prompt_override.trim();
            if (trimmed.length === 0) {
                patch.system_prompt_override = null;
            } else if (trimmed.length > 2000) {
                return { ok: false, failure: { field: 'system_prompt_override', reason: 'must be 2000 chars or fewer' } };
            } else {
                patch.system_prompt_override = trimmed;
            }
        }
    }

    return { ok: true, patch };
}

export async function PATCH(request: Request) {
    const meta = withRequestMeta(request, 'integrations.imessage.prefs');
    try {
        const verified = await verifySession(request).catch(() => null);
        if (!verified?.userId) {
            return NextResponse.json(
                {
                    error: 'unauthorized',
                    errorClass: 'reauth_required',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Sign in with Privy and retry.',
                },
                { status: 401, headers: meta.headers },
            );
        }

        const body = (await request.json().catch(() => null)) as PrefsBody | null;
        if (!body || typeof body !== 'object') {
            return NextResponse.json(
                {
                    error: 'invalid_body',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Send a JSON body with the fields you want to update.',
                },
                { status: 400, headers: meta.headers },
            );
        }

        const v = validate(body);
        if (!v.ok) {
            return NextResponse.json(
                {
                    error: 'invalid_field',
                    field: v.failure.field,
                    reason: v.failure.reason,
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: `Fix ${v.failure.field}: ${v.failure.reason}.`,
                },
                { status: 422, headers: meta.headers },
            );
        }

        if (Object.keys(v.patch).length === 0) {
            return NextResponse.json(
                {
                    updated: 0,
                    note: 'no fields supplied',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                },
                { status: 200, headers: meta.headers },
            );
        }

        const supabase = getSupabase();
        if (!supabase) {
            return NextResponse.json(
                {
                    error: 'no_supabase',
                    errorClass: 'provider_unavailable',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.',
                },
                { status: 503, headers: meta.headers },
            );
        }

        const now = new Date().toISOString();
        const { error, count } = await supabase
            .from('imessage_users')
            .update({ ...v.patch, updated_at: now }, { count: 'exact' })
            .eq('privy_user_id', verified.userId);

        if (error) {
            const tableMissing = TABLE_MISSING_RE.test(error.message || '');
            if (tableMissing) {
                return NextResponse.json(
                    {
                        error: 'table_missing',
                        errorClass: 'provider_unavailable',
                        requestId: meta.requestId,
                        timestamp: meta.startedAt,
                        nextAction: 'Run lib/photon-imessage-users-migration.sql against your Supabase project.',
                    },
                    { status: 503, headers: meta.headers },
                );
            }
            safeWarn({
                at: meta.route,
                event: 'prefs_update_failed',
                requestId: meta.requestId,
                error: error.message?.slice(0, 240),
            });
            return NextResponse.json(
                {
                    error: 'database_error',
                    errorClass: 'provider_unavailable',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    nextAction: 'Check Supabase connectivity and retry.',
                },
                { status: 503, headers: meta.headers },
            );
        }

        const updated = typeof count === 'number' ? count : 0;
        safeLog({
            at: meta.route,
            event: 'prefs_updated',
            requestId: meta.requestId,
            updated,
            fields: Object.keys(v.patch),
        });

        return NextResponse.json(
            {
                updated,
                fields: Object.keys(v.patch),
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { status: 200, headers: meta.headers },
        );
    } catch (err) {
        safeWarn({
            at: meta.route,
            event: 'prefs_unexpected',
            requestId: meta.requestId,
            error: err instanceof Error ? err.message.slice(0, 240) : String(err),
        });
        return NextResponse.json(
            {
                error: 'unexpected',
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { status: 500, headers: meta.headers },
        );
    }
}
