# Loops House Hackathon — Gate 2 (x402)

**Status**: ✅ Gate 2 green. Every gated tool call goes through an
x402 payment flow on Solana devnet and produces a signed receipt.

- **Network**: Solana devnet
- **Price**: $0.01 USDC per write action (calendar.create, gmail.draft,
  gmail.send, gmail.send_draft). Reads stay free.
- **Signing**: ed25519 on the server. Public key at
  `/api/receipts/public-key`.

## End-to-end demo (5 steps)

```
┌─────────────────────────────────────────────────────────────┐
│  1. Agent proposes action                                   │
│     LLM emits <tool_use>{tool: "calendar", action: "create",│
│                          params: {summary, start, end}}     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. User approves in ToolApprovalModal                      │
│     Modal shows: tool, action, params, and "$0.01 USDC"     │
│     Click "Pay & Allow Once"                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Server returns 402 Payment Required                     │
│     POST /api/tools/calendar                                │
│       action: "create", params: {...}                       │
│     → 402                                                   │
│       { invoice_reference: "inv_cal_1729...",               │
│         amount: 0.01, currency: "USDC",                     │
│         chain: "solana-devnet",                             │
│         recipient: "UpL1ft111...",                          │
│         pay_endpoint: "/api/tools/x402/pay" }               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Client pays via x402 and retries with proof             │
│     POST /api/tools/x402/pay                                │
│       { invoice_reference }                                 │
│     → { status: "paid", tx_signature: "devnet_sim_..." }    │
│                                                             │
│     POST /api/tools/calendar (retry)                        │
│       X-Payment-Proof: <invoice_reference>                  │
│       action: "create", params: {...}                       │
│     → 200 { event, receipt }                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Receipt stored + visible at /security                   │
│     Signed receipt JSON:                                    │
│       { receipt: {                                          │
│           timestamp, user_id, agent_id, tool, action,       │
│           params_hash, result_hash, invoice_reference,      │
│           amount_usdc, chain, payment_tx                    │
│         },                                                  │
│         signature: "<base64 ed25519>",                      │
│         public_key: "<base64 raw 32-byte pubkey>" }         │
│     Click "Copy JSON" on /security to export.               │
└─────────────────────────────────────────────────────────────┘
```

## Exact demo steps

### Setup (once)

1. Apply the migration: paste `lib/hackathon-gate2-migration.sql` into
   the Supabase SQL editor. Creates `tool_invoices` + `tool_receipts`
   tables and RLS policies.
2. Ensure env vars are set (Vercel):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_TREASURY_WALLET` (optional — defaults to
     `UpL1ft11111111111111111111111111111111111111` for the demo)
   - `PAYWALL_BYPASS_EMAILS=<your-email>` so you're not blocked by
     the Pro paywall during the demo
   - `RECEIPT_SIGNING_PRIVATE_KEY` / `RECEIPT_SIGNING_PUBLIC_KEY`
     (optional — server auto-generates on cold start; fine for demo,
     but pins the key across restarts if you set them)
3. Connect Google in the app (Settings → Integrations → Connect
   Google). Requires Calendar + Gmail OAuth scopes.

### Calendar demo

1. Go to `/chat`.
2. Ask: "Schedule a coffee chat with alex@example.com tomorrow at 3pm
   for 30 minutes."
3. Agent emits a `<tool_use>` block for `calendar.create`.
4. **ToolApprovalModal appears** showing:
   - Tool: Google Calendar — Create event
   - Details: Event summary, attendees, start/end
   - **Cost: $0.01 USDC on solana-devnet** with x402 badge
5. Click **Pay & Allow Once**.
6. Under the hood (open the network tab to watch):
   - `POST /api/tools/calendar` → **402**
   - `POST /api/tools/x402/pay` → **200** with `tx_signature`
   - `POST /api/tools/calendar` with `X-Payment-Proof` header → **200**
     with `{ event, receipt }`
7. The calendar event is created on the user's real Google Calendar.
8. Navigate to `/security`. The new receipt shows under "Signed
   Receipts" at the top. Click **Copy JSON** to export.

### Gmail demo

1. Go to `/chat`.
2. Ask: "Draft an email to alex@example.com saying I'm looking forward
   to our coffee chat tomorrow."
3. Agent emits `<tool_use>` for `gmail.draft`.
4. Modal shows **Cost: $0.01 USDC on solana-devnet**.
5. Click **Pay & Allow Once**.
6. Network sequence: 402 → /pay → 200 with proof.
7. The draft appears in the user's real Gmail Drafts folder.
8. `/security` shows the second receipt.

### Verifying a receipt externally (for judges)

```bash
# 1. Copy JSON from /security
cat > receipt.json

# 2. Fetch the public key
curl https://operatoruplift.com/api/receipts/public-key
# → { algorithm: "ed25519", public_key_base64: "...", ... }

# 3. Verify with any ed25519 library. Canonical JSON = sorted keys, no
#    whitespace. In Node:
node -e '
  const crypto = require("crypto");
  const r = require("./receipt.json");
  const canonical = JSON.stringify(r.receipt, Object.keys(r.receipt).sort());
  const spki = Buffer.concat([
    Buffer.from("302a300506032b6570032100", "hex"),
    Buffer.from(r.public_key, "base64"),
  ]);
  const pub = crypto.createPublicKey({ key: spki, format: "der", type: "spki" });
  const ok = crypto.verify(null, Buffer.from(canonical), pub, Buffer.from(r.signature, "base64"));
  console.log("verified:", ok);
'
```

## What's NOT in Gate 2

Deferred to future work (explicitly not claiming):
- **ERC-8004 agent identity registration** (next PR)
- **Mainnet payments** — devnet only right now
- **Real on-chain Solana Pay verification** — the `/pay` endpoint
  currently marks invoices paid with a simulated tx signature. Wiring
  the actual on-chain verification is a 30-minute swap (replace
  `devnet_sim_*` with a call to the Solana RPC to confirm the tx
  hit the treasury wallet with the right amount).
- **Custom pricing per agent** — TOOL_PRICING is flat $0.01 USDC. The
  `query_price` column on `agents` exists for future per-agent pricing.

## Files touched

| File | Role |
|---|---|
| `lib/x402/pricing.ts` | Pricing table (tool.action → amount) |
| `lib/x402/invoices.ts` | Invoice CRUD + param hashing |
| `lib/x402/receipts.ts` | ed25519 signing + receipt storage |
| `lib/x402/middleware.ts` | `x402Gate()` — wraps tool handlers |
| `lib/hackathon-gate2-migration.sql` | `tool_invoices` + `tool_receipts` tables |
| `app/api/tools/calendar/route.ts` | Now gated via `x402Gate()` |
| `app/api/tools/gmail/route.ts` | Now gated via `x402Gate()` |
| `app/api/tools/x402/pay/route.ts` | New — mints payment proofs on devnet |
| `app/api/receipts/route.ts` | New — GET user's receipts |
| `app/api/receipts/public-key/route.ts` | New — public key for verification |
| `lib/toolCalls.ts` | `executeToolCall` now handles 402 → pay → retry |
| `src/components/ui/ToolApprovalModal.tsx` | Shows price from `TOOL_PRICING` |
| `app/(dashboard)/security/page.tsx` | New "Signed Receipts" panel |

## Acceptance checklist

- [x] Calendar: 402 on `create` without proof
- [x] Gmail: 402 on `draft`, `send`, `send_draft` without proof
- [x] Reads (list, free_slots, read) stay free — no 402
- [x] Client retry loop: 402 → pay → retry with `X-Payment-Proof`
- [x] No silent execution — if Google not connected, clean error
- [x] Receipts signed with ed25519
- [x] Receipts visible at `/security` with Copy JSON
- [x] Public key exposed at `/api/receipts/public-key` for verification
- [x] Hash binding: invoices are bound to `params_hash` so a proof for
      one request cannot be replayed for a different one
- [x] Invoice expiry: 10 minutes
- [x] `pnpm build` passes
