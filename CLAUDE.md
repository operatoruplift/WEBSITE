# Operator Uplift — Website

## Role
Marketing site + live demo chat + Privy auth + Solana Pay gate + audit viewer. Owns `operatoruplift.com` and every `/api/*` route the web dashboard talks to. Consumer-first positioning for the May 14 Colosseum Demo Day.

## Must not touch
- Tauri desktop wrapper — that's `webview/san-francisco`.
- Python FastAPI runtime (demo_service, compliance, models) — that's `core/guangzhou`.
- Shared React components consumed by the desktop app — that's `repos/UI`.
- MCPay payment rail internals — that's `x402-agent/biarritz`.
- Google Calendar / Gmail tool node internals — that's `calendar_agent/cambridge` (the webhook interface only).

## May 14 priorities (in order)
1. Capability gating: `capability_google`, `capability_key`, `capability_real` surfaced via `/api/capabilities`, consumed by `/chat` and every tool route. Two user-visible states only: Demo (simulated) or Real.
2. Anonymous demo on `/chat` — canned replies, mock tool execution, Simulated chip everywhere, `10/hr/IP` rate limit.
3. Daily 8am briefing loop — Vercel Cron → `/api/cron/daily-briefing` → `notifications` → pinned row on `/chat`.
4. Consumer-first hero copy + `/demo` script wired to the 3 beats (briefing, inbox triage, reminders).
5. Solana devnet receipts for real tool calls only — never produce a receipt for a mock.

## Verification
- `npm run build` → 0 errors.
- `npx tsc --noEmit` → 0 errors.
- `npx playwright test tests/e2e/capability` → 4 specs pass.
- `curl /api/capabilities` unauthenticated → all flags false.
- Incognito → `/chat` loads, Demo pill visible, no redirect to `/login`.
- Real sign-in + Google connected → Real pill, `/security` shows receipt row after a tool run.

## Current state snapshot
- Shipped: chat, /security, Google OAuth (Calendar + Gmail), morning-briefing cron, paywall gate, Privy JWT verification, Upstash rate limiting.
- In-flight (this PR): capability primitive, Demo mode, daily-briefing cron, Tier 1 tools (web/notes/tasks/reminders).
- Stubbed/comingSoon: Tier 2 tools (Slack, Linear, Jira, Notion, GitHub, Drive, Stripe, SMS).
- Deferred post-May-15: Stripe billing, ERC-8004, per-user-local-time briefings, brand-color reconcile (#E77630 vs #F97316).
