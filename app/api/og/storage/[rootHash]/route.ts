import { NextResponse } from 'next/server';
import { withRequestMeta } from '@/lib/apiHelpers';
import { get0gConfig, og0Status } from '@/lib/og/storage';

export const runtime = 'nodejs';

/**
 * GET /api/og/storage/[rootHash]
 *
 * Passthrough verifier route. A clickable target for the `0g:` link
 * we render on /security next to each receipt. Returns a JSON envelope
 * with the rootHash and the testnet indexer the bytes are pinned to,
 * plus a small instructions block so a judge or a developer can
 * download the bytes themselves with the 0G SDK.
 *
 * Why a stub instead of a full SDK download proxy:
 *   - 0G testnet today does not expose a public-gateway HTTPS URL like
 *     Filecoin via dweb.link does. Downloading requires the indexer
 *     RPC and the SDK.
 *   - For a hackathon submission, the value of this link is "judges
 *     can see the rootHash, copy it, and verify against the indexer
 *     directly." A proxy that ran a wallet-signed SDK call on every
 *     anonymous GET would burn testnet RPC quota for no real win.
 *   - A future PR can swap this stub for a real download proxy if the
 *     0G public gateway ships.
 *
 * Public route. No auth.
 */

export async function GET(
    request: Request,
    { params }: { params: Promise<{ rootHash: string }> },
) {
    const meta = withRequestMeta(request, 'og.storage.verify');
    const { rootHash } = await params;

    const status = og0Status();
    const cfg = get0gConfig();

    return NextResponse.json(
        {
            rootHash,
            network: status.network,
            anchored: status.active,
            indexerRpc: cfg?.indexerRpc ?? null,
            rpcUrl: cfg?.rpcUrl ?? null,
            verify: {
                instructions: [
                    'This SignedReceipt JSON was pinned to 0G Storage testnet. Verify it like this:',
                    '1. `pnpm install @0gfoundation/0g-storage-ts-sdk ethers`',
                    '2. Point at the indexerRpc above',
                    '3. Use the SDK download API with the rootHash to fetch the bytes',
                    '4. Compare those bytes against what /api/receipts returns for the same receipt_reference',
                    'If the two byte-streams differ, the receipt has been tampered with on one side.',
                ],
                docs: 'https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk',
            },
            requestId: meta.requestId,
            timestamp: meta.startedAt,
        },
        { headers: meta.headers },
    );
}
