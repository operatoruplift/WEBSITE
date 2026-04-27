import { NextResponse } from 'next/server';
import { getCapabilities } from '@/lib/capabilities';
import { withRequestMeta } from '@/lib/apiHelpers';

export const runtime = 'nodejs';

/**
 * GET /api/capabilities
 *
 * Returns the three capability flags plus the verified userId (or null).
 * Called on /chat load and before every ToolApprovalModal render so the
 * UI knows whether to route to mock or real execution.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'capabilities');
    const caps = await getCapabilities(request);
    // Never return the userId if not authenticated
    const payload = {
        capability_google: caps.capability_google,
        capability_key: caps.capability_key,
        capability_real: caps.capability_real,
        authenticated: caps.userId !== null,
    };
    return NextResponse.json(payload, {
        headers: { 'Cache-Control': 'no-store, private', ...meta.headers },
    });
}
