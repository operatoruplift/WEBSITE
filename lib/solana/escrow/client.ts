/**
 * High-level read client + economic helpers for uplift-escrow. Instruction
 * builders live in ./instructions; this wraps account reads (so a caller does
 * not hand-decode) and the yield math (so previews match the on-chain result).
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { ESCROW_PROGRAM_ID, BPS_DENOMINATOR, DAYS_PER_YEAR } from './constants';
import { configPda, challengePda, enrollmentPda } from './pdas';
import {
  decodeConfig,
  decodeChallenge,
  decodeEnrollment,
  type ConfigAccount,
  type ChallengeAccount,
  type EnrollmentAccount,
} from './coder';

/**
 * Simple-interest yield, identical to the program's `simple_interest`:
 * stake * apyBps / 10_000 * days / 365, floored. Uses BigInt so a large
 * stake * apy * days product never loses precision.
 */
export function simpleInterest(
  stake: bigint | number,
  apyBps: number,
  days: number,
): bigint {
  return (
    (BigInt(stake) * BigInt(apyBps) * BigInt(days)) /
    (BigInt(BPS_DENOMINATOR) * BigInt(DAYS_PER_YEAR))
  );
}

/** Per-finisher bonus a settlement would pay, for UI previews. */
export function previewPerFinisherBonus(
  forfeitedPool: bigint,
  protocolFeeBps: number,
  finishers: number,
): bigint {
  if (finishers <= 0) return BigInt(0);
  const protocolCut = (forfeitedPool * BigInt(protocolFeeBps)) / BigInt(BPS_DENOMINATOR);
  return (forfeitedPool - protocolCut) / BigInt(finishers);
}

export class UpliftEscrowClient {
  constructor(
    public readonly connection: Connection,
    public readonly programId: PublicKey = ESCROW_PROGRAM_ID,
  ) {}

  async fetchConfig(): Promise<ConfigAccount | null> {
    const info = await this.connection.getAccountInfo(configPda(this.programId)[0]);
    return info ? decodeConfig(info.data) : null;
  }

  async fetchChallenge(challengeId: bigint | number): Promise<ChallengeAccount | null> {
    const info = await this.connection.getAccountInfo(challengePda(challengeId, this.programId)[0]);
    return info ? decodeChallenge(info.data) : null;
  }

  async fetchEnrollment(
    challengeId: bigint | number,
    user: PublicKey,
  ): Promise<EnrollmentAccount | null> {
    const info = await this.connection.getAccountInfo(
      enrollmentPda(challengeId, user, this.programId)[0],
    );
    return info ? decodeEnrollment(info.data) : null;
  }

  /** The treasury token account this program pays fees to (from config). */
  async getTreasury(): Promise<PublicKey> {
    const config = await this.fetchConfig();
    if (!config) throw new Error('Escrow config is not initialized');
    return config.treasury;
  }
}
