import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession, getUserEmail } from '@/lib/auth';
import { checkSubscription } from '@/lib/subscription';
import { classifyError, envelope } from '@/lib/errorTaxonomy';
import { withRequestMeta } from '@/lib/apiHelpers';
import { safeLog } from '@/lib/safeLog';

export const runtime = 'nodejs';

/**
 * Extract the JOSE header fields from a compact JWS without verifying.
 * Used only for logging, we never log payload or signature. Returns null
 * if the token isn't even shaped like `a.b.c`.
 */
function jwsHeaderDebug(request: Request): { alg?: string; typ?: string; kid?: string; tokenLength: number; tokenPrefix: string } | null {
    const authz = request.headers.get('authorization') || '';
    const m = authz.match(/^Bearer\s+(.+)$/i);
    if (!m) return null;
    const token = m[1];
    const parts = token.split('.');
    if (parts.length !== 3) {
        return { tokenLength: token.length, tokenPrefix: token.slice(0, 12) + '...' };
    }
    try {
        const headerJson = Buffer.from(parts[0], 'base64url').toString('utf8');
        const h = JSON.parse(headerJson) as { alg?: string; typ?: string; kid?: string };
        return { alg: h.alg, typ: h.typ, kid: h.kid, tokenLength: token.length, tokenPrefix: token.slice(0, 12) + '...' };
    } catch {
        return { tokenLength: token.length, tokenPrefix: token.slice(0, 12) + '...' };
    }
}

/**
 * GET /api/subscription, check current user's subscription status.
 * POST /api/subscription, create a pending subscription (status=pending) or
 *    activate one (status=active) after Solana Pay confirmation.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'subscription.get');
    const { requestId, startedAt } = meta;
    try {
        const verified = await verifySession(request);
        const email = await getUserEmail(verified.userId);
        const status = await checkSubscription(verified.userId, email || undefined);
        return NextResponse.json(status, { headers: meta.headers });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Auth required';
        const jws = jwsHeaderDebug(request);
        const errorClass = classifyError(err);
        safeLog({ at: meta.route, event: 'auth-failed', route: 'GET /api/subscription', requestId, errorClass, reason: msg.slice(0, 120), jws });
        const body = envelope(errorClass, msg, requestId, startedAt);
        return NextResponse.json(
            { tier: 'free', active: false, ...body },
            { status: 401, headers: meta.headers },
        );
    }
}

export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'subscription.post');
    const { requestId, startedAt } = meta;
    try {
        let verified;
        try {
            verified = await verifySession(request);
        } catch (authErr) {
            const code = authErr instanceof Error ? authErr.message : 'token_invalid';
            const jws = jwsHeaderDebug(request);
            const errorClass = classifyError(authErr);
            // JWS header is safe to log (alg/typ/kid), never log payload or signature.
            safeLog({ at: 'subscription', event: 'auth-failed', route: 'POST /api/subscription', requestId, errorClass, reason: code.slice(0, 120), jws });
            return NextResponse.json(
                envelope(errorClass, code, requestId, startedAt),
                { status: 401, headers: meta.headers },
            );
        }
        const body = await request.json();
        const { action, tx_signature, invoice_reference } = body;

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
        }
        const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

        // action=create_invoice, generate a pending subscription + Solana Pay reference
        if (action === 'create_invoice') {
            // Generate a unique reference for this payment (used in Solana Pay URL)
            const ref = `inv-${verified.userId.slice(-8)}-${Date.now()}`;
            const now = new Date();

            await supabase.from('subscriptions').upsert({
                user_id: verified.userId,
                tier: 'pro',
                status: 'pending',
                price_usdc: 19.00,
                tx_signature: null,
                invoice_reference: ref,
                started_at: now.toISOString(),
                expires_at: null,
                updated_at: now.toISOString(),
            }, { onConflict: 'user_id' });

            // Return the payment details for the UI to build a Solana Pay URL
            return NextResponse.json({
                status: 'pending',
                invoice_reference: ref,
                amount_usdc: 19.00,
                recipient: process.env.NEXT_PUBLIC_TREASURY_WALLET || 'UpL1ft11111111111111111111111111111111111111',
                memo: `Operator Uplift Pro, ${verified.userId.slice(-8)}`,
            });
        }

        // action=dev_simulate, staging-only bypass that marks subscription active without a real tx
        if (action === 'dev_simulate') {
            if (process.env.NODE_ENV === 'production' && process.env.PAYMENT_SIMULATOR_ENABLED !== '1') {
                return NextResponse.json({ error: 'Dev simulator disabled in production' }, { status: 403 });
            }
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            const simulatedTx = `sim-${Date.now()}`;

            await supabase.from('subscriptions').upsert({
                user_id: verified.userId,
                tier: 'pro',
                status: 'active',
                price_usdc: 19.00,
                tx_signature: simulatedTx,
                started_at: now.toISOString(),
                expires_at: expiresAt.toISOString(),
                updated_at: now.toISOString(),
            }, { onConflict: 'user_id' });

            // Log a prominent audit entry, simulators must leave a trail
            await supabase.from('audit_entries').insert({
                user_id: verified.userId,
                category: 'billing',
                action: 'dev_simulate_subscription',
                details: `Pro activated via dev simulator (no charge). tx_signature=${simulatedTx}`,
                approved: true,
                created_at: now.toISOString(),
            }).then(() => {}, () => {}); // best-effort, audit_entries table may not exist

            return NextResponse.json({
                tier: 'pro',
                active: true,
                expiresAt: expiresAt.toISOString(),
                tx_signature: simulatedTx,
                simulated: true,
            });
        }

        // The legacy "confirm" fall-through path used to mark a user
        // active just because they posted a tx_signature. No on-chain
        // verification, no replay protection, anyone could submit any
        // 88-char string and get marked Pro. Real settlement lives on
        // /api/access/verify-payment which calls verifyPayment(reference)
        // against the Solana RPC. Closing this path explicitly to avoid
        // a future caller ending up here by accident, plus the noise
        // (`tx_signature` and `invoice_reference` are still parsed off
        // the body to keep the destructure readable, they just go
        // unused below).
        void tx_signature; void invoice_reference;
        return NextResponse.json({
            error: 'gone',
            errorClass: 'unknown',
            requestId: meta.requestId,
            timestamp: meta.startedAt,
            message: 'POST /api/subscription with no recognized action is no longer accepted.',
            nextAction: 'Use action="create_invoice" to start payment, then call POST /api/access/verify-payment with the invoice reference + wallet address. That route verifies the on-chain tx before granting access.',
        }, { status: 410, headers: meta.headers });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        const errorClass = classifyError(err);
        safeLog({ at: 'subscription', event: 'unhandled', route: 'POST /api/subscription', requestId, errorClass, error: msg.slice(0, 240) });
        return NextResponse.json(
            envelope(errorClass, msg, requestId, startedAt),
            { status: errorClass === 'provider_unavailable' ? 503 : 500, headers: meta.headers },
        );
    }
}
