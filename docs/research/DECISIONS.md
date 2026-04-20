# DECISIONS.md

Explicit "yes / no" calls that prevent drift and Frankenstein builds. Every decision here is binding across all workspaces unless superseded by a later dated entry.

---

## Scope rules (Wave 0)

- **Reading all sources is allowed. Integrating everything is forbidden. We extract patterns first.**
- Research phase (Waves 0–3) is **doc-only**. Product code does not change.
- **STOP after each wave and ask for approval** before continuing.
- Wave 4 (implementation) is blocked until Waves 0–3 exist on disk.

## Truth rules

- Never claim a source was read unless we can cite a URL + file paths/symbols (repos) or quoted text (sites/social).
- Never claim implementation unless we can show commit hash + diff + PR link.
- If a link is blocked / login-walled, mark it `UNREADABLE`. Do **not** infer.

## Trust-critical surfaces — frozen

No research-triggered change may touch any of these unless a specific PR Task in `INTEGRATION_BACKLOG.md` says "this PR modifies \<surface\>":

- `lib/receipts.ts` — ed25519 receipt signing
- `app/api/cron/*` — Merkle anchor cron
- `lib/x402/*` — x402 payment gate, invoice lifecycle, pricing
- `lib/capabilities.ts` — capability_real primitive
- `middleware.ts` — AuthGate rules
- `/api/cron/*` — cron schedule
- Pricing tiers + amounts in `src/sections/Pricing.tsx` + `/api/subscription` subscription price

## Execution rules

- One workspace per PR. No cross-workspace edits.
- One PR per task. Timebox: 4 hours per PR.
- Every PR has exactly one acceptance test + an explicit non-goals list.
- Every failure path returns `X-Request-Id` + calm copy + `nextAction`.

## Simulated vs Real

- If something is simulated, it is labeled `SIMULATED` in the UI and in the tool-call payload (`simulated: true`).
- Demo Mode never produces a receipt. Real Mode writes produce exactly one ed25519-signed receipt.
- Approval modal must fire **before** any real write. No post-approval payload mutation.

## Capture and storage (carry into every DMG / project_space pattern)

- Background screenshot capture: **NOT DEFAULT**. Manual button only in v1.
- Raw screenshots: **never synced to cloud**. Optional local OCR + derived text only.
- Retention: user-selectable (1 day / 7 days / 30 days). Default 7 days.
- "Delete all local data" button: required on every surface that captures anything.

## Messaging (Photon / iMessage)

- Transport-first: inbound webhook → persistence → outbound send. LLM wiring is a separate PR.
- Deterministic routing by `thread_id` / `conversation_id`.
- Idempotency keyed on `message_id`.
- Always respond within 5 seconds with either a real reply or a calm fallback + Ref.

## Tokens.xyz

- Single connector module. Env-var auth only. Never hardcode.
- Persist `x-request-id` + timestamp for every call (debugging contract with the provider).
- Treat as an external data source; not a write surface.

## ECC plugin install

- **Do not execute `/plugin install ecc@ecc` until Wave 0 completes and the ECC repo has a CLONED entry in `RESEARCH_INDEX.md`.**
- Before install, add an audit note here covering: what it changes, how to audit, how to uninstall.
- After install, run `/ecc:plan` in doc-only mode first. No auto-merges.

## UI libraries

- Adopt aceternity / magicui in **controlled** replacements — max 3 components per PR.
- No wholesale redesigns triggered by research.
- Every UI change references DESIGN.md (which itself is a Wave 4 PR, not a Wave 0 artifact).

## Non-goals (things we explicitly will not build from research)

- No new agent framework unless it **replaces** an existing one (no additive frameworks).
- No new LLM provider wiring unless it plugs into the existing provider switch in `lib/llm.ts`.
- No new chain integration (EVM, Base OnchainKit full wiring, etc.) without a trust-rule decision in this file first.

---

## Revision log

- 2026-04-19 — Initial Wave 0 decisions captured. Anchor for all subsequent waves.
