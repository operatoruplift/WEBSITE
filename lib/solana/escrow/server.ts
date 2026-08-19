/**
 * Server-only escrow helpers: config gating, settlement-authority key
 * loading, and an RPC connection. Kept out of ./index (never bundled into
 * the client) because it reads the settlement-authority secret.
 */

import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

/** The Anchor placeholder id. A real deployment overrides it via env. */
export const PLACEHOLDER_PROGRAM_ID = 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS';

/**
 * True only when a real program id is set AND the settlement-authority
 * secret is present. Reads process.env live (not the cached module const)
 * so the route stays inert until you deploy and configure it.
 */
export function isEscrowConfigured(): boolean {
  const id = process.env.NEXT_PUBLIC_ESCROW_PROGRAM_ID;
  return (
    !!id &&
    id !== PLACEHOLDER_PROGRAM_ID &&
    !!process.env.ESCROW_SETTLEMENT_AUTHORITY_SECRET
  );
}

/**
 * Load the settlement-authority keypair from ESCROW_SETTLEMENT_AUTHORITY_SECRET.
 * Accepts a base58 string (wallet export) or a JSON byte array (solana-keygen).
 * Throws if unset or unparseable, so a misconfig surfaces as a 500, never a
 * transaction signed by the wrong key.
 */
export function loadSettlementAuthority(): Keypair {
  const secret = process.env.ESCROW_SETTLEMENT_AUTHORITY_SECRET;
  if (!secret) throw new Error('ESCROW_SETTLEMENT_AUTHORITY_SECRET is not set');
  const trimmed = secret.trim();
  const bytes = trimmed.startsWith('[')
    ? Uint8Array.from(JSON.parse(trimmed) as number[])
    : bs58.decode(trimmed);
  return Keypair.fromSecretKey(bytes);
}

/** RPC connection for escrow settlement (defaults to devnet). */
export function escrowConnection(): Connection {
  const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';
  return new Connection(rpc, 'confirmed');
}
