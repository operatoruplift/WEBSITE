//! Program-wide constants and PDA seeds.

/// Basis-point denominator (100% = 10_000 bps).
pub const BPS_DENOMINATOR: u64 = 10_000;

/// Seconds in a day. Cohort windows and the "one proof per day" rule
/// are measured against this.
pub const SECONDS_PER_DAY: i64 = 86_400;

/// Days in a year, used for the simple-interest yield accrual
/// (interest = stake * apy_bps / 10_000 * days / 365).
pub const DAYS_PER_YEAR: u128 = 365;

/// Free-cancellation grace window: a user who forfeits within this many
/// seconds of enrolling gets their full stake back (matches the app's
/// 24-hour no-hard-feelings cancel).
pub const FREE_CANCEL_WINDOW: i64 = 24 * SECONDS_PER_DAY / 24; // 24 hours

/// Upper bound on protocol fee (10%) so a misconfigured config can never
/// skim more than a sane maximum from stakes or the forfeited pool.
pub const MAX_PROTOCOL_FEE_BPS: u16 = 1_000;

/// Upper bound on the quoted yield APY (20%). Guards against a fat-finger
/// that would drain the yield reserve faster than it can be funded.
pub const MAX_YIELD_APY_BPS: u16 = 2_000;

// PDA seeds.
pub const CONFIG_SEED: &[u8] = b"config";
pub const VAULT_AUTHORITY_SEED: &[u8] = b"vault_auth";
pub const YIELD_RESERVE_SEED: &[u8] = b"yield_reserve";
pub const CHALLENGE_SEED: &[u8] = b"challenge";
pub const VAULT_SEED: &[u8] = b"vault";
pub const ENROLLMENT_SEED: &[u8] = b"enrollment";
