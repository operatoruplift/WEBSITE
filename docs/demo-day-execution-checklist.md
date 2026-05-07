# Demo-day execution checklist

The single ordered list of what to do before recording. Each row has a deliverable that proves it is done, a verification command, and the file path of the artifact (if any).

Companion docs:
- `docs/demo-recording-script.md` - the click-by-click recording script.
- `docs/deck-objections.md` - pitch + 8 objection answers.
- `docs/filecoin-decision.md` - defer Filecoin, what to say if asked.
- `docs/imessage-agent-runbook.md` - what the iMessage agent does, env vars required.
- `docs/prod-env-checklist.md` - must-have Vercel env vars.

## Order of operations

Run top to bottom. Skip items at your own risk.

| # | Step | Deliverable / verification | Owner |
|---|---|---|---|
| 1 | Repo audit (Wave 1) | `Wave 1 inventory` delivered earlier in chat thread | done |
| 2 | iMessage / Photon Wave 2 fixes | PR #459 merged: UUID messageId, reject `unknown` sender. 221/221 photon tests pass. | done |
| 3 | Auth light-mode (Wave 3 prompt 10) | PR #456 merged. Privy modal `theme: 'light'`, AuthGate gate + loading wrapped in `theme-light`. | done |
| 4 | AuthGate prod fail-closed (Wave 1 risk 2) | PR #462 merged. `NODE_ENV === 'production'` gate on the catch branch. | done |
| 5 | `/signup` deprecated, redirects to `/login` (Wave 1 risk 1) | PR #458 merged. `app/(auth)/signup/page.tsx` is a server-side `redirect('/login')`. | done |
| 6 | `/pricing` CTAs route to login (Wave 1 risk 3) | PR #458 merged. Team and Business tier CTAs go `/login?returnTo=/paywall`. Enterprise stays `/contact`. | done |
| 7 | `/api/health` exists (Wave 1 risk 6) | PR #458 merged. `app/api/health/route.ts` returns `{ ok: true }`. | done |
| 8 | Hero + LocalFirst + TrustedBy + Pro/Teams copy refresh (Wave 6 prompts 21-24) | PR #457 merged. `Stop typing the same email twice.` headline. Continuity callout under trust grid. Trust marquee trimmed 14→7. | done |
| 9 | SNS-anchored signer identity on /security (Wave 5 prompt 19) | PR #460 merged. "Signed by operatoruplift.sol" link to `/api/sns/resolve` next to the public-key endpoint. | done |
| 10 | Demo recording script (Wave 4 prompts 13-16) | `docs/demo-recording-script.md` (PR #461). | done |
| 11 | Deck + objections (Wave 7 prompts 25-27) | `docs/deck-objections.md` (PR #463). | done |
| 12 | Filecoin defer decision (Wave 5 prompt 17) | `docs/filecoin-decision.md` (PR #463). | done |
| 13 | Vercel env vars sweep | All "Required for Real Mode" rows in `docs/prod-env-checklist.md` confirmed in Vercel Production. | **operator** |
| 14 | Supabase migrations applied | `psql -f` all four migrations: `lib/photon-webhook-migration.sql`, `lib/photon-optouts-migration.sql`, `lib/photon-imessage-users-migration.sql`, `lib/photon-pending-actions-migration.sql`. Plus the `tool_receipts` table for receipts and `users.briefing_enabled` column for the daily-briefing cron. | **operator** |
| 15 | Spectrum dashboard webhook URL configured | `https://www.operatoruplift.com/api/webhooks/photon` is set in the Spectrum Webhooks tab. Secret matches `PHOTON_WEBHOOK_SECRET` in Vercel. | **operator** |
| 16 | Smoke test against prod | `node scripts/photon-smoke.mjs` returns 5 PASS lines. | **operator** |
| 17 | Pre-flight from `docs/demo-recording-script.md` | All 7 pre-flight rows in that doc verified within T-30 of recording. | **operator** |
| 18 | Demo recorded | One `.mp4` file ≤95s with the 5-step sequence. Spliced web + iPhone halves. | **operator** |
| 19 | ElevenLabs voiceover (optional) | Demo `.mp4` has narration overlaid generated from `docs/demo-recording-script.md` voiceover column. | **operator** |
| 20 | Deck assembled | 7 slides max, mirrors `docs/deck-objections.md`. Filecoin / ElevenLabs / Tauri / Base / Ethereum logos NOT on slides. | **operator** |
| 21 | Objection rehearsal | Operator can recite all 8 answers in `docs/deck-objections.md` under 30s each, on camera, without looking. | **operator** |
| 22 | Full demo rehearsal | Demo recorded twice end-to-end. Second take ≤95s, no fumbles. | **operator** |
| 23 | Fallback plan rehearsal | If Photon dies mid-demo, operator can switch to `/dev/photon` simulator within 10 seconds without panicking. | **operator** |

## What "done" means for each deliverable

- **Code PRs**: merged to master, CI green, tests pass.
- **Docs**: file exists in `docs/` with the canonical content. Linked from at least one other doc that uses it.
- **Operator action**: verified with the listed command or by physical inspection.

## What's deliberately NOT on this checklist

- Wave 6 deposit-to-credit pricing model rebuild. Recommended in `docs/deck-objections.md` but requires `/paywall` + `/api/subscription` rewrite. Multi-PR effort, not safe to ship close to demo.
- Tauri / desktop binary. `desktop/tauri.conf.json` exists but `src-tauri/` does not. Not in the deck (per `docs/deck-objections.md`).
- Filecoin anchoring. Deferred per `docs/filecoin-decision.md`.
- Calendar timezone fix (still hardcoded MYT). Avoid free-slot calendar UI on stage.
- localStorage encryption rollout. Disclosure in product copy is honest; full encrypt-at-rest is post-demo work.
- Any new channel (Telegram, Slack, Discord) tool wiring. Spectrum bridge handles the platforms; per-platform code is roadmap.

## Hard rule (re-stated)

Do not edit anything under `lib/photon/`, `app/api/webhooks/photon/`, `app/api/integrations/imessage/`, `lib/google/`, or `app/(dashboard)/integrations/IMessageVerifyCard.tsx` between now and recording. The 221 photon hermetic specs cover the green path. If a step in this checklist appears to require it, propose the change in writing first and run all 221 specs before committing.

## What to do if a step fails

| Failure mode | Response |
|---|---|
| Smoke test fails on PHOTON_PROJECT_ID / PHOTON_API_KEY | Check Vercel env. Re-run after fix. Do NOT proceed to recording. |
| Smoke test fails on ANTHROPIC_API_KEY | Same. Without an LLM key, the agent falls back to a fixed-string ack and the demo is dead. |
| iMessage round-trip is slower than 5 seconds | Retry until you get a sub-3s reply. Don't record a slow take; it kills the rhythm. |
| Photon dies in the middle of recording | Switch to the `/dev/photon` simulator path described in `docs/demo-recording-script.md`. Same dispatch chain, no Spectrum dependency. |
| Gmail draft step fails because Google isn't connected | Use the demo Gmail account that's pre-connected. If that fails too, drop step 4-5 and end the demo at the bot's preview reply. |
| The card on `/login` looks washed out on light mode | Optional 2-line fix: replace `bg-black/40 backdrop-blur-xl` with `bg-white shadow-2xl border-foreground/10` in `app/(auth)/login/page.tsx:197` and `app/(auth)/signup/page.tsx:59`. Verify with a fresh incognito reload. Skip if it looks fine. |

## Time budget

- Code work (steps 1-12): **done**.
- Operator setup (steps 13-17): ~2 hours.
- Recording (steps 18-19): ~1 hour with retakes.
- Deck + rehearsal (steps 20-23): ~2 hours.

Total operator time before demo: ~5 hours.
