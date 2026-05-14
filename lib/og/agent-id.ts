/**
 * 0G Agent ID (ERC-7857 Intelligent NFT) integration scaffolding.
 *
 * Companion to lib/og/storage.ts (PR #569) for the second piece of
 * our 0G Labs hackathon submission. Per docs/0g-integration-decision.md,
 * scope here is intentionally narrow:
 *
 *   - Map our existing `AgentRegistration` shape (from
 *     lib/agent-registration/index.ts) onto the ERC-7857
 *     `IntelligentData[]` shape the AgenticID contract expects.
 *   - Hash the agent's description, capabilities, system prompt, and
 *     model into `bytes32` entries so the on-chain record is
 *     tamper-evident without leaking the prompt text.
 *   - Build chainscan URLs for the deployed token so /agents/[id] can
 *     link to the on-chain identity.
 *   - Provide an honest-status helper for /api/health/adapters.
 *
 * The actual mint call lives in `scripts/og-agent-id-mint.mjs` (next
 * PR) so this module stays import-safe in any Next route. Minting
 * needs a funded wallet on 0G Galileo Testnet; the runtime app only
 * needs to render the tokenId, not produce it.
 *
 * Reference contract on 0G Galileo Testnet:
 *   0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F
 *
 * Required env (set once tokenIds exist):
 *   OG_AGENT_ID_CONTRACT       contract address (defaults to the
 *                              0G Foundation reference deployment)
 *   OG_AGENT_ID_CHAIN_EXPLORER chainscan base URL (defaults to
 *                              chainscan-galileo.0g.ai)
 */

import { createHash } from 'crypto';

export interface IntelligentDataEntry {
    dataDescription: string;
    /** 0x-prefixed 32-byte SHA-256 hash, ready to pass into the
     *  ERC-7857 `setIntelligentData(IntelligentData[])` call. */
    dataHash: string;
}

export interface AgentRegistrationSlim {
    id: string;
    name: string;
    description: string;
    version?: string;
    capabilities?: string[];
    systemPrompt?: string;
    model?: string;
}

const DEFAULT_CONTRACT = '0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F';
const DEFAULT_EXPLORER = 'https://chainscan-galileo.0g.ai';

/** Honest-status surface for /api/health/adapters. Mirrors og0Status
 *  in lib/og/storage.ts so the dashboard can render both 0G rows. */
export function og0AgentIdStatus(): {
    active: boolean;
    contract: string;
    explorer: string;
    network: 'galileo-testnet';
} {
    return {
        active: true,
        contract: process.env.OG_AGENT_ID_CONTRACT?.trim() || DEFAULT_CONTRACT,
        explorer: process.env.OG_AGENT_ID_CHAIN_EXPLORER?.trim() || DEFAULT_EXPLORER,
        network: 'galileo-testnet',
    };
}

/** 0x-prefixed 32-byte hash of a UTF-8 string, suitable for an
 *  ERC-7857 IntelligentData entry. SHA-256 chosen because we already
 *  use it everywhere else in the repo (params_hash, result_hash in
 *  signed receipts). The contract only requires `bytes32`, so the
 *  hash algorithm is our choice. */
export function sha256Hex32(input: string): string {
    return '0x' + createHash('sha256').update(input).digest('hex');
}

/**
 * Convert one of our agent registrations to the ERC-7857
 * IntelligentData[] payload. Each field that contributes to the
 * agent's identity becomes one IntelligentData entry, with a
 * description tag and a SHA-256 of the field value.
 *
 * The order matters because the contract emits an
 * `IntelligentDataSet` event with the array; downstream consumers
 * (including 0G's Galileo chainscan) will read the array positionally.
 */
export function agentToIntelligentData(
    agent: AgentRegistrationSlim,
): IntelligentDataEntry[] {
    const entries: IntelligentDataEntry[] = [
        { dataDescription: 'name', dataHash: sha256Hex32(agent.name) },
        { dataDescription: 'description', dataHash: sha256Hex32(agent.description) },
    ];

    if (agent.version) {
        entries.push({ dataDescription: 'version', dataHash: sha256Hex32(agent.version) });
    }

    if (agent.capabilities && agent.capabilities.length > 0) {
        // Canonicalize the capability list so two agents with the
        // same capabilities in a different order produce the same hash.
        const canonical = [...agent.capabilities].map(c => c.trim()).sort().join('|');
        entries.push({
            dataDescription: 'capabilities',
            dataHash: sha256Hex32(canonical),
        });
    }

    if (agent.systemPrompt) {
        entries.push({
            dataDescription: 'systemPrompt',
            dataHash: sha256Hex32(agent.systemPrompt),
        });
    }

    if (agent.model) {
        entries.push({ dataDescription: 'model', dataHash: sha256Hex32(agent.model) });
    }

    return entries;
}

/** Public chainscan URL for an Agent ID token. /agents/[id] uses this
 *  to deep-link a judge straight to the on-chain NFT page. */
export function agentIdTokenExplorerUrl(tokenId: string | number): string {
    const status = og0AgentIdStatus();
    return `${status.explorer}/token/${status.contract}?a=${encodeURIComponent(String(tokenId))}`;
}

/** Public chainscan URL for the deployed AgenticID contract itself.
 *  Useful for /docs explaining the standard. */
export function agentIdContractExplorerUrl(): string {
    const status = og0AgentIdStatus();
    return `${status.explorer}/address/${status.contract}`;
}

/**
 * Minimal ABI fragment for the AgenticID contract. Only the calls
 * we need from a Node script:
 *   - mint(address to) payable returns (uint256)
 *   - setTokenURI(uint256, string)
 *   - tokenURI(uint256) view returns (string)
 *   - ownerOf(uint256) view returns (address)
 *   - getIntelligentDatas(uint256) view returns ((string, bytes32)[])
 *
 * setIntelligentData is internal in the reference impl; the public
 * "set the data" path goes through iMint or iMintWithRole. For our
 * one-off mint script we expect iMintWithRole to be available since
 * the operator wallet will be granted MINTER_ROLE.
 *
 * Real ABI gets fetched from chainscan at script runtime. This
 * fragment exists as a typed compile-time stub so the rest of the
 * module is import-safe.
 */
export const AGENT_ID_ABI = [
    'function mint(address to) payable returns (uint256)',
    'function mintWithRole(address to) returns (uint256)',
    'function setTokenURI(uint256 tokenId, string uri)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function getIntelligentDatas(uint256 tokenId) view returns (tuple(string dataDescription, bytes32 dataHash)[])',
] as const;
