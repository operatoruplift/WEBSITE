# Demo Day — ordered build brief (P0 → P9)

Single source of truth for the May 14 Colosseum Demo Day PR. Earlier
session notes repeated P6–P9 and P0–P5 in different orders and paired
them with longer rationale; this file is the short, strict, ordered
version. Follow top to bottom.

## Mission

Consumer-first onboarding with an explicit trust model.
- Anyone can try `/chat` with zero signup in **Demo mode** (simulated).
- Logged-in users unlock **Real mode** when they have Google connected
  OR a valid LLM API key available server-side.
- Never claim real execution unless it truly ran. Every tool result is
  labeled **Real** or **Simulated**. Demo mode never creates receipts.

## Positioning

> Operator Uplift is a personal AI operator that drafts your emails
> and runs your calendar, but every action waits for your Approve
> click and every real action leaves a signed receipt.

Three demo beats, in this order:
1. **Daily briefing** — "What's on my calendar today and what should I worry about?"
2. **Inbox triage** — "Draft replies to these 3 emails, ask me before sending."
3. **Reminders vibe** — "Turn this into iMessage-style nudges: weather, calendar, one fun thing (horoscope) so I come back tomorrow."

Lead consumer-first on the landing. Enterprise examples
(lawyers/therapists/accountants) stay out of the hero unless they
carry a concrete workflow with before/after. Otherwise delete.

---

## P0 — Cut noise (sidebar)

Trim `src/components/cockpit/CockpitSidebar.tsx` nav to exactly:
Chat, Swarm, Integrations, Security, Profile. Hide theater pages from
nav but keep routes mounted for direct links. Drop the
`advanced_mode` localStorage toggle. Leave a JSDoc comment listing
the hidden routes so they can be restored post-May-15.

## P1 — Capability primitive

Server-side capability flags plus a client endpoint.
- `capability_google` — authenticated AND valid Google OAuth row in
  `user_integrations`.
- `capability_key` — authenticated AND an LLM provider key is
  available (server env key or user-supplied BYOK when shipped).
- `capability_real` — `capability_google || capability_key`.

Expose via `GET /api/capabilities` → `{capability_google,
capability_key, capability_real, authenticated}`. Back it with
`lib/capabilities.ts::getCapabilities(request)`. Every `/api/*` route
that can produce a side effect must call this before acting.

## P2 — /chat Demo mode (anonymous)

Make `/chat` reachable logged out via `AuthGate.AUTH_OPTIONAL_ROUTES`.

Two user-visible states only: **Demo** and **Real**.

**Demo** (logged out OR logged in with `capability_real=false`):
- Canned, deterministic replies from `lib/cannedReplies.ts`. Zero LLM
  spend. No Supabase chat writes.
- `ToolApprovalModal` still appears. Approve returns a deterministic
  mock with `simulated: true` and a gray **Simulated** chip. Footer
  CTA: "Connect Google or add an API key to run this for real."
- Rate limit: `10/hr/IP` via Upstash `rl:demo:<ip>`.

**Real** (logged in with `capability_real=true`):
- Real LLM. Supabase persistence. Real tool execution.
- Tools the user can't authorise are hidden from the picker, not
  partially enabled. Google-scoped tools require `capability_google`;
  Tier 1 tools require `capability_real` only.
- Successful actions produce ed25519-signed receipts rendered on
  `/security`, Merkle-rooted to Solana devnet every five.

**Core rule (non-negotiable):** never claim real execution unless
`capability_real === true` AND the tool actually ran. No code path
produces a receipt when `simulated: true`.

## P3 — Retention loop (daily briefing)

- Profile toggle "Daily briefing at 8am" — default OFF.
- Vercel Cron `/api/cron/daily-briefing` fires at `0 13 * * *` UTC
  (08:00 PT), guarded by `CRON_SECRET`.
- Only for users with `briefing_enabled = true` AND Google connected.
- Insert a pinned row into `notifications` (type `daily_briefing`,
  `pinned_until` = today 23:59). `/chat` renders it as the first
  message above the composer on load.

## P4 — Tier 1 tool expansion (no Google needed)

Tools registered in `lib/tools/registry.ts` with `tier`, `requires`,
and `comingSoon` metadata.

Ship end-to-end (real + demo mock):
- `web.search`, `web.fetch` — real uses server-held key + readability,
  demo returns a fixed snippet.
- `notes.create`, `notes.list` — Supabase in real mode, in-memory in
  demo.
- `tasks.create`, `tasks.list`, `tasks.complete` — same.
- `reminders.schedule` — beat 3 primitive; demo returns "Nudge
  scheduled (simulated)".

All Tier 1 tools must work in API-key-only mode.

Register Tier 2 tools (`slack.*`, `linear.*`, `jira.*`, `notion.*`,
`github.*`, `drive.*`, `stripe.*`, `comms.*`) with `comingSoon: true`
so they render in the catalog but Approve is disabled — prevents
over-promising.

## P5 — Consumer-first positioning (copy only, no new pages)

Only edit: hero, `/demo` copy, `/demo/hackathon` copy, canned chat
prompts.

- Hero subhead must mention Approve and receipt. Primary CTA "Try It
  Live — No Signup" → `/chat`.
- Any mention of lawyers/therapists/accountants on the landing
  requires a concrete workflow + before/after. Otherwise delete it
  for this release.
- Ensure the three beats appear in canned replies and in `/demo`.

No new marketing pages. If it would need one, defer it.

## P6 — SNS (read-only, Profile identity card)

- `lib/sns.ts` resolves `.sol` via the Bonfida SNS proxy. Cache 10
  minutes. Never hard-fail.
- `GET /api/sns/resolve?name=operatoruplift.sol` returns
  `{name, owner, records, verified, cachedAt}`. Demo users get a
  mocked payload with `simulated: true`.
- Profile gains an **Identity** section showing `operatoruplift.sol`
  and `operatoruplift.sol.site`. Verified badge only when owner
  matches `SNS_EXPECTED_OWNER` env.

Acceptance: Profile never throws on cold load. Endpoint returns fast.

## P7 — MagicBlock (hackathon surface only)

- `lib/magicblock/adapter.ts` — feature-flagged
  (`NEXT_PUBLIC_MAGICBLOCK_ENABLED`) adapter interface.
- Stub implementation refuses every `submit` with
  `stub_not_configured` even when the flag is on, so no receipt can
  carry `executed_via: magicblock` until the stub is replaced.
- `/demo/hackathon` gets a MagicBlock card with an honest Inactive
  status and a link to the adapter file. No fake claims.

If enabled AND the adapter is real, one safe demo action writes
`executed_via: magicblock` to receipt metadata with a linkable
artifact. Otherwise nothing in the core flow changes.

## P8 — Blog polish + Balaji post

- Narrow reading column to 720 px, body 17 px, line-height 1.75,
  `.blog-content` class for consistent h2/h3/code/pre/blockquote
  styling.
- New featured post `/blog/balaji-pivot-advice` — "Balaji told me to
  pivot. I didn't. Here's why." Specific breakdown: what he advised,
  what I disagreed with, what I changed anyway, what I kept. No
  unverified claims.
- Ensure only one post has `featured: true` so the blog index has a
  single featured card.

## P9 — /docs GitBook-style route

- `app/docs/layout.tsx` — sticky left sidebar nav grouped by section,
  740 px content column.
- Six slugs, statically pre-rendered:
  `getting-started`, `approvals`, `receipts`, `x402`,
  `integrations`, `troubleshooting`.
- Content in `app/docs/_components/DocContent.tsx`. Every claim must
  match shipping behaviour — cross-check against the Truth table.

## Final deliverables

- `docs/TRUTH_TABLE.md` lists every surface as Real / Simulated /
  Stub. Update it whenever code and docs diverge.
- PR body carries a Truth table section, test plan, migration list,
  env checklist, and follow-up note for screenshots + sibling
  `CLAUDE.md` files in `docs/workspace-CLAUDE/`.
- `npx tsc --noEmit` clean. `npm run build` clean. Capability
  Playwright specs pass.

## Known production gotchas (verified 2026-04-17)

1. **Council "Unable to process — API unavailable"** — caused by
   `/api/chat` returning 503 when `ANTHROPIC_API_KEY` (or the
   user's chosen provider) is missing in Vercel env, OR by
   `lib/council.ts` calling `/api/chat` without the Privy token
   (which after P1 falls into the demo canned branch). Both fixed
   post-PR #110: council now passes `Authorization: Bearer <token>`
   and surfaces the real error instead of a generic message. Action
   for ops: confirm `ANTHROPIC_API_KEY` is set in Vercel prod.

2. **Balaji post "missing" on production** — the post lives on
   `hackathon-submission`. Production is `master` and will only show
   the post after PR #110 merges. Until then, use the Vercel preview
   URL for that branch.
