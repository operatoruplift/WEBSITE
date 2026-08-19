//! Typed program errors. Each maps to a specific guard so the client can
//! surface a precise message (mirrors the off-chain `UpliftApiError`).

use anchor_lang::prelude::*;

#[error_code]
pub enum EscrowError {
    #[msg("Protocol fee exceeds the allowed maximum")]
    FeeTooHigh,
    #[msg("Yield APY exceeds the allowed maximum")]
    ApyTooHigh,
    #[msg("Challenge parameters are invalid (days or per-day is zero)")]
    InvalidChallengeParams,
    #[msg("This cohort's window has already closed")]
    CohortClosed,
    #[msg("This cohort has not started yet")]
    CohortNotStarted,
    #[msg("The cohort window is still open; settlement is not due yet")]
    CohortNotEnded,
    #[msg("This challenge has already been settled")]
    AlreadySettled,
    #[msg("This challenge has not been settled yet")]
    NotSettled,
    #[msg("This enrollment is no longer active")]
    EnrollmentNotActive,
    #[msg("This enrollment did not finish the challenge")]
    NotAFinisher,
    #[msg("Only the settlement authority can attest proofs")]
    NotSettlementAuthority,
    #[msg("Today's proof is already in for this enrollment")]
    ProofAlreadyIn,
    #[msg("All required days are already proven")]
    ChallengeAlreadyComplete,
    #[msg("This enrollment is still on track; it cannot be lapsed yet")]
    NotLapsable,
    #[msg("This payout has already been claimed")]
    AlreadyClaimed,
    #[msg("The yield reserve does not hold enough to pay the accrued interest")]
    InsufficientYieldReserve,
    #[msg("Arithmetic overflow")]
    MathOverflow,
    #[msg("Provided token account does not match the expected mint or owner")]
    InvalidTokenAccount,
}
