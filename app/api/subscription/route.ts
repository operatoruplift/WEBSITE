import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession, getUserEmail } from '@/lib/auth';
import { checkSubscription } from '@/lib/subscription';
import { classifyError, envelope } from '@/lib/errorTaxonomy';

export const runtime = 'nodejs';

function newRequestId(): string {
    return `req_${crypto.randomUUID()}`;
}

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
    const requestId = request.headers.get('x-request-id') || newRequestId();
    const startedAt = new Date().toISOString();
    try {
        const verified = await verifySession(request);
        const email = await getUserEmail(verified.userId);
        const status = await checkSubscription(verified.userId, email || undefined);
        return NextResponse.json(status, { headers: { 'X-Request-Id': requestId } });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Auth required';
        const jws = jwsHeaderDebug(request);
        const errorClass = classifyError(err);
        console.log(JSON.stringify({ at: 'subscription', event: 'auth-failed', route: 'GET /api/subscription', requestId, ts: startedAt, errorClass, reason: msg.slice(0, 120), jws }));
        const body = envelope(errorClass, msg, requestId, startedAt);
        return NextResponse.json(
            { tier: 'free', active: false, ...body },
            { status: 401, headers: { 'X-Request-Id': requestId } },
        );
    }
}

export async function POST(request: Request) {
    const requestId = request.headers.get('x-request-id') || newRequestId();
    const startedAt = new Date().toISOString();
    try {
        let verified;
        try {
            verified = await verifySession(request);
        } catch (authErr) {
            const code = authErr instanceof Error ? authErr.message : 'token_invalid';
            const jws = jwsHeaderDebug(request);
            const errorClass = classifyError(authErr);
            // JWS header is safe to log (alg/typ/kid), never log payload or signature.
            console.log(JSON.stringify({ at: 'subscription', event: 'auth-failed', route: 'POST /api/subscription', requestId, ts: startedAt, errorClass, reason: code.slice(0, 120), jws }));
            return NextResponse.json(
                envelope(errorClass, code, requestId, startedAt),
                { status: 401, headers: { 'X-Request-Id': requestId } },
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

        // action=confirm (default, legacy), confirm a real Solana Pay tx
        if (!tx_signature) {
            return NextResponse.json({ error: 'tx_signature required' }, { status: 400 });
        }

        // TODO: Verify the Solana tx on-chain before activating.
        // For devnet/demo, we trust the client-provided signature.

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        await supabase.from('subscriptions').upsert({
            user_id: verified.userId,
            tier: 'pro',
            status: 'active',
            price_usdc: 19.00,
            tx_signature,
            invoice_reference: invoice_reference || null,
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            updated_at: now.toISOString(),
        }, { onConflict: 'user_id' });

        return NextResponse.json({
            tier: 'pro',
            active: true,
            expiresAt: expiresAt.toISOString(),
            tx_signature,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        const errorClass = classifyError(err);
        console.log(JSON.stringify({ at: 'subscription', event: 'unhandled', route: 'POST /api/subscription', requestId, ts: startedAt, errorClass, error: msg.slice(0, 240) }));
        return NextResponse.json(
            envelope(errorClass, msg, requestId, startedAt),
            { status: errorClass === 'provider_unavailable' ? 503 : 500, headers: { 'X-Request-Id': requestId } },
        );
    }
}
