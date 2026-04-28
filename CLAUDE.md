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
- `pnpm check` → 3 grep-guards pass (copy-check, capability-check, trust-gate). Trust-gate currently reports 44/44 routes on `withRequestMeta`.
- `pnpm exec playwright test tests/e2e` → 17 hermetic specs pass on every PR (see `.github/workflows/ci.yml`).

## Honesty regression net
Five specs lock in the consumer-copy + fabrication cleanups (PRs #147 → #196). Any drift fails CI:

- `tests/e2e/chat-honesty.spec.ts` — /chat, /paywall, /swarm: no LLM Council, no Chairman/Contrarian/Outsider, no fake transcripts.
- `tests/e2e/consumer-copy.spec.ts` — homepage, navbar, /paywall, /store, /pricing, OG metadata, JSON-LD, /login, /signup: must use the new consumer voice (`stay in charge`, `Try it free`, `drafts your email`), and must not contain banned dev/sci-fi vocabulary (Multi-agent orchestration, AI Operating System, Self-Hosted, Local-first, Commander, Blackwall, Founder Ops, Warp Network, Uplift Core, Gold Agent).
- `tests/e2e/dashboard-honesty.spec.ts` — /app, /notifications, /workflows: no fabricated stats, no Gold Agent widget, no fake "Blackwall blocked 3 threats" notifications, no hardcoded "142 runs" workflow counts.
- `tests/e2e/request-id-runtime.spec.ts` — 16 representative endpoints all carry `X-Request-Id` (including the middleware-401 path).
- `tests/e2e/demo-flow.spec.ts` — anonymous /chat hits exactly one server route (`/api/chat`); no leaks to /api/capabilities, /api/audit/log, or other auth-required routes.

## Trust-gate
Source-level (`scripts/check.mjs::trust-gate`): every `app/api/*/route.ts` imports `@/lib/apiHelpers` and calls `withRequestMeta`. Currently 44/44 (100%).

Runtime (the spec above): every response — including the middleware's 401 — carries `X-Request-Id`. The middleware mints a fresh `req_<uuid>` if the request doesn't already have one and forwards it to the handler so end-to-end IDs match.

## Current state snapshot
- **Shipped**: chat (with honesty guarantees), /security, Google OAuth (Calendar + Gmail), morning-briefing cron, paywall gate, Privy JWT verification, Upstash rate limiting, capability primitive, Demo mode, daily-briefing cron, Tier 1 tools (web/notes/tasks/reminders), full consumer-copy rewrite across every public surface, sitemap + robots updated, JSON-LD rewritten for Google rich-results.
- **Stubbed / coming soon**: Tier 2 tools (Slack, Linear, Jira, Notion, GitHub, Drive, Stripe, SMS).
- **Deferred**: Stripe billing, ERC-8004, per-user-local-time briefings, brand-color reconcile (#E77630 vs #F97316), the lint long-tail (~19 setState-in-effect warnings in legitimate state machines).
