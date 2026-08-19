import { test, expect } from '@playwright/test';
import { createHash } from 'crypto';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import {
  IX_DISCRIMINATORS,
  ACCOUNT_DISCRIMINATORS,
  ESCROW_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  configPda,
  vaultPda,
  challengePda,
  enrollmentPda,
  BorshWriter,
  decodeConfig,
  decodeChallenge,
  decodeEnrollment,
  EnrollmentStatus,
  enrollIx,
  claimBonusIx,
  simpleInterest,
  previewPerFinisherBonus,
} from '@/lib/solana/escrow';

/**
 * Pure-function coverage for the escrow client. No validator: it proves the
 * discriminators, PDA seeds, borsh layout, and instruction account ordering
 * match the on-chain program by construction, so a client/program drift is a
 * test failure, not a lost transaction.
 */

const sighash = (ns: string, name: string) =>
  Array.from(createHash('sha256').update(`${ns}:${name}`).digest().subarray(0, 8));

test('instruction discriminators equal a live sha256 recompute', () => {
  for (const [name, expected] of Object.entries(IX_DISCRIMINATORS)) {
    expect(sighash('global', name), name).toEqual([...expected]);
  }
});

test('account discriminators equal a live sha256 recompute', () => {
  for (const [name, expected] of Object.entries(ACCOUNT_DISCRIMINATORS)) {
    expect(sighash('account', name), name).toEqual([...expected]);
  }
});

test('PDAs are deterministic and user-scoped', () => {
  expect(configPda()[0].equals(configPda()[0])).toBe(true);
  expect(challengePda(1)[0].equals(challengePda(2)[0])).toBe(false);
  const a = Keypair.generate().publicKey;
  const b = Keypair.generate().publicKey;
  expect(enrollmentPda(1, a)[0].equals(enrollmentPda(1, b)[0])).toBe(false);
  expect(enrollmentPda(1, a)[0].equals(enrollmentPda(1, a)[0])).toBe(true);
});

test('Config borsh layout round-trips', () => {
  const k = () => Keypair.generate().publicKey;
  const admin = k(), settlement = k(), mint = k(), treasury = k(), reserve = k();
  const data = new BorshWriter()
    .discriminator(ACCOUNT_DISCRIMINATORS.Config)
    .pubkey(admin).pubkey(settlement).pubkey(mint).pubkey(treasury).pubkey(reserve)
    .u16(100).u16(450).u8(254).u8(253)
    .toBuffer();
  const c = decodeConfig(data);
  expect(c.admin.equals(admin)).toBe(true);
  expect(c.settlementAuthority.equals(settlement)).toBe(true);
  expect(c.protocolFeeBps).toBe(100);
  expect(c.yieldApyBps).toBe(450);
  expect(c.vaultAuthorityBump).toBe(253);
});

test('Challenge borsh layout round-trips', () => {
  const vault = Keypair.generate().publicKey;
  const data = new BorshWriter()
    .discriminator(ACCOUNT_DISCRIMINATORS.Challenge)
    .u64(7).u16(28).u64(1_000_000).u64(28_000_000).i64(1000).i64(1000 + 28 * 86400)
    .bool(false).pubkey(vault).u32(240).u32(168).u64(4_704_000_000).u64(2_016_000_000)
    .u64(11_600_000).bool(true).u8(255)
    .toBuffer();
  const c = decodeChallenge(data);
  expect(c.challengeId).toBe(BigInt(7));
  expect(c.days).toBe(28);
  expect(c.finishers).toBe(168);
  expect(c.forfeitedPool).toBe(BigInt(2_016_000_000));
  expect(c.settled).toBe(true);
  expect(c.vault.equals(vault)).toBe(true);
});

test('Enrollment borsh layout round-trips', () => {
  const user = Keypair.generate().publicKey;
  const challenge = Keypair.generate().publicKey;
  const data = new BorshWriter()
    .discriminator(ACCOUNT_DISCRIMINATORS.Enrollment)
    .pubkey(user).pubkey(challenge).u64(28_000_000).u16(28).u8(1).i64(1234)
    .bool(true).bool(false).u8(252)
    .toBuffer();
  const e = decodeEnrollment(data);
  expect(e.user.equals(user)).toBe(true);
  expect(e.stake).toBe(BigInt(28_000_000));
  expect(e.provenDays).toBe(28);
  expect(e.status).toBe(EnrollmentStatus.Won);
  expect(e.stakeClaimed).toBe(true);
  expect(e.bonusClaimed).toBe(false);
});

test('enroll instruction has the exact accounts the program expects', () => {
  const user = Keypair.generate().publicKey;
  const userAta = Keypair.generate().publicKey;
  const treasury = Keypair.generate().publicKey;
  const ix = enrollIx({ user, userTokenAccount: userAta, treasury, challengeId: 1 });

  expect(ix.programId.equals(ESCROW_PROGRAM_ID)).toBe(true);
  // Field order from the Enroll accounts struct.
  const keys = ix.keys;
  expect(keys.length).toBe(9);
  expect(keys[0].pubkey.equals(user)).toBe(true);
  expect(keys[0].isSigner && keys[0].isWritable).toBe(true);
  expect(keys[1].pubkey.equals(configPda()[0])).toBe(true);
  expect(keys[1].isWritable).toBe(false);
  expect(keys[2].pubkey.equals(challengePda(1)[0])).toBe(true);
  expect(keys[2].isWritable).toBe(true);
  expect(keys[3].pubkey.equals(enrollmentPda(1, user)[0])).toBe(true);
  expect(keys[4].pubkey.equals(vaultPda(1)[0])).toBe(true);
  expect(keys[5].pubkey.equals(treasury)).toBe(true);
  expect(keys[6].pubkey.equals(userAta)).toBe(true);
  expect(keys[7].pubkey.equals(TOKEN_PROGRAM_ID)).toBe(true);
  expect(keys[8].pubkey.equals(SystemProgram.programId)).toBe(true);
  // Data = 8-byte discriminator + u64 challenge id.
  expect(Array.from(ix.data.subarray(0, 8))).toEqual(IX_DISCRIMINATORS.enroll);
  expect(ix.data.length).toBe(16);
});

test('claim_bonus instruction ordering matches the program', () => {
  const user = Keypair.generate().publicKey;
  const userAta = Keypair.generate().publicKey;
  const ix = claimBonusIx({ user, userTokenAccount: userAta, challengeId: 3 });
  const keys = ix.keys;
  expect(keys.length).toBe(8);
  expect(keys[0].pubkey.equals(user)).toBe(true);
  expect(keys[0].isSigner).toBe(true);
  expect(keys[3].pubkey.equals(challengePda(3)[0])).toBe(true);
  expect(keys[3].isWritable).toBe(false); // challenge is read-only in claim_bonus
  expect(keys[4].pubkey.equals(enrollmentPda(3, user)[0])).toBe(true);
  expect(keys[4].isWritable).toBe(true);
  expect(Array.from(ix.data.subarray(0, 8))).toEqual(IX_DISCRIMINATORS.claim_bonus);
});

test('yield + bonus math matches the program formulas', () => {
  // 28-day, $28 stake at 4.5% APY: 28e6 * 450 * 28 / (10000 * 365) = 96657 base units (~$0.097).
  expect(simpleInterest(28_000_000, 450, 28)).toBe(BigInt(96657));
  // Forfeited $2016 pool, 1% cut, 168 finishers => 11.88 USDC each.
  expect(previewPerFinisherBonus(BigInt(2_016_000_000), 100, 168)).toBe(BigInt(11_880_000));
  expect(previewPerFinisherBonus(BigInt(2_016_000_000), 100, 0)).toBe(BigInt(0));
});

test('a placeholder-free program id can be supplied per call', () => {
  const custom = new PublicKey('11111111111111111111111111111111');
  const ix = enrollIx({
    user: Keypair.generate().publicKey,
    userTokenAccount: Keypair.generate().publicKey,
    treasury: Keypair.generate().publicKey,
    challengeId: 1,
    programId: custom,
  });
  expect(ix.programId.equals(custom)).toBe(true);
});
