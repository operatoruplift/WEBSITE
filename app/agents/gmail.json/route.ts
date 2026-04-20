import { NextResponse } from 'next/server';
import { GMAIL_AGENT } from '@/lib/agent-registration';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

/**
 * GET /agents/gmail.json
 *
 * ERC-8004-style agent registration document for the Gmail agent.
 * Public, anyone can fetch and verify the checksum.
 */
export async function GET() {
    return NextResponse.json(GMAIL_AGENT, {
        headers: {
            'Cache-Control': 'public, max-age=300',
            'Content-Type': 'application/json; charset=utf-8',
        },
    });
}
