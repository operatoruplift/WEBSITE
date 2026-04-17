# Truth table — what is Real, Simulated, or Stub

Used as the authoritative reference when reviewing the PR and when
judges ask *"is that really on-chain?"* during Demo Day. If a row
here conflicts with reality, fix the row **and** fix the code — the
rule is that docs and code never disagree.

Legend:
- **Real** — ships today, works end-to-end, produces a verifiable artifact.
- **Simulated** — Demo-mode-only mock that returns a deterministic response labelled `simulated: true`. Never produces a receipt.
- **Stub** — adapter/interface shipped but not wired to anything. Clearly labelled in the UI as inactive. No fake claims.

## Chat + capability gating

| Surface | State | Notes |
|---|---|---|
| `/chat` anonymous | Real (demo canned replies) | Canned replies from `lib/cannedReplies.ts`. Zero LLM spend. 10/hr/IP rate limit. |
| `/chat` authenticated, `capability_real=false` | Real (same canned path) | Blue banner prompts Connect Google or API key. Approvals disabled. |
| `/chat` authenticated, `capability_real=true` | Real | Real LLM, Supabase persistence, real tool execution. |
| Demo pill (orange) | Real | Rendered when `capability_real=false`. |
| Real pill (green) | Real | Rendered when `capability_real=true`. |
| `/api/capabilities` | Real | Resolves `capability_google`, `capability_key`, `capability_real`. |

## Tool execution

| Tool | Demo result | Real result |
|---|---|---|
| `calendar.list/free_slots/create` | Simulated (canned events) | Real — Google Calendar API, receipt on `/security`. |
| `gmail.list/draft/send` | Simulated (fake draftId/messageId) | Real — Gmail API + receipt. |
| `reminders.schedule` | Simulated (scheduled message) | Real — inserts into `notifications` with `pinned_until`. |
| `notes.create/list` | Simulated (in-memory) | Real — Supabase `notes` table, RLS on `user_id`. |
| `tasks.create/list/complete` | Simulated (in-memory) | Real — Supabase `tasks` table, RLS on `user_id`. |
| `web.search` | Simulated (canned SERP) | Real — Serper/Brave, server-held key. |
| `web.fetch` | Simulated (canned snippet) | Real — direct fetch, HTML strip, 8 KB cap. |
| `tokens.search/price/risk/markets` | Simulated (canned SERP + candles + score) | Real — Tokens API (`api.tokens.xyz/v1`) with server-held `TOKENS_API_KEY`. |
| `imessage.send` | Simulated (`simulated-photon` messageId) | Real — Photon adapter (`lib/photon/adapter.ts`) calls provider at `PHOTON_API_BASE` (defaults to LoopMessage) using `PHOTON_API_KEY` + `PHOTON_PROJECT_ID`. |
| `slack.*`, `linear.*`, `jira.*`, `notion.*`, `github.*`, `drive.*`, `stripe.*`, `comms.*` | Stub | Registered in `lib/tools/registry.ts` as `comingSoon: true`. Approve disabled. Never executes. |

## Receipts + audit trail

| Surface | State | Notes |
|---|---|---|
| ed25519-signed receipts for Real tool calls | Real | `/api/receipts/*`. |
| Public key endpoint `/api/receipts/public-key` | Real | ed25519 pubkey for independent verification. |
| Merkle root commit to Solana devnet | Real | Anchor `publish_root` program; every 5 receipts. |
| Demo receipts | Never | No code path produces a receipt when `simulated: true`. |

## Payment rail

| Surface | State | Notes |
|---|---|---|
| x402 gate on `calendar.create` / `gmail.send/draft` | Real | 402 → invoice → `/api/tools/x402/pay` → retry with `X-Payment-Proof`. |
| x402 settlement | Real | Server wallet signs a tiny lamport transfer on Solana devnet; real signature, verifiable at `explorer.solana.com/tx/<sig>?cluster=devnet`. Requires `SOLANA_DEPLOY_WALLET_KEY` set and funded. Mainnet post-May-15. |
| MCPay compatibility | Real | Flow matches the MCPay spec. |

## Retention loop

| Surface | State | Notes |
|---|---|---|
| Profile toggle "Daily briefing at 8am" | Real | Persists to `users.briefing_enabled`. OFF by default. |
| Vercel Cron `/api/cron/daily-briefing` | Real | Runs `0 13 * * *` UTC (08:00 PT). `CRON_SECRET` required. |
| Pinned briefing message on `/chat` | Real | Reads from `notifications` where `pinned_until > now()`. |
| Demo users receive briefing | Never | Only authenticated users with `briefing_enabled=true` AND Google connected. |

## SNS (Solana Name Service)

| Surface | State | Notes |
|---|---|---|
| `/api/sns/resolve` for authenticated users | Real | Bonfida SNS proxy, 10 min cache. |
| `/api/sns/resolve` for demo/unauth users | Simulated | Mocked owner + records, `simulated: true`. |
| Verified badge on Profile | Real | Only true when resolved owner matches `SNS_EXPECTED_OWNER`. |

## MagicBlock

| Surface | State | Notes |
|---|---|---|
| `lib/magicblock/adapter.ts` | Stub | Refuses every submit with `stub_not_configured`. |
| `NEXT_PUBLIC_MAGICBLOCK_ENABLED=1` | Stub (still) | Flag alone does not activate the adapter. UI surface still reads "Inactive". |
| Receipt metadata `executed_via: 'magicblock'` | Never in this release | Only appears when the adapter is replaced with a real implementation. |
| `/demo/hackathon` MagicBlock card | Real (the card) | The card is real and accurate. The status it reports is honestly "Inactive". |

## Marketing + content

| Surface | State | Notes |
|---|---|---|
| Hero copy consumer-first | Real | Subhead mentions Approve + receipt; CTA routes to `/chat`. |
| UseCases 3 beats (briefing/inbox/reminders) | Real | Concrete prompts you can paste into `/chat` and demo. |
| Landing enterprise vignettes (lawyers/accountants/therapists) | Removed | Moved to blog posts only. Landing no longer pitches them without concrete workflow. |
| Blog post "Balaji told me to pivot. I didn't. Here's why." | Real | Published at `/blog/balaji-pivot-advice`. Specific breakdown of what was advised vs kept vs changed. |
| `/docs` GitBook-style route | Real | 7 sections shipped. Content matches this truth table. |
