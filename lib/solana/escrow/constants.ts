/**
 * uplift-escrow client constants.
 *
 * Program id, SPL token program, PDA seeds, and the Anchor instruction /
 * account discriminators for the on-chain program in `anchor/`. The
 * discriminators are the first 8 bytes of sha256("global:<ix>") /
 * sha256("account:<Account>") and are verified against a live recompute in
 * tests/e2e/escrow-client.spec.ts, so they can never silently drift.
 */

import { PublicKey } from '@solana/web3.js';

/** SPL Token program (classic, not token-2022 — USDC is a classic mint). */
export const TOKEN_PROGRAM_ID = new PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
);

/**
 * Deployed program id. Defaults to the Anchor placeholder; set
 * NEXT_PUBLIC_ESCROW_PROGRAM_ID once you `anchor deploy` so the client
 * targets your real program.
 */
export const ESCROW_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ESCROW_PROGRAM_ID ||
    'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
);

/** PDA seeds (must match anchor/programs/uplift-escrow/src/constants.rs). */
export const SEEDS = {
  config: Buffer.from('config'),
  vaultAuthority: Buffer.from('vault_auth'),
  yieldReserve: Buffer.from('yield_reserve'),
  challenge: Buffer.from('challenge'),
  vault: Buffer.from('vault'),
  enrollment: Buffer.from('enrollment'),
} as const;

/** Economics, mirrored from the program + src/uplift/store.ts. */
export const PROTOCOL_FEE_BPS = 100; // 1%
export const YIELD_APY_BPS = 450; // 4.5%
export const BPS_DENOMINATOR = 10_000;
export const DAYS_PER_YEAR = 365;

/** First 8 bytes of sha256("global:<name>"). */
export const IX_DISCRIMINATORS = {
  initialize_config: [208, 127, 21, 1, 194, 190, 196, 70],
  fund_yield_reserve: [133, 82, 43, 50, 191, 159, 120, 57],
  create_challenge: [170, 244, 47, 1, 1, 15, 173, 239],
  enroll: [58, 12, 36, 3, 142, 28, 1, 43],
  submit_proof: [54, 241, 46, 84, 4, 212, 46, 94],
  forfeit: [80, 154, 237, 158, 244, 198, 154, 9],
  lapse_enrollment: [162, 105, 25, 122, 14, 153, 62, 219],
  settle_challenge: [242, 58, 232, 150, 127, 199, 11, 204],
  claim_bonus: [143, 250, 0, 123, 176, 198, 110, 71],
} as const;

/** First 8 bytes of sha256("account:<Name>"). */
export const ACCOUNT_DISCRIMINATORS = {
  Config: [155, 12, 170, 224, 30, 250, 204, 130],
  Challenge: [119, 250, 161, 121, 119, 81, 22, 208],
  Enrollment: [249, 210, 64, 145, 197, 241, 57, 51],
} as const;
