import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const wallet = url.searchParams.get('wallet');
        const email = url.searchParams.get('email');

        if (!wallet && !email) {
            return NextResponse.json({ access: false, reason: 'no identifier' });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            // No Supabase — fall back to local-only check
            return NextResponse.json({ access: false, reason: 'no backend' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

        // Check early_access table (paid users)
        if (wallet) {
            const { data } = await supabase
                .from('early_access')
                .select('wallet_address, granted_at')
                .eq('wallet_address', wallet)
                .single();
            if (data) {
                return NextResponse.json({ access: true, tier: 'early_access', granted_at: data.granted_at });
            }
        }

        // Check waitlist table for approved users
        if (email) {
            const { data } = await supabase
                .from('waitlist')
                .select('email, approved')
                .eq('email', email)
                .single();
            if (data?.approved) {
                return NextResponse.json({ access: true, tier: 'waitlist_approved' });
            }
        }

        return NextResponse.json({ access: false, reason: 'not_on_list' });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ access: false, error: msg });
    }
}
