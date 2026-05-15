/**
 * ERC-8004-style agent registration documents.
 *
 * Each registered agent has a stable JSON manifest published at
 * `/agents/{id}.json` describing what it does, what it can do, where
 * to call it, and what it costs.
 *
 * The `checksum` field is SHA-256 of the canonical form of the
 * document (all fields EXCEPT the checksum itself). Clients can
 * verify the document hasn't been tampered with by recomputing it.
 *
 * This is the static version of what would be an on-chain ERC-721
 * agent NFT, the NFT metadata would point at this URI.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { canonicalJson } from '@/lib/x402/invoices';
import { agentIdTokenExplorerUrl } from '@/lib/og/agent-id';

export interface AgentCapability {
    tool: string;
    action: string;
    description: string;
    /** Whether the action requires payment (x402 gated) */
    paid: boolean;
    /** Price in USDC per call if paid */
    amount_usdc?: number;
}

export interface AgentEndpoint {
    method: string;
    url: string;
    description: string;
}

export interface AgentRegistration {
    /** Unique agent id */
    id: string;
    /** Display name */
    name: string;
    description: string;
    version: string;
    /** Who published this agent */
    publisher: {
        name: string;
        url: string;
    };
    /** ERC-8004-style capabilities array */
    capabilities: AgentCapability[];
    /** Where to call this agent */
    endpoints: AgentEndpoint[];
    /** Pricing metadata */
    pricing: {
        model: 'x402';
        chain: string;
        currency: string;
    };
    /** Receipt public key URL for verification */
    receipt_public_key_url: string;
    /** When this registration was last updated */
    updated_at: string;
    /** Optional on-chain identity for this agent: an ERC-7857
     *  Intelligent NFT minted into the 0G Foundation reference
     *  AgenticID contract on 0G Galileo Testnet. Populated by
     *  scripts/og-agent-id-mint.mjs; absent until the operator
     *  funds the mint wallet and runs the script. */
    og_agent_id?: {
        token_id: number;
        contract: string;
        network: 'galileo-testnet';
        standard: 'ERC-7857';
        explorer_url: string;
    };
    /** SHA-256 hex of canonicalJson(registration without checksum) */
    checksum: string;
}

interface OgAgentIdsFile {
    _contract: string;
    _network: string;
    _explorer: string;
    _standard: string;
    agents: Record<string, number | null>;
}

let cachedOgAgentIds: OgAgentIdsFile | null | undefined;

function readOgAgentIds(): OgAgentIdsFile | null {
    if (cachedOgAgentIds !== undefined) return cachedOgAgentIds;
    try {
        const filePath = path.join(process.cwd(), 'data', 'og-agent-ids.json');
        const raw = fs.readFileSync(filePath, 'utf-8');
        cachedOgAgentIds = JSON.parse(raw) as OgAgentIdsFile;
    } catch {
        cachedOgAgentIds = null;
    }
    return cachedOgAgentIds;
}

function ogAgentIdFor(slug: string): AgentRegistration['og_agent_id'] {
    const file = readOgAgentIds();
    if (!file) return undefined;
    const tokenId = file.agents?.[slug];
    if (typeof tokenId !== 'number') return undefined;
    return {
        token_id: tokenId,
        contract: file._contract,
        network: 'galileo-testnet',
        standard: 'ERC-7857',
        explorer_url: agentIdTokenExplorerUrl(tokenId),
    };
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://operatoruplift.com';
const UPDATED_AT = '2026-04-16T00:00:00Z';

/** Build an agent registration and compute its checksum. The og_agent_id
 *  is folded in from data/og-agent-ids.json BEFORE the checksum is
 *  computed, so the document hash covers the on-chain pointer too. */
function buildRegistration(
    fields: Omit<AgentRegistration, 'checksum' | 'og_agent_id'>,
): AgentRegistration {
    const ogAgentId = ogAgentIdFor(slugFromId(fields.id));
    const fieldsWithOg = ogAgentId ? { ...fields, og_agent_id: ogAgentId } : fields;
    const canonical = canonicalJson(fieldsWithOg);
    const checksum = crypto.createHash('sha256').update(canonical).digest('hex');
    return { ...fieldsWithOg, checksum };
}

/** Map our agent ids (operator-uplift.calendar) to the short slug used
 *  in the public registry route (/agents/calendar.json) and in
 *  data/og-agent-ids.json. */
function slugFromId(id: string): string {
    const dot = id.lastIndexOf('.');
    return dot >= 0 ? id.slice(dot + 1) : id;
}

export const CALENDAR_AGENT: AgentRegistration = buildRegistration({
    id: 'operator-uplift.calendar',
    name: 'Calendar Agent',
    description: 'Reads your Google Calendar, finds conflicts, suggests optimal meeting times, and creates events. Every write action is gated by x402 and produces a signed receipt.',
    version: '1.0.0',
    publisher: {
        name: 'Operator Uplift',
        url: BASE_URL,
    },
    capabilities: [
        {
            tool: 'calendar',
            action: 'list',
            description: 'List upcoming events',
            paid: false,
        },
        {
            tool: 'calendar',
            action: 'free_slots',
            description: 'Find open time slots',
            paid: false,
        },
        {
            tool: 'calendar',
            action: 'create',
            description: 'Create a calendar event',
            paid: true,
            amount_usdc: 0.01,
        },
    ],
    endpoints: [
        {
            method: 'POST',
            url: `${BASE_URL}/api/tools/calendar`,
            description: 'Tool execution endpoint. Returns 402 on gated actions without X-Payment-Proof.',
        },
        {
            method: 'POST',
            url: `${BASE_URL}/api/tools/x402/pay`,
            description: 'Pay an invoice. Body: { invoice_reference }. Returns { status, tx_signature }.',
        },
    ],
    pricing: {
        model: 'x402',
        chain: 'solana-devnet',
        currency: 'USDC',
    },
    receipt_public_key_url: `${BASE_URL}/api/receipts/public-key`,
    updated_at: UPDATED_AT,
});

export const GMAIL_AGENT: AgentRegistration = buildRegistration({
    id: 'operator-uplift.gmail',
    name: 'Gmail Agent',
    description: 'Reads your Gmail inbox and drafts, sends, or creates drafts. Every write action is gated by x402 and produces a signed receipt.',
    version: '1.0.0',
    publisher: {
        name: 'Operator Uplift',
        url: BASE_URL,
    },
    capabilities: [
        {
            tool: 'gmail',
            action: 'list',
            description: 'List inbox messages',
            paid: false,
        },
        {
            tool: 'gmail',
            action: 'read',
            description: 'Read a specific message',
            paid: false,
        },
        {
            tool: 'gmail',
            action: 'draft',
            description: 'Create an email draft',
            paid: true,
            amount_usdc: 0.01,
        },
        {
            tool: 'gmail',
            action: 'send_draft',
            description: 'Send an existing draft',
            paid: true,
            amount_usdc: 0.01,
        },
        {
            tool: 'gmail',
            action: 'send',
            description: 'Compose and send an email',
            paid: true,
            amount_usdc: 0.01,
        },
    ],
    endpoints: [
        {
            method: 'POST',
            url: `${BASE_URL}/api/tools/gmail`,
            description: 'Tool execution endpoint. Returns 402 on gated actions without X-Payment-Proof.',
        },
        {
            method: 'POST',
            url: `${BASE_URL}/api/tools/x402/pay`,
            description: 'Pay an invoice. Body: { invoice_reference }. Returns { status, tx_signature }.',
        },
    ],
    pricing: {
        model: 'x402',
        chain: 'solana-devnet',
        currency: 'USDC',
    },
    receipt_public_key_url: `${BASE_URL}/api/receipts/public-key`,
    updated_at: UPDATED_AT,
});

/** Get registration by agent slug (used by /agents/{slug}.json route). */
export function getRegistrationBySlug(slug: string): AgentRegistration | null {
    if (slug === 'calendar') return CALENDAR_AGENT;
    if (slug === 'gmail') return GMAIL_AGENT;
    return null;
}
