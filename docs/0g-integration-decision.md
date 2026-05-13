# 0G integration decision

Status: **Deferred 2026-05-14.** Re-evaluate when 0G ships Persistent
Memory AND our in-house memory system shows real strain. Mirrors the
template used for `docs/filecoin-decision.md` and
`docs/paysh-solana-new-integrations.md`.

## Why we looked

Founder shared the 0G docs (https://docs.0g.ai/) asking which modules
to fold in. Same investigation pattern we ran for the Solana Developer
Platform and clawcage / clawtalk-ios.

## What 0G offers and how it maps to our stack

| 0G module | What it is | What it would replace or extend | Verdict |
|---|---|---|---|
| **0G Storage** (Log + KV) | Decentralized storage, Log permanent archival + KV millisecond query layer, optimized for AI data | Filecoin mirror via Lighthouse (`lib/filecoin/anchor.ts`) for receipts; Supabase for app data | **Skip.** Pure infrastructure migration with vendor lock-in risk and no new user value. The Filecoin mirror story is already shipped and the receipt JSON shape contract is locked. |
| **Compute Network** | Decentralized GPU marketplace, pay-as-you-go inference, ZK-verifiable settlement | Hosted AI providers (Anthropic, OpenAI, Google, xAI, DeepSeek) that the user BYOKs into | **Skip.** Conflicts with our "use the model you already pay for" wedge. Adding 0G compute either replaces user-chosen providers (breaks BYOK) or adds a 6th option nobody asked for. ZK-verifiable settlement is interesting but our trust story is signed-receipts-on-Solana, not inference chain-of-custody. |
| **Persistent Memory** (coming soon) | Cross-session permanent memory + ultra-large context windows for AI agents | In-house memory in `lib/memoryEngine` + localStorage + Supabase tables (`memory_nodes`, `chat_sessions`) | **Watch.** Re-evaluate when both (a) 0G ships it and (b) our memory system shows real strain (memory truncation complaints, context-window pain). Adopting a "coming soon" hosted dependency pre-ship is risky. |
| **Agent ID** | Tokenized AI agent identity, encrypted metadata, tradable ownership, composability | Our ERC-8004-style agent registration documents (`agents/*.json` + `/api/receipts/public-key`) | **Skip.** Our wedge is approval-gated consumer assistant, not trade-your-agent marketplaces. We don't tokenize agents and users don't own/trade them on our platform. |
| **Privacy & Security** (TEE + Alignment Nodes) | Hardware-enforced privacy during inference + real-time drift/bias monitoring | Nothing today (we proxy to user-chosen AI providers; we never see prompt content beyond the proxy hop) | **Skip.** TEE solves a problem we already solved by not having it (BYOK means the user picked their provider's privacy posture, not ours). Alignment Nodes for model drift is interesting only at scale we don't have. |

## The recurring architectural mismatch

This is the **third platform-investigation in the same session** (after
SDP, then clawcage / clawtalk-ios). All three have the same shape:

- 0G / SDP / clawcage are **platforms for teams building decentralized
  AI / wallet / agent infrastructure from scratch**.
- We are **a consumer app that integrates with existing best-of-breed
  providers** (Anthropic + Google OAuth + Solana + Filecoin + Privy +
  Photon Spectrum for iMessage).

Forking from any of these or adopting their stack means rebuilding our
app on a different substrate, not extending our existing one. The cost
is high and the user-visible benefit is near-zero.

## What would change our mind

The only 0G module that could matter to us is **Persistent Memory**.
Re-evaluate it when ALL of these are true:

1. 0G has shipped Persistent Memory out of "coming soon" status.
2. Our in-house memory system (`lib/memoryEngine`) is showing real
   strain. Specifically:
   - Users complain that the assistant forgets context across sessions
     that should persist.
   - We hit context-window walls on long-running conversations.
   - We need to ship cross-device memory and our current localStorage
     + Supabase setup makes it expensive.
3. 0G offers either self-hosting or clear pricing. We do not adopt a
   hosted dependency we can't model the cost of.

Until those three line up, 0G stays in this doc, not in our code.

## Cross-references

- `docs/filecoin-decision.md` — Filecoin mirror that 0G Storage would
  replace. Shipped, working, do not touch.
- `docs/paysh-solana-new-integrations.md` — Solana payment + scaffolding
  integration we deferred under the same logic.
- `docs/deck-objections.md` — Final story alignment table. If 0G ever
  ships, the new row goes here.
- `lib/memoryEngine/` — The in-house memory subsystem that 0G
  Persistent Memory would replace.
