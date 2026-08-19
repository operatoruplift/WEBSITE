# uplift-escrow

Solana (Anchor 0.30) escrow for Operator Uplift's "bet on yourself" mechanic.

Stake USDC on a daily-habit cohort, prove each day, and finish to reclaim your
full stake **plus accrued yield plus a share of the stakes forfeited by people
who quit**. Miss a day and your stake stays in the pool and is redistributed to
the finishers. The on-chain economics match the app: **1% protocol fee, 4.5%
simple-interest APY, forfeited pool split evenly among finishers after a 1% cut.**

> ⚠️ **This program holds real funds and has NOT been audited. Do not deploy to
> mainnet before a professional audit.** It is written to be reviewable and to
> mirror the off-chain logic in `src/uplift/store.ts`, not to be shipped as-is.

## Accounts

| PDA | Seeds | Holds |
| --- | --- | --- |
| `Config` | `["config"]` | admin, settlement authority, USDC mint, treasury, yield reserve, fee/APY bps |
| vault authority | `["vault_auth"]` | (signer only) owns every vault + the reserve |
| `yield_reserve` | `["yield_reserve"]` | USDC the accrued interest is paid from |
| `Challenge` | `["challenge", id]` | cohort params, counters, pool accounting |
| vault | `["vault", id]` | that cohort's escrowed stakes |
| `Enrollment` | `["enrollment", id, user]` | one user's stake + proof progress |

## Instructions

1. `initialize_config(settlement_authority, protocol_fee_bps, yield_apy_bps)` — one-time.
2. `fund_yield_reserve(amount)` — top up the reserve interest is paid from.
3. `create_challenge(id, days, per_day, fee_free, start_ts)` — admin opens a cohort.
4. `enroll(id)` — user locks `days * per_day` USDC; pays the 1% fee to treasury.
5. `submit_proof(id)` — settlement authority attests a day. On the final day the
   stake **+ interest** is returned immediately.
6. `forfeit(id)` — user quits. Full refund inside 24h, else stake → forfeited pool.
7. `lapse_enrollment(id)` — permissionless; forfeits an enrollment that missed a
   day or whose window closed unfinished.
8. `settle_challenge(id)` — permissionless after the window; takes the 1% cut and
   fixes the per-finisher bonus rate.
9. `claim_bonus(id)` — a finisher pulls their share of the forfeited pool.

### Settlement is pull-based

On-chain programs can't loop over every enrollment, so redistribution is a **pull
pattern**: `settle_challenge` only computes `per_finisher_bonus = (forfeited_pool −
1% cut) / finishers` and each finisher calls `claim_bonus`. A **keeper must
`lapse_enrollment` every still-active, unfinished enrollment after `end_ts` before
calling `settle_challenge`** — exactly as the app runs `resolveLapsedEnrollments`
before settling. Stakes of enrollments left un-lapsed at settlement are not counted
into the bonus pool.

## Yield: where the 4.5% actually comes from

The contract **accounts for and pays** yield (`simple_interest = stake · apy ·
days / 365`) out of the `yield_reserve`. It does not itself run a yield strategy —
that is a deliberate seam so the strategy can be chosen and audited independently:

- **Now (accrual model):** `fund_yield_reserve` tops up the reserve; interest is
  paid from it on completion. Matches the app's fixed-APY model exactly.
- **Production (real market yield):** during the lock, idle escrow should be
  deposited into a Solana money-market so it earns actual yield, then withdrawn at
  settlement. Add `strategy_deposit` / `strategy_withdraw` instructions that CPI
  into **Kamino Lend**, **MarginFi**, or **Solend**, routing the earned interest
  into `yield_reserve`. This is protocol-specific, needs the vendor SDK/program
  IDs, and must be audited — hence it is intentionally not wired here.

Keeping principal in escrow and yield in a separate reserve means a strategy that
underperforms can never eat into stakers' principal.

## Build, test, deploy

```bash
cd anchor
anchor keys sync            # replace the placeholder program id with your keypair
anchor build                # requires the Solana platform tools (solana-install)
anchor test                 # localnet: spins a validator, runs tests/uplift-escrow.ts
anchor deploy --provider.cluster devnet
```

`cargo check -p uplift-escrow` type-checks the program without the Solana toolchain.

## Wiring to the app

`Challenge.challenge_id` is the app's numeric cohort id; `per_day` and
`stake_amount` are USDC base units (6 decimals). The `settlement_authority` key is
the server-side "AI Game Master" that attests proofs after the vision pipeline
passes — the same authority that settles proofs in `app/api`. Point the client at
this program by adding a `lib/solana/escrow.ts` builder alongside the existing
`usdc-transfer.ts`.
