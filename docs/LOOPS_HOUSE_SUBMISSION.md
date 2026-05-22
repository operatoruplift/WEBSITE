# Operator Uplift — Loops House Challenge 02 Submission

**Track**: ERC-8004 + x402
**Network**: Solana devnet
**Live demo**: https://operatoruplift.com/demo/hackathon (or `/demo`, which redirects)

---

## Problem

AI agents that act on your behalf need two things that don't exist together today:

1. **A machine-readable identity** for the agent — so users, other agents, and payment rails know what they're talking to, what it can do, and what it costs.
2. **A cryptographic receipt** for every paid action — so when an agent schedules a meeting or sends an email, the user has proof it happened, who authorized it, and what was paid.

Operator Uplift ships both, using **x402** for per-action payments and an **ERC-8004-style** agent registration document for discoverability.

## What we built

Every agent action in Operator Uplift that costs the user (calendar writes, email sends) goes through an **x402 gate**:

1. Client calls `/api/tools/calendar` or `/api/tools/gmail`
2. Server responds **HTTP 402 Payment Required** with a bound invoice
3. Client pays via `/api/tools/x402/pay` (Solana devnet USDC)
4. Client retries with `X-Payment-Proof: <invoice_reference>`
5. Server validates, executes on the real Google API, and returns a **signed ed25519 receipt**

Receipts are persisted in Supabase and visible to the user. Anyone can verify them independently using the public key at `/api/receipts/public-key`.

Each receipt is anchored to **two decentralized storage networks** so a single provider outage cannot break verification:

- **Filecoin** via the cron at `/api/cron/filecoin-anchor` (Lighthouse provider). The resulting `filecoin_cid` is rendered next to every receipt row on `/security` as a clickable link to `https://<cid>.ipfs.dweb.link`.
- **0G Storage testnet** via the cron at `/api/cron/og-anchor` (Turbo indexer). The resulting `og_storage_root_hash` is rendered next to each receipt as a `0g: <rootHash>` link, pointing at `/api/og/storage/[rootHash]` — our public verifier passthrough returns a JSON envelope with the rootHash + indexer endpoint + verification instructions.

A judge fetches the same `SignedReceipt` JSON from either network and byte-compares against what `/api/receipts` returns — no need to trust our Supabase. The ed25519 signature still proves authenticity; the two mirrors prove the bytes are public, immutable, and independently retrievable from whichever network is up.

Each live agent has two identity surfaces:

1. An **ERC-8004-style registration document** at `/agents/calendar.json` and `/agents/gmail.json` — name, description, capabilities, endpoints, pricing, and a content checksum. Clients verify the agent hasn't been tampered with before calling it.
2. An **ERC-7857 Intelligent NFT (0G AgenticID)** on 0G Galileo Testnet. The agent JSON exposes an optional `og_agent_id` field with the tokenId + chainscan URL once `scripts/og-agent-id-mint.mjs` runs against a funded testnet wallet. Until that operator step is taken, the field is omitted — the deploy never claims a tokenId it does not have.

## How it works

```
User approves action in chat
        ↓
POST /api/tools/calendar { action: "create", params: {...} }
        ↓
[x402Gate middleware]
        ├─ No X-Payment-Proof header?
        │  ↓
        │  Create tool_invoice (SHA-256 bound to params)
        │  Respond 402 { invoice_reference, amount: 0.01, currency: USDC,
        │               chain: solana-devnet, recipient, pay_endpoint }
        │  ↑ goes to client
        │
        ↓ on retry (X-Payment-Proof present)
POST /api/tools/x402/pay { invoice_reference }
        ↓
Validate + mark invoice.paid (devnet: simulate tx; mainnet-ready swap)
        ↑ returns tx_signature
        ↓
POST /api/tools/calendar (retry) with X-Payment-Proof header
        ↓
[x402Gate middleware]
        ├─ validateInvoiceForConsumption()
        │    - user_id matches session
        │    - tool + action match
        │    - params_hash matches (no replay across requests)
        │    - status = paid
        │    - not expired
        │    ↓
        ↓ (gate.type === 'paid')
Execute the real Google Calendar API call
Create ed25519-signed receipt
Mark invoice consumed (single-use)
Store in tool_receipts
        ↓
Respond 200 { event, receipt: { receipt, signature, public_key } }
```

## What's verifiable

Anyone — judge, user, auditor — can verify:

| Claim | How to verify |
|---|---|
| The receipt wasn't forged | Ed25519-verify `signature` against canonical JSON of `receipt`, using the pubkey from `GET /api/receipts/public-key` |
| The invoice couldn't be replayed | `receipt.params_hash` is bound to the SHA-256 of the exact tool params; server rejects proof with mismatched hash |
| The agent exists + hasn't been modified | GET `/agents/calendar.json` includes a `checksum` over its own content |
| The tool call was paid | `receipt.invoice_reference` + `receipt.payment_tx` are recorded server-side in `tool_invoices`; user can export from `/security` |
| Per-action consent, not blanket | Every action requires a fresh approval modal. No "remember this agent" — each execution stands alone |
| The bytes survive our database | Click the `filecoin:` link on `/security` for the IPFS gateway URL; click the `0g:` link for the JSON envelope at `/api/og/storage/[rootHash]` pointing at the 0G testnet indexer. Byte-compare against `/api/receipts`. |
| The agent identity is on-chain | Once `og_agent_id` is populated in `/agents/{slug}.json`, the `explorer_url` field points at the ERC-7857 Intelligent NFT on `chainscan-galileo.0g.ai`. The on-chain `IntelligentData[]` array carries SHA-256 hashes of name + description + capabilities + system prompt + model. |

## Demo steps (exact clicks)

Judge needs: a Google account connected to operatoruplift.com. No Solana wallet required (devnet is server-simulated).

1. Open `https://operatoruplift.com/demo/hackathon` (or `/demo`, redirects there) — walks you through the flow with a diagram.
2. Log in via Privy Google at `/login`.
3. Go to `/integrations` → Connect Google Calendar & Gmail.
4. Go to `/chat`. Type: **"Schedule a 30-minute coffee chat tomorrow at 3 PM called 'Loops House demo'"**.
5. Approval modal appears. Cost: **$0.01 USDC on solana-devnet**. Click **Pay & Allow Once**.
6. Watch the Network tab: `calendar → 402`, `x402/pay → 200`, `calendar (retry, X-Payment-Proof) → 200`.
7. Real event created on your Google Calendar.
8. Go to `/security`. Your signed receipt appears. Click **Copy JSON** to export.
9. Open `/agents/calendar.json` in another tab — see the ERC-8004-style registration document.
10. (Optional) Verify the receipt signature using `GET /api/receipts/public-key`.

## Why this fits ERC-8004 + x402

**ERC-8004** is an agent identity standard: machine-readable declarations of what an agent is, what it can do, and where to talk to it. Our `/agents/{id}.json` is the static version of this — same shape (name, description, capabilities, endpoints, pricing, checksum), served from the same origin that enforces access. An on-chain registration (ERC-721 agent NFT) would replace the static JSON with a chain-anchored URI; the rest of the stack is ready for that upgrade.

**x402** is HTTP 402 Payment Required as a real protocol. Most "x402" implementations are mocks — they charge upfront in-modal. Ours is the real thing:
- The **server** returns 402 with the invoice body
- The **client** pays using the protocol-specified fields (`recipient`, `amount`, `currency`, `chain`)
- The **client** retries with `X-Payment-Proof` and the server verifies before executing

The gate is enforced at the actual tool endpoints (`/api/tools/calendar`, `/api/tools/gmail`). Reads stay free. Writes fire a server-side x402 micropayment per action — paid by us, not the user. The receipt is issued the moment the gate clears. (User billing is the separate `/paywall` subscription layer: Pro is $50/month, gas on us, cancel any time.)

## What's NOT in this submission (honest)

- **Mainnet payments** — devnet only today. Swap-over is replacing the simulated tx signature in `app/api/tools/x402/pay/route.ts` with an RPC call that verifies the tx landed in the treasury wallet for the right amount.
- **0G AgenticID tokens actually minted** — the mint scaffolding (`scripts/og-agent-id-mint.mjs`) is shipped and the persistence file (`data/og-agent-ids.json`) is committed with `null` tokenIds. Operator action is required to fund a `OG_PRIVATE_KEY` wallet at `https://faucet.0g.ai` and run the script once. Until that step happens, the `og_agent_id` field is omitted from the public agent JSON — no overclaim.

## Links

- Repo: private (2026-05-22 forward). Judge access on request at operatoruplift@gmail.com.
- Full technical doc: [`docs/HACKATHON_GATE2.md`](./HACKATHON_GATE2.md)
- 0G integration decision + scope: [`docs/0g-integration-decision.md`](./0g-integration-decision.md)
- Agent registration: `/agents/calendar.json`, `/agents/gmail.json`
- 0G AgenticID reference contract (Galileo Testnet): [`chainscan-galileo.0g.ai/address/0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F`](https://chainscan-galileo.0g.ai/address/0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F)
- 0G Storage verifier passthrough: `/api/og/storage/[rootHash]`
- Public key (receipt verification): `/api/receipts/public-key`
- Migration: `lib/hackathon-gate2-migration.sql`
