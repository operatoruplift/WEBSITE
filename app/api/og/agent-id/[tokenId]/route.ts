import { NextResponse } from 'next/server';
import { withRequestMeta } from '@/lib/apiHelpers';
import { agentIdTokenExplorerUrl, og0AgentIdStatus } from '@/lib/og/agent-id';

export const runtime = 'nodejs';

/**
 * GET /api/og/agent-id/[tokenId]
 *
 * Public verifier passthrough for the 0G Agent ID (ERC-7857) NFT
 * that represents one of our agents. Same pattern as
 * /api/og/storage/[rootHash] (PR #569). Returns a JSON envelope
 * with the tokenId, the contract address, the network, and a
 * direct chainscan link so a judge or developer can see the NFT
 * on-chain without needing to install anything.
 *
 * Why a stub instead of an SDK proxy:
 *   - The on-chain record is the source of truth and chainscan
 *     renders it for free.
 *   - Our role here is to map our agent slug (used in /agents/[id])
 *     to the deployed tokenId. The page surfaces this route as a
 *     "View on 0G chainscan" link.
 *   - A future PR can pull the IntelligentData[] back from the
 *     contract and render the hashes alongside the agent's plain-
 *     English fields, so a reader can verify each hash themselves.
 *
 * Public route. No auth.
 */

export async function GET(
    request: Request,
    { params }: { params: Promise<{ tokenId: string }> },
) {
    const meta = withRequestMeta(request, 'og.agent-id.verify');
    const { tokenId } = await params;

    const status = og0AgentIdStatus();
    const explorerUrl = agentIdTokenExplorerUrl(tokenId);

    return NextResponse.json(
        {
            tokenId,
            contract: status.contract,
            network: status.network,
            explorerUrl,
            verify: {
                instructions: [
                    'This agent is registered as an ERC-7857 Intelligent NFT on 0G Galileo Testnet.',
                    '1. Open the explorerUrl above to see the NFT directly on 0G chainscan.',
                    '2. The token carries an array of IntelligentData entries: { dataDescription, dataHash }.',
                    '3. Each dataHash is a SHA-256 of the corresponding agent field (name, description, capabilities, system prompt, model).',
                    '4. Compare the chainscan hashes against what /agents/<id>.json returns from our static publish to verify the agent identity has not drifted.',
                ],
                standard: 'ERC-7857 (Agentic ID)',
                docs: 'https://github.com/0gfoundation/agenticID-examples',
            },
            requestId: meta.requestId,
            timestamp: meta.startedAt,
        },
        { headers: meta.headers },
    );
}
