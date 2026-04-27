import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'waitlist');
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return validationError('Valid email required', 'Send a valid email in the JSON body.', meta, {
                missing: !email ? ['email'] : ['email_format'],
            });
        }

        // Check if already on waitlist
        const supabase = getSupabase();

        const { data: existing } = await supabase
            .from('waitlist')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

        if (existing) {
            return NextResponse.json({ message: 'Already on waitlist', alreadyExists: true }, { headers: meta.headers });
        }

        // Insert new entry
        const { error } = await supabase
            .from('waitlist')
            .insert({ email: email.toLowerCase() });

        if (error) {
            return errorResponse(new Error(error.message), meta);
        }

        return NextResponse.json({ message: 'Successfully joined waitlist' }, { headers: meta.headers });
    } catch (err) {
        return errorResponse(err, meta);
    }
}
