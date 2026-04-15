import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySession } from '@/lib/auth';
import { checkSubscription } from '@/lib/subscription';

export const runtime = 'nodejs';

/**
 * GET /api/subscription — check current user's subscription status.
 * POST /api/subscription — activate a Pro subscription after Solana Pay.
 */
export async function GET(request: Request) {
    try {
        const verified = await verifySession(request);
        const status = await checkSubscription(verified.userId);
        return NextResponse.json(status);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Auth required';
        return NextResponse.json({ tier: 'free', active: false, error: msg }, { status: 401 });
    }
}

export async function POST(request: Request) {
    try {
        const verified = await verifySession(request);
        const { tx_signature } = await request.json();

        if (!tx_signature) {
            return NextResponse.json({ error: 'tx_signature required' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

        // TODO: Verify the Solana tx on-chain before activating.
        // For devnet/demo, we trust the client-provided signature.

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await supabase.from('subscriptions').upsert({
            user_id: verified.userId,
            tier: 'pro',
            status: 'active',
            price_usdc: 19.00,
            tx_signature,
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
