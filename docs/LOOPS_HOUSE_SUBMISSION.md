# Operator Uplift — Loops House Challenge 02 Submission

**Track**: ERC-8004 + x402
**Network**: Solana devnet
**Live demo**: https://operatoruplift.com/demo

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

Each live agent publishes an **ERC-8004-style registration document** at `/agents/calendar.json` and `/agents/gmail.json` — name, description, capabilities, endpoints, pricing, and a content checksum. Clients can verify the agent hasn't been tampered with before calling it.

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

## Demo steps (exact clicks)

Judge needs: a Google account connected to operatoruplift.com. No Solana wallet required (devnet is server-simulated).

1. Open `https://operatoruplift.com/demo` — walks you through the flow with a diagram.
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

The gate is enforced at the actual tool endpoints (`/api/tools/calendar`, `/api/tools/gmail`). Reads stay free. Writes pay per action. No subscription lock-in, no batched billing — the moment an action costs, the cost is billed, and a receipt is issued.

## What's NOT in this submission (honest)

- **Mainnet payments** — devnet only today. Swap-over is replacing the simulated tx signature in `app/api/tools/x402/pay/route.ts` with an RPC call that verifies the tx landed in the treasury wallet for the right amount.
- **On-chain agent NFT (ERC-721)** — we ship the registration document but haven't minted. An NFT mint with metadata pointing at `/agents/*.json` would close the loop.

## Links

- Repo: https://github.com/operatoruplift/website
- Full technical doc: [`docs/HACKATHON_GATE2.md`](./HACKATHON_GATE2.md)
- Agent registration: `/agents/calendar.json`, `/agents/gmail.json`
- Public key (receipt verification): `/api/receipts/public-key`
- Migration: `lib/hackathon-gate2-migration.sql`
