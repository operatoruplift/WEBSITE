# Operator Uplift — Website

## Role
Marketing site + live demo chat + Privy auth + Solana Pay gate + audit viewer. Owns `operatoruplift.com` and every `/api/*` route the web dashboard talks to. Consumer pitch: "AI for your inbox and calendar. You stay in charge."

## Must not touch
- Tauri desktop wrapper — that's `webview/san-francisco`.
- Python FastAPI runtime (demo_service, compliance, models) — that's `core/guangzhou`.
- Shared React components consumed by the desktop app — that's `repos/UI`.
- MCPay payment rail internals — that's `x402-agent/biarritz`.
- Google Calendar / Gmail tool node internals — that's `calendar_agent/cambridge` (the webhook interface only).

## Verification commands
- `pnpm build` → 0 errors. Authoritative production-build gate.
- `pnpm exec tsc --noEmit` → 0 errors.
- `pnpm check` → 4 grep-guards pass (copy-check, capability-check, trust-gate, fabrication-rot). Trust-gate currently reports 44/44 routes on `withRequestMeta`. Fabrication-rot encodes the patterns we've explicitly retired (Gold Agent balances, Webacy fake risk grades, x402-devnet-${Date.now()} tx signatures, random-vector fakes, etc.) and points each match at the original cleanup PR — see `scripts/fabrication-rot-check.mjs`.
- `pnpm exec playwright test tests/e2e` → 38 hermetic specs pass on every PR (see `.github/workflows/ci.yml`). Includes 17 unit-style specs for lib/ pure helpers added in PRs #254-#271 (safeLog, errorTaxonomy, cannedReplies, subscription bypass, rateLimit memory fallback, oauth-state HMAC, x402 pricing+canonicalJson+hashParams, apiHelpers pure helpers, solana-pay builders, photon-adapter, magicblock-adapter ER routing, flags DEC_UI, google-oauth-consent scope contract, llm-isRetryable, sns mock, receipts ed25519 verify, llm provider status).

## Honesty regression net
Five specs + one grep-guard lock in the consumer-copy + fabrication cleanups (PRs #147 → #271). Any drift fails CI:

- `tests/e2e/chat-honesty.spec.ts` — /chat, /paywall, /swarm: no LLM Council, no Chairman/Contrarian/Outsider, no fake transcripts.
- `tests/e2e/consumer-copy.spec.ts` — homepage, navbar, /paywall, /store, /pricing, OG metadata, JSON-LD, /login, /signup: must use the new consumer voice (`stay in charge`, `Try it free`, `drafts your email`), and must not contain banned dev/sci-fi vocabulary (Multi-agent orchestration, AI Operating System, Self-Hosted, Local-first, Commander, Blackwall, Founder Ops, Warp Network, Uplift Core, Gold Agent) NOR retired local-machine claims (Everything lives on your computer, on your machine instead of theirs, AES-256 encrypted local storage, AES-256-GCM Encrypted, Your agent ran locally, Zero cloud Zero surveillance, Encrypted on your computer, your data never leaves your environment).
- `tests/e2e/dashboard-honesty.spec.ts` — /app, /notifications, /workflows, /memory, /integrations, /agents/builder, /settings: no fabricated stats, no Gold Agent widget, no fake "Blackwall blocked 3 threats" notifications, no hardcoded "142 runs" workflow counts, no pre-seeded fake memory nodes, integrations summary shows live + coming-soon (not "X available"), agent-builder DEMO badges on stub tools, settings API-keys disclosure.
- `tests/e2e/request-id-runtime.spec.ts` — 17 representative endpoints all carry `X-Request-Id` (including /api/risk + /api/gold returning 410 Gone, and the middleware-401 path).
- `tests/e2e/demo-flow.spec.ts` — anonymous /chat hits exactly one server route (`/api/chat`); no leaks to /api/capabilities, /api/audit/log, or other auth-required routes.
- `scripts/fabrication-rot-check.mjs` — **20 literal/regex patterns** for retired fabrications: Gold Agent balances, Webacy fake A-grades, x402-devnet-${Date.now()}, random-vector fakes, "expires in 30 days" toast, fake-install alert, plus the local-machine claims retired in PRs #231–#239 (Everything lives on your computer, on your machine instead of theirs, AES-256 encrypted local storage, your data never leaves your environment, vault sealed memory encrypted, Encrypted on your computer, Your agent ran locally Zero cloud Zero surveillance, Agent ${name} deployed locally, AES-256-GCM Encrypted, Local encrypted / On your computer dashboard tile sublabels). Each match prints the original cleanup PR.

## Trust-gate
Source-level (`scripts/check.mjs::trust-gate`): every `app/api/*/route.ts` imports `@/lib/apiHelpers` and calls `withRequestMeta`. Currently 44/44 (100%).

Runtime (the spec above): every response — including the middleware's 401 — carries `X-Request-Id`. The middleware mints a fresh `req_<uuid>` if the request doesn't already have one and forwards it to the handler so end-to-end IDs match.

## Current state snapshot
- **Shipped**: chat (with honesty guarantees), /security, Google OAuth (Calendar + Gmail), morning-briefing cron, paywall gate, Privy JWT verification, Upstash rate limiting, capability primitive, Demo mode, daily-briefing cron, Tier 1 tools (web/notes/tasks/reminders), full consumer-copy rewrite across every public surface, sitemap + robots updated, JSON-LD rewritten for Google rich-results.
- **Stubbed / coming soon**: Tier 2 tools (Slack, Linear, Jira, Notion, GitHub, Drive, Stripe, SMS).
- **Deferred**: Stripe billing, ERC-8004, per-user-local-time briefings, the react-hooks lint long-tail (~17 errors in legitimate state machines: setState-in-effect, ref access during render, store mutations from event handlers — non-blocking, in the informational lint job).
