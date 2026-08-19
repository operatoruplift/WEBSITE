# Deploying uplift-escrow (devnet)

Everything below runs on your machine (this repo's environment has Rust +
anchor-cli but not the Solana platform tools, so it can `cargo check` but not
produce the deployable `.so`). Install the Solana toolchain first:

```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"   # solana + cargo-build-sbf
solana --version && anchor --version                            # anchor 0.30.1
```

## 1. Keys + build

```bash
cd anchor
solana-keygen new -o ~/.config/solana/id.json     # or reuse your keypair
solana config set --url devnet
solana airdrop 5

anchor keys sync         # replaces the placeholder program id with your keypair's
anchor build             # writes target/deploy/uplift_escrow.so + IDL + TS types
anchor test              # localnet: runs tests/uplift-escrow.ts against a validator
```

`anchor keys sync` updates `declare_id!` in `src/lib.rs` and `Anchor.toml`.
Commit that change so the client's default id matches, or set
`NEXT_PUBLIC_ESCROW_PROGRAM_ID` in the web app to the printed program id.

## 2. Deploy

```bash
anchor deploy --provider.cluster devnet
# note the "Program Id" it prints
```

## 3. Initialize on-chain state

USDC devnet mint is `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` (mainnet is
`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`, already in
`lib/waitlist-constants.ts`). You need a treasury token account for that mint.

Call `initialize_config(settlement_authority, 100, 450)` once (1% fee, 4.5%
APY), then `fund_yield_reserve(amount)` and `create_challenge(...)` per cohort.
Build those transactions with the typed client:

```ts
import { Connection, Keypair, Transaction } from '@solana/web3.js';
import { initializeConfigIx, createChallengeIx, UpliftEscrowClient } from '@/lib/solana/escrow';

const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC!);
const admin = /* your keypair */;
const tx = new Transaction().add(
  initializeConfigIx({
    admin: admin.publicKey,
    stakeMint: USDC_DEVNET_MINT,
    treasury: TREASURY_TOKEN_ACCOUNT,
    settlementAuthority: GAME_MASTER_PUBKEY,
    protocolFeeBps: 100,
    yieldApyBps: 450,
  }),
);
await connection.sendTransaction(tx, [admin]);
```

Read state back with `new UpliftEscrowClient(connection).fetchChallenge(id)`.

## 4. Operating a cohort

1. `create_challenge(id, days, perDay, feeFree, startTs)` — admin.
2. Users `enroll(id)` from the app (wallet signs).
3. Your server (holding the settlement-authority key) calls `submit_proof(id)`
   for a user once its vision pipeline passes — the same gate as `app/api`.
4. After `endTs`, a keeper `lapse_enrollment(id)` for every unfinished
   enrollment, then anyone calls `settle_challenge(id)`.
5. Finishers `claim_bonus(id)`.

## Server settlement route

`POST /api/escrow/settle-proof` (in the Next app) lets your verification
backend attest a proof on-chain with the settlement-authority key, instead of
exposing that key to the client. It stays inert (503) until you set:

```
NEXT_PUBLIC_ESCROW_PROGRAM_ID        # your deployed program id
ESCROW_SETTLEMENT_AUTHORITY_SECRET   # the authority keypair (base58 or JSON array)
ESCROW_ADMIN_KEY                     # shared secret the caller sends as X-Escrow-Key
```

Then, after your pipeline confirms a day's proof:

```bash
curl -X POST https://<host>/api/escrow/settle-proof \
  -H "X-Escrow-Key: $ESCROW_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"challengeId": 1, "user": "<wallet-base58>"}'
# -> { signature, challengeId, user, ... }
```

Keep `ESCROW_SETTLEMENT_AUTHORITY_SECRET` in a server secret store, never a
`NEXT_PUBLIC_*` var, and move it to an HSM/KMS signer before mainnet.

## Before mainnet

- **Get a professional audit.** This holds user funds.
- Decide the real yield source and wire `strategy_deposit`/`strategy_withdraw`
  (Kamino / MarginFi / Solend) — see the README. Until then the yield reserve
  is funded manually via `fund_yield_reserve`.
- Move the settlement-authority key into an HSM / KMS signer, not a hot .env.
