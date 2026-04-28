import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPayment } from '@/lib/solana/pay';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';
import { safeError } from '@/lib/safeLog';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'access.verify-payment');
    try {
        const { reference, wallet_address, user_id, email } = await request.json();

        if (!reference || !wallet_address) {
            return validationError('reference and wallet_address required', 'Send both reference and wallet_address in the JSON body.', meta, {
                missing: [!reference && 'reference', !wallet_address && 'wallet_address'].filter(Boolean),
            });
        }

        // Verify on-chain
        const result = await verifyPayment(reference);

        if (!result.confirmed) {
            return NextResponse.json({
                verified: false,
                error: result.error || 'Payment not confirmed',
                requestId: meta.requestId,
            }, { status: 402, headers: meta.headers });
        }

        // Write to early_access table in Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            return errorResponse(new Error('Supabase not configured'), meta, {
                errorClass: 'provider_unavailable',
            });
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
            safeError({
                at: meta.route,
                event: 'supabase_write_failed',
                requestId: meta.requestId,
                error: dbError.message,
                code: dbError.code,
            });
            // Payment confirmed but DB write failed, still grant access
            // The on-chain record is the source of truth
        }

        return NextResponse.json({
            verified: true,
            signature: result.signature,
            access: 'granted',
        }, { headers: meta.headers });
    } catch (err) {
        return errorResponse(err, meta);
    }
}
