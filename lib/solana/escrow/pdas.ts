/**
 * PDA derivation for uplift-escrow. Every seed layout matches the
 * `#[account(seeds = ...)]` constraints in the on-chain program.
 */

import { PublicKey } from '@solana/web3.js';
import { ESCROW_PROGRAM_ID, SEEDS } from './constants';

/** u64 challenge id as an 8-byte little-endian buffer (matches to_le_bytes). */
export function challengeIdToBuffer(challengeId: bigint | number): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(challengeId));
  return buf;
}

export function configPda(programId: PublicKey = ESCROW_PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.config], programId);
}

export function vaultAuthorityPda(programId: PublicKey = ESCROW_PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.vaultAuthority], programId);
}

export function yieldReservePda(programId: PublicKey = ESCROW_PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.yieldReserve], programId);
}

export function challengePda(
  challengeId: bigint | number,
  programId: PublicKey = ESCROW_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.challenge, challengeIdToBuffer(challengeId)],
    programId,
  );
}

export function vaultPda(
  challengeId: bigint | number,
  programId: PublicKey = ESCROW_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.vault, challengeIdToBuffer(challengeId)],
    programId,
  );
}

export function enrollmentPda(
  challengeId: bigint | number,
  user: PublicKey,
  programId: PublicKey = ESCROW_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.enrollment, challengeIdToBuffer(challengeId), user.toBuffer()],
    programId,
  );
}
