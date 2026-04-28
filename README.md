# Operator Uplift

**AI for your inbox and calendar. You stay in charge.**

Operator Uplift is an AI assistant that drafts your email, schedules your meetings, and sends your follow-ups. The web app pauses for your tap before any action and emits a signed receipt afterward. The desktop+Ollama build on the roadmap removes the provider hop entirely for users who need full on-device inference.

- **Real Gmail and Calendar**: connect Google once, the assistant works on your actual accounts
- **Pick any AI**: Claude, ChatGPT, Gemini, Grok per turn (the desktop build adds Ollama on the roadmap)
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
- `pnpm check` (grep-guards: copy-check, capability-check, trust-gate, fabrication-rot)
- 17 hermetic Playwright specs (helpers, copy-check, capability-check, trust-gate, check-orchestrator, health-adapters, magicblock-honest-status, chat-honesty, consumer-copy, dashboard-honesty, request-id-runtime, agents-store, download-cta, demo-flow, photon-webhook, toolSafety, auth-diagnoseJws)

The honesty regression tests guard against re-introducing fabricated features (LLM Council, fake telemetry, Gold Agent widget), dev jargon (Multi-agent orchestration, AI Operating System), and local-machine claims (Runs on your computer, AES-256 encrypted local storage, Your agent ran locally, Encrypted on your computer) that prior versions of the site shipped. `scripts/fabrication-rot-check.mjs` enforces 20 anchored patterns; each match prints the original cleanup PR.

## Deploy

Pushes to `master` deploy automatically via Vercel. PR previews are generated for every pull request.
