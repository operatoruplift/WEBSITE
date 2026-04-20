# INTEGRATION_BACKLOG.md

## Integration Specs (Wave 2, from Wave 1A)

Maps every Wave 1A pattern to a workspace + data flow. Doc-only. No code changes. Each spec names its Pattern ID + Sources from `PATTERN_LIBRARY.md`.

### Index — 20 patterns → workspaces

| Theme | Pattern | Primary workspace | Supporting |
|---|---|---|---|
| 1. Local capture + storage | 1.A Manual-first capture | `WEBSITE` | `project_space` |
| | 1.B Local SQLite journal | `DMG/Tauri` | `project_space`, `core` |
| | 1.C Durable webhook state | `DMG/Tauri` | — |
| 2. Messaging transport | 2.A Webhook idempotency | `core` | `DMG/Tauri`, `WEBSITE` |
| | 2.B Trigger scheduler in-flight set | `calendar_agent` (new: `message_agent`) | `developer_console` |
| | 2.C Thread-stable routing | `developer_console` | `core` |
| | 2.D 5 s fallback + Ref | `calendar_agent`/`message_agent` | `developer_console` |
| | 2.E HMAC on raw body | `WEBSITE` (done) | — |
| 3. Trust UX | 3.A SAFE/RISKY classification | `core` | `UI` |
| | 3.B Approval-token args-hash | `core` | `WEBSITE` |
| | 3.C Consistent envelope | `WEBSITE` | — |
| | 3.D Session allowlist (deferred) | — | — |
| 4. Observability | 4.A X-Request-Id everywhere | `WEBSITE` | `developer_console` |
| | 4.B Structured logs, no secrets | `developer_console` | `WEBSITE` |
| | 4.C Ref + Copy everywhere | `WEBSITE` | — |
| | 4.D Healthcheck vs probe | `WEBSITE` | — |
| 5. Demo reliability | 5.A Scripted golden path | `WEBSITE` | `DMG/Tauri` |
| | 5.B Offline-first DMG | `DMG/Tauri` | — |
| 6. UI systems | 6.A DESIGN.md at root | `WEBSITE` | `UI`, `DMG/Tauri` |
| | 6.B Trust-contract landing copy | `WEBSITE` (done) | — |
| 7. Skills/CLI | 7.A ECC plugin model (deferred) | — | — |
| | 7.B Helius four-pack (deferred) | — | — |
| 8. External data | 8.A Tokens.xyz connector | `x402-agent` | `project_space` |

---

### Spec 1.A — Manual-first capture with toggle

**Integration Spec:**
- **Pattern:** 1.A Manual-first capture with explicit toggle
- **Source(s):** `f/poke-gate/src/app.js`; `README.md` L1 ("Run Poke Gate on your Mac, then message Poke from iMessage…")
- **User value:** A user can store what they're looking at right now without worrying about background surveillance.
- **Primary workspace home:** `WEBSITE` (button + settings panel)
- **Supporting workspaces:** `project_space` (storage schema)
- **Current state in Operator Uplift:** No local capture. `/settings` exists; no "Local memory" section.
- **Proposed change (to-be, minimal):** Add a `Local memory` tab in `/settings` with one button `Capture current screen`, a list of captured items (timestamp + page URL + thumbnail), and a per-item `Delete` + a global `Delete all` button. Retention selector: 1d / 7d / 30d, default 7d.
- **Data flow:**
  - Click → `navigator.mediaDevices.getDisplayMedia({video: true})` → canvas screenshot → SHA-256 hash.
  - Write to IndexedDB under `operatoruplift:captures`. Never reaches the network.
  - TTL sweeper on app mount removes items past retention.
- **Storage:** 100% browser IndexedDB, user-local. No server row.
- **APIs/endpoints touched:** None.
- **New flags/env vars:** None (all client-side). Optional: `NEXT_PUBLIC_LOCAL_CAPTURE_ENABLED=1` kill switch.
- **Observability:** Captures write one local console log `{at:"local.capture", event:"stored", id, hash, ts}` — opt-in verbose mode only.
- **Security/trust:** No network egress. Aligns with DECISIONS.md "No background screenshot capture by default".
- **Out of scope:** OCR, cloud sync, background capture.
- **Acceptance test:** Open DevTools → Network. Capture → appears in list. Delete → disappears. Zero outbound bytes throughout.
- **Rollback:** Hide the Local memory tab via feature flag `NEXT_PUBLIC_LOCAL_CAPTURE_ENABLED=0`.

### Spec 1.B — Local SQLite journal + per-agent lock

**Integration Spec:**
- **Pattern:** 1.B Append-only SQLite journal
- **Source(s):** `shlokkhemani/openpoke/server/services/triggers/store.py::TriggerStore._ensure_schema`; `server/services/execution/log_store.py::ExecutionAgentLogStore`
- **User value:** DMG demo survives process crashes; every agent action has a grep-able trail.
- **Primary workspace home:** `DMG/Tauri`
- **Supporting workspaces:** `core` (shared schema), `project_space`
- **Current state:** Web app uses Supabase; DMG has no local DB.
- **Proposed change:** Bundle `better-sqlite3` (Node) or `tauri-plugin-sql` (Rust). On boot, run `lib/photon/migration.sql`-equivalent (inbound_messages, outbound_messages, captures, execution_logs). WAL on. Per-agent lock via a `Map<slug, AsyncMutex>`.
- **Data flow:** DMG-local writes only. If cloud sync is enabled later (opt-in PR), a sync job copies rows to Supabase respecting retention.
- **Storage:** Local SQLite at `~/Library/Application Support/OperatorUplift/data.db` (macOS).
- **APIs/endpoints touched:** None server-side. Tauri commands expose `queryLocal(sql, params)` to the renderer under an allowlist.
- **New flags/env vars:** `DMG_DATA_PATH` (optional override).
- **Observability:** Schema version in a `meta` table; `X-Local-Schema: N` echoed by DMG-local routes.
- **Security/trust:** Local only; RLS moot. File perms 0600.
- **Out of scope:** Cloud sync, schema migrations beyond `CREATE IF NOT EXISTS`.
- **Acceptance test:** Boot DMG, send 10 webhook events incl. one duplicate `message_id`. SQLite has 9 rows; unique index rejects the dup.
- **Rollback:** Delete `data.db`; DMG reboots with fresh state.

### Spec 1.C — Durable webhook state file

**Integration Spec:**
- **Pattern:** 1.C `$XDG_CONFIG_HOME/<app>/state.json`
- **Source(s):** `f/poke-gate/src/webhook.js::loadState / saveState / getWebhook`
- **User value:** DMG restart doesn't lose the webhook URL; user can `cat` the file to debug.
- **Primary workspace home:** `DMG/Tauri`
- **Supporting workspaces:** —
- **Current state:** DMG has no webhook state file.
- **Proposed change:** Create `~/.config/operator-uplift/state.json` on first launch. Store `{photonWebhookUrl, photonWebhookSecretRef, connectionId}`. Never store the raw secret — store a keychain reference.
- **Data flow:** Startup → read file → if missing, prompt user to connect → persist.
- **Storage:** Local JSON (0600) + macOS Keychain for secrets.
- **APIs/endpoints touched:** None.
- **New flags/env vars:** `OPERATOR_UPLIFT_CONFIG_DIR` (override).
- **Observability:** A "Regenerate webhook" button on the DMG admin panel.
- **Security/trust:** Secrets live in Keychain, not in the JSON. JSON has a reference name only.
- **Out of scope:** Multi-account profiles.
- **Acceptance test:** Quit DMG → relaunch → admin panel shows the same webhook URL.
- **Rollback:** Delete `state.json`; DMG re-prompts for setup.

### Spec 2.A — Webhook idempotency via unique index

**Integration Spec:**
- **Pattern:** 2.A `(provider, message_id)` unique key dedupe
- **Source(s):** Our `lib/photon/migration.sql` (PR #128); `openpoke/server/services/triggers/service.py::TriggerService.fetch_one`
- **User value:** Provider retry storms are free no-ops; the agent never replies twice.
- **Primary workspace home:** `core` (canonical schema)
- **Supporting workspaces:** `DMG/Tauri` (mirror in local SQLite), `WEBSITE` (already uses)
- **Current state:** WEBSITE has the unique index + `select-first-then-insert` in the webhook route (PR #128).
- **Proposed change:** Extract the migration SQL into `core` as `core/schema/messaging.sql`. Both WEBSITE and DMG import from `core`.
- **Data flow:** Webhook → normalize → dedupe-check by `(provider, message_id)` → insert on miss, 200 `{status:"duplicate"}` on hit.
- **Storage:** Server Postgres (WEBSITE) + DMG local SQLite.
- **APIs/endpoints touched:** `POST /api/webhooks/photon` already uses this. No new endpoints.
- **New flags/env vars:** None.
- **Observability:** Existing `requestId` + `event:"duplicate"` log line covers this.
- **Security/trust:** None (dedup only).
- **Out of scope:** Cross-provider dedupe.
- **Acceptance test:** POST same payload 3×. First: `status:"new"`. Next two: `status:"duplicate"`. One row in `inbound_messages`.
- **Rollback:** Drop the unique index; dedup becomes best-effort via `select-first`.

### Spec 2.B — Message worker with in-flight set

**Integration Spec:**
- **Pattern:** 2.B Async poll loop + in-flight set + per-record lock
- **Source(s):** `openpoke/server/services/trigger_scheduler.py::TriggerScheduler` (`_in_flight: Set[int]`, `asyncio.Lock`)
- **User value:** An inbound iMessage reliably gets exactly one reply.
- **Primary workspace home:** `calendar_agent` (or a new `message_agent` worker)
- **Supporting workspaces:** `developer_console` (visibility)
- **Current state:** PR #128 lands transport only; no worker exists yet.
- **Proposed change:** New long-running worker process (Vercel cron or separate service). Polls `SELECT … FROM inbound_messages WHERE status='new' ORDER BY received_at` every 5 s. Holds IDs in an in-memory `Set`. Before enqueue, update `status='in_progress', started_at=now()`. On success: `status='replied'`. On crash recovery: any row with `started_at < now() - 5m AND status='in_progress'` is retried.
- **Data flow:** Worker → `inbound_messages` SELECT → agent pipeline (out of this spec) → `outbound_messages` INSERT → `/api/photon/imessage/send`.
- **Storage:** Postgres via Supabase. Worker is stateless between polls.
- **APIs/endpoints touched:** Consumes `inbound_messages`; writes `outbound_messages`.
- **New flags/env vars:** `MESSAGE_WORKER_POLL_INTERVAL_MS`, `MESSAGE_WORKER_LEASE_TTL_SEC`.
- **Observability:** Worker logs one line per poll iteration in verbose mode; `/dev/imessage` shows `status='in_progress'` rows with elapsed time.
- **Security/trust:** No new auth. Worker uses service-role Supabase key (env only).
- **Out of scope:** LLM/agent wiring (Spec is about transport scheduling only).
- **Acceptance test:** Stub agent to sleep 0.5 s. POST 2 duplicate inbound messages 0.3 s apart. Exactly one outbound row appears for that `thread_id`.
- **Rollback:** Stop the worker; no state persists in memory. `status='in_progress'` rows expire via the 5 min lease.

### Spec 2.C — Thread-stable routing with recipient fallback

**Integration Spec:**
- **Pattern:** 2.C `thread_id` → `recipient` fallback
- **Source(s):** `f/poke-gate/src/webhook.js::sendToWebhook`; `lib/photon/adapter.ts::SendImessageRequest`
- **User value:** Replies land in the same iMessage thread the user sent from.
- **Primary workspace home:** `developer_console` (test surface `/dev/imessage`)
- **Supporting workspaces:** `core` (schema enforces `thread_id` on outbound)
- **Current state:** PR #128's `outbound_messages` schema has `thread_id`; `lib/photon/adapter.ts` accepts `threadId` optionally.
- **Proposed change:** Make `threadId` first-class in the send route payload; when absent, log a warning `event:"thread_id_missing"` so we can track provider-side gaps.
- **Data flow:** Inbound `thread_id` → persist → worker reads → outbound `thread_id`.
- **Storage:** Both columns already exist.
- **APIs/endpoints touched:** `POST /api/photon/imessage/send`.
- **New flags/env vars:** None.
- **Observability:** Warning log line; `/dev/imessage` sorts outbound by `thread_id` when set.
- **Security/trust:** None.
- **Out of scope:** Provider-side threading correction.
- **Acceptance test:** Two inbound from same phone 5 min apart → two replies → both outbound rows have identical non-null `thread_id`.
- **Rollback:** `thread_id` column accepts NULL; reverting to recipient-only routing is a config flip, not a schema change.

### Spec 2.D — 5-second fallback reply

**Integration Spec:**
- **Pattern:** 2.D Bounded-wait with calm-copy fallback
- **Source(s):** Our `docs/integrations-plan.md` Photon governance; `openpoke/server/app.py::_unhandled_exception_handler`; `onyx/backend/onyx/utils/error_handling.py`
- **User value:** A user always hears back within 5 s, even when the agent stalls.
- **Primary workspace home:** `calendar_agent` / `message_agent` worker
- **Supporting workspaces:** `developer_console`
- **Current state:** No worker yet. Fallback copy exists in `lib/errorTaxonomy.ts`.
- **Proposed change:** Wrap agent call in `Promise.race([agent(), sleep(5000).then(()=>FALLBACK)])`. If fallback fires, send calm reply with Ref. Log the late agent response but do not send a second outbound.
- **Data flow:** Worker → race → whichever resolves first is sent → `outbound_messages` row logs `source: 'agent' | 'fallback'`.
- **Storage:** `outbound_messages.source` new enum value `fallback`.
- **APIs/endpoints touched:** None new; existing send route.
- **New flags/env vars:** `MESSAGE_WORKER_FALLBACK_MS=5000`.
- **Observability:** `/dev/imessage` shows a pill `FALLBACK` on fallback rows; a metric `fallback_ratio = fallback_count / total_outbound`.
- **Security/trust:** None.
- **Out of scope:** Agent retry on transient failures (separate pattern).
- **Acceptance test:** Stub agent to sleep 8 s. One inbound → one fallback outbound within 5 s → agent's late response is logged but no second message is sent.
- **Rollback:** Set `MESSAGE_WORKER_FALLBACK_MS=99999`; effectively disables fallback.

### Spec 2.E — HMAC verification on raw body

**Integration Spec:**
- **Pattern:** 2.E HMAC-SHA256 + `timingSafeEqual` on raw body
- **Source(s):** Our `app/api/webhooks/photon/route.ts::hmacHex / constantTimeEq` (PR #128)
- **User value:** Unauthenticated actors can't forge inbound messages.
- **Primary workspace home:** `WEBSITE` (done)
- **Supporting workspaces:** —
- **Current state:** Implemented in PR #128.
- **Proposed change:** Add a regression test: flip one byte → expect 401.
- **Data flow:** Unchanged.
- **Storage:** —
- **APIs/endpoints touched:** `POST /api/webhooks/photon`.
- **New flags/env vars:** None.
- **Observability:** Existing `event:"invalid-signature"` log line.
- **Security/trust:** Already enforced.
- **Out of scope:** Secret rotation tooling (separate PR).
- **Acceptance test:** cURL with correct sig → 200. Flip one byte → 401.
- **Rollback:** Unset `PHOTON_WEBHOOK_SECRET` (drops to dev-mode accept-all).

### Spec 3.A — SAFE vs RISKY action classification

**Integration Spec:**
- **Pattern:** 3.A Binary SAFE/RISKY set drives approval
- **Source(s):** `f/poke-gate/src/permission-service.js::SAFE_TOOLS / RISKY_TOOLS`
- **User value:** Every new tool action is explicitly categorized; no silent "oh that was a write".
- **Primary workspace home:** `core`
- **Supporting workspaces:** `UI` (approval modal consumes)
- **Current state:** Implicit via `lib/x402/pricing.ts` (price=null → read). Not explicit.
- **Proposed change:** Export `const TOOL_SAFETY: Record<string, 'safe'|'write'>` in `lib/toolCalls.ts` covering every action. Default `write` (fail-closed) for unknown. Approval modal refuses to run `unknown` with a Ref.
- **Data flow:** Tool call → `safetyOf(tool, action)` → modal branch.
- **Storage:** In-code constant.
- **APIs/endpoints touched:** None.
- **New flags/env vars:** None.
- **Observability:** Modal shows `SAFE` / `WRITE` pill (exists in PR #127 as `SIMULATED` / `REAL`; this formalizes the data source).
- **Security/trust:** Positive — makes the rule grep-able, defensive default.
- **Out of scope:** Session-scoped allowlist (Spec 3.D deferred).
- **Acceptance test:** Add a fake `calendar.delete` action without classifying it. Modal refuses with "Unknown safety class" + Ref.
- **Rollback:** Revert the new map; falls back to current pricing-based inference.

### Spec 3.B — Approval token with args-hash binding

**Integration Spec:**
- **Pattern:** 3.B HMAC-signed, single-use, TTL-bounded approval
- **Source(s):** `f/poke-gate/src/permission-service.js::PermissionService.requestApproval / validateApprovalToken`
- **User value:** The modal's preview and the server's execution are byte-equal — no post-approval tampering.
- **Primary workspace home:** `core` (`lib/approvalTokens.ts`)
- **Supporting workspaces:** `WEBSITE` (issue endpoint + tool-route validator)
- **Current state:** Approval is a UI convention; no server-side binding.
- **Proposed change:** New `lib/approvalTokens.ts` with `issue({userId, tool, action, argsHash, ttlMs})` and `verify(token, {userId, tool, action, args})`. New route `POST /api/approvals/request` issues tokens. Tool routes (gmail/calendar) require `X-Approval-Token` header; mismatch → 403 `invalid_approval_token_args_mismatch`.
- **Data flow:** Modal click → `POST /api/approvals/request` → token → client attaches as `X-Approval-Token` → tool route validates → execute.
- **Storage:** In-memory TTL map (single-region). No DB row (single-use; TTL 5 min).
- **APIs/endpoints touched:** New `POST /api/approvals/request`; existing tool routes add header validation.
- **New flags/env vars:** `APPROVAL_TOKEN_SECRET` (ed25519 or HMAC secret), `APPROVAL_TOKEN_TTL_MS`.
- **Observability:** Log `event: "approval-issued"`, `event: "approval-accepted"`, `event: "approval-rejected"` with reason.
- **Security/trust:** POSITIVE — upgrades the approval contract from UI convention to cryptographic. **Does NOT touch receipts or x402.** The token gate fires BEFORE x402; receipts still sign after execute.
- **Out of scope:** Session-scoped always-allow.
- **Acceptance test:** Approve `gmail.draft{subject:"Hi"}`. Intercept the subsequent call and flip body to "Malicious". Server returns 403 with a Ref.
- **Rollback:** Deploy with `APPROVAL_TOKEN_REQUIRED=0` env; routes skip validation. Phased rollout: ship validator in log-only mode first (see Wave 3 note).

### Spec 3.C — `{ok:false, error}` envelope everywhere

**Integration Spec:**
- **Pattern:** 3.C Consistent envelope
- **Source(s):** `openpoke/server/app.py::register_exception_handlers`; our `lib/apiHelpers.ts::envelope`
- **User value:** One UI branch handles all failures; no edge case.
- **Primary workspace home:** `WEBSITE`
- **Supporting workspaces:** —
- **Current state:** Most routes use the envelope (PRs #121–#123). Some legacy routes drift.
- **Proposed change:** Audit every `/api/*` route; any NextResponse.json without the envelope gets refactored. Add a CI lint rule grep-checking for the pattern.
- **Data flow:** Unchanged.
- **Storage:** —
- **APIs/endpoints touched:** Audit sweep across all `/api/*`.
- **New flags/env vars:** None.
- **Observability:** CI lint rule; audit count decreasing per PR.
- **Security/trust:** None.
- **Out of scope:** Envelope shape changes (it's frozen as-is).
- **Acceptance test:** `grep -r "NextResponse.json" app/api/ | grep -v errorResponse | grep -v envelope` returns zero non-trivial hits.
- **Rollback:** Per-route revert to previous shape (unlikely).

### Spec 4.A — `X-Request-Id` on every response

**Integration Spec:**
- **Pattern:** 4.A Request-scoped ID header + body field
- **Source(s):** Our `lib/apiHelpers.ts::withRequestMeta` (PR #123)
- **User value:** Support finds the log line in one grep.
- **Primary workspace home:** `WEBSITE`
- **Supporting workspaces:** `developer_console` (shows last N)
- **Current state:** Implemented on auth, subscription, chat, gmail, calendar, x402/pay.
- **Proposed change:** Extend to: receipts, memory, agents, notifications, audit. Add a middleware that injects `X-Request-Id` if the handler forgot.
- **Data flow:** Request → `withRequestMeta` → response carries header + body.
- **Storage:** —
- **APIs/endpoints touched:** Receipts/memory/agents/notifications/audit routes.
- **New flags/env vars:** None.
- **Observability:** Existing.
- **Security/trust:** UUIDs are not PII.
- **Out of scope:** Edge runtime routes (middleware covers them).
- **Acceptance test:** cURL every `/api/*` with bad input. Every response has `X-Request-Id: req_…` header AND `requestId` in body.
- **Rollback:** None needed — additive.

### Spec 4.B — Structured JSON logs with no secrets

**Integration Spec:**
- **Pattern:** 4.B Bounded fields, no token bodies
- **Source(s):** Our `lib/apiHelpers.ts::errorResponse`; `openpoke/server/app.py` structured `logger.debug(..., extra=...)`
- **User value:** Logs are shareable with support without redaction.
- **Primary workspace home:** `developer_console` (lint rule owner)
- **Supporting workspaces:** `WEBSITE`
- **Current state:** Most routes log correctly; no CI rule.
- **Proposed change:** Add `eslint` rule `no-console-log-with-secrets` that greps for `Authorization`, `Bearer`, `_SECRET`, `_KEY` inside `console.log/warn/error` args in source trees. Fail build on hit.
- **Data flow:** Build-time lint.
- **Storage:** —
- **APIs/endpoints touched:** —
- **New flags/env vars:** None.
- **Observability:** CI failure = fail-fast secret leak.
- **Security/trust:** HIGH — primary defense against accidental secret leaks.
- **Out of scope:** Log drains / retention policies.
- **Acceptance test:** Add a `console.log({token})` somewhere. CI fails. Remove. CI passes.
- **Rollback:** Disable the rule via `.eslintignore` (should never be needed).

### Spec 4.C — Ref + Copy on every failure surface

**Integration Spec:**
- **Pattern:** 4.C Admin + user surfaces expose requestId as a Copy chip
- **Source(s):** Our PR #121 (paywall), PR #122 (settings Diagnostics), PR #128 (/dev/imessage)
- **User value:** One-click paste for bug reports.
- **Primary workspace home:** `WEBSITE`
- **Supporting workspaces:** —
- **Current state:** Done on paywall, settings, /dev/imessage, /settings/part2-runner.
- **Proposed change:** Add the Copy chip to: receipts view on `/profile`, any remaining error state on `/chat` (covered by tool-error path), and a future `/docs/troubleshooting` page.
- **Data flow:** `localStorage.lastRequestId` mirrors server response; Copy button writes to clipboard.
- **Storage:** `localStorage['lastRequestId']` (no PII).
- **APIs/endpoints touched:** —
- **New flags/env vars:** None.
- **Observability:** —
- **Security/trust:** None.
- **Out of scope:** Log-link-out from the Ref chip.
- **Acceptance test:** On `/profile` after a receipt fetch fails, Copy → clipboard has `req_…`.
- **Rollback:** Remove the chip component; error copy remains.

### Spec 4.D — Healthcheck probes every provider

**Integration Spec:**
- **Pattern:** 4.D Cheap-but-real GETs per provider
- **Source(s):** Our `/api/health/llm` (PR #120); `openpoke/server/routes/meta.py`
- **User value:** Uptime dashboards show real outages, not our site saying "all good" while every tool fails.
- **Primary workspace home:** `WEBSITE`
- **Supporting workspaces:** —
- **Current state:** `/api/health/llm` probes 5 providers.
- **Proposed change:** Add `/api/health/photon` (hits adapter `isActive()` + base URL HEAD with 3 s timeout), `/api/health/google` (checks a cached `user_integrations` row count + the Google OAuth token endpoint reachability), `/api/health/supabase` (existence probe).
- **Data flow:** Edge-runtime-safe GETs; no user data.
- **Storage:** 30 s in-process cache.
- **APIs/endpoints touched:** Three new routes.
- **New flags/env vars:** None.
- **Observability:** Machine-readable JSON; uptime monitors poll these.
- **Security/trust:** No PII, no secrets.
- **Out of scope:** Aggregate `/api/health` that rolls them up (can be a follow-up).
- **Acceptance test:** `curl /api/health/photon` → 200 when configured + reachable; 503 when env unset; 503 + `provider_unreachable` when upstream down.
- **Rollback:** Delete the routes.

### Spec 5.A — Golden-path demo script + Playwright harness

**Integration Spec:**
- **Pattern:** 5.A Deterministic scripted demo
- **Source(s):** `shlokkhemani/openpoke/README.md` + our `/tmp/ecc-demo-recorder/demo-three-beats.cjs`
- **User value:** Every pitch demo is reproducible byte-for-byte.
- **Primary workspace home:** `WEBSITE`
- **Supporting workspaces:** `DMG/Tauri` (offline theater version)
- **Current state:** Playwright harness exists in `/tmp/`; no script in the repo.
- **Proposed change:** Commit `scripts/demo-three-beats.cjs` + `DEMO_SCRIPT.md` at repo root. Add a `pnpm demo:record` script. Optionally CI-run on every main push to catch drift.
- **Data flow:** Playwright → `/chat` → canned replies → MP4 file.
- **Storage:** `scripts/demo-three-beats.cjs`, `public/demo/three-beats.mp4` (already shipped in PR #126).
- **APIs/endpoints touched:** None.
- **New flags/env vars:** `DEMO_BASE_URL` (default prod).
- **Observability:** CI artifact: the mp4.
- **Security/trust:** None (runs against prod demo mode).
- **Out of scope:** Automated upload to YouTube / share URL.
- **Acceptance test:** `node scripts/demo-three-beats.cjs` against prod produces a 60 s mp4 identical to previous run (visual-diff ≤5%).
- **Rollback:** Delete the script.

### Spec 5.B — Offline-first DMG with bundled fixtures

**Integration Spec:**
- **Pattern:** 5.B Offline demo theater
- **Source(s):** `f/poke-gate/README.md`
- **User value:** Demo works on airplane WiFi.
- **Primary workspace home:** `DMG/Tauri`
- **Supporting workspaces:** —
- **Current state:** DMG workspace exists but no offline demo.
- **Proposed change:** Tauri build that bundles `lib/cannedReplies.ts` as JSON at compile time. Chat UI uses bundled fixtures when `NAVIGATOR_ONLINE === false || DMG_OFFLINE_ONLY=1`. Zero `/api/*` calls in demo mode.
- **Data flow:** Prompt → matcher → fixture → display.
- **Storage:** Bundled JSON under `src-tauri/resources/canned/*.json`.
- **APIs/endpoints touched:** None (demo never calls server).
- **New flags/env vars:** `DMG_OFFLINE_ONLY` (default 1 in demo builds).
- **Observability:** Footer shows `DEMO · OFFLINE · BUNDLED` pill.
- **Security/trust:** Positive — no exfiltration possible.
- **Out of scope:** Real-mode connect flow (handled post-demo).
- **Acceptance test:** Boot DMG with WiFi off. Run 3 beats. Every reply in ≤500 ms. `tcpdump` on the interface shows 0 outbound packets.
- **Rollback:** Ship DMG without offline fixtures; demo degrades to online-only.

### Spec 6.A — DESIGN.md at WEBSITE root

**Integration Spec:**
- **Pattern:** 6.A Single canonical design reference
- **Source(s):** `VoltAgent/awesome-design-md/design-md/*/README.md` (shape only — content is external and UNREADABLE)
- **User value:** Consistent visual language across web + DMG + webview.
- **Primary workspace home:** `WEBSITE` (root `DESIGN.md`)
- **Supporting workspaces:** `UI`, `DMG/Tauri`, `webview`
- **Current state:** No DESIGN.md.
- **Proposed change:** Create `DESIGN.md` with: color tokens (primary `#F97316` — confirm vs user's `#E77630` before write), typography scale (copy from `tailwind.config`), spacing, radii, shadows, motion, copy rules (calm, no scary errors, Ref on failure), banned phrases list.
- **Data flow:** Doc-only; every UI PR cites it.
- **Storage:** —
- **APIs/endpoints touched:** —
- **New flags/env vars:** None.
- **Observability:** PR template line "References DESIGN.md".
- **Security/trust:** None.
- **Out of scope:** Full Figma export; DESIGN.md is a markdown reference.
- **Acceptance test:** A new UI PR that references `DESIGN.md` and uses exact color tokens is easy to review; grep of hardcoded `#F97316` outside `tailwind.config`+`DESIGN.md` trends to zero.
- **Rollback:** Delete file; lint rule optional.

### Spec 6.B — Landing trust-contract copy (already shipped)

**Integration Spec:**
- **Pattern:** 6.B Explicit trust copy
- **Source(s):** Our `src/sections/WhatBecomesReal.tsx` (PR #126)
- **User value:** Cold visitor gets trust story in 5 s.
- **Primary workspace home:** `WEBSITE` (done)
- **Supporting workspaces:** —
- **Current state:** Shipped in PR #126.
- **Proposed change:** Add anchor links from each block to `/docs/trust` (Spec 8.A-adjacent `/docs` rewrite).
- **Data flow:** —
- **Storage:** —
- **APIs/endpoints touched:** —
- **New flags/env vars:** None.
- **Observability:** —
- **Security/trust:** None.
- **Out of scope:** Hero headline rewrites.
- **Acceptance test:** Each of the 3 trust blocks deep-links to a real `/docs/trust#anchor`.
- **Rollback:** Remove anchors.

### Spec 7.A — ECC plugin model (deferred)

**Integration Spec:**
- **Pattern:** 7.A Claude Code plugin
- **Source(s):** `affaan-m/everything-claude-code/README.md`
- **User value:** Reusable skill install.
- **Primary workspace home:** Meta/tooling (outside operatoruplift workspaces)
- **Supporting workspaces:** —
- **Current state:** Not installed. Repo CLONED for audit.
- **Proposed change:** **Deferred.** Before install, write a DECISIONS.md safety note (covered in `docs/research/DECISIONS.md` already).
- **Data flow:** —
- **Storage:** —
- **APIs/endpoints touched:** —
- **New flags/env vars:** —
- **Observability:** —
- **Security/trust:** Medium — plugin can exfiltrate. Audit before install.
- **Out of scope:** Anything beyond installing in a disposable scope first.
- **Acceptance test:** Install in disposable scope, run `/ecc:plan` in doc-only mode, confirm zero operatoruplift files modified.
- **Rollback:** Uninstall via `/plugin uninstall ecc`.

### Spec 7.B — Helius four-pack (deferred)

**Integration Spec:**
- **Pattern:** 7.B CLI + MCP + skills + plugin from one repo
- **Source(s):** `helius-labs/core-ai/README.md`
- **User value:** Target shape for any future Operator Uplift MCP/CLI.
- **Primary workspace home:** Deferred.
- **Supporting workspaces:** —
- **Current state:** Not built.
- **Proposed change:** **Deferred.** Capture shape as a reference; no action.
- **Data flow:** —
- **Storage:** —
- **APIs/endpoints touched:** —
- **New flags/env vars:** —
- **Observability:** —
- **Security/trust:** Medium (if built).
- **Out of scope:** Everything.
- **Acceptance test:** N/A.
- **Rollback:** N/A.

### Spec 8.A — Tokens.xyz single-file connector

**Integration Spec:**
- **Pattern:** 8.A External data source as a single module
- **Source(s):** `docs.tokens.xyz` (READ) + our `lib/photon/adapter.ts` shape
- **User value:** Pro users see live token data inside Operator Uplift without leaving the chat.
- **Primary workspace home:** `x402-agent` (payment-adjacent) OR `project_space` (memory/data)
- **Supporting workspaces:** `WEBSITE` (tool-route wrapper)
- **Current state:** No connector.
- **Proposed change:** `lib/tokens-xyz/adapter.ts` with a typed fetch wrapper. Env: `TOKENS_XYZ_API_KEY`. Every call persists `{requestUrl, xRequestId, timestamp, httpStatus}` in a new `tokens_requests` row (no response body logged to avoid PII drift).
- **Data flow:** Chat tool call → `/api/tools/tokens-xyz` → adapter → tokens.xyz API → persist + return.
- **Storage:** `tokens_requests` table (server-only).
- **APIs/endpoints touched:** New `POST /api/tools/tokens-xyz` (additive).
- **New flags/env vars:** `TOKENS_XYZ_API_KEY`, `TOKENS_XYZ_API_BASE` (optional override).
- **Observability:** Log line per call; `/dev/reliability` gets a sixth check.
- **Security/trust:** Env-only auth, never logged. No PII.
- **Out of scope:** Caching / pre-fetch.
- **Acceptance test:** Call `/api/tools/tokens-xyz {action:'lookup', symbol:'SOL'}` with an admin session. Response has price data + Ref. One `tokens_requests` row written. Zero log lines contain the key.
- **Rollback:** Unset `TOKENS_XYZ_API_KEY`; adapter returns 503 `provider_unavailable` with calm copy.

---

### Wave 2 Critical Path Order (top 8 specs, dependency-ordered)

1. **Spec 2.A — webhook idempotency in `core`** (unblocks DMG + cleanups WEBSITE import boundary).
2. **Spec 4.A — X-Request-Id everywhere** (enables every downstream observability task).
3. **Spec 4.B — structured-logs CI lint** (locks in secret-leak prevention before broader changes).
4. **Spec 3.C — envelope everywhere** (parallel with 4.A; related codepaths).
5. **Spec 3.A — SAFE/RISKY classification** (prereq for 3.B approval-token).
6. **Spec 3.B — approval-token args-hash** (the biggest trust upgrade in the set; depends on 3.A).
7. **Spec 5.A — Playwright golden-path demo in repo** (Demo Day safety net).
8. **Spec 5.B — offline-first DMG theater** (Demo Day safety net, parallel with 5.A).

### Frozen-surface check (Wave 2)

None of the 20 Wave 2 specs proposes modifying: receipts, Merkle anchor, x402 semantics (pricing/gating/receipts), capabilities rules, AuthGate rules, cron schedule, or pricing tiers. The two specs closest to frozen surfaces are:

- **Spec 3.B** (approval-token): adds a new pre-execution gate, runs BEFORE the x402 gate. Does not modify `lib/x402/*`. `capability_real` unaffected.
- **Spec 2.B** (message worker): introduces a new process. Does not touch cron schedule (runs as a separate worker or a dedicated Vercel cron with an additive entry; existing crons untouched).

---

Wave 2 complete.

---

## PR Backlog (Wave 3, from Wave 1A specs)

### Critical path (first 10 PR Task IDs, dependency-ordered)

1. `W1A-obs-1` — X-Request-Id audit sweep across remaining `/api/*`
2. `W1A-obs-2` — eslint rule `no-console-log-with-secrets`
3. `W1A-trust-1` — `lib/toolCalls.ts::TOOL_SAFETY` map + modal "Unknown safety class" branch
4. `W1A-transport-1` — extract `core/schema/messaging.sql` from `lib/photon/migration.sql`
5. `W1A-transport-2` — regression test for HMAC raw-body verification
6. `W1A-transport-3` — message worker skeleton (polling + in-flight set, no agent yet)
7. `W1A-trust-2` — `lib/approvalTokens.ts` + `/api/approvals/request` (log-only mode)
8. `W1A-trust-3` — flip approval-token validator from log-only to enforce
9. `W1A-demo-1` — commit `scripts/demo-three-beats.cjs` + `DEMO_SCRIPT.md`
10. `W1A-demo-2` — DMG offline fixtures build step (compile-time embed of `lib/cannedReplies.ts`)

### Frozen-surface check (Wave 3)

No PR task in this backlog modifies receipts, Merkle anchor, x402 semantics, capabilities rules, AuthGate rules, cron schedule, or pricing. **Note for `W1A-trust-3`:** the approval-token enforce flip lands BEFORE the x402 gate call inside the existing tool routes — it adds a layer, does not change x402. Ship log-only first (`W1A-trust-2`), verify zero false rejects, then flip.

### Demo Day track (PRs that most directly improve Demo Day stability)

`W1A-demo-1`, `W1A-demo-2`, `W1A-transport-2`, `W1A-transport-3`, `W1A-obs-3` (`/api/health/photon`), `W1A-ui-1` (`DESIGN.md`). Ship these first; defer the rest.

---

### Epic A — Observability hardening
_Why: underpins every other epic; cheap, low-risk, high-leverage._
_Specs included: 4.A, 4.B, 4.C, 4.D._

**PR Task: W1A-obs-1**
- **Epic:** A — Observability hardening
- **Workspace:** `WEBSITE`
- **Goal:** Extend X-Request-Id + envelope to remaining `/api/*` routes (receipts, memory, agents, notifications, audit).
- **Patterns included:** 4.A, 3.C
- **Integration Spec(s):** 4.A, 3.C
- **Files likely touched:** `app/api/receipts/route.ts`, `app/api/memory/*/route.ts`, `app/api/agents/route.ts`, `app/api/notifications/pinned/route.ts`, `app/api/audit/log/route.ts`.
- **Flags/env vars:** None.
- **Acceptance test:** cURL each of those routes with bad input; every response has `X-Request-Id` header AND `requestId` in body.
- **Non goals:** Envelope shape changes; edge routes (they are exempt).
- **RISK:** low · **TRUST impact:** none
- **Rollback:** Per-route revert.

**PR Task: W1A-obs-2**
- **Epic:** A
- **Workspace:** `developer_console`
- **Goal:** Add `eslint-plugin-operatoruplift/no-console-log-with-secrets` and fail CI on hit.
- **Patterns included:** 4.B
- **Integration Spec(s):** 4.B
- **Files likely touched:** `.eslintrc` or `eslint.config.mjs`, a new `tools/eslint-rules/no-secrets.js`.
- **Flags/env vars:** None.
- **Acceptance test:** Add `console.log({token})` in a branch → CI fails. Remove → CI passes.
- **Non goals:** Log-drain architecture; retention policy.
- **RISK:** low · **TRUST impact:** high (positive)
- **Rollback:** Disable the rule in `.eslintrc`.

**PR Task: W1A-obs-3**
- **Epic:** A
- **Workspace:** `WEBSITE`
- **Goal:** `/api/health/photon` returns `{ok, configured, reachable, latencyMs}` with 30 s cache.
- **Patterns included:** 4.D
- **Integration Spec(s):** 4.D
- **Files likely touched:** `app/api/health/photon/route.ts` (new); reuses `lib/photon/adapter.ts`.
- **Flags/env vars:** None.
- **Acceptance test:** `curl /api/health/photon` returns 200 when configured + reachable; 503 otherwise with correct `reason`.
- **Non goals:** Aggregate `/api/health`; `/api/health/google` (separate PR).
- **RISK:** low · **TRUST impact:** none
- **Rollback:** Delete the route.

---

### Epic B — Trust-gate cryptography
_Why: turns the approval modal from a UI convention into a cryptographic invariant. Two PRs — ship log-only first._
_Specs included: 3.A, 3.B._

**PR Task: W1A-trust-1**
- **Epic:** B
- **Workspace:** `core`
- **Goal:** Export `TOOL_SAFETY` classification map in `lib/toolCalls.ts`; modal refuses unknown actions.
- **Patterns included:** 3.A
- **Integration Spec(s):** 3.A
- **Files likely touched:** `lib/toolCalls.ts`, `src/components/ui/ToolApprovalModal.tsx`.
- **Flags/env vars:** None.
- **Acceptance test:** Add a fake `calendar.delete` action. Modal refuses with "Unknown safety class — this action is disabled" + Ref.
- **Non goals:** Runtime override; dynamic classification.
- **RISK:** low · **TRUST impact:** low (positive)
- **Rollback:** Revert `TOOL_SAFETY` map.

**PR Task: W1A-trust-2**
- **Epic:** B
- **Workspace:** `WEBSITE` (or `core` for the lib, with the endpoint in WEBSITE)
- **Goal:** Ship `lib/approvalTokens.ts` + `POST /api/approvals/request` + tool-route validation **in log-only mode** (validate, log any mismatch, but don't reject).
- **Patterns included:** 3.B
- **Integration Spec(s):** 3.B
- **Files likely touched:** `lib/approvalTokens.ts` (new), `app/api/approvals/request/route.ts` (new), `app/api/tools/{gmail,calendar}/route.ts` (header parse + log, no reject), `src/components/ui/ToolApprovalModal.tsx` (request + attach token).
- **Flags/env vars:** `APPROVAL_TOKEN_SECRET`, `APPROVAL_TOKEN_TTL_MS` (default 300000), `APPROVAL_TOKEN_ENFORCE=0` (log-only mode).
- **Acceptance test:** Approve a `gmail.draft`. Network tab shows `X-Approval-Token` header attached. Server log: `event:"approval-accepted"` one line. Flip body post-approval → log line `event:"approval-rejected-args-mismatch"`. 200 still returned (log-only).
- **Non goals:** Reject on mismatch (next PR); session allowlist.
- **RISK:** med · **TRUST impact:** high (positive long-term; none immediate because log-only)
- **Rollback:** Remove the new files; validation paths are additive.

**PR Task: W1A-trust-3**
- **Epic:** B
- **Workspace:** `WEBSITE`
- **Goal:** Flip `APPROVAL_TOKEN_ENFORCE=1`; server rejects mismatches with 403.
- **Patterns included:** 3.B
- **Integration Spec(s):** 3.B
- **Files likely touched:** No code; env change + one line in tool routes to read the flag.
- **Flags/env vars:** `APPROVAL_TOKEN_ENFORCE=1` on prod.
- **Acceptance test:** Run the admin harness (future `/dev/approvals`): approve a payload, mutate it client-side, confirm server returns 403 with Ref + `errorClass: "invalid_approval_token_args_mismatch"`.
- **Non goals:** Session allowlist.
- **RISK:** high (breaks any code path that forgot the token) · **TRUST impact:** high (positive)
- **Rollback:** Set `APPROVAL_TOKEN_ENFORCE=0` on Vercel; redeploy. No schema change to revert.

---

### Epic C — Messaging transport (Photon agent loop)
_Why: turns PR #128's transport loopback into a real agent reply cycle, safely._
_Specs included: 2.A, 2.B, 2.C, 2.D, 2.E._

**PR Task: W1A-transport-1**
- **Epic:** C
- **Workspace:** `core`
- **Goal:** Extract `lib/photon/migration.sql` into `core/schema/messaging.sql`. WEBSITE + DMG import from `core`.
- **Patterns included:** 2.A
- **Integration Spec(s):** 2.A
- **Files likely touched:** Create `core/schema/messaging.sql` (copied from `lib/photon/migration.sql`). `lib/photon/migration.sql` becomes a 1-line include/reference.
- **Flags/env vars:** None.
- **Acceptance test:** Running migrations produces identical tables as before; existing `inbound_messages` queries unchanged.
- **Non goals:** Schema changes.
- **RISK:** low · **TRUST impact:** none
- **Rollback:** Revert to inline SQL in WEBSITE.

**PR Task: W1A-transport-2**
- **Epic:** C
- **Workspace:** `WEBSITE`
- **Goal:** Jest test for HMAC raw-body webhook verification — byte-flip rejected.
- **Patterns included:** 2.E
- **Integration Spec(s):** 2.E
- **Files likely touched:** `tests/api/webhooks/photon.test.ts` (new).
- **Flags/env vars:** None (test-only `PHOTON_WEBHOOK_SECRET` fixture).
- **Acceptance test:** `pnpm test` shows the new test passing: correct sig → 200; flipped byte → 401.
- **Non goals:** Actual webhook integration test against real Photon.
- **RISK:** low · **TRUST impact:** none
- **Rollback:** Delete test.

**PR Task: W1A-transport-3**
- **Epic:** C
- **Workspace:** `calendar_agent` (or new `message_agent`)
- **Goal:** Ship worker skeleton: polls `inbound_messages` every 5 s, claims with `in_progress` lease, no agent call yet — just writes a stub `outbound_messages` row `{status:'sent', text:'[transport test]'}`.
- **Patterns included:** 2.B
- **Integration Spec(s):** 2.B
- **Files likely touched:** `message_agent/index.ts` (new), `message_agent/worker.ts`, deployment config for the worker.
- **Flags/env vars:** `MESSAGE_WORKER_POLL_INTERVAL_MS`, `MESSAGE_WORKER_LEASE_TTL_SEC`, `MESSAGE_WORKER_ENABLED=0` (default off).
- **Acceptance test:** Enable worker; send 2 duplicate inbound rows 0.3 s apart. Exactly one stub outbound is written with the same `thread_id`.
- **Non goals:** LLM agent wiring; real reply generation.
- **RISK:** med · **TRUST impact:** low (worker can spam if mis-configured; kill switch via flag)
- **Rollback:** Set `MESSAGE_WORKER_ENABLED=0` on Vercel; process exits on next loop.

**PR Task: W1A-transport-4**
- **Epic:** C
- **Workspace:** `calendar_agent` / `message_agent`
- **Goal:** Add 5-second fallback around the agent call.
- **Patterns included:** 2.D
- **Integration Spec(s):** 2.D
- **Files likely touched:** `message_agent/worker.ts` (extend race logic), `outbound_messages.source` enum widened.
- **Flags/env vars:** `MESSAGE_WORKER_FALLBACK_MS=5000`.
- **Acceptance test:** Stub agent sleep 8 s. One inbound → one fallback outbound within 5 s with calm copy + Ref; late agent response logged but not sent.
- **Non goals:** Retries.
- **RISK:** low · **TRUST impact:** none (user sees calm fallback; receipt path unchanged)
- **Rollback:** Set `MESSAGE_WORKER_FALLBACK_MS=99999`.

**PR Task: W1A-transport-5**
- **Epic:** C
- **Workspace:** `developer_console`
- **Goal:** `/dev/imessage` shows worker state: rows grouped by `thread_id`, `in_progress` rows with lease-remaining seconds, fallback-ratio counter.
- **Patterns included:** 2.B, 2.C, 2.D
- **Integration Spec(s):** 2.B, 2.C, 2.D
- **Files likely touched:** `app/dev/imessage/page.tsx`.
- **Flags/env vars:** None.
- **Acceptance test:** Admin opens `/dev/imessage`, sees new columns (lease-remaining, fallback), rows grouped by thread with a small indent showing reply relation.
- **Non goals:** Time-series charts.
- **RISK:** low · **TRUST impact:** none
- **Rollback:** Revert the page component.

---

### Epic D — Demo Day safety net
_Why: the two lowest-risk interventions that most raise the probability the May 14 demo succeeds._
_Specs included: 5.A, 5.B, 6.A, 4.D._

**PR Task: W1A-demo-1**
- **Epic:** D
- **Workspace:** `WEBSITE`
- **Goal:** Commit `scripts/demo-three-beats.cjs` + `DEMO_SCRIPT.md`; add `pnpm demo:record` script.
- **Patterns included:** 5.A
- **Integration Spec(s):** 5.A
- **Files likely touched:** `scripts/demo-three-beats.cjs`, `DEMO_SCRIPT.md`, `package.json` (add script entry).
- **Flags/env vars:** `DEMO_BASE_URL` optional.
- **Acceptance test:** `pnpm demo:record` runs against prod and produces a 60 s mp4 matching the current recording (visual-diff ≤5%).
- **Non goals:** CI artifact upload; YouTube integration.
- **RISK:** low · **TRUST impact:** none
- **Rollback:** Delete the script + package.json entry.

**PR Task: W1A-demo-2**
- **Epic:** D
- **Workspace:** `DMG/Tauri`
- **Goal:** Tauri build step reads `lib/cannedReplies.ts` (or its JSON export) at compile time and embeds as resource. Chat UI uses bundled fixtures when offline.
- **Patterns included:** 5.B
- **Integration Spec(s):** 5.B
- **Files likely touched:** Tauri `src-tauri/build.rs` or equivalent bundler, `src-tauri/resources/canned/*.json`, client code that switches based on `NAVIGATOR_ONLINE` or `DMG_OFFLINE_ONLY`.
- **Flags/env vars:** `DMG_OFFLINE_ONLY=1` default in demo builds.
- **Acceptance test:** Boot DMG with WiFi off; run 3 beats; every reply <500 ms; `tcpdump` shows 0 outbound packets.
- **Non goals:** Real-mode connect flow; receipt signing in offline mode (simulated only).
- **RISK:** med (build-pipeline touch) · **TRUST impact:** none (offline ≠ less safe)
- **Rollback:** Ship DMG without the build step; demo mode degrades to online.

**PR Task: W1A-demo-3**
- **Epic:** D
- **Workspace:** `WEBSITE`
- **Goal:** Create `DESIGN.md` at repo root.
- **Patterns included:** 6.A
- **Integration Spec(s):** 6.A
- **Files likely touched:** `DESIGN.md` (new).
- **Flags/env vars:** None.
- **Acceptance test:** File exists; contains color tokens, typography scale, spacing, copy rules, banned phrases list; referenced from README.
- **Non goals:** Figma export; per-component styles.
- **RISK:** low · **TRUST impact:** none
- **Rollback:** Delete.

---

### Epic E — Local-first capture + storage (DMG foundation)
_Why: gets the DMG workspace to parity with the web feature surface without bloating the server._
_Specs included: 1.A, 1.B, 1.C._

**PR Task: W1A-local-1**
- **Epic:** E
- **Workspace:** `WEBSITE`
- **Goal:** Add `Local memory` tab in `/settings` with Capture / Delete / Delete all buttons.
- **Patterns included:** 1.A
- **Integration Spec(s):** 1.A
- **Files likely touched:** `app/(dashboard)/settings/page.tsx`, a new client component for the tab, `lib/localCaptures.ts` (IndexedDB wrapper).
- **Flags/env vars:** `NEXT_PUBLIC_LOCAL_CAPTURE_ENABLED=1`.
- **Acceptance test:** Capture → new row in list (timestamp + URL + thumbnail). Delete → disappears. DevTools Network shows zero outbound bytes.
- **Non goals:** OCR; cloud sync; background capture.
- **RISK:** low · **TRUST impact:** none (zero-server)
- **Rollback:** Set the flag to 0.

**PR Task: W1A-local-2**
- **Epic:** E
- **Workspace:** `DMG/Tauri`
- **Goal:** Bundle SQLite via `tauri-plugin-sql`; run `core/schema/messaging.sql` on first boot.
- **Patterns included:** 1.B, 2.A
- **Integration Spec(s):** 1.B, 2.A
- **Files likely touched:** `src-tauri/Cargo.toml`, `src-tauri/src/main.rs`, initial-migration runner, Tauri commands for `query_local`.
- **Flags/env vars:** `DMG_DATA_PATH` override.
- **Acceptance test:** First boot creates `data.db` at default path with correct schema; second boot is idempotent (`CREATE IF NOT EXISTS`); fresh Tauri runtime can `query_local("SELECT COUNT(*) FROM inbound_messages")` and get 0.
- **Non goals:** Sync; migrations beyond CREATE IF NOT EXISTS.
- **RISK:** med (new native dep) · **TRUST impact:** none
- **Rollback:** Delete the plugin + migration runner; DMG starts without local persistence.

**PR Task: W1A-local-3**
- **Epic:** E
- **Workspace:** `DMG/Tauri`
- **Goal:** Durable `state.json` + Keychain secret storage for Photon webhook.
- **Patterns included:** 1.C
- **Integration Spec(s):** 1.C
- **Files likely touched:** `src-tauri/src/state.rs` (or equivalent), DMG admin panel component.
- **Flags/env vars:** `OPERATOR_UPLIFT_CONFIG_DIR`.
- **Acceptance test:** Quit → relaunch → admin panel shows same webhook URL; `ls -la ~/.config/operator-uplift/state.json` shows `0600`; Keychain contains the secret reference.
- **Non goals:** Multi-account profiles.
- **RISK:** low · **TRUST impact:** low (positive — secrets off disk).
- **Rollback:** Delete state.json.

---

### Epic F — Core schema unification
_Why: today WEBSITE and DMG have parallel schemas; `core` becomes the source of truth._
_Specs included: 2.A, 1.B (schema side)._

**PR Task: W1A-core-1**
- **Epic:** F
- **Workspace:** `core`
- **Goal:** Publish `core/schema/messaging.sql` + `core/schema/captures.sql` + typed TypeScript exports of the shapes.
- **Patterns included:** 2.A, 1.B
- **Integration Spec(s):** 2.A, 1.B
- **Files likely touched:** `core/schema/*.sql`, `core/types/messaging.ts`, `core/types/captures.ts`.
- **Flags/env vars:** None.
- **Acceptance test:** `import { InboundMessage } from '@core/types/messaging'` resolves from WEBSITE + DMG; shape matches existing Supabase columns.
- **Non goals:** Shared ORM.
- **RISK:** low · **TRUST impact:** none
- **Rollback:** WEBSITE + DMG revert to their own copies.

---

### Epic G — External data connectors
_Why: tokens.xyz is the first one; establish the pattern so adding Phantom, Helius, etc. is a template job._
_Specs included: 8.A._

**PR Task: W1A-data-1**
- **Epic:** G
- **Workspace:** `x402-agent` (or `project_space` — final decision in spec)
- **Goal:** `lib/tokens-xyz/adapter.ts` + `POST /api/tools/tokens-xyz` + `tokens_requests` log table.
- **Patterns included:** 8.A
- **Integration Spec(s):** 8.A
- **Files likely touched:** `lib/tokens-xyz/adapter.ts`, `lib/tokens-xyz/migration.sql`, `app/api/tools/tokens-xyz/route.ts`, `lib/toolCalls.ts` (register).
- **Flags/env vars:** `TOKENS_XYZ_API_KEY`, `TOKENS_XYZ_API_BASE`.
- **Acceptance test:** Admin session calls `{action:'lookup', symbol:'SOL'}` → 200 with price data + Ref + `tokens_requests` row written. Log lines contain zero occurrences of the API key.
- **Non goals:** Caching; in-chat auto-triggering.
- **RISK:** low · **TRUST impact:** low (new external dep; env-only auth mitigates)
- **Rollback:** Unset `TOKENS_XYZ_API_KEY`; route returns 503 `provider_unavailable`.

---

### Epic H — UI Ref + Copy coverage
_Why: consistent user experience — every failure surface has a Copyable Ref._
_Specs included: 4.C._

**PR Task: W1A-ui-1**
- **Epic:** H
- **Workspace:** `WEBSITE`
- **Goal:** Add Ref + Copy chip on `/profile` receipt-fetch failures and on `/chat` tool-error assistant messages (where still missing).
- **Patterns included:** 4.C
- **Integration Spec(s):** 4.C
- **Files likely touched:** `app/(dashboard)/profile/page.tsx`, `app/(dashboard)/chat/page.tsx` (extension).
- **Flags/env vars:** None.
- **Acceptance test:** Simulate a receipt fetch failure → chip renders, Copy → clipboard has `req_…`.
- **Non goals:** Log link-out.
- **RISK:** low · **TRUST impact:** low (positive)
- **Rollback:** Remove the chip.

---

Wave 3 complete. Ready for Wave 4 (one PR at a time). First recommended Wave 4 task: **`W1A-obs-1`** (lowest risk, unblocks debugging of every subsequent task). Confirm which task to implement first.
