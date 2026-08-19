//! On-chain account layouts.

use anchor_lang::prelude::*;

/// Enrollment lifecycle, mirroring the off-chain `status` field.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum EnrollmentStatus {
    Active,
    Won,
    Forfeited,
}

/// Global program configuration (single PDA, seeds = ["config"]).
#[account]
pub struct Config {
    /// May update config and create challenges.
    pub admin: Pubkey,
    /// The impartial "AI Game Master" key that attests each daily proof.
    /// Kept separate from `admin` so proof attestation can be delegated to
    /// a hot signer without granting treasury/config powers.
    pub settlement_authority: Pubkey,
    /// SPL mint every stake, payout, fee, and yield transfer uses (USDC).
    pub stake_mint: Pubkey,
    /// Destination token account for protocol fees.
    pub treasury: Pubkey,
    /// PDA-owned token account the accrued interest is paid from. Topped up
    /// by `fund_yield_reserve`; in production it is fed by the real yield a
    /// strategy earns on idle escrow (see README).
    pub yield_reserve: Pubkey,
    /// Fee taken at enrollment and on the forfeited pool at settlement.
    pub protocol_fee_bps: u16,
    /// Simple-interest APY paid to finishers on their stake.
    pub yield_apy_bps: u16,
    /// Bump for the config PDA.
    pub bump: u8,
    /// Bump for the shared vault-authority PDA that owns every vault and
    /// the yield reserve (the only signer that can move escrowed funds out).
    pub vault_authority_bump: u8,
}

impl Config {
    pub const SPACE: usize = 8 + 32 * 5 + 2 + 2 + 1 + 1;
}

/// One cohort of a challenge (PDA, seeds = ["challenge", id]).
#[account]
pub struct Challenge {
    /// Numeric cohort id (a monotonic id assigned off-chain).
    pub challenge_id: u64,
    /// Days that must be proven to finish.
    pub days: u16,
    /// Stake charged per day, in stake-mint base units.
    pub per_day: u64,
    /// Total stake to enroll = days * per_day.
    pub stake_amount: u64,
    /// Cohort window (unix seconds).
    pub start_ts: i64,
    pub end_ts: i64,
    /// Longer challenges can waive the enrollment fee.
    pub fee_free: bool,
    /// This cohort's escrow token account (owned by the vault authority).
    pub vault: Pubkey,
    /// Enrollment counters.
    pub members: u32,
    pub finishers: u32,
    /// Sum of stakes still owned by active-or-won enrollments (returned to
    /// their owners, never redistributed).
    pub active_stake: u64,
    /// Sum of forfeited stakes escrowed in the vault, awaiting settlement.
    pub forfeited_pool: u64,
    /// Set at settlement: per-finisher bonus rate (bonus pool / finishers).
    pub per_finisher_bonus: u64,
    pub settled: bool,
    pub bump: u8,
}

impl Challenge {
    pub const SPACE: usize =
        8 + 8 + 2 + 8 + 8 + 8 + 8 + 1 + 32 + 4 + 4 + 8 + 8 + 8 + 1 + 1;
}

/// One user's participation in a cohort
/// (PDA, seeds = ["enrollment", challenge_id, user]).
#[account]
pub struct Enrollment {
    pub user: Pubkey,
    pub challenge: Pubkey,
    pub stake: u64,
    pub proven_days: u16,
    pub status: u8,
    pub created_ts: i64,
    /// Set once the stake + interest has been returned on completion.
    pub stake_claimed: bool,
    /// Set once the post-settlement finisher bonus has been pulled.
    pub bonus_claimed: bool,
    pub bump: u8,
}

impl Enrollment {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 2 + 1 + 8 + 1 + 1 + 1;
}
