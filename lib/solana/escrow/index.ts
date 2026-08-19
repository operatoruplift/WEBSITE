/**
 * uplift-escrow client: typed instruction builders, PDA helpers, account
 * decoders, and a high-level read client for the on-chain program in
 * `anchor/`. web3.js only (no heavy anchor runtime), so it is safe to import
 * from the marketing app or a server route.
 */

export * from './constants';
export * from './pdas';
export * from './coder';
export * from './instructions';
export * from './client';
