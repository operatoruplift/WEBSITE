/**
 * Off-platform waitlist base + public-total helper.
 *
 * Lives in its own module (no Supabase / server imports) so it can be
 * pulled into both the server-side counts API and the client-side
 * hero counter without dragging server code into the browser bundle.
 *
 * Why a base and not the raw Supabase total?
 *   - The Supabase `waitlist` table only counts email submissions made
 *     on this site. The real waitlist also includes people who pledged
 *     via Discord, X DMs, founder direct outreach, and the earliest
 *     pilot cohort that predates the /waitlist page.
 *   - The founder-confirmed off-platform figure (2026-08-18) is 950;
 *     combined with the live table count it puts the public waitlist
 *     total at 1,000+, matching the traction cohorts on the homepage
 *     (200+ paid founding members, 1,000+ waitlist, 2,200+ beta,
 *     4,600+ pre-launch community).
 *
 * Display total = WAITLIST_OFFPLATFORM_BASE + live Supabase count, so
 * the number reads 1,000+ today and ticks up by one on every new web
 * signup, so the person submitting watches it increment in real time.
 * Once on-platform signups dwarf the base, the base stops mattering.
 *
 * Override per-environment with NEXT_PUBLIC_WAITLIST_OFFPLATFORM_BASE.
 * Bump the default whenever the founder confirms new off-platform commits.
 */
const DEFAULT_OFFPLATFORM_BASE = 950;

const parsedBase = Number(process.env.NEXT_PUBLIC_WAITLIST_OFFPLATFORM_BASE);

export const WAITLIST_OFFPLATFORM_BASE =
    Number.isFinite(parsedBase) && parsedBase >= 0
        ? parsedBase
        : DEFAULT_OFFPLATFORM_BASE;

/**
 * Public-facing waitlist total = off-platform base + live table count.
 * Negative inputs (shouldn't happen) are clamped to 0 so the base is
 * always the floor.
 */
export function toDisplayTotal(rawCount: number): number {
    return WAITLIST_OFFPLATFORM_BASE + Math.max(0, rawCount);
}

/**
 * Solana recipient for every on-chain waitlist payment (Founder Member
 * $5 + the skip-the-line tiers). Defaults to the Founder treasury that
 * `FOUNDER_TIER.recipientSolana` already uses so there is a single
 * source of truth; override per-environment with NEXT_PUBLIC_TREASURY_WALLET
 * if skip funds should route to a different wallet.
 *
 * Lives here (client-safe, no server imports) because both the browser
 * checkout (builds the transfer) and the server skip verifier (confirms
 * the transfer landed) need the same address.
 */
const DEFAULT_PAYMENT_RECIPIENT = 'Hory1jnLvqdaiFYmSVWevVSCKzfrZLTfDizoA6veVmQ2';

export const WAITLIST_PAYMENT_RECIPIENT =
    process.env.NEXT_PUBLIC_TREASURY_WALLET || DEFAULT_PAYMENT_RECIPIENT;

/** USDC SPL mint on Solana mainnet (6 decimals). */
export const USDC_MAINNET_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export const USDC_DECIMALS = 6;

/**
 * Client RPC used to fetch a recent blockhash and recipient token-account
 * state when building the transfer. Privy submits the signed transaction
 * over its own configured RPC; this endpoint is only read from. The public
 * mainnet endpoint is rate-limited but fine for one-off founder payments;
 * set NEXT_PUBLIC_SOLANA_RPC to a dedicated key for reliability.
 */
export const SOLANA_RPC_URL =
    process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';

/** Privy CAIP-2 chain id for the connected-wallet send. */
export const PRIVY_SOLANA_CHAIN = 'solana:mainnet' as const;
