# Operator Uplift

**AI that runs on your terms.**

Operator Uplift is an AI assistant that drafts your email, schedules your meetings, and sends your follow-ups. Every action waits for your explicit tap, executes against your real Google Calendar and Gmail, gets gated by a real x402 micropayment on Solana, and produces an ed25519-signed receipt that gets mirrored to **two** independent public storage networks (Filecoin and 0G testnet) plus published as a Merkle root on Solana devnet.

**Live at [operatoruplift.com](https://operatoruplift.com)** · Judge-facing walkthrough at [operatoruplift.com/demo/hackathon](https://operatoruplift.com/demo/hackathon)

---

## Table of contents

- [Project overview](#project-overview)
- [System architecture](#system-architecture)
- [0G integration](#0g-integration)
- [Arkiv integration (ETHLisbon challenge entrant)](#arkiv-integration-ethlisbon-challenge-entrant)
- [Quickstart for judges](#quickstart-for-judges)
- [Test accounts and testnet faucets](#test-accounts-and-testnet-faucets)
- [CI checks](#ci-checks)
- [Project layout](#project-layout)
- [Further reading](#further-reading)

## Project overview

**The problem.** Today's AI assistants either (a) talk a great game but cannot touch your actual Gmail or Calendar, or (b) execute actions silently with no proof of what they did. When the model changes next quarter, when a vendor goes down, or when a recipient disputes an email a year later, there is no auditable record.

**Our wedge.** A real assistant with:
- **Real tool execution.** Google Calendar and Gmail through their actual APIs, behind a Privy-authenticated session.
- **Per-action approval.** Every write action surfaces a modal showing the exact params, the cost, and the chain. One tap to confirm, one tap to cancel. No "remember this agent."
- **A signed, public-archived receipt.** Each approved action produces an ed25519-signed JSON receipt. Bytes get mirrored to Filecoin (via IPFS) **and** 0G Storage testnet (via the Turbo indexer). A Merkle root commits every five receipts to Solana devnet. A judge can verify the bytes against either mirror without trusting our database.
- **Optional on-chain agent identity.** Each agent's identity hash (name, description, capabilities, system prompt, model) can be minted as an ERC-7857 Intelligent NFT on 0G Galileo Testnet via the 0G AgenticID standard.

**Pricing.** Pro is $50/month in USDC. Team pricing is custom (book a call). Per-action gas (fractions of a cent on Solana devnet, fired by the x402 gate on every write: calendar.create, gmail.draft, gmail.send, gmail.send_draft) is on us — we don't pass it through. Reads are free.

## System architecture

```text
                       ┌──────────────────────────┐
                       │  Browser (/chat)         │
                       │  Privy session (JWT)     │
                       └────────────┬─────────────┘
                                    │
                                    │ POST /api/tools/<tool>
                                    │ { action, params }
                                    ▼
                       ┌──────────────────────────┐
                       │  x402Gate middleware     │
                       │  (returns 402 + invoice  │
                       │   if no payment proof)   │
                       └────────────┬─────────────┘
                                    │
                                    ▼
                       ┌──────────────────────────┐
                       │  POST /api/tools/x402/   │
                       │  pay { invoice_ref }     │
                       │  → simulated Solana      │
                       │  devnet tx, mark paid    │
                       └────────────┬─────────────┘
                                    │
                                    │ retry with X-Payment-Proof
                                    ▼
                       ┌──────────────────────────┐
                       │  Tool execution against  │
                       │  real Google API         │
                       │                          │
                       │  ed25519 sign canonical  │
                       │  SignedReceipt JSON      │
                       │  (lib/x402/receipts.ts)  │
                       └────────────┬─────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                ▼                                       ▼
       ┌────────────────┐                   ┌────────────────────┐
       │ tool_receipts  │                   │ Solana devnet      │
       │ Supabase + RLS │                   │ Anchor program     │
       │ (user-scoped)  │                   │ publish_root every │
       │                │                   │ 5 receipts         │
       └────────┬───────┘                   └────────────────────┘
                │
       ┌────────┴────────┐
       ▼                 ▼
┌─────────────┐   ┌──────────────────┐
│ Filecoin    │   │ 0G Storage       │
│ anchor cron │   │ anchor cron      │
│ Lighthouse  │   │ Turbo indexer    │
│ provider    │   │ (testnet)        │
└──────┬──────┘   └────────┬─────────┘
       │                   │
       ▼                   ▼
filecoin_cid          og_storage_root_hash
   │                       │
   ▼                       ▼
dweb.link IPFS    /api/og/storage/[hash]
                  (public verifier passthrough
                   returns indexer + verify steps)
```

Plus an independent on-chain identity surface for each agent:

```text
Agent registration (lib/agent-registration/)
        │
        ▼
/agents/{slug}.json  (ERC-8004-style manifest with content checksum)
        │
        │ optional second identity surface, env-gated
        ▼
scripts/og-agent-id-mint.mjs
        │
        ▼
ERC-7857 Intelligent NFT
contract: 0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F
network:  0G Galileo Testnet
IntelligentData[] = SHA-256 hashes of (name, description,
                    version, capabilities, system prompt, model)
        │
        ▼
chainscan-galileo.0g.ai/token/<contract>?a=<tokenId>
```

The Merkle-root + dual-storage-mirror + signed receipt + on-chain agent identity together form what we call the **trust stack**. Each layer is independently verifiable; a judge who distrusts our database can verify the bytes against either Filecoin or 0G; a judge who distrusts the bytes can verify the ed25519 signature against the published public key; a judge who distrusts our agents can verify their identity hash against the chainscan record.

## 0G integration

Two of 0G's five modules are integrated, both additively (they do not replace existing infrastructure, they add a second verifiable layer). See [`docs/0g-integration-decision.md`](./docs/0g-integration-decision.md) for the full rationale.

### 0G Storage (testnet)

| Field | Value |
|---|---|
| SDK | [`@0gfoundation/0g-storage-ts-sdk`](https://www.npmjs.com/package/@0gfoundation/0g-storage-ts-sdk) `^1.2.9` |
| EVM RPC | `https://evmrpc-testnet.0g.ai` |
| Storage indexer | `https://indexer-storage-testnet-turbo.0g.ai` |
| Wallet | provisioned via `OG_PRIVATE_KEY` env var |
| Code | [`lib/og/storage.ts`](./lib/og/storage.ts), [`app/api/cron/og-anchor/route.ts`](./app/api/cron/og-anchor/route.ts), [`app/api/og/storage/[rootHash]/route.ts`](./app/api/og/storage/[rootHash]/route.ts) |
| Schema | [`lib/og-storage-migration.sql`](./lib/og-storage-migration.sql) — adds `og_storage_root_hash` + `og_storage_anchored_at` columns to `tool_receipts` |

**Problem it solves:** receipt durability beyond our database. Our ed25519 signature proves the bytes are authentic, but a malicious operator could still delete a row from Supabase and pretend the action never happened. By pinning the same SignedReceipt JSON to **two** independent decentralized storage networks (Filecoin via Lighthouse, 0G via Turbo indexer), a judge or auditor fetches the bytes from a network we do not control and byte-compares against what `/api/receipts` returns. If they differ, tampering is detectable.

**Verifier flow** (no SDK install required for the first step):

```bash
# 1. Get any receipt's rootHash from the user's /security page
curl -s "https://www.operatoruplift.com/api/og/storage/<rootHash>" | jq .
# → returns the rootHash + indexer endpoint + verify instructions

# 2. To pull the raw bytes, use the 0G SDK against the indexer
# (see https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk)
pnpm install @0gfoundation/0g-storage-ts-sdk ethers
node -e "
  const { ZgFile, Indexer } = require('@0gfoundation/0g-storage-ts-sdk');
  const indexer = new Indexer('https://indexer-storage-testnet-turbo.0g.ai');
  indexer.download('<rootHash>', './receipt-from-0g.json', false).then(console.log);
"
# 3. Byte-compare against /api/receipts to detect tampering
diff <(jq -S . receipt-from-0g.json) <(curl -s .../api/receipts/<ref> | jq -S .)
```

### 0G AgenticID (Intelligent NFT, ERC-7857)

| Field | Value |
|---|---|
| Contract | [`0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F`](https://chainscan-galileo.0g.ai/address/0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F) |
| Network | 0G Galileo Testnet |
| Standard | ERC-7857 (Intelligent NFT) |
| Reference | [github.com/0gfoundation/agenticID-examples](https://github.com/0gfoundation/agenticID-examples) |
| Explorer | [chainscan-galileo.0g.ai](https://chainscan-galileo.0g.ai) |
| Code | [`lib/og/agent-id.ts`](./lib/og/agent-id.ts), [`scripts/og-agent-id-mint.mjs`](./scripts/og-agent-id-mint.mjs), [`app/api/og/agent-id/[tokenId]/route.ts`](./app/api/og/agent-id/[tokenId]/route.ts), [`data/og-agent-ids.json`](./data/og-agent-ids.json) |

**Problem it solves:** on-chain agent identity. The agent's content (name, description, capabilities, system prompt, model) is hashed into bytes32 entries and stored on-chain as the NFT's `IntelligentData[]` array. A third party can verify our agent identity has not drifted by recomputing the SHA-256 of each field and comparing against the on-chain hash. The agent JSON at `/agents/{slug}.json` surfaces the chainscan link via an optional `og_agent_id` field that is **omitted** from the JSON until a real tokenId is minted (no overclaim).

**Mint flow (operator-side):**

```bash
# 1. Fund a Galileo Testnet wallet at the faucet:
#    https://faucet.0g.ai
# 2. Export the funded wallet's private key:
export OG_PRIVATE_KEY=0x...
# 3. Run the mint script:
node scripts/og-agent-id-mint.mjs
# → mints a tokenId for each agent in data/og-agent-ids.json
# → updates the file with the resulting tokenIds
# → /agents/calendar.json and /agents/gmail.json then expose
#   og_agent_id.explorer_url pointing at chainscan-galileo.0g.ai
```

We do **not** ship pre-minted tokenIds. The persistence file ships with `null` and the public JSON omits the field until the operator runs the script. This is the same honest-status pattern we use for Filecoin and 0G Storage.

### What we explicitly do not ship from 0G

- **0G Compute Network**: would conflict with our "bring your own provider" wedge. See decision doc.
- **0G Persistent Memory**: still "coming soon" on 0G's side. Re-evaluate when it ships.
- **0G TEE Privacy**: we do not run inference. The user picks their own provider's privacy posture.

## Arkiv integration (ETHLisbon challenge entrant)

Operator Uplift is an Arkiv ETHLisbon challenge entrant under the **AI theme**: agents whose memory you actually own. Arkiv is the third public trust layer alongside Filecoin and 0G Storage, with one important difference: while Filecoin and 0G mirror our backend-signed receipts, Arkiv hosts data the user themselves can own and transfer.

| Field | Value |
|---|---|
| Theme | AI |
| Demo link | [operatoruplift.com/arkiv](https://operatoruplift.com/arkiv) |
| Network | Arkiv Braga Testnet (chain id 60138453102) |
| RPC | `https://braga.hoodi.arkiv.network/rpc` |
| Faucet | [braga.hoodi.arkiv.network/faucet](https://braga.hoodi.arkiv.network/faucet/) |
| Explorer | [explorer.braga.hoodi.arkiv.network](https://explorer.braga.hoodi.arkiv.network/) |
| Code | [`lib/arkiv/`](./lib/arkiv), [`app/api/arkiv/`](./app/api/arkiv), [`app/arkiv/page.tsx`](./app/arkiv/page.tsx), [`scripts/arkiv/publish-agents.mjs`](./scripts/arkiv/publish-agents.mjs) |
| Project attribute | `project=operatoruplift-bucharest-arkiv-7q3w` (lib/arkiv/constants.ts) |

**Entrant requirements covered:**

1. Unique `PROJECT_ATTRIBUTE` used on every create and every query (Arkiv best practice 1). Hermetic spec at `tests/e2e/arkiv-core.spec.ts` fails CI on any new write path that forgets to include it.
2. **Two entity types**:
   - `agent`: on-Arkiv mirror of `/agents/{slug}.json` (ERC-8004 identity card + sha256 checksum). Backend-written, reads filter by `.createdBy()` against the trusted creator wallet.
   - `memory-event`: one entry of an agent's conversation memory tied to a user, agent slug, and session. `$owner` defaults to the backend writer but can be transferred to the user's wallet so the platform loses update/delete permission while `$creator` (immutable) keeps the audit trail.
3. Open-source repo (this one), MIT-licensed via Operator Uplift's existing license.
4. Working demo link at [/arkiv](https://operatoruplift.com/arkiv) — honest empty state when no entities are published yet (same hide-when-NULL contract as Filecoin/0G).
5. README setup (this section + `.env.local.example`).

**Publish flow (operator-side):**

```bash
# 1. Fund a Braga testnet wallet at the faucet:
#    https://braga.hoodi.arkiv.network/faucet/
# 2. Export the funded wallet private key + its public address:
export ARKIV_PRIVATE_KEY=0x...
export NEXT_PUBLIC_ARKIV_CREATOR_ADDRESS=0x...  # derive from the private key
# 3. Run the publish script:
node scripts/arkiv/publish-agents.mjs
# → mirrors /agents/calendar.json + /agents/gmail.json as Arkiv entities
# → idempotent: republishing produces a fresh entity, /arkiv shows the newest
# → entityKey + Braga explorer link printed for each agent so a judge can
#   click straight through to verify the on-chain card
```

Until the operator runs the script, `/arkiv` surfaces an honest "no entities yet" state and the agents API returns `{ agents: [], count: 0 }`. The page never fabricates results.

**Verifying any entity independently (judge cookbook):**

```bash
# 1. List on-Arkiv agents (no auth required)
curl https://www.operatoruplift.com/api/arkiv/agents | jq

# 2. Open any entityKey in the Braga explorer
open https://explorer.braga.hoodi.arkiv.network/entity/<entityKey>

# 3. Cross-verify the on-Arkiv checksum against the origin manifest
curl -s https://www.operatoruplift.com/agents/calendar.json | jq -r .checksum
# Should match the checksum attribute on the Arkiv entity.
```

The two surfaces are independently signed: origin manifest by the deploy, Arkiv entity by the `$creator` wallet. If they disagree, tampering is detectable.

## Quickstart for judges

This boots the app locally and surfaces the deployed live site for full functionality. The marketing pages, /demo/hackathon walkthrough, /docs, and /api/og/storage/[rootHash] all work without any env vars; the gated chat and tool routes require Privy + Supabase + Google OAuth credentials documented below.

```bash
# 1. Prereqs
# - Node.js 20+
# - pnpm 9 (https://pnpm.io/installation)
node -v   # → v20.x.x or higher
pnpm -v   # → 9.x.x

# 2. Clone + install
git clone https://github.com/operatoruplift/website.git operatoruplift
cd operatoruplift
pnpm install --frozen-lockfile

# 3. Configure env vars
cp .env.local.example .env.local
# Edit .env.local — for the marketing-only and judge-walkthrough
# paths, no values are required. The /demo/hackathon page works
# anonymously. For real tool execution you will need:
#   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#   SUPABASE_SERVICE_ROLE_KEY (from supabase.com)
#   NEXT_PUBLIC_PRIVY_APP_ID, PRIVY_APP_SECRET (from privy.io)
#   GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET,
#     GOOGLE_OAUTH_STATE_SECRET, GOOGLE_OAUTH_REDIRECT_URI
#     (from console.cloud.google.com)
# The .env.local.example file has the full annotated list.

# 4. Run the dev server
pnpm dev
# → http://localhost:3000

# 5. (Optional) Run the production build locally
pnpm build && pnpm start
# → http://localhost:3000 (full prod compile)
```

**What works without any env:**

- `/` — homepage with the trust stack pitch
- `/blog` — engineering posts including the "we shipped 0G" piece
- `/docs` — public documentation including the receipts + verification flow
- `/demo/hackathon` — the judge-facing walkthrough with VerifyCard links
- `/agents/calendar.json` and `/agents/gmail.json` — ERC-8004 agent manifests
- `/api/receipts/public-key` — the ed25519 pubkey used to sign every receipt
- `/api/og/storage/<rootHash>` — public verifier passthrough for the 0G Storage anchor
- `/api/og/agent-id/<tokenId>` — public verifier passthrough for the AgenticID NFT

**What needs env vars** (full setup):

- `/chat` — needs Privy app id, Anthropic/OpenAI/Gemini provider key, Supabase
- `/integrations` Google connect — needs the four `GOOGLE_OAUTH_*` env vars
- `/security` receipts — needs Supabase + a signed receipt to exist
- `/api/cron/og-anchor` — needs `OG_PRIVATE_KEY` funded at <https://faucet.0g.ai>
- `/api/cron/filecoin-anchor` — needs `FILECOIN_PROVIDER` + token

## Test accounts and testnet faucets

We do **not** ship hard-coded test credentials for security reasons. Judges use the live deploy with their own accounts:

### Live judge walkthrough (no signup needed)

Open [operatoruplift.com/demo/hackathon](https://operatoruplift.com/demo/hackathon). The page walks through the trust stack with click-through verifier links for each receipt anchor (signature, Solana Merkle root, Filecoin CID, 0G rootHash). No authentication required.

### Full live test (real Gmail/Calendar tool calls)

1. Sign up at [operatoruplift.com/login](https://operatoruplift.com/login) via Privy (Google or email).
2. Connect Google at [operatoruplift.com/integrations](https://operatoruplift.com/integrations).
3. Open `/chat` and ask: **"Schedule a 30-minute coffee chat with alex@example.com tomorrow at 3pm called 'Loops House demo'."**
4. The approval modal shows the cost (**$0.01 USDC on solana-devnet**) and the params. Click **Pay & Allow Once**.
5. The event lands on your real Google Calendar. The signed receipt appears at `/security`.

The Pro tier is $50/month; for judging we whitelist `PAYWALL_BYPASS_EMAILS` so judges do not hit the paywall — email the team to be added before testing.

### Testnet faucets (if reproducing the cron flows locally)

| Network | Faucet | What it funds |
|---|---|---|
| 0G Galileo Testnet | <https://faucet.0g.ai> | `OG_PRIVATE_KEY` wallet — anchors receipts to 0G Storage and mints AgenticID tokens |
| Solana devnet | `solana airdrop 2 <pubkey> --url devnet` | The treasury wallet that x402 sims against (already simulated server-side; not required for testing the gate) |

### Verifying any receipt independently (judge cookbook)

Given a `receipt_reference` from `/security` or `/api/receipts`:

```bash
# Verify the ed25519 signature
curl -s https://operatoruplift.com/api/receipts/public-key
# → { algorithm: "ed25519", public_key_base64: "...", ... }
# (verify with any ed25519 library; see docs/HACKATHON_GATE2.md)

# Verify the bytes are also on Filecoin
# → click the filecoin: <cid> link on /security
# → browser opens https://<cid>.ipfs.dweb.link
# → diff against /api/receipts response

# Verify the bytes are also on 0G Storage
# → click the 0g: <rootHash> link on /security
# → JSON envelope at /api/og/storage/<rootHash> documents the indexer
# → pull bytes via the 0G SDK and diff
```

See [`docs/HACKATHON_GATE2.md`](./docs/HACKATHON_GATE2.md) for the full step-by-step verifier cookbook.

## CI checks

Every PR runs through `.github/workflows/ci.yml`:

- `pnpm build` (Next.js 16 production compile)
- `pnpm check` (grep guards: copy-check banned phrases, capability-check for unguarded routes, trust-gate runtime contract, fabrication-rot anchored patterns)
- **~70 hermetic Playwright specs** covering: trust contract, capability gating, copy honesty, receipt verification, x402 gate, photon iMessage adapter, MagicBlock honest-status, 0G Storage envelope, 0G Agent ID hide-when-NULL, blog header centering, and more

The honesty regression tests guard against re-introducing fabricated features (LLM Council, fake telemetry, Gold Agent widget), dev jargon (Multi-agent orchestration, AI Operating System), and local-machine claims that prior versions of the site shipped. `scripts/fabrication-rot-check.mjs` enforces 20 anchored patterns; each match prints the original cleanup PR.

## Project layout

```text
app/
├── api/
│   ├── tools/             ← x402-gated tool routes (calendar, gmail)
│   ├── cron/
│   │   ├── filecoin-anchor/   ← anchors un-anchored receipts to Filecoin
│   │   └── og-anchor/         ← anchors un-anchored receipts to 0G Storage
│   ├── og/
│   │   ├── storage/[rootHash]/   ← public verifier passthrough
│   │   └── agent-id/[tokenId]/   ← public verifier passthrough
│   ├── health/adapters/   ← honest-status surface for every integration
│   └── receipts/public-key/   ← ed25519 pubkey for independent verification
├── chat/                  ← gated chat UI with per-turn approval modal
├── security/              ← signed receipts with both mirror links
├── agents/{slug}.json     ← ERC-8004 manifest + optional og_agent_id field
├── demo/hackathon/        ← no-auth judge walkthrough
└── blog/                  ← engineering blog

lib/
├── og/storage.ts          ← 0G Storage SDK wrapper
├── og/agent-id.ts         ← ERC-7857 IntelligentData mapper + chainscan URL builders
├── filecoin/anchor.ts     ← Filecoin (Lighthouse) anchor module
├── x402/                  ← invoices, receipts, canonical JSON, ed25519
└── agent-registration/    ← ERC-8004 manifest builders with og_agent_id field

scripts/
├── og-agent-id-mint.mjs   ← operator script: mint ERC-7857 NFTs for each agent
├── filecoin-smoke.mjs     ← end-to-end Filecoin anchor smoke test
└── copy-check.mjs         ← banned-phrase guard run in CI

data/
└── og-agent-ids.json      ← persisted tokenIds per agent slug (null until minted)

tests/e2e/                 ← Playwright specs (run in CI)
docs/                      ← decision docs, runbooks, judge cookbook
```

## Further reading

- [`docs/HACKATHON_GATE2.md`](./docs/HACKATHON_GATE2.md) — full x402 + receipts + dual-mirror + AgenticID verification cookbook
- [`docs/LOOPS_HOUSE_SUBMISSION.md`](./docs/LOOPS_HOUSE_SUBMISSION.md) — earlier hackathon submission (Loops House) covering the x402 + ERC-8004 wedge
- [`docs/0g-integration-decision.md`](./docs/0g-integration-decision.md) — which 0G modules we ship, which we skip, and why
- [`docs/TRUTH_TABLE.md`](./docs/TRUTH_TABLE.md) — authoritative "what is Real, Simulated, or Stub" table for every claim on the site
- [`docs/prod-env-checklist.md`](./docs/prod-env-checklist.md) — operator runbook for prod env vars
- [`docs/deck-objections.md`](./docs/deck-objections.md) — pitch + 8 memorized objection answers

## Deploy

Pushes to `master` deploy automatically via Vercel. PR previews are generated for every pull request.

## License

MIT.
