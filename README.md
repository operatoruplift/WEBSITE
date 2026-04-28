# Operator Uplift

**AI for your inbox and calendar. You stay in charge.**

Operator Uplift is an AI assistant that drafts your email, schedules your meetings, and sends your follow-ups. It runs on your computer (not a cloud), and every action waits for your tap.

- **Real Gmail and Calendar**: connect Google once, the assistant works on your actual accounts
- **Pick any AI**: Claude, ChatGPT, Gemini, Grok, or a model running on your laptop via Ollama
- **You approve everything**: a popup before any send or booking, one tap to confirm or cancel
- **Tamper-proof receipts**: every action gets a signed receipt you can scroll back through
- **Open source**: MIT licensed

**Live at [operatoruplift.com](https://operatoruplift.com)**

---

This is a [Next.js 16](https://nextjs.org) app deployed on Vercel.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project layout

- `app/` - Next.js app router pages and API routes
- `app/api/*` - Server-side endpoints. Every route uses `withRequestMeta` from `lib/apiHelpers.ts` to propagate `X-Request-Id` headers
- `src/sections/` - Homepage section components
- `src/components/` - Shared UI components
- `lib/` - Server + shared utilities (auth, capabilities, error taxonomy, receipts)
- `tests/e2e/` - Playwright specs (run on every PR via `.github/workflows/ci.yml`)

## CI checks

Every PR runs:

- `pnpm build` (Next.js production compile)
- `pnpm check` (grep-guards: copy-check, capability-check, trust-gate)
- 11 hermetic Playwright specs (helpers, copy-check, capability-check, trust-gate, check-orchestrator, health-adapters, magicblock-honest-status, chat-honesty, consumer-copy, dashboard-honesty, request-id-runtime)

The honesty regression tests guard against re-introducing fabricated features (LLM Council, fake telemetry, Gold Agent widget) and dev jargon (Multi-agent orchestration, AI Operating System) that prior versions of the site shipped.

## Deploy

Pushes to `master` deploy automatically via Vercel. PR previews are generated for every pull request.
