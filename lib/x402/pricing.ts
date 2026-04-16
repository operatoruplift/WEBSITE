/**
 * x402 pricing table — shared between server and client.
 *
 * Keys are `${tool}.${action}`. `null` = free (read actions).
 * Non-null = gated — the middleware requires X-Payment-Proof before
 * executing, and the modal shows the price before the user approves.
 *
 * Loops House hackathon (Challenge 02): $0.01 USDC per write action
 * on Solana devnet. Reads stay free so list + search don't cost money.
 */

export type ToolPrice = {
    amount: number;          // USDC
    currency: 'USDC';
    chain: 'solana-devnet' | 'solana-mainnet';
    description: string;
};

export const TOOL_PRICING: Record<string, ToolPrice | null> = {
    // Calendar — reads free, writes gated
    'calendar.list': null,
    'calendar.free_slots': null,
    'calendar.create': { amount: 0.01, currency: 'USDC', chain: 'solana-devnet', description: 'Create a calendar event' },

    // Gmail — reads free, writes gated
    'gmail.list': null,
    'gmail.read': null,
    'gmail.draft': { amount: 0.01, currency: 'USDC', chain: 'solana-devnet', description: 'Draft an email' },
    'gmail.send': { amount: 0.01, currency: 'USDC', chain: 'solana-devnet', description: 'Send an email' },
    'gmail.send_draft': { amount: 0.01, currency: 'USDC', chain: 'solana-devnet', description: 'Send an existing draft' },
};

/**
 * Look up the price for a tool action. Returns null for free actions
 * or unknown tool/action combos (default fail-open for reads).
 */
export function getToolPrice(tool: string, action: string): ToolPrice | null {
    return TOOL_PRICING[`${tool}.${action}`] ?? null;
}

/** Check whether an action is gated (needs payment). */
export function isGatedAction(tool: string, action: string): boolean {
    return getToolPrice(tool, action) !== null;
}

/** Treasury wallet that receives x402 payments. */
export const TREASURY_WALLET =
    process.env.NEXT_PUBLIC_TREASURY_WALLET || 'UpL1ft11111111111111111111111111111111111111';

/** USDC mint on Solana devnet */
export const USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
