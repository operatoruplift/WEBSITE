import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPayment } from '@/lib/solana/pay';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const { reference, wallet_address, user_id, email } = await request.json();

        if (!reference || !wallet_address) {
            return NextResponse.json({ error: 'reference and wallet_address required' }, { status: 400 });
        }

        // Verify on-chain
        const result = await verifyPayment(reference);

        if (!result.confirmed) {
            return NextResponse.json({
                verified: false,
                error: result.error || 'Payment not confirmed',
            }, { status: 402 });
        }

        // Write to early_access table in Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

        const { error: dbError } = await supabase.from('early_access').upsert(
            {
                wallet_address,
                user_id: user_id || null,
                email: email || null,
                tx_signature: result.signature,
                amount_sol: 0.1,
                granted_at: new Date().toISOString(),
            },
            { onConflict: 'wallet_address' },
        );

        if (dbError) {
            console.error('[verify-payment] Supabase error:', dbError);
            // Payment confirmed but DB write failed — still grant access
            // The on-chain record is the source of truth
        }

        return NextResponse.json({
            verified: true,
            signature: result.signature,
            access: 'granted',
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[verify-payment]', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
