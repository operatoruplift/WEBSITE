//! Operator Uplift commitment-staking escrow.
//!
//! Users stake USDC on a daily-habit cohort ("bet on yourself"). Each day
//! the settlement authority (the impartial AI Game Master) attests a proof.
//! Finish every day and you reclaim your full stake plus accrued yield plus
//! a share of the stakes forfeited by people who quit. Miss a day and your
//! stake stays in the pool and is redistributed to the finishers.
//!
//! Economics mirror the off-chain app: 1% protocol fee, 4.5% simple-interest
//! APY, forfeited stakes split evenly among finishers after a 1% cut.
//!
//! SECURITY: holds real funds. MUST be audited before mainnet. Redistribution
//! uses a pull pattern (finishers claim) to avoid unbounded loops; a keeper
//! must `lapse_enrollment` every incomplete enrollment after the window closes
//! before `settle_challenge`, exactly as the app resolves lapses before settle.

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

mod constants;
mod errors;
mod state;

use constants::*;
use errors::EscrowError;
use state::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod uplift_escrow {
    use super::*;

    /// One-time global setup. `admin` funds config + creates the PDA-owned
    /// yield reserve; `settlement_authority` is the proof-attesting key.
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        settlement_authority: Pubkey,
        protocol_fee_bps: u16,
        yield_apy_bps: u16,
    ) -> Result<()> {
        require!(protocol_fee_bps <= MAX_PROTOCOL_FEE_BPS, EscrowError::FeeTooHigh);
        require!(yield_apy_bps <= MAX_YIELD_APY_BPS, EscrowError::ApyTooHigh);

        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.settlement_authority = settlement_authority;
        config.stake_mint = ctx.accounts.stake_mint.key();
        config.treasury = ctx.accounts.treasury.key();
        config.yield_reserve = ctx.accounts.yield_reserve.key();
        config.protocol_fee_bps = protocol_fee_bps;
        config.yield_apy_bps = yield_apy_bps;
        config.bump = ctx.bumps.config;
        config.vault_authority_bump = ctx.bumps.vault_authority;
        Ok(())
    }

    /// Top up the yield reserve. Anyone may fund it; in production a yield
    /// strategy deposits the interest earned on idle escrow here.
    pub fn fund_yield_reserve(ctx: Context<FundYieldReserve>, amount: u64) -> Result<()> {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.funder_token_account.to_account_info(),
                    to: ctx.accounts.yield_reserve.to_account_info(),
                    authority: ctx.accounts.funder.to_account_info(),
                },
            ),
            amount,
        )
    }

    /// Admin opens a cohort with its own escrow vault.
    pub fn create_challenge(
        ctx: Context<CreateChallenge>,
        challenge_id: u64,
        days: u16,
        per_day: u64,
        fee_free: bool,
        start_ts: i64,
    ) -> Result<()> {
        require!(days > 0 && per_day > 0, EscrowError::InvalidChallengeParams);
        let stake_amount = (days as u64)
            .checked_mul(per_day)
            .ok_or(EscrowError::MathOverflow)?;
        let end_ts = start_ts
            .checked_add((days as i64).checked_mul(SECONDS_PER_DAY).ok_or(EscrowError::MathOverflow)?)
            .ok_or(EscrowError::MathOverflow)?;

        let c = &mut ctx.accounts.challenge;
        c.challenge_id = challenge_id;
        c.days = days;
        c.per_day = per_day;
        c.stake_amount = stake_amount;
        c.start_ts = start_ts;
        c.end_ts = end_ts;
        c.fee_free = fee_free;
        c.vault = ctx.accounts.vault.key();
        c.members = 0;
        c.finishers = 0;
        c.active_stake = 0;
        c.forfeited_pool = 0;
        c.per_finisher_bonus = 0;
        c.settled = false;
        c.bump = ctx.bumps.challenge;
        Ok(())
    }

    /// Lock a stake into the cohort. Charges the 1% enrollment fee (unless the
    /// cohort is fee-free) straight to the treasury; the stake goes to escrow.
    pub fn enroll(ctx: Context<Enroll>, _challenge_id: u64) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let c = &mut ctx.accounts.challenge;
        require!(!c.settled, EscrowError::AlreadySettled);
        require!(now < c.end_ts, EscrowError::CohortClosed);

        let stake = c.stake_amount;
        let fee = if c.fee_free {
            0
        } else {
            (stake as u128)
                .checked_mul(ctx.accounts.config.protocol_fee_bps as u128)
                .and_then(|v| v.checked_div(BPS_DENOMINATOR as u128))
                .ok_or(EscrowError::MathOverflow)? as u64
        };

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            stake,
        )?;
        if fee > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.user_token_account.to_account_info(),
                        to: ctx.accounts.treasury.to_account_info(),
                        authority: ctx.accounts.user.to_account_info(),
                    },
                ),
                fee,
            )?;
        }

        let e = &mut ctx.accounts.enrollment;
        e.user = ctx.accounts.user.key();
        e.challenge = c.key();
        e.stake = stake;
        e.proven_days = 0;
        e.status = EnrollmentStatus::Active as u8;
        e.created_ts = now;
        e.stake_claimed = false;
        e.bonus_claimed = false;
        e.bump = ctx.bumps.enrollment;

        c.members = c.members.checked_add(1).ok_or(EscrowError::MathOverflow)?;
        c.active_stake = c.active_stake.checked_add(stake).ok_or(EscrowError::MathOverflow)?;
        Ok(())
    }

    /// The settlement authority attests one day's proof. On the final day the
    /// stake plus accrued interest is returned immediately (matching the app);
    /// the forfeited-pool bonus is claimed later via `claim_bonus`.
    pub fn submit_proof(ctx: Context<SubmitProof>, _challenge_id: u64) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let c = &mut ctx.accounts.challenge;
        let e = &mut ctx.accounts.enrollment;
        require!(e.status == EnrollmentStatus::Active as u8, EscrowError::EnrollmentNotActive);
        require!(now >= c.start_ts, EscrowError::CohortNotStarted);
        require!(now <= c.end_ts, EscrowError::CohortClosed);
        require!(e.proven_days < c.days, EscrowError::ChallengeAlreadyComplete);

        // One proof per calendar day of the window: `current_day` is 1-indexed.
        let elapsed = now.checked_sub(c.start_ts).ok_or(EscrowError::MathOverflow)?;
        let current_day = (elapsed / SECONDS_PER_DAY) + 1;
        require!((e.proven_days as i64) < current_day, EscrowError::ProofAlreadyIn);

        e.proven_days = e.proven_days.checked_add(1).ok_or(EscrowError::MathOverflow)?;

        if e.proven_days == c.days {
            // Finisher: return stake + interest now; count them for the split.
            let interest = simple_interest(
                e.stake,
                ctx.accounts.config.yield_apy_bps,
                c.days,
            )?;
            require!(
                ctx.accounts.yield_reserve.amount >= interest,
                EscrowError::InsufficientYieldReserve
            );

            let seeds: &[&[u8]] = &[VAULT_AUTHORITY_SEED, &[ctx.accounts.config.vault_authority_bump]];
            let signer = &[seeds];

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.user_token_account.to_account_info(),
                        authority: ctx.accounts.vault_authority.to_account_info(),
                    },
                    signer,
                ),
                e.stake,
            )?;
            if interest > 0 {
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.yield_reserve.to_account_info(),
                            to: ctx.accounts.user_token_account.to_account_info(),
                            authority: ctx.accounts.vault_authority.to_account_info(),
                        },
                        signer,
                    ),
                    interest,
                )?;
            }

            e.status = EnrollmentStatus::Won as u8;
            e.stake_claimed = true;
            c.finishers = c.finishers.checked_add(1).ok_or(EscrowError::MathOverflow)?;
            c.active_stake = c.active_stake.checked_sub(e.stake).ok_or(EscrowError::MathOverflow)?;
        }
        Ok(())
    }

    /// The user quits. Within the 24h grace window the stake is refunded in
    /// full; otherwise it moves into the forfeited pool for the finishers.
    pub fn forfeit(ctx: Context<UserResolve>, _challenge_id: u64) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let c = &mut ctx.accounts.challenge;
        let e = &mut ctx.accounts.enrollment;
        require!(e.status == EnrollmentStatus::Active as u8, EscrowError::EnrollmentNotActive);

        let free_cancel = now.checked_sub(e.created_ts).ok_or(EscrowError::MathOverflow)? < FREE_CANCEL_WINDOW;
        c.active_stake = c.active_stake.checked_sub(e.stake).ok_or(EscrowError::MathOverflow)?;
        e.status = EnrollmentStatus::Forfeited as u8;

        if free_cancel {
            let seeds: &[&[u8]] = &[VAULT_AUTHORITY_SEED, &[ctx.accounts.config.vault_authority_bump]];
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.user_token_account.to_account_info(),
                        authority: ctx.accounts.vault_authority.to_account_info(),
                    },
                    &[seeds],
                ),
                e.stake,
            )?;
            e.stake_claimed = true;
        } else {
            c.forfeited_pool = c.forfeited_pool.checked_add(e.stake).ok_or(EscrowError::MathOverflow)?;
        }
        Ok(())
    }

    /// Permissionless: forfeit an enrollment that missed a required day or
    /// whose window has closed without finishing. The stake joins the pool.
    /// A keeper must lapse every incomplete enrollment before settlement.
    pub fn lapse_enrollment(ctx: Context<Lapse>, _challenge_id: u64) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let c = &mut ctx.accounts.challenge;
        let e = &mut ctx.accounts.enrollment;
        require!(e.status == EnrollmentStatus::Active as u8, EscrowError::EnrollmentNotActive);

        // Days that were due before now, capped at the challenge length.
        let elapsed = now.checked_sub(c.start_ts).ok_or(EscrowError::MathOverflow)?.max(0);
        let due = ((elapsed / SECONDS_PER_DAY).min(c.days as i64)) as u16;
        let window_closed = now >= c.end_ts;
        require!(window_closed || e.proven_days < due, EscrowError::NotLapsable);

        c.active_stake = c.active_stake.checked_sub(e.stake).ok_or(EscrowError::MathOverflow)?;
        c.forfeited_pool = c.forfeited_pool.checked_add(e.stake).ok_or(EscrowError::MathOverflow)?;
        e.status = EnrollmentStatus::Forfeited as u8;
        Ok(())
    }

    /// Permissionless, after the window closes: take the protocol cut of the
    /// forfeited pool to the treasury and fix the per-finisher bonus rate.
    /// Finishers then pull their bonus via `claim_bonus`.
    pub fn settle_challenge(ctx: Context<SettleChallenge>, _challenge_id: u64) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let c = &mut ctx.accounts.challenge;
        require!(!c.settled, EscrowError::AlreadySettled);
        require!(now >= c.end_ts, EscrowError::CohortNotEnded);

        let forfeited = c.forfeited_pool as u128;
        let protocol_cut = forfeited
            .checked_mul(ctx.accounts.config.protocol_fee_bps as u128)
            .and_then(|v| v.checked_div(BPS_DENOMINATOR as u128))
            .ok_or(EscrowError::MathOverflow)? as u64;
        let bonus_pool = (c.forfeited_pool).checked_sub(protocol_cut).ok_or(EscrowError::MathOverflow)?;
        let per_finisher = if c.finishers > 0 {
            bonus_pool / (c.finishers as u64)
        } else {
            0
        };

        if protocol_cut > 0 {
            let seeds: &[&[u8]] = &[VAULT_AUTHORITY_SEED, &[ctx.accounts.config.vault_authority_bump]];
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.treasury.to_account_info(),
                        authority: ctx.accounts.vault_authority.to_account_info(),
                    },
                    &[seeds],
                ),
                protocol_cut,
            )?;
        }

        c.per_finisher_bonus = per_finisher;
        c.settled = true;
        Ok(())
    }

    /// A finisher pulls their share of the forfeited pool after settlement.
    pub fn claim_bonus(ctx: Context<ClaimBonus>, _challenge_id: u64) -> Result<()> {
        let c = &ctx.accounts.challenge;
        let e = &mut ctx.accounts.enrollment;
        require!(c.settled, EscrowError::NotSettled);
        require!(e.status == EnrollmentStatus::Won as u8, EscrowError::NotAFinisher);
        require!(!e.bonus_claimed, EscrowError::AlreadyClaimed);

        e.bonus_claimed = true;
        let bonus = c.per_finisher_bonus;
        if bonus > 0 {
            let seeds: &[&[u8]] = &[VAULT_AUTHORITY_SEED, &[ctx.accounts.config.vault_authority_bump]];
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.user_token_account.to_account_info(),
                        authority: ctx.accounts.vault_authority.to_account_info(),
                    },
                    &[seeds],
                ),
                bonus,
            )?;
        }
        Ok(())
    }
}

/// Simple-interest yield: stake * apy_bps / 10_000 * days / 365.
/// u128 intermediates keep a large stake * apy * days product from overflowing.
fn simple_interest(stake: u64, apy_bps: u16, days: u16) -> Result<u64> {
    let out = (stake as u128)
        .checked_mul(apy_bps as u128)
        .and_then(|v| v.checked_mul(days as u128))
        .and_then(|v| v.checked_div(BPS_DENOMINATOR as u128))
        .and_then(|v| v.checked_div(DAYS_PER_YEAR))
        .ok_or(EscrowError::MathOverflow)?;
    u64::try_from(out).map_err(|_| EscrowError::MathOverflow.into())
}

// ─────────────────────────── Accounts ───────────────────────────

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = Config::SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    /// CHECK: PDA that owns every vault and the yield reserve. Not read/written.
    #[account(seeds = [VAULT_AUTHORITY_SEED], bump)]
    pub vault_authority: UncheckedAccount<'info>,
    pub stake_mint: Account<'info, Mint>,
    #[account(constraint = treasury.mint == stake_mint.key() @ EscrowError::InvalidTokenAccount)]
    pub treasury: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = admin,
        seeds = [YIELD_RESERVE_SEED],
        bump,
        token::mint = stake_mint,
        token::authority = vault_authority
    )]
    pub yield_reserve: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct FundYieldReserve<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut, address = config.yield_reserve @ EscrowError::InvalidTokenAccount)]
    pub yield_reserve: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = funder_token_account.mint == config.stake_mint @ EscrowError::InvalidTokenAccount
    )]
    pub funder_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(challenge_id: u64)]
pub struct CreateChallenge<'info> {
    #[account(mut, address = config.admin @ EscrowError::NotSettlementAuthority)]
    pub admin: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    /// CHECK: PDA authority for the new vault. Not read/written.
    #[account(seeds = [VAULT_AUTHORITY_SEED], bump = config.vault_authority_bump)]
    pub vault_authority: UncheckedAccount<'info>,
    #[account(
        init,
        payer = admin,
        space = Challenge::SPACE,
        seeds = [CHALLENGE_SEED, &challenge_id.to_le_bytes()],
        bump
    )]
    pub challenge: Account<'info, Challenge>,
    #[account(address = config.stake_mint @ EscrowError::InvalidTokenAccount)]
    pub stake_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = admin,
        seeds = [VAULT_SEED, &challenge_id.to_le_bytes()],
        bump,
        token::mint = stake_mint,
        token::authority = vault_authority
    )]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(challenge_id: u64)]
pub struct Enroll<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [CHALLENGE_SEED, &challenge_id.to_le_bytes()],
        bump = challenge.bump
    )]
    pub challenge: Account<'info, Challenge>,
    #[account(
        init,
        payer = user,
        space = Enrollment::SPACE,
        seeds = [ENROLLMENT_SEED, &challenge_id.to_le_bytes(), user.key().as_ref()],
        bump
    )]
    pub enrollment: Account<'info, Enrollment>,
    #[account(mut, address = challenge.vault @ EscrowError::InvalidTokenAccount)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut, address = config.treasury @ EscrowError::InvalidTokenAccount)]
    pub treasury: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_token_account.mint == config.stake_mint @ EscrowError::InvalidTokenAccount,
        constraint = user_token_account.owner == user.key() @ EscrowError::InvalidTokenAccount
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(challenge_id: u64)]
pub struct SubmitProof<'info> {
    #[account(address = config.settlement_authority @ EscrowError::NotSettlementAuthority)]
    pub settlement_authority: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    /// CHECK: PDA authority for vault + reserve transfers. Not read/written.
    #[account(seeds = [VAULT_AUTHORITY_SEED], bump = config.vault_authority_bump)]
    pub vault_authority: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [CHALLENGE_SEED, &challenge_id.to_le_bytes()],
        bump = challenge.bump
    )]
    pub challenge: Account<'info, Challenge>,
    #[account(
        mut,
        seeds = [ENROLLMENT_SEED, &challenge_id.to_le_bytes(), enrollment.user.as_ref()],
        bump = enrollment.bump,
        has_one = challenge @ EscrowError::InvalidTokenAccount
    )]
    pub enrollment: Account<'info, Enrollment>,
    #[account(mut, address = challenge.vault @ EscrowError::InvalidTokenAccount)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut, address = config.yield_reserve @ EscrowError::InvalidTokenAccount)]
    pub yield_reserve: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_token_account.mint == config.stake_mint @ EscrowError::InvalidTokenAccount,
        constraint = user_token_account.owner == enrollment.user @ EscrowError::InvalidTokenAccount
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(challenge_id: u64)]
pub struct UserResolve<'info> {
    pub user: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    /// CHECK: PDA authority for the refund transfer. Not read/written.
    #[account(seeds = [VAULT_AUTHORITY_SEED], bump = config.vault_authority_bump)]
    pub vault_authority: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [CHALLENGE_SEED, &challenge_id.to_le_bytes()],
        bump = challenge.bump
    )]
    pub challenge: Account<'info, Challenge>,
    #[account(
        mut,
        seeds = [ENROLLMENT_SEED, &challenge_id.to_le_bytes(), user.key().as_ref()],
        bump = enrollment.bump,
        has_one = user @ EscrowError::InvalidTokenAccount,
        has_one = challenge @ EscrowError::InvalidTokenAccount
    )]
    pub enrollment: Account<'info, Enrollment>,
    #[account(mut, address = challenge.vault @ EscrowError::InvalidTokenAccount)]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_token_account.mint == config.stake_mint @ EscrowError::InvalidTokenAccount,
        constraint = user_token_account.owner == user.key() @ EscrowError::InvalidTokenAccount
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(challenge_id: u64)]
pub struct Lapse<'info> {
    #[account(
        mut,
        seeds = [CHALLENGE_SEED, &challenge_id.to_le_bytes()],
        bump = challenge.bump
    )]
    pub challenge: Account<'info, Challenge>,
    #[account(
        mut,
        seeds = [ENROLLMENT_SEED, &challenge_id.to_le_bytes(), enrollment.user.as_ref()],
        bump = enrollment.bump,
        has_one = challenge @ EscrowError::InvalidTokenAccount
    )]
    pub enrollment: Account<'info, Enrollment>,
}

#[derive(Accounts)]
#[instruction(challenge_id: u64)]
pub struct SettleChallenge<'info> {
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    /// CHECK: PDA authority for the protocol-cut transfer. Not read/written.
    #[account(seeds = [VAULT_AUTHORITY_SEED], bump = config.vault_authority_bump)]
    pub vault_authority: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [CHALLENGE_SEED, &challenge_id.to_le_bytes()],
        bump = challenge.bump
    )]
    pub challenge: Account<'info, Challenge>,
    #[account(mut, address = challenge.vault @ EscrowError::InvalidTokenAccount)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut, address = config.treasury @ EscrowError::InvalidTokenAccount)]
    pub treasury: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(challenge_id: u64)]
pub struct ClaimBonus<'info> {
    pub user: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    /// CHECK: PDA authority for the bonus transfer. Not read/written.
    #[account(seeds = [VAULT_AUTHORITY_SEED], bump = config.vault_authority_bump)]
    pub vault_authority: UncheckedAccount<'info>,
    #[account(
        seeds = [CHALLENGE_SEED, &challenge_id.to_le_bytes()],
        bump = challenge.bump
    )]
    pub challenge: Account<'info, Challenge>,
    #[account(
        mut,
        seeds = [ENROLLMENT_SEED, &challenge_id.to_le_bytes(), user.key().as_ref()],
        bump = enrollment.bump,
        has_one = user @ EscrowError::InvalidTokenAccount,
        has_one = challenge @ EscrowError::InvalidTokenAccount
    )]
    pub enrollment: Account<'info, Enrollment>,
    #[account(mut, address = challenge.vault @ EscrowError::InvalidTokenAccount)]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_token_account.mint == config.stake_mint @ EscrowError::InvalidTokenAccount,
        constraint = user_token_account.owner == user.key() @ EscrowError::InvalidTokenAccount
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
