/**
 * x402 pricing table, shared between server and client.
 *
 * Keys are `${tool}.${action}`. `null` = free (read actions).
 * Non-null = gated, the middleware requires X-Payment-Proof before
 * executing, and the modal shows the price before the user approves.
 *
 * Demo / testnet phase: $0.01 USDC per gated write action on Solana
 * devnet. Reads stay free so list + search don't cost money.
 * Production mainnet pricing is decided separately at Phase 8 cutover.
 *
 * Amounts are stored as decimal strings (e.g. '0.01') plus a token
 * `decimals` field. This avoids JS float precision loss the moment
 * a price is not a clean two-decimal value. Convert to bigint base
 * units via `parseDecimalAmount` in `lib/x402/amount.ts` for any
 * arithmetic; convert to a Number only when writing to a numeric
 * DB column.
 */

/** USDC has 6 decimal places on Solana (mainnet + devnet). */
export const USDC_DECIMALS = 6;

export type ToolPrice = {
    amount: string;          // human-readable decimal, e.g. '0.01'
    decimals: number;        // base-unit divisor; 6 for USDC
    currency: 'USDC';
    chain: 'solana-devnet' | 'solana-mainnet';
    description: string;
};

export const TOOL_PRICING: Record<string, ToolPrice | null> = {
    // Calendar, reads free, writes gated
    'calendar.list': null,
    'calendar.free_slots': null,
    'calendar.create': { amount: '0.01', decimals: USDC_DECIMALS, currency: 'USDC', chain: 'solana-devnet', description: 'Create a calendar event' },

    // Gmail, reads free, writes gated
    'gmail.list': null,
    'gmail.read': null,
    'gmail.draft': { amount: '0.01', decimals: USDC_DECIMALS, currency: 'USDC', chain: 'solana-devnet', description: 'Draft an email' },
    'gmail.send': { amount: '0.01', decimals: USDC_DECIMALS, currency: 'USDC', chain: 'solana-devnet', description: 'Send an email' },
    'gmail.send_draft': { amount: '0.01', decimals: USDC_DECIMALS, currency: 'USDC', chain: 'solana-devnet', description: 'Send an existing draft' },
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
