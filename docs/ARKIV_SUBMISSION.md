# Operator Uplift — ETHLisbon Arkiv Challenge Submission (AI Theme)

**Track**: Arkiv AI challenge ("a web3-native application where all data lives on a public verifiable network")
**Network**: Arkiv Braga testnet (chain id `60138453102`)
**RPC**: `https://braga.hoodi.arkiv.network/rpc`
**Explorer**: `https://explorer.braga.hoodi.arkiv.network/`
**Faucet**: `https://braga.hoodi.arkiv.network/faucet/`
**Project key**: `operatoruplift-bucharest-arkiv-7q3w` (attached as PROJECT_ATTRIBUTE to every entity + query)
**Live demo**: https://www.operatoruplift.com/arkiv
**SDK**: `@arkiv-network/sdk` v0.6.8

---

## Problem

Most AI assistants treat your conversation history as their data. They store it, sometimes train on it, and lose it the day they re-architect. Your relationship with the assistant is a relationship with their database. If that database changes hands, your memory does too.

That is the part of the agent economy nobody likes to talk about. The Arkiv AI challenge framed the alternative clearly: build a web3-native application where all data lives on a public verifiable network. We built the version where the user can actually walk away with what the assistant remembers about them.

## What we built

Two new entity types on the Arkiv Braga testnet, both carrying our `PROJECT_ATTRIBUTE` so a judge can list everything we have published with one query.

### 1. Agent identity cards (entity type `agent`)

The Calendar agent and the Gmail agent each have a signed entity that mirrors the same JSON served at `/agents/calendar.json` and `/agents/gmail.json`. Same name, description, capabilities, system prompt, model, scopes, approval policy, and SHA-256 checksum. When the agent gets a new permission, we publish a new entity; the entire history of what the agent was allowed to do is visible on a public chain explorer, not just in our internal changelog.

A judge can verify the bytes match the live JSON with:

```bash
curl -s https://www.operatoruplift.com/api/arkiv/agents | jq .
# → { agents: [...], count: 2, explorer: "https://explorer.braga.hoodi.arkiv.network/", requestId: "req_...", timestamp: "..." }
```

Click any `entityKey` through to the Braga explorer to see the on-chain entity, then byte-compare against `/agents/calendar.json` or `/agents/gmail.json`.

### 2. Session memory events (entity type `memory-event`)

When you ask the assistant to remember something across model swaps (your default tone, the people you email most, your work-hours preference), the assistant writes an entity to Arkiv tagged with the session. The entity is signed by us as the **creator** (so you can always prove we wrote it) but the **owner** field can be transferred to your wallet.

The day you want to take your memory off our servers, we hand the `$owner` to your wallet via a single transaction. We stay as `$creator` for provenance but we become read-only. The control moves to you.

This is the part the AI theme cared about: agent state that lives on a public verifiable network, ownable by the user, transferable, and signed by both parties.

## Why Arkiv specifically (not "just put it on Filecoin")

We already pin every signed receipt to **Filecoin** (via Lighthouse) and **0G Storage testnet** (via the Turbo indexer). Adding a third receipt mirror would have been the lazy interpretation of the challenge. We picked Arkiv because its entity model is structurally different:

| Property | Filecoin / 0G Storage | Arkiv |
|---|---|---|
| Stored unit | Opaque blob (IPFS CID, rootHash) | Typed entity with attributes + payload |
| Ownership semantics | Pinning provider holds | `$creator` immutable + `$owner` transferable |
| Indexing | By hash | By attribute, queryable across the network |
| Updates | New blob (new CID) | Same entity, new owner / new payload |

For receipt bytes (immutable, anonymous, byte-exact verification), Filecoin and 0G are the right shape. For agent identity and user memory (typed, queryable, transferable, attributable), Arkiv is the right shape. Same trust posture, two different data models, used where each fits.

## Architecture

```text
                        ┌──────────────────────────────┐
                        │ User asks assistant to        │
                        │ remember something            │
                        └──────────────┬───────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │ lib/arkiv/memory.ts           │
                        │ rememberEvent(agentSlug,      │
                        │                sessionId,     │
                        │                payload)       │
                        └──────────────┬───────────────┘
                                       │ writeEntity({
                                       │   $creator: ECC_WALLET,
                                       │   $owner: ECC_WALLET (default),
                                       │   project: PROJECT_ATTRIBUTE.value,
                                       │   entity_type: "memory-event",
                                       │   agent: "calendar"|"gmail",
                                       │   session: "<sessionId>",
                                       │   payload: { ... }
                                       │ })
                                       ▼
                        ┌──────────────────────────────┐
                        │ Arkiv Braga testnet           │
                        │ chain id 60138453102          │
                        └──────────────────────────────┘
                                       │
              ┌────────────────────────┴───────────────────────┐
              ▼                                                ▼
┌───────────────────────────┐                  ┌────────────────────────────┐
│ /api/arkiv/agents          │                  │ /api/arkiv/memories         │
│ (public, no auth)          │                  │ ?agent=<slug>               │
│ → list agent entities      │                  │ ?agent=<slug>&session=<id>  │
└───────────────────────────┘                  │ → index or session mode     │
              │                                  └────────────────────────────┘
              │
              ▼
┌───────────────────────────┐
│ /arkiv (judge demo page)   │
│ honest empty state until   │
│ operator funds + publishes │
└───────────────────────────┘
```

## Files shipped

| File | Purpose |
|---|---|
| `lib/arkiv/constants.ts` | `PROJECT_ATTRIBUTE` + `ENTITY_TYPE` enum + Braga testnet metadata |
| `lib/arkiv/client.ts` | Cached `PublicClient` + `WalletClient` singletons; chain config |
| `lib/arkiv/agent.ts` | Zod-validated CRUD for agent identity cards |
| `lib/arkiv/memory.ts` | CRUD for session memory events + owner-transfer helpers |
| `lib/arkiv/index.ts` | Barrel export |
| `app/api/arkiv/agents/route.ts` | GET: lists agent entities; envelope `{ agents, count, explorer, requestId, timestamp }` |
| `app/api/arkiv/memories/route.ts` | GET: index mode (`?agent=`) or session mode (`?agent=&session=`) |
| `app/arkiv/page.tsx` | Judge-facing demo route (force-dynamic), honest empty state |
| `scripts/arkiv/publish-agents.mjs` | Operator command to mirror `/agents/{slug}.json` onto Arkiv |
| `scripts/arkiv-smoke.mjs` | Five-check operator smoke (Braga RPC, agents envelope, memories envelope, PROJECT_ATTRIBUTE coherence, key shape) |
| `tests/e2e/arkiv-core.spec.ts` | Hermetic spec for the lib + page + PROJECT_ATTRIBUTE pattern |
| `tests/e2e/arkiv-routes.spec.ts` | Hermetic spec for both API route envelopes |
| `tests/e2e/blog-arkiv-post.spec.ts` | Locks the launch blog post |
| `tests/e2e/docs-arkiv-mention.spec.ts` | Locks the /docs "What ships today" mention |

## What ships today

- Agent identity cards (Calendar + Gmail) publishable to Braga via `pnpm arkiv:publish-agents`.
- Session memory events readable via `/api/arkiv/memories?agent=<slug>`.
- `/arkiv` demo page with live entity list and links to the Braga explorer.
- `pnpm arkiv:smoke` operator script confirms the Braga RPC, both routes, the PROJECT_ATTRIBUTE coherence, and the wallet key shape.

Honest about state: until the operator funds the Braga wallet at the faucet and runs `pnpm arkiv:publish-agents`, both routes return `{ count: 0 }` envelopes. We never fabricate published entities.

## What we deliberately did NOT do

- **Replace Filecoin or 0G Storage with Arkiv** for receipt mirroring. Receipts are immutable, anonymous, hash-addressed bytes; Arkiv's typed-entity model is the wrong shape for that. Receipt mirrors stay at two. See the architecture table above for the side-by-side.
- **Mint identity bytes inside an Arkiv entity** rather than the existing 0G AgenticID ERC-7857 NFT. The two surfaces are complementary: 0G AgenticID stores hashed identity bytes inside an Intelligent NFT for on-chain agent registration; Arkiv stores the full agent card JSON + transferable memory entities as queryable typed entities. Different jobs.
- **Claim user-owned memory before the user can actually own it.** Today the `$owner` defaults to the project wallet so the deploy demo lists entities without a logged-in user. The transferable-ownership API (`transferOwner`) is implemented and tested; surfacing a one-click "take my memory" button on `/dashboard` is the next follow-up that requires an authenticated wallet flow.

## Verification (for judges)

```bash
# 1. Confirm Braga RPC is reachable and we are on the right chain
curl -s -X POST https://braga.hoodi.arkiv.network/rpc \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' | jq .result
# → "0xe00de44e" (60138453102 in hex)

# 2. List every entity we have published under our project key
curl -s https://www.operatoruplift.com/api/arkiv/agents | jq .

# 3. Check that the lib + publish script agree on PROJECT_ATTRIBUTE
node scripts/arkiv-smoke.mjs

# 4. Click any entityKey into the explorer
open "https://explorer.braga.hoodi.arkiv.network/<entityKey>"

# 5. Compare entity payload to /agents/calendar.json byte-for-byte
diff <(jq -S . agent-card-from-arkiv.json) <(curl -s https://www.operatoruplift.com/agents/calendar.json | jq -S .)
```

## Cross-references

- **Demo page**: `/demo/hackathon` lists the Arkiv VerifyCard alongside Filecoin + 0G + Receipt public key (PR #628).
- **Built-on strip**: Arkiv pill on the homepage LocalFirst section (PR #623).
- **Blog launch post**: `/blog/arkiv-agent-memory-you-own` (PR #629).
- **README submission section**: full architecture + commands (PR #622).
- **Truth table**: `docs/TRUTH_TABLE.md` row for Arkiv (PR #622).
- **Deck objections + slide 4 framing**: `docs/deck-objections.md` (PR #625).
- **Verifier cookbook**: `docs/HACKATHON_GATE2.md` Arkiv section (PR #632).
- **0G companion submission**: `docs/LOOPS_HOUSE_SUBMISSION.md` (separate hackathon, separate scope).

## Why we are entering this challenge

Bucharest is the codename for the part of Operator Uplift that bets the future of AI assistants is decided not by whose model is smartest but by whose data architecture lets you walk away. Arkiv's typed-entity + transferable-ownership model is the closest thing we have seen to a real answer for that bet. Building on Braga today is the smallest possible step that makes the bet legible to users: when the assistant remembers something about you, the memory exists on a network we do not control, and you can take it with you whenever you want.
