/**
 * Minimal Borsh writer/reader for the exact field types uplift-escrow uses
 * (u8/u16/u32/u64/i64/bool/pubkey). Anchor lays out instruction args and
 * account data as `[8-byte discriminator][borsh fields in declaration order]`,
 * which is what these helpers produce and parse. No external borsh dependency
 * keeps the client tree-shakeable and its behavior fully auditable here.
 */

import { PublicKey } from '@solana/web3.js';
import { ACCOUNT_DISCRIMINATORS } from './constants';

export class BorshWriter {
  private parts: Buffer[] = [];

  u8(v: number): this { const b = Buffer.alloc(1); b.writeUInt8(v); this.parts.push(b); return this; }
  bool(v: boolean): this { return this.u8(v ? 1 : 0); }
  u16(v: number): this { const b = Buffer.alloc(2); b.writeUInt16LE(v); this.parts.push(b); return this; }
  u32(v: number): this { const b = Buffer.alloc(4); b.writeUInt32LE(v); this.parts.push(b); return this; }
  u64(v: bigint | number): this { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(v)); this.parts.push(b); return this; }
  i64(v: bigint | number): this { const b = Buffer.alloc(8); b.writeBigInt64LE(BigInt(v)); this.parts.push(b); return this; }
  pubkey(v: PublicKey): this { this.parts.push(Buffer.from(v.toBytes())); return this; }
  discriminator(d: readonly number[]): this { this.parts.push(Buffer.from(d)); return this; }

  toBuffer(): Buffer { return Buffer.concat(this.parts); }
}

class BorshReader {
  private offset: number;
  constructor(private readonly buf: Buffer, startOffset = 0) { this.offset = startOffset; }
  u8(): number { const v = this.buf.readUInt8(this.offset); this.offset += 1; return v; }
  bool(): boolean { return this.u8() === 1; }
  u16(): number { const v = this.buf.readUInt16LE(this.offset); this.offset += 2; return v; }
  u32(): number { const v = this.buf.readUInt32LE(this.offset); this.offset += 4; return v; }
  u64(): bigint { const v = this.buf.readBigUInt64LE(this.offset); this.offset += 8; return v; }
  i64(): bigint { const v = this.buf.readBigInt64LE(this.offset); this.offset += 8; return v; }
  pubkey(): PublicKey { const v = new PublicKey(this.buf.subarray(this.offset, this.offset + 32)); this.offset += 32; return v; }
}

function assertDiscriminator(buf: Buffer, expected: readonly number[], label: string): void {
  const got = buf.subarray(0, 8);
  if (!got.equals(Buffer.from(expected))) {
    throw new Error(`Account data is not a ${label} (discriminator mismatch)`);
  }
}

/* ------------------------- account decoders ------------------------- */

export interface ConfigAccount {
  admin: PublicKey;
  settlementAuthority: PublicKey;
  stakeMint: PublicKey;
  treasury: PublicKey;
  yieldReserve: PublicKey;
  protocolFeeBps: number;
  yieldApyBps: number;
  bump: number;
  vaultAuthorityBump: number;
}

export function decodeConfig(data: Buffer): ConfigAccount {
  assertDiscriminator(data, ACCOUNT_DISCRIMINATORS.Config, 'Config');
  const r = new BorshReader(data, 8);
  return {
    admin: r.pubkey(),
    settlementAuthority: r.pubkey(),
    stakeMint: r.pubkey(),
    treasury: r.pubkey(),
    yieldReserve: r.pubkey(),
    protocolFeeBps: r.u16(),
    yieldApyBps: r.u16(),
    bump: r.u8(),
    vaultAuthorityBump: r.u8(),
  };
}

export interface ChallengeAccount {
  challengeId: bigint;
  days: number;
  perDay: bigint;
  stakeAmount: bigint;
  startTs: bigint;
  endTs: bigint;
  feeFree: boolean;
  vault: PublicKey;
  members: number;
  finishers: number;
  activeStake: bigint;
  forfeitedPool: bigint;
  perFinisherBonus: bigint;
  settled: boolean;
  bump: number;
}

export function decodeChallenge(data: Buffer): ChallengeAccount {
  assertDiscriminator(data, ACCOUNT_DISCRIMINATORS.Challenge, 'Challenge');
  const r = new BorshReader(data, 8);
  return {
    challengeId: r.u64(),
    days: r.u16(),
    perDay: r.u64(),
    stakeAmount: r.u64(),
    startTs: r.i64(),
    endTs: r.i64(),
    feeFree: r.bool(),
    vault: r.pubkey(),
    members: r.u32(),
    finishers: r.u32(),
    activeStake: r.u64(),
    forfeitedPool: r.u64(),
    perFinisherBonus: r.u64(),
    settled: r.bool(),
    bump: r.u8(),
  };
}

export enum EnrollmentStatus { Active = 0, Won = 1, Forfeited = 2 }

export interface EnrollmentAccount {
  user: PublicKey;
  challenge: PublicKey;
  stake: bigint;
  provenDays: number;
  status: EnrollmentStatus;
  createdTs: bigint;
  stakeClaimed: boolean;
  bonusClaimed: boolean;
  bump: number;
}

export function decodeEnrollment(data: Buffer): EnrollmentAccount {
  assertDiscriminator(data, ACCOUNT_DISCRIMINATORS.Enrollment, 'Enrollment');
  const r = new BorshReader(data, 8);
  return {
    user: r.pubkey(),
    challenge: r.pubkey(),
    stake: r.u64(),
    provenDays: r.u16(),
    status: r.u8() as EnrollmentStatus,
    createdTs: r.i64(),
    stakeClaimed: r.bool(),
    bonusClaimed: r.bool(),
    bump: r.u8(),
  };
}
