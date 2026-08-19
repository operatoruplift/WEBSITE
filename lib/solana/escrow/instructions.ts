/**
 * Instruction builders for uplift-escrow.
 *
 * Every account list here mirrors the field order and writability of the
 * matching `#[derive(Accounts)]` struct in
 * anchor/programs/uplift-escrow/src/lib.rs. Getting that order wrong is the
 * classic client bug, so the escrow-client spec asserts each builder's
 * account count and key set against the derived PDAs.
 */

import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  AccountMeta,
} from '@solana/web3.js';
import { ESCROW_PROGRAM_ID, IX_DISCRIMINATORS, TOKEN_PROGRAM_ID } from './constants';
import { BorshWriter } from './coder';
import {
  configPda,
  vaultAuthorityPda,
  yieldReservePda,
  challengePda,
  vaultPda,
  enrollmentPda,
} from './pdas';

const ro = (pubkey: PublicKey): AccountMeta => ({ pubkey, isSigner: false, isWritable: false });
const rw = (pubkey: PublicKey): AccountMeta => ({ pubkey, isSigner: false, isWritable: true });
const signer = (pubkey: PublicKey): AccountMeta => ({ pubkey, isSigner: true, isWritable: false });
const signerRw = (pubkey: PublicKey): AccountMeta => ({ pubkey, isSigner: true, isWritable: true });

function ix(keys: AccountMeta[], data: Buffer, programId: PublicKey): TransactionInstruction {
  return new TransactionInstruction({ programId, keys, data });
}

export interface InitializeConfigArgs {
  admin: PublicKey;
  stakeMint: PublicKey;
  treasury: PublicKey;
  settlementAuthority: PublicKey;
  protocolFeeBps: number;
  yieldApyBps: number;
  programId?: PublicKey;
}

export function initializeConfigIx(a: InitializeConfigArgs): TransactionInstruction {
  const programId = a.programId ?? ESCROW_PROGRAM_ID;
  const data = new BorshWriter()
    .discriminator(IX_DISCRIMINATORS.initialize_config)
    .pubkey(a.settlementAuthority)
    .u16(a.protocolFeeBps)
    .u16(a.yieldApyBps)
    .toBuffer();
  const keys = [
    signerRw(a.admin),
    rw(configPda(programId)[0]),
    ro(vaultAuthorityPda(programId)[0]),
    ro(a.stakeMint),
    ro(a.treasury),
    rw(yieldReservePda(programId)[0]),
    ro(TOKEN_PROGRAM_ID),
    ro(SystemProgram.programId),
    ro(SYSVAR_RENT_PUBKEY),
  ];
  return ix(keys, data, programId);
}

export function fundYieldReserveIx(a: {
  funder: PublicKey;
  funderTokenAccount: PublicKey;
  amount: bigint | number;
  programId?: PublicKey;
}): TransactionInstruction {
  const programId = a.programId ?? ESCROW_PROGRAM_ID;
  const data = new BorshWriter()
    .discriminator(IX_DISCRIMINATORS.fund_yield_reserve)
    .u64(a.amount)
    .toBuffer();
  const keys = [
    signerRw(a.funder),
    ro(configPda(programId)[0]),
    rw(yieldReservePda(programId)[0]),
    rw(a.funderTokenAccount),
    ro(TOKEN_PROGRAM_ID),
  ];
  return ix(keys, data, programId);
}

export function createChallengeIx(a: {
  admin: PublicKey;
  stakeMint: PublicKey;
  challengeId: bigint | number;
  days: number;
  perDay: bigint | number;
  feeFree: boolean;
  startTs: bigint | number;
  programId?: PublicKey;
}): TransactionInstruction {
  const programId = a.programId ?? ESCROW_PROGRAM_ID;
  const data = new BorshWriter()
    .discriminator(IX_DISCRIMINATORS.create_challenge)
    .u64(a.challengeId)
    .u16(a.days)
    .u64(a.perDay)
    .bool(a.feeFree)
    .i64(a.startTs)
    .toBuffer();
  const keys = [
    signerRw(a.admin),
    ro(configPda(programId)[0]),
    ro(vaultAuthorityPda(programId)[0]),
    rw(challengePda(a.challengeId, programId)[0]),
    ro(a.stakeMint),
    rw(vaultPda(a.challengeId, programId)[0]),
    ro(TOKEN_PROGRAM_ID),
    ro(SystemProgram.programId),
    ro(SYSVAR_RENT_PUBKEY),
  ];
  return ix(keys, data, programId);
}

export function enrollIx(a: {
  user: PublicKey;
  userTokenAccount: PublicKey;
  treasury: PublicKey;
  challengeId: bigint | number;
  programId?: PublicKey;
}): TransactionInstruction {
  const programId = a.programId ?? ESCROW_PROGRAM_ID;
  const data = new BorshWriter()
    .discriminator(IX_DISCRIMINATORS.enroll)
    .u64(a.challengeId)
    .toBuffer();
  const keys = [
    signerRw(a.user),
    ro(configPda(programId)[0]),
    rw(challengePda(a.challengeId, programId)[0]),
    rw(enrollmentPda(a.challengeId, a.user, programId)[0]),
    rw(vaultPda(a.challengeId, programId)[0]),
    rw(a.treasury),
    rw(a.userTokenAccount),
    ro(TOKEN_PROGRAM_ID),
    ro(SystemProgram.programId),
  ];
  return ix(keys, data, programId);
}

export function submitProofIx(a: {
  settlementAuthority: PublicKey;
  user: PublicKey;
  userTokenAccount: PublicKey;
  challengeId: bigint | number;
  programId?: PublicKey;
}): TransactionInstruction {
  const programId = a.programId ?? ESCROW_PROGRAM_ID;
  const data = new BorshWriter()
    .discriminator(IX_DISCRIMINATORS.submit_proof)
    .u64(a.challengeId)
    .toBuffer();
  const keys = [
    signer(a.settlementAuthority),
    ro(configPda(programId)[0]),
    ro(vaultAuthorityPda(programId)[0]),
    rw(challengePda(a.challengeId, programId)[0]),
    rw(enrollmentPda(a.challengeId, a.user, programId)[0]),
    rw(vaultPda(a.challengeId, programId)[0]),
    rw(yieldReservePda(programId)[0]),
    rw(a.userTokenAccount),
    ro(TOKEN_PROGRAM_ID),
  ];
  return ix(keys, data, programId);
}

export function forfeitIx(a: {
  user: PublicKey;
  userTokenAccount: PublicKey;
  challengeId: bigint | number;
  programId?: PublicKey;
}): TransactionInstruction {
  const programId = a.programId ?? ESCROW_PROGRAM_ID;
  const data = new BorshWriter()
    .discriminator(IX_DISCRIMINATORS.forfeit)
    .u64(a.challengeId)
    .toBuffer();
  const keys = [
    signer(a.user),
    ro(configPda(programId)[0]),
    ro(vaultAuthorityPda(programId)[0]),
    rw(challengePda(a.challengeId, programId)[0]),
    rw(enrollmentPda(a.challengeId, a.user, programId)[0]),
    rw(vaultPda(a.challengeId, programId)[0]),
    rw(a.userTokenAccount),
    ro(TOKEN_PROGRAM_ID),
  ];
  return ix(keys, data, programId);
}

export function lapseEnrollmentIx(a: {
  user: PublicKey;
  challengeId: bigint | number;
  programId?: PublicKey;
}): TransactionInstruction {
  const programId = a.programId ?? ESCROW_PROGRAM_ID;
  const data = new BorshWriter()
    .discriminator(IX_DISCRIMINATORS.lapse_enrollment)
    .u64(a.challengeId)
    .toBuffer();
  const keys = [
    rw(challengePda(a.challengeId, programId)[0]),
    rw(enrollmentPda(a.challengeId, a.user, programId)[0]),
  ];
  return ix(keys, data, programId);
}

export function settleChallengeIx(a: {
  treasury: PublicKey;
  challengeId: bigint | number;
  programId?: PublicKey;
}): TransactionInstruction {
  const programId = a.programId ?? ESCROW_PROGRAM_ID;
  const data = new BorshWriter()
    .discriminator(IX_DISCRIMINATORS.settle_challenge)
    .u64(a.challengeId)
    .toBuffer();
  const keys = [
    ro(configPda(programId)[0]),
    ro(vaultAuthorityPda(programId)[0]),
    rw(challengePda(a.challengeId, programId)[0]),
    rw(vaultPda(a.challengeId, programId)[0]),
    rw(a.treasury),
    ro(TOKEN_PROGRAM_ID),
  ];
  return ix(keys, data, programId);
}

export function claimBonusIx(a: {
  user: PublicKey;
  userTokenAccount: PublicKey;
  challengeId: bigint | number;
  programId?: PublicKey;
}): TransactionInstruction {
  const programId = a.programId ?? ESCROW_PROGRAM_ID;
  const data = new BorshWriter()
    .discriminator(IX_DISCRIMINATORS.claim_bonus)
    .u64(a.challengeId)
    .toBuffer();
  const keys = [
    signer(a.user),
    ro(configPda(programId)[0]),
    ro(vaultAuthorityPda(programId)[0]),
    ro(challengePda(a.challengeId, programId)[0]),
    rw(enrollmentPda(a.challengeId, a.user, programId)[0]),
    rw(vaultPda(a.challengeId, programId)[0]),
    rw(a.userTokenAccount),
    ro(TOKEN_PROGRAM_ID),
  ];
  return ix(keys, data, programId);
}
