import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession, getUserEmail } from '@/lib/auth';
import { checkSubscription } from '@/lib/subscription';

export const runtime = 'nodejs';

/**
 * GET /api/subscription — check current user's subscription status.
 * POST /api/subscription — create a pending subscription (status=pending) or
 *    activate one (status=active) after Solana Pay confirmation.
 */
export async function GET(request: Request) {
    try {
        const verified = await verifySession(request);
        const email = await getUserEmail(verified.userId);
        const status = await checkSubscription(verified.userId, email || undefined);
        return NextResponse.json(status);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Auth required';
        return NextResponse.json({ tier: 'free', active: false, error: msg, reason: 'auth_failed' }, { status: 401 });
    }
}

export async function POST(request: Request) {
    try {
        const verified = await verifySession(request);
        const body = await request.json();
        const { action, tx_signature, invoice_reference } = body;

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
        }
        const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

        // action=create_invoice — generate a pending subscription + Solana Pay reference
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
                memo: `Operator Uplift Pro — ${verified.userId.slice(-8)}`,
            });
        }

        // action=dev_simulate — staging-only bypass that marks subscription active without a real tx
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

            // Log a prominent audit entry — simulators must leave a trail
            await supabase.from('audit_entries').insert({
                user_id: verified.userId,
                category: 'billing',
                action: 'dev_simulate_subscription',
                details: `Pro activated via dev simulator (no charge). tx_signature=${simulatedTx}`,
                approved: true,
                created_at: now.toISOString(),
            }).then(() => {}, () => {}); // best-effort — audit_entries table may not exist

            return NextResponse.json({
                tier: 'pro',
                active: true,
                expiresAt: expiresAt.toISOString(),
                tx_signature: simulatedTx,
                simulated: true,
            });
        }

        // action=confirm (default, legacy) — confirm a real Solana Pay tx
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
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
