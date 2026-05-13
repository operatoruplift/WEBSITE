# 0G integration decision

Status: **Reversed on 2026-05-14 from deferred to partial ship.** Original
decision was to defer all 5 modules; founder asked us to integrate for
the 0G Labs hackathon. Scope is **Storage + Agent ID on testnet**, with
the other three modules (Compute, Persistent Memory, TEE) still
deferred.

## What changed and why

Earlier this week we wrote "defer all" because we evaluated 0G as
infrastructure-replacement: should it replace our Filecoin mirror, our
hosted AI providers, our memory engine. The answer to each was no. But
that was the wrong frame for a hackathon. For a hackathon, the right
question is **what can 0G add on top of our existing stack as a second
verifiable layer**, and the answer is Storage and Agent ID.

This file replaces the earlier "defer all" record. The honest
architectural read on each module is preserved below; what changed is
the verdict on Storage + Agent ID.

## Module verdicts (current)

| 0G module | Verdict | Reasoning |
|---|---|---|
| **Storage** | **Ship (testnet)** | Additive: every signed receipt now pinned to **two** decentralized storage networks (Filecoin via Lighthouse + 0G testnet via the indexer). Judges can verify the same bytes against either network independently. Implemented in `lib/og/storage.ts` + `/api/cron/og-anchor` + `lib/og-storage-migration.sql`. /security shows a `0g: <rootHash>` link next to the `filecoin: <cid>` link. |
| **Agent ID** | **Ship (testnet)** | Additive: our existing ERC-8004-style agent registration documents (`agents/*.json`) get a parallel 0G Agent ID registration so the same agent identity is verifiable from a second standard. Implementation pending in a follow-up PR. |
| **Compute Network** | Skip | Our wedge is "use the model you already pay for." Decentralized GPU marketplace replaces user-chosen providers (breaks BYOK) or adds a 6th dropdown nobody asked for. No change since the earlier decision. |
| **Persistent Memory** | Watch | Still "coming soon" on 0G's side. Our `lib/memoryEngine` works for now. Re-evaluate when 0G ships it AND our memory system strains AND they offer clear pricing. |
| **TEE Privacy** | Skip | We do not run inference. The TEE secures a problem we already solved by not having it (BYOK means the user picks their provider's privacy posture, not ours). |

## What "Ship Storage" actually means

The hackathon integration is intentionally narrow:

1. **A new module** at `lib/og/storage.ts` that wraps the official
   `@0gfoundation/0g-storage-ts-sdk` and `ethers` packages.
2. **A new cron** at `/api/cron/og-anchor` that picks up un-anchored
   receipts and pushes the canonical `SignedReceipt` JSON to 0G
   Storage testnet. Triggered manually with the existing `CRON_SECRET`
   pattern, same as `filecoin-anchor`.
3. **A new column** `og_storage_root_hash` on `tool_receipts`. Migration
   in `lib/og-storage-migration.sql`. Filecoin column stays.
4. **A new link** on `/security` next to the existing `filecoin:` link.
   Shows the truncated rootHash; clicks through to the verifier route.
5. **A verifier passthrough** at `/api/og/storage/[rootHash]`. Public
   route (allowlisted in middleware). Returns a JSON envelope with the
   rootHash, the indexer endpoint, and verify-it-yourself instructions.
6. **Three new env vars** for the operator to provision:
   - `OG_PRIVATE_KEY` (a wallet on 0G testnet)
   - `OG_RPC_URL` (defaults to `https://evmrpc-testnet.0g.ai`)
   - `OG_INDEXER_RPC` (defaults to `https://indexer-storage-testnet-turbo.0g.ai`)

The receipt content is **unchanged**. The signed canonical JSON
contract from PR #510 + `lib/x402/receipts.ts` is preserved. 0G Storage
holds external provenance metadata, the same way Filecoin does.

## What "Ship Agent ID" will mean (next PR)

Pending. Will live as `lib/og/agent-id.ts` with a registration helper
that maps our existing `AgentRegistration` shape onto whatever 0G Agent
ID exposes. The existing agent JSON files (`agents/calendar.json`,
`agents/gmail.json`, etc.) get a second registration document; the
ERC-8004-style ones stay.

## What stays deferred

- 0G Compute Network (would replace BYOK, no)
- 0G Persistent Memory (still "coming soon")
- 0G TEE Privacy (problem we already solved)

If 0G ships Persistent Memory and our `lib/memoryEngine` strains, the
matrix above gets one more "Ship" row. Until then, two modules ship,
three modules don't.

## Cross-references

- `docs/filecoin-decision.md` — Filecoin mirror that 0G Storage **does
  not replace**. The two networks coexist per receipt.
- `lib/og/storage.ts`, `lib/og-storage-migration.sql`,
  `app/api/cron/og-anchor/route.ts`, `app/api/og/storage/[rootHash]/route.ts`
  — the actual code.
- `docs/prod-env-checklist.md` — the three OG_* env vars must be set
  on Vercel before the cron does work.
- `docs/HACKATHON_GATE2.md` — companion hackathon doc for x402 + signed
  receipts. The 0G Storage anchor is the second-network extension of
  the trust pillar described there.
