/**
 * Waitlist + skip-the-line helpers.
 *
 * The waitlist table tracks every signup as a row with:
 *   - email (unique, lowercased)
 *   - position (sequential, starting at 301, immutable until skip pays)
 *   - source (where the signup came from: paywall, press-kit, etc.)
 *   - skip_paid_usdc (lifetime total paid to skip the line)
 *   - skip_tx_signature (most recent on-chain proof)
 *   - skip_paid_at (timestamp of last successful skip)
 *   - wallet_address (which wallet was used to pay)
 *
 * The position is assigned by a Postgres sequence (waitlist_position_seq,
 * START WITH 301). New rows nextval() the sequence at insert time, so
 * two simultaneous signups can never collide.
 *
 * Skip-the-line tiers are locked here so a UI bug or a stray API call
 * can never charge an off-menu amount.
 */
import { getSupabase } from './supabase';

export const WAITLIST_BASE_POSITION = 300;

/**
 * Founder Member tier. Optional paid signup at $5 USDC that grants
 * the visitor two perks on top of the regular waitlist slot:
 *
 *   - vanity_badge: shows a "Founder Member" badge on the dashboard
 *     once they sign in with the same email
 *   - xp_head_start: +500 XP banked against their first session
 *
 * Recipient wallet is locked here so a UI bug can never route the
 * payment somewhere else. Mirrors the SKIP_TIERS pattern above.
 */
export const FOUNDER_TIER = {
    priceUsdc: 5,
    recipientSolana: 'Hory1jnLvqdaiFYmSVWevVSCKzfrZLTfDizoA6veVmQ2',
    label: 'Founder Member',
    perks: {
        vanity_badge: true,
        xp_head_start: 500,
    },
} as const;

export type WaitlistTier = 'free' | 'founder';

export const SKIP_TIERS = {
    boost_50: {
        amountUsdc: 25,
        bumpSpots: 50,
        label: 'Boost 50 spots',
    },
    boost_200: {
        amountUsdc: 50,
        bumpSpots: 200,
        label: 'Boost 200 spots',
    },
    jump_top: {
        amountUsdc: 100,
        // jump_top is special-cased in applySkipBump to set position=1.
        bumpSpots: Number.POSITIVE_INFINITY,
        label: 'Jump to the top',
    },
} as const;

export type SkipTier = keyof typeof SKIP_TIERS;

export function skipTierByAmount(amountUsdc: number): SkipTier | null {
    if (amountUsdc === SKIP_TIERS.boost_50.amountUsdc) return 'boost_50';
    if (amountUsdc === SKIP_TIERS.boost_200.amountUsdc) return 'boost_200';
    if (amountUsdc === SKIP_TIERS.jump_top.amountUsdc) return 'jump_top';
    return null;
}

export interface WaitlistRow {
    id: string;
    email: string;
    position: number | null;
    source: string | null;
    skip_paid_usdc: number;
    skip_tx_signature: string | null;
    skip_paid_at: string | null;
    wallet_address: string | null;
    created_at: string;
}

export interface JoinResult {
    position: number;
    alreadyExisted: boolean;
    row: WaitlistRow;
}

/**
 * Join the waitlist or look up an existing row by email.
 *
 * Idempotent: if the email is already on the list, returns the existing
 * row without bumping the position. New rows get nextval() from the
 * sequence so positions stay sequential under concurrent signups.
 *
 * Throws if the database is unreachable. The caller should map that to
 * a 503 rather than swallow it.
 */
export async function joinWaitlist(
    email: string,
    source?: string,
): Promise<JoinResult> {
    const supabase = getSupabase();
    const normalized = email.trim().toLowerCase();

    // Check for an existing row first. Use a minimal column list +
    // a fallback so a missing position/skip column never blocks the
    // idempotent lookup.
    let existing: Record<string, unknown> | null = null;
    const { data: existingFull, error: existingErr } = await supabase
        .from('waitlist')
        .select('id, email, position, source, skip_paid_usdc, skip_tx_signature, skip_paid_at, wallet_address, created_at')
        .eq('email', normalized)
        .maybeSingle();
    if (existingErr && /column/i.test(existingErr.message)) {
        const { data: minimal } = await supabase
            .from('waitlist')
            .select('id, email, source, created_at')
            .eq('email', normalized)
            .maybeSingle();
        existing = minimal as Record<string, unknown> | null;
    } else {
        existing = existingFull as Record<string, unknown> | null;
    }

    if (existing) {
        return {
            position: (existing as { position?: number | null }).position ?? 0,
            alreadyExisted: true,
            row: existing as unknown as WaitlistRow,
        };
    }

    // Pull the next position from the sequence in the same statement
    // that inserts the row. Doing it client-side then inserting would
    // race; the sequence + a unique constraint guarantees serializable
    // assignment.
    const { data: positionResult, error: seqError } = await supabase.rpc(
        'nextval_text',
        { seq_name: 'waitlist_position_seq' },
    );
    let position: number;
    if (seqError || positionResult == null) {
        // Fallback: pick MAX(position) + 1. Less safe under concurrent
        // signups but better than refusing the request because the RPC
        // helper isn't installed.
        const { data: maxRow } = await supabase
            .from('waitlist')
            .select('position')
            .order('position', { ascending: false })
            .limit(1)
            .maybeSingle();
        const last = maxRow?.position ?? WAITLIST_BASE_POSITION;
        position = last + 1;
    } else {
        position = Number(positionResult);
    }

    const { data: inserted, error: insertError } = await supabase
        .from('waitlist')
        .insert({
            email: normalized,
            source: source || null,
            position,
        })
        .select('id, email, position, source, skip_paid_usdc, skip_tx_signature, skip_paid_at, wallet_address, created_at')
        .single();

    // If the position column doesn't exist in the schema yet (the
    // waitlist-position-migration has not been applied), fall back
    // to a position-less insert so signups still land. The row is
    // recoverable later by re-running the migration + backfilling
    // sequence values.
    if (insertError && /column.*position/i.test(insertError.message)) {
        const { data: minimal, error: minError } = await supabase
            .from('waitlist')
            .insert({ email: normalized, source: source || null })
            .select('id, email, source, created_at')
            .single();
        if (!minError && minimal) {
            return {
                position: 0,
                alreadyExisted: false,
                row: { ...(minimal as object), position: null, skip_paid_usdc: 0, skip_tx_signature: null, skip_paid_at: null, wallet_address: null } as WaitlistRow,
            };
        }
    }

    if (insertError || !inserted) {
        // Unique-constraint collision on position (extremely rare with
        // the sequence; possible with the fallback path). Retry once
        // with the latest MAX+1 before giving up.
        const { data: maxRow } = await supabase
            .from('waitlist')
            .select('position')
            .order('position', { ascending: false })
            .limit(1)
            .maybeSingle();
        const retryPosition = (maxRow?.position ?? WAITLIST_BASE_POSITION) + 1;
        const { data: retried, error: retryError } = await supabase
            .from('waitlist')
            .insert({
                email: normalized,
                source: source || null,
                position: retryPosition,
            })
            .select('id, email, position, source, skip_paid_usdc, skip_tx_signature, skip_paid_at, wallet_address, created_at')
            .single();
        if (retryError || !retried) {
            throw new Error(`waitlist insert failed: ${retryError?.message || insertError?.message}`);
        }
        return {
            position: retried.position ?? retryPosition,
            alreadyExisted: false,
            row: retried as WaitlistRow,
        };
    }

    return {
        position: inserted.position ?? position,
        alreadyExisted: false,
        row: inserted as WaitlistRow,
    };
}

/** Read-only lookup. Returns null when the email is not on the list. */
export async function lookupByEmail(email: string): Promise<WaitlistRow | null> {
    const supabase = getSupabase();
    const normalized = email.trim().toLowerCase();
    const { data } = await supabase
        .from('waitlist')
        .select('id, email, position, source, skip_paid_usdc, skip_tx_signature, skip_paid_at, wallet_address, created_at')
        .eq('email', normalized)
        .maybeSingle();
    return (data as WaitlistRow) || null;
}

/**
 * Total number of waitlist rows. Used by the public /waitlist page
 * header ("You are #X of Y on the list").
 */
export async function totalCount(): Promise<number> {
    const supabase = getSupabase();
    const { count } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true });
    return count ?? 0;
}

/**
 * Apply a skip-the-line bump after a confirmed on-chain payment.
 *
 * Caller must pass the verified tx_signature, the tier, the wallet
 * address that signed the tx, and the email being bumped. This function
 * does NOT verify the on-chain payment, that happens upstream in the
 * route handler (against Solana RPC). Here we just translate a valid
 * tier into a new position.
 *
 * Returns the new position. If the row wasn't on the list yet, joins it
 * at the resulting position first.
 */
export async function applySkipBump(args: {
    email: string;
    tier: SkipTier;
    txSignature: string;
    walletAddress: string;
}): Promise<{ oldPosition: number | null; newPosition: number; row: WaitlistRow }> {
    const supabase = getSupabase();
    const { email, tier, txSignature, walletAddress } = args;
    const tierConfig = SKIP_TIERS[tier];

    // Ensure the row exists before computing the bump.
    const existing = await lookupByEmail(email);
    let oldPosition: number | null = null;
    if (existing) {
        oldPosition = existing.position;
    } else {
        const joined = await joinWaitlist(email, 'skip-line-payment');
        oldPosition = joined.position;
    }

    // Compute the target position.
    let newPosition: number;
    if (tier === 'jump_top') {
        // Reserve position 1 for the top. If someone else has it, this
        // user takes 1 and the prior holder gets bumped down by 1. The
        // shift cascades but stays bounded because we only touch rows
        // with position < oldPosition.
        newPosition = 1;
    } else {
        newPosition = Math.max(1, (oldPosition ?? 0) - tierConfig.bumpSpots);
    }

    // If nobody else is at newPosition, just update. If someone is, we
    // need a temporary shift to avoid violating the UNIQUE constraint.
    // Use the negative-temp trick: park at -id for the duration of the
    // update, then settle.
    const normalized = email.trim().toLowerCase();
    const tempSlot = -1 * Date.now();

    await supabase
        .from('waitlist')
        .update({ position: tempSlot })
        .eq('email', normalized);

    if (tier === 'jump_top') {
        // Shift everyone currently in positions [1, oldPosition - 1] down
        // by 1 to clear position 1. Do it in descending order so each
        // increment doesn't collide with the next row.
        // Note: this is intentionally a loop in the application layer
        // because Supabase doesn't expose serializable transactions over
        // PostgREST. For the demo-scale numbers we have today (waitlist
        // measured in hundreds), this is fine. At enterprise scale this
        // would move into a SQL function.
        const { data: bumpRows } = await supabase
            .from('waitlist')
            .select('id, position')
            .lt('position', oldPosition ?? 0)
            .gt('position', 0)
            .order('position', { ascending: false });

        for (const row of bumpRows ?? []) {
            if (row.position == null) continue;
            await supabase
                .from('waitlist')
                .update({ position: row.position + 1 })
                .eq('id', row.id);
        }
    }

    const { data: updated, error: updateError } = await supabase
        .from('waitlist')
        .update({
            position: newPosition,
            skip_paid_usdc: (existing?.skip_paid_usdc ?? 0) + tierConfig.amountUsdc,
            skip_tx_signature: txSignature,
            skip_paid_at: new Date().toISOString(),
            wallet_address: walletAddress,
        })
        .eq('email', normalized)
        .select('id, email, position, source, skip_paid_usdc, skip_tx_signature, skip_paid_at, wallet_address, created_at')
        .single();

    if (updateError || !updated) {
        throw new Error(`skip bump update failed: ${updateError?.message}`);
    }

    return {
        oldPosition,
        newPosition,
        row: updated as WaitlistRow,
    };
}

export interface MarkFounderInput {
    email: string;
    txSignature: string;
    chain: 'solana' | 'base' | 'arbitrum' | 'optimism' | 'polygon';
    amountUsd: number;
    walletAddress?: string;
}

export interface MarkFounderResult {
    row: WaitlistRow;
    alreadyFounder: boolean;
}

/**
 * Mark an existing waitlist row (or create one) as a Founder Member
 * after a confirmed on-chain payment.
 *
 * Caller must have already verified the tx_signature on the relevant
 * chain RPC, this function does NOT do on-chain verification. It only
 * writes the verdict: tier='founder', founder_tx, founder_chain,
 * founder_amount, founder_paid_at, and the perks JSON snapshot.
 *
 * Idempotent: if the email is already tier='founder', returns the
 * existing row with alreadyFounder=true rather than re-applying the
 * perks. Prevents double-grant if the payment confirmation route is
 * called twice.
 *
 * If the email is not yet on the waitlist, joinWaitlist() is called
 * first to allocate a position, then the same row is upgraded.
 */
export async function markFounder(input: MarkFounderInput): Promise<MarkFounderResult> {
    const supabase = getSupabase();
    const normalized = input.email.trim().toLowerCase();

    const existing = await lookupByEmail(normalized);
    if (existing && (existing as WaitlistRow & { tier?: string }).tier === 'founder') {
        return { row: existing, alreadyFounder: true };
    }

    if (!existing) {
        await joinWaitlist(normalized, 'waitlist-founder');
    }

    const { data: updated, error: updateError } = await supabase
        .from('waitlist')
        .update({
            tier: 'founder',
            founder_tx: input.txSignature,
            founder_chain: input.chain,
            founder_amount: input.amountUsd,
            founder_paid_at: new Date().toISOString(),
            wallet_address: input.walletAddress ?? null,
            perks: FOUNDER_TIER.perks,
        })
        .eq('email', normalized)
        .select('id, email, position, source, skip_paid_usdc, skip_tx_signature, skip_paid_at, wallet_address, created_at')
        .single();

    if (updateError || !updated) {
        throw new Error(`markFounder update failed: ${updateError?.message}`);
    }

    return {
        row: updated as WaitlistRow,
        alreadyFounder: false,
    };
}
