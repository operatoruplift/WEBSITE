import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
        }

        // Check if already on waitlist
        const supabase = getSupabase();

        const { data: existing } = await supabase
            .from('waitlist')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

        if (existing) {
            return NextResponse.json({ message: 'Already on waitlist', alreadyExists: true });
        }

        // Insert new entry
        const { error } = await supabase
            .from('waitlist')
            .insert({ email: email.toLowerCase() });

        if (error) {
            return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Successfully joined waitlist' });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
