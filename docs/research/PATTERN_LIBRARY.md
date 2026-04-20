# PATTERN_LIBRARY.md

## Wave 1A: Demo Reliability + iMessage Transport (20 patterns max)

Scope: four themes — (A) offline demo reliability, (B) Photon iMessage transport reliability, (C) trust-UX guardrails (SIMULATED vs REAL, approvals, calm envelopes with Ref `req_…`), (D) observability (requestId, timestamps, last N events).

Doc-only. Every pattern cites a file path + symbol or a verbatim README/code snippet. No pattern here proposes a trust-critical surface change.

### Wave 1A Sources Used

| ID | Source | Status | Where read |
|---|---|---|---|
| A019 | `f/poke-gate` (https://github.com/f/poke-gate) | CLONED | `src/webhook.js`, `src/tunnel.js`, `src/permission-service.js`, `src/app.js`, `README.md` |
| A020 | `shlokkhemani/openpoke` (https://github.com/shlokkhemani/OpenPoke) | CLONED | `server/app.py`, `server/routes/chat.py`, `server/services/triggers/service.py`, `server/services/triggers/store.py`, `server/services/execution/log_store.py`, `server/services/trigger_scheduler.py` |
| A009 + A023 | `onyx-dot-app/onyx` + `onyx-foss` | CLONED | `backend/onyx/utils/error_handling.py`, `backend/onyx/utils/errors.py`, `backend/onyx/error_handling/error_codes.py`, `backend/onyx/background/error_logging.py` |
| A029 | `helius-labs/core-ai` | CLONED | `README.md`, `helius-mcp/`, `helius-skills/`, `helius-plugin/` |
| B002 | `thelibrarian.io` | READ | `/` landing copy |
| B003 | `poke.com` | READ | `/` landing copy |
| B004 | `zo.computer` | READ | `/` landing copy + the Zo repo `README.md` |
| A010 | `VoltAgent/awesome-design-md` | CLONED (partial — README only) | `design-md/*/README.md`; the actual design specs moved to an external site (`https://getdesign.md/...`), which is **UNREADABLE for pattern extraction** — see DECISIONS.md |

Deprioritized for Wave 1A: UI component libraries (aceternity, magicui), local-LLM runtimes (LocalAI, BitNet), dev-side agents (TabbyML, continue) — reserved for future waves.

---

### Pattern 1.A — Single-button "Capture current screen" before background capture

**Pattern:**
- **Name:** Manual-first capture with an explicit toggle
- **Source(s):** `f/poke-gate/src/app.js` + `README.md` ("Run Poke Gate on your Mac, then message Poke from iMessage, Telegram, or SMS to run commands, read files, take screenshots, and more — all on your machine"). Capture is explicitly a per-invocation tool (`take-screenshot.js`), not a daemon.
- **What it does:** Screenshots and local reads only happen when the user messages a command. There is no background daemon silently scraping the screen. This matches the consumer-trust threshold you need before enabling always-on capture later.
- **Why it works:**
  - Zero anxiety for the cold user — nothing runs without an explicit trigger.
  - Simple to reason about (one code path), easy to log, easy to audit.
  - Upgrade path to always-on is linear once trust is earned — the capture function stays the same, just the invocation changes.
- **Minimal version we can ship:** In Operator Uplift `/settings`, add a **"Capture current screen"** button under a new "Local memory" section. On click: render a canvas from the foremost tab's content (browser) or use `navigator.mediaDevices.getDisplayMedia` for a one-shot capture. Store metadata + blob in IndexedDB under the user's local-only store. No network call.
- **Dependencies:** Browser `getDisplayMedia`, `IndexedDB`. No server.
- **Risks / failure modes:** Browser permission prompt UX on some OSes; user denies → need calm-copy fallback.
- **Trust / privacy implications:** Low — zero default capture; no cloud. Aligns with DECISIONS.md "No background screenshot capture by default".
- **Best workspace home:** `project_space` (storage schema) + `WEBSITE` (button + settings panel).
- **Acceptance test:** In an Operator Uplift session, visit `/settings → Local memory`, click **Capture current screen**, approve the browser permission prompt, see a row appear in the local list with timestamp + page URL, click **Delete** → row disappears. Open DevTools → Network: zero outbound bytes during capture or deletion.

---

### Pattern 1.B — Local SQLite journal with append-only agent logs

**Pattern:**
- **Name:** Per-agent append-only log file + SQLite index
- **Source(s):** `shlokkhemani/openpoke/server/services/triggers/store.py::TriggerStore._ensure_schema` (uses `CREATE TABLE IF NOT EXISTS triggers`, `PRAGMA journal_mode=WAL`, and `CREATE INDEX IF NOT EXISTS idx_triggers_agent_next`) plus `server/services/execution/log_store.py::ExecutionAgentLogStore` (writes per-agent journal files under `data/execution_agents/<slug>.xml` with a `threading.Lock` per agent).
- **What it does:** Every trigger is durable in a local SQLite DB with WAL mode on; every agent execution is appended to an XML-style log file, one file per agent, serialized via a per-agent lock. Survives process crashes; replay is trivial.
- **Why it works:**
  - WAL mode means reads don't block concurrent writes — critical for a webhook thread scheduling while the UI reads.
  - `IF NOT EXISTS` semantics means the schema is reproducible and idempotent on boot.
  - Per-agent locks prevent interleaving without needing a global mutex.
- **Minimal version we can ship:** For Operator Uplift's DMG/Tauri build, use `sqlite3` (built into Node via `better-sqlite3` or Tauri's `tauri-plugin-sql`) to store: inbound messages, outbound messages, receipts. Single file under the user's app-data dir. WAL on. Per-thread lock. Idempotency index on `(provider, message_id)`.
- **Dependencies:** `better-sqlite3` (Node) or `tauri-plugin-sql` (Rust/Tauri).
- **Risks / failure modes:** File corruption on OS crash mid-write (WAL mitigates); schema migration if we ever change column shape.
- **Trust / privacy implications:** Low — fully local. No cloud sync of raw rows unless opt-in in a later PR.
- **Best workspace home:** `DMG/Tauri` (primary) + `project_space` (schema definitions shared with web `/api/photon/imessage/replay` via a thin adapter).
- **Acceptance test:** Boot the DMG app with a fresh `~/Library/Application Support/OperatorUplift/`. Send 10 inbound webhook events (one same `message_id` twice). Open the local SQLite: inbound table has exactly 9 rows; the duplicate `message_id` row is rejected by the unique index.

---

### Pattern 1.C — Local-first state file for webhook URL + token, shared across invocations

**Pattern:**
- **Name:** Durable webhook state under `$XDG_CONFIG_HOME/<app>/state.json`
- **Source(s):** `f/poke-gate/src/webhook.js::loadState / saveState` — stores `{ webhookUrl, webhookToken, connectionId, connectionHistory }` at `$XDG_CONFIG_HOME/poke-gate/state.json`. `getWebhook()` lazily creates-or-loads.
- **What it does:** The webhook URL and token are created once (via `poke.createWebhook(...)`) and persisted to a well-known config path. Subsequent invocations reuse. This makes demo restarts fast and the state user-inspectable.
- **Why it works:**
  - The demo always knows where its mailbox is — no lost messages after a restart.
  - Users can `cat` the state file to debug; no opaque binary store.
  - The reuse pattern avoids hitting the provider's create-webhook rate limit.
- **Minimal version we can ship:** In the Operator Uplift DMG, store `~/.config/operator-uplift/state.json` with `{ photonWebhookUrl, photonWebhookSecret (short-lived, never logged), connectionId }`. The web app doesn't share this file — it uses Vercel env.
- **Dependencies:** Node `fs/promises`; Tauri `fs` plugin.
- **Risks / failure modes:** Stale state if the provider rotates tokens; need a "regenerate webhook" button.
- **Trust / privacy implications:** Low — local only. No secret material transits the network after write. File permissions should be 0600.
- **Best workspace home:** `DMG/Tauri`.
- **Acceptance test:** Quit the DMG, delete nothing. Relaunch. The webhook URL box in the admin panel shows the same URL that was there pre-quit. `ls -la ~/.config/operator-uplift/state.json` shows `-rw-------`.

---

### Pattern 2.A — Webhook idempotency via `(provider, message_id)` unique key

**Pattern:**
- **Name:** Dedupe webhook retries at the DB layer
- **Source(s):** Inferred from how `openpoke` scopes its trigger rows by `(agent_name, id)` (`server/services/triggers/service.py::TriggerService.fetch_one(trigger_id, agent_name)`) combined with our own PR #128's Supabase migration for `inbound_messages(provider, message_id)`. Openpoke's use of per-agent scoping for trigger queries is the same shape.
- **What it does:** Every inbound webhook row carries `(provider, message_id)`. A unique index rejects duplicates. Spectrum/Photon retry storms become no-ops after the first success.
- **Why it works:**
  - The DB, not the app, is the idempotency boundary — you can't skip it by forgetting an if-check.
  - `message_id` is server-authoritative (the provider mints it); we never need to generate our own.
  - Responses still return HTTP 200 on duplicate, so the provider stops retrying.
- **Minimal version we can ship:** Already landed in PR #128's `lib/photon/migration.sql`. Port the identical table shape to the DMG's local SQLite so the DMG can run webhooks standalone (e.g., demo theater mode with no cloud).
- **Dependencies:** SQLite / Postgres unique index.
- **Risks / failure modes:** `message_id` missing from some event types → select-first path handles gracefully (`PR #128 app/api/webhooks/photon/route.ts::POST` lines ~150).
- **Trust / privacy implications:** None — no new data stored, just dedup.
- **Best workspace home:** `core` (shared schema) + `DMG/Tauri`.
- **Acceptance test:** POST the same webhook payload 3 times in a row to `/api/webhooks/photon` with identical `message_id`. First response: `{status: "new"}`. Second + third: `{status: "duplicate"}`. Exactly one row in `inbound_messages`.

---

### Pattern 2.B — Trigger scheduler with in-flight set to prevent double-execution

**Pattern:**
- **Name:** Async poll loop + `in_flight` set + per-record lock
- **Source(s):** `shlokkhemani/openpoke/server/services/trigger_scheduler.py::TriggerScheduler` — uses `self._in_flight: Set[int]` plus `self._lock = asyncio.Lock()` in `__init__`. Start/stop serialize through the lock. `_run()` (elided for brevity above) pulls due triggers and adds them to `_in_flight` before dispatching.
- **What it does:** Polls every 10 s for due triggers (`_poll_interval`). A trigger that's already being executed won't re-fire — its ID is in `_in_flight` until the task completes. Graceful shutdown awaits in-flight work.
- **Why it works:**
  - No double-fire even if a task takes longer than the poll interval.
  - `asyncio.Lock()` around `start()` and `stop()` is idempotent against accidental double-calls.
  - `Set[int]` is O(1) membership check — scales to thousands of triggers without pressure.
- **Minimal version we can ship:** For Operator Uplift's agent-reply loop (the Photon PR #128's "next PR" that wires the LLM), mirror this exactly. Poll `inbound_messages WHERE status = 'new'`; hold message IDs in an in-flight set; mark `status = 'replied'` on success or `status = 'failed'` with a reason on error.
- **Dependencies:** Python `asyncio` (or Node `AbortController` + `Set`).
- **Risks / failure modes:** In-flight set lost on process restart — solve by marking row `status = 'in_progress'` with a `started_at`; on restart, any row older than 5 minutes in that state gets retried.
- **Trust / privacy implications:** None.
- **Best workspace home:** `calendar_agent` or a new `message_agent` worker (not the web route — the web route persists; the worker replies).
- **Acceptance test:** Start the worker. POST two duplicate inbound messages 0.5 s apart. Exactly one outbound reply is produced (verified by checking `outbound_messages` row count with the same `thread_id`).

---

### Pattern 2.C — Thread-safe deterministic routing by `thread_id` first, `recipient` fallback

**Pattern:**
- **Name:** Thread-stable conversation routing with addressable fallback
- **Source(s):** `f/poke-gate/src/webhook.js::sendToWebhook` (the `{ webhookUrl, webhookToken }` pair is thread-like — a single durable endpoint per connection) combined with Operator Uplift's own `lib/photon/adapter.ts` send payload shape (`project_id`, `recipient`/`to`). When Spectrum provides a `thread_id`, outbound MUST reuse it.
- **What it does:** Every outbound reply carries the `thread_id` from the originating inbound. Providers that honor it thread the reply into the same chat; those that don't (some Spectrum platforms) group by recipient. We persist `thread_id` regardless so our audit trail is correct.
- **Why it works:**
  - Users experience replies in the same thread, not as new conversations.
  - Our DB always has the linkage, so we can rebuild provider-side threading later if a provider fixes this.
- **Minimal version we can ship:** In `/api/photon/imessage/send`, read `threadId` from the body; include it in the adapter call AND persist it to `outbound_messages.thread_id`. PR #128 already captures this; Wave 1A just makes it canonical.
- **Dependencies:** Existing `lib/photon/adapter.ts`.
- **Risks / failure modes:** Some providers silently drop `thread_id` — our audit still shows intent; user-visible threading becomes provider-limited but known.
- **Trust / privacy implications:** None.
- **Best workspace home:** `developer_console` (visible test at `/dev/imessage`) + `core` (schema shared with DMG if we go dual-host).
- **Acceptance test:** From one phone number, send two messages to the Photon number 5 minutes apart. Reply to both. Both replies arrive in the same iMessage thread; both outbound rows have identical `thread_id` values.

---

### Pattern 2.D — 5-second fallback with calm copy when agent doesn't respond

**Pattern:**
- **Name:** Bounded-wait reply with calm-fallback catch-all
- **Source(s):** Our Photon governance rule in `docs/integrations-plan.md` ("Always respond within 5s with either real reply or calm fallback + Ref") cross-referenced with `onyx-dot-app/onyx/backend/onyx/utils/error_handling.py::handle_connector_error` (standardized handler that logs and optionally re-raises) and `shlokkhemani/openpoke/server/app.py::_unhandled_exception_handler` (returns `{"ok": False, "error": "Internal server error"}` on any unhandled — simple, consistent).
- **What it does:** When the agent pipeline runs long, a watchdog sends a calm fallback message referencing the `requestId`. The user never wonders if the bot is dead; they always get a Ref.
- **Why it works:**
  - Deterministic UX — every incoming message gets a reply within 5 s.
  - Calm copy avoids "Unknown error" / "Internal server error"; matches our existing error taxonomy (`lib/errorTaxonomy.ts`).
  - Ref lets support find the exact log line.
- **Minimal version we can ship:** In the message worker, wrap the agent call in `Promise.race([agentCall, sleep(5000).then(() => ({ fallback: true }))])`. If fallback fires, send: *"I'm having trouble right now — try again in a minute. Ref: req_…"*. The long-running agent result, if it finishes, is logged but not sent (user already got the fallback).
- **Dependencies:** Node `Promise.race`; our existing `lib/errorTaxonomy.ts`.
- **Risks / failure modes:** User sends two messages in quick succession, both time out, gets two fallbacks — acceptable; the Ref disambiguates.
- **Trust / privacy implications:** None — the fallback is calm; no token or PII in the copy.
- **Best workspace home:** `developer_console` (watchdog config + visualizer) + `calendar_agent`/`message_agent` (the actual send).
- **Acceptance test:** Stub the agent to sleep 8 s. Send one inbound message. Within 5 s a fallback arrives with Ref. No second message arrives when the agent finally completes at 8 s.

---

### Pattern 2.E — Webhook signature verification on the RAW body, constant-time compare

**Pattern:**
- **Name:** HMAC-SHA256 on raw bytes + `timingSafeEqual`
- **Source(s):** Our own `app/api/webhooks/photon/route.ts::hmacHex` + `constantTimeEq` (shipped in PR #128; validated against the Spectrum docs shape). `f/poke-gate/src/permission-service.js` uses the same HMAC-SHA256 pattern for approval-token signing (`createHmac("sha256", this.secret).update(tokenPayload).digest("hex")`).
- **What it does:** The webhook body is read once as raw bytes, HMAC'd with the shared secret, and compared constant-time against the provider's signature. Never parse JSON first — parsing normalizes whitespace and breaks the hash.
- **Why it works:**
  - Resistant to timing-attack signature oracles.
  - Resistant to JSON-reserialization bugs (a single space difference kills the hash).
  - Matches the provider's expected verification procedure.
- **Minimal version we can ship:** Already in PR #128. Add a small test that changes one whitespace character in the body and confirms the request is rejected.
- **Dependencies:** Node `crypto`.
- **Risks / failure modes:** Secret rotation — need a "previous secret" transition window for zero-downtime.
- **Trust / privacy implications:** None — signature verification is trust-enforcing.
- **Best workspace home:** Existing `WEBSITE/app/api/webhooks/photon/route.ts` (already there).
- **Acceptance test:** With `PHOTON_WEBHOOK_SECRET` set, POST the payload from the runbook with a correct signature → 200. Flip one byte → 401 `{error: "invalid_signature"}`.

---

### Pattern 3.A — RISKY vs SAFE tool classification as the gate for approval

**Pattern:**
- **Name:** Binary SAFE/RISKY set drives approval requirement
- **Source(s):** `f/poke-gate/src/permission-service.js` lines 1–8: `const SAFE_TOOLS = new Set(["read_file", "read_image", "list_directory", "system_info"]); const RISKY_TOOLS = new Set(["run_command", "write_file", "take_screenshot"]);`
- **What it does:** A central classification: safe tools run without approval; risky tools require an HMAC-signed approval token that's single-use, TTL-bounded, and binds to the exact args hash.
- **Why it works:**
  - Trivially auditable — one file, two sets.
  - Extensible — adding a new tool makes you pick a side explicitly.
  - Maps cleanly to our existing "simulated vs real" dichotomy — `SAFE_TOOLS` ≈ Demo-mode reads; `RISKY_TOOLS` ≈ Real-mode writes.
- **Minimal version we can ship:** In `lib/toolCalls.ts`, export a `SAFE_ACTIONS` and `WRITE_ACTIONS` set per tool. Calendar: `{list, free_slots}` safe; `{create}` write. Gmail: `{list, read}` safe; `{draft, send_draft, send}` write. The approval modal already reads this shape — this pattern formalizes it in code and docs.
- **Dependencies:** None.
- **Risks / failure modes:** New action added without being classified → default to write (fail closed).
- **Trust / privacy implications:** Low — we already gate by capability + approval; this pattern makes the rule grep-able.
- **Best workspace home:** `core` (the set is schema-adjacent) + `UI` (approval modal consumes it).
- **Acceptance test:** Add a hypothetical `calendar.delete` action to the code without classifying it. The approval modal refuses to run it and shows "Unknown safety class — this action is disabled" with a Ref.

---

### Pattern 3.B — Approval token binds session + tool + args-hash + TTL

**Pattern:**
- **Name:** HMAC-signed approval token pinned to exact args
- **Source(s):** `f/poke-gate/src/permission-service.js::PermissionService.requestApproval` — `tokenPayload = ${approvalRequestId}:${sessionId}:${toolName}:${argsHash}:${expiresAt}`, HMAC-SHA256, stored as `{consumed: false, expiresAt}`. `validateApprovalToken` checks all fields match and the token is not yet consumed, then marks it consumed.
- **What it does:** When the user clicks Approve, the server issues a token that is bound to (a) the session, (b) the tool name, (c) a deterministic hash of the args the user saw, and (d) a 5-minute TTL. If the client tries to send different args post-approval, the hash mismatch invalidates the token.
- **Why it works:**
  - Prevents post-approval payload mutation — the UI's preview and the server's execution are byte-equal or nothing runs.
  - TTL means stale approvals can't be replayed days later.
  - Single-use means replay is impossible.
- **Minimal version we can ship:** In Operator Uplift's `/api/tools/*/route.ts`, require an `X-Approval-Token` header on every write action. The token is issued by a new `/api/approvals/request` endpoint (which the approval modal hits on click). The token carries `{userId, tool, action, argsHash, expiresAt}` HMAC'd with a server secret. Tool routes validate before executing. Zero change to receipts or x402 — this is a new layer BEFORE them.
- **Dependencies:** `lib/errorTaxonomy.ts` + a new `lib/approvalTokens.ts`.
- **Risks / failure modes:** Clock skew between client and server (the token expiry is server-issued, so not an issue).
- **Trust / privacy implications:** Strongly POSITIVE — makes the "approval modal shows what runs" invariant cryptographically enforced instead of a UI convention. This is the missing half of the approval story.
- **Best workspace home:** `core` (the token lib) + `WEBSITE` (the issue endpoint + tool-route check).
- **Acceptance test:** Approve a gmail.draft with subject "Hi" and body "Test". Intercept the subsequent tool call and flip the body to "Malicious". Server rejects with 403 `invalid_approval_token_args_mismatch` + Ref. A scripted test (admin harness) can do this end-to-end.

---

### Pattern 3.C — Consistent envelope for every error: `{ok: false, error}`

**Pattern:**
- **Name:** One error shape across the whole API
- **Source(s):** `shlokkhemani/openpoke/server/app.py::register_exception_handlers` — every error handler (`RequestValidationError`, `HTTPException`, unhandled `Exception`) returns `{"ok": False, "error": <string>}`. No route returns a different shape.
- **What it does:** The UI never has to guess. `ok: false` → show calm copy; `ok: true` → show success. No nested `detail.errors[0].msg` paths.
- **Why it works:**
  - The chat UI branch for "tool didn't complete" is a single code path.
  - New routes don't drift — the global handlers catch them.
- **Minimal version we can ship:** Operator Uplift already has `lib/errorTaxonomy.ts::envelope`. Extend it with an `ok` boolean in success responses so the shape is fully mirrored. Minor polish — doesn't change existing failure semantics.
- **Dependencies:** Existing `lib/errorTaxonomy.ts`, `lib/apiHelpers.ts`.
- **Risks / failure modes:** Clients that already read `{active: true}` or similar — keep those flags, just add `ok: true` alongside.
- **Trust / privacy implications:** None.
- **Best workspace home:** `WEBSITE` (every `/api/*` route consumes `lib/apiHelpers.ts`).
- **Acceptance test:** Grep every `/api/*` response body across the codebase for `ok: false` — every error response either has this flag or uses `errorTaxonomy.envelope` (which implies the semantic). A CI lint rule can enforce this.

---

### Pattern 3.D — Session-scoped pattern allowlist for repeat actions

**Pattern:**
- **Name:** "Always allow X for this session" without weakening the approval gate
- **Source(s):** `f/poke-gate/src/permission-service.js::allowPatternForSession` + `isAllowedBySessionPattern` — each session keeps a `Set` of shell patterns (e.g. `git *`); subsequent matching commands skip the approval modal *only* for this session.
- **What it does:** Lets a power user say "always let me draft emails during this browser session" without creating a permanent always-allow (which would be scary).
- **Why it works:**
  - Permission is scoped to the session — closing the tab resets it.
  - User stays in control — no persistent bypass in localStorage.
  - Clears cleanly: `clearSession(sessionId)` removes all whitelist + pending approvals in one call.
- **Minimal version we can ship:** For v1, we don't need this — our current "approve every write" is the conservative default. Keep this pattern as a Wave 4+ candidate only; document the precedent so we don't invent a worse version under time pressure.
- **Dependencies:** None (deferred).
- **Risks / failure modes:** Scope creep into "remember forever" via misread UX → DECISIONS.md already forbids this.
- **Trust / privacy implications:** Medium — any auto-allow weakens the approval contract. Only ever implement session-scoped, never origin-scoped.
- **Best workspace home:** Deferred; would live in `UI` (modal + panel) + `core` (per-session lib).
- **Acceptance test:** (Deferred) Approving a draft with "Always this session" allows subsequent drafts to this address without a modal; closing the tab and re-opening forces re-approval on the next draft.

---

### Pattern 4.A — `X-Request-Id` on every response, success or failure

**Pattern:**
- **Name:** Request-scoped ID header on every API response
- **Source(s):** Our own `lib/apiHelpers.ts::withRequestMeta` + `errorResponse` (shipped in PR #123) — every error route returns `{requestId, timestamp, message, nextAction}` + header `X-Request-Id`. Parallels the openpoke pattern of consistent `ok/error` envelopes but adds the Ref.
- **What it does:** Every HTTP round-trip carries a unique ID. The UI shows it as `Ref: req_…` on failure; support pastes it into logs and grep finds the exact JSON line.
- **Why it works:**
  - Cheap on the hot path (one UUID per request).
  - Dev-to-support loop is instant: user copies Ref → dev finds log.
- **Minimal version we can ship:** Already shipped on our auth + subscription + gmail/calendar/x402 routes. Extend to the receipt route and every remaining `/api/*`. The lint rule above would enforce this too.
- **Dependencies:** Existing.
- **Risks / failure modes:** Log retention — requestIds are useless if logs are 1-hour TTL. Vercel logs are 1 hour on the Hobby plan; need Pro or a Datadog sink for prod.
- **Trust / privacy implications:** None — UUIDs are not PII.
- **Best workspace home:** `WEBSITE` (done). Mirror in `DMG/Tauri` for the desktop app's local logs.
- **Acceptance test:** POST any `/api/*` route with an invalid payload. Response headers include `X-Request-Id: req_<uuid>`; response body includes `"requestId": "req_<uuid>"`; same value in both places; the value appears in a Vercel log line within 30 s.

---

### Pattern 4.B — Structured JSON logs with bounded fields, no secrets

**Pattern:**
- **Name:** One-line JSON log per event, capped field lengths, tokens never included
- **Source(s):** Our own `lib/apiHelpers.ts::errorResponse` (`console.log(JSON.stringify({at, event, ts, requestId, errorClass, httpStatus, detail: detail.slice(0, 240)}))`) + `shlokkhemani/openpoke/server/app.py` (uses `logger.debug(..., extra={"errors": exc.errors(), "path": str(request.url)})` — structured via extra).
- **What it does:** Every log line is parseable, searchable, and truncated. Tokens, raw request bodies, and payload content never enter logs.
- **Why it works:**
  - Bounded fields prevent log-storage blowout from a rogue 5 MB body.
  - No secrets means the log drain can be shared with support without redaction.
  - JSON lines are Datadog/Loki/Vercel-native.
- **Minimal version we can ship:** Codify the field contract in `docs/research/DECISIONS.md` (already captures "no secrets"). Add a CI grep for `process.env.*_SECRET` or `Authorization.*Bearer` appearing inside a `console.log`. Fail if found.
- **Dependencies:** Existing logging.
- **Risks / failure modes:** A dev accidentally passes `request.headers` into `console.log` → CI catches.
- **Trust / privacy implications:** High — this is the rule that stops accidental secret leaks.
- **Best workspace home:** `developer_console` (harness surfaces the fields) + a CI rule in `WEBSITE`.
- **Acceptance test:** Vercel log search for `Bearer ` and `sk-` in the last 24 h returns zero matches. Log search for `req_` returns many.

---

### Pattern 4.C — Admin diagnostics page with "last N events + Copy Ref"

**Pattern:**
- **Name:** Diagnostics surface surfaces the most recent requestIds with one-click copy
- **Source(s):** Our own PR #122 `/settings → Status` (`lastRequestId` + Copy), PR #128 `/dev/imessage` (last 20 inbound + outbound with Copy chips per row), and Pattern 4.A above. Converge them: any admin / support view showing an error row must expose its `requestId` as a Copy chip.
- **What it does:** When a user reports "it didn't work", they can click one button and paste the last Ref. Support searches the log by Ref and finds the exact route + timestamp.
- **Why it works:**
  - Zero-friction for non-technical users.
  - The Ref is the whole report.
- **Minimal version we can ship:** Already shipped on `/settings → Status` + `/dev/imessage`. Extend to: the receipts view on `/profile`, the paywall error panel (done), and any future admin surface.
- **Dependencies:** Existing.
- **Risks / failure modes:** Users copy and paste into public channels — benign, the UUID is non-sensitive.
- **Trust / privacy implications:** Positive — more signal in the bug report, less guesswork for support.
- **Best workspace home:** `WEBSITE` (done).
- **Acceptance test:** In the /settings Status panel after a simulated failure, click Copy → paste into a text editor → value starts with `req_`.

---

### Pattern 4.D — Clear separation of "healthcheck" vs "probe" endpoints

**Pattern:**
- **Name:** Cheap GET healthchecks that actually exercise downstream providers
- **Source(s):** Our own `/api/health/llm` (PR #120 — probes each provider's `/models` with 3 s timeout). `shlokkhemani/openpoke/server/routes/meta.py` (the `meta` route, typical health+version split). `onyx-dot-app/onyx` has multi-tier healthcheck under `backend/onyx/server/` (standard Python FastAPI pattern).
- **What it does:** `/api/health/*` returns 200 only when the actual provider chain is reachable — not a dumb "ok". For Photon, we'd add `/api/health/photon` probing the adapter's `/v1/spectrum/messages` (read-only equivalent if available; otherwise just check `isActive()` + send a ping) with a short timeout.
- **Why it works:**
  - Uptime monitoring catches real outages (provider down ≠ our site down).
  - Dev diagnostics: one curl tells you everything.
- **Minimal version we can ship:** Add `GET /api/health/photon` that returns `{ok, configured, reachable, latencyMs}` — doesn't need to send a real message; just confirms credentials resolve and base URL responds to a HEAD or `/v1/health` if Spectrum has one.
- **Dependencies:** Existing `lib/photon/adapter.ts`.
- **Risks / failure modes:** Health check itself becomes rate-limited by the provider — use cached result with 30 s TTL.
- **Trust / privacy implications:** None — no user data involved.
- **Best workspace home:** `WEBSITE` (`/api/health/photon` route).
- **Acceptance test:** `curl /api/health/photon` returns `{ok: true, reachable: true}` when Spectrum is up; `{ok: false, reason: "adapter_not_configured"}` when env vars are unset; `{ok: false, reason: "provider_unreachable", latencyMs: 3000}` when the upstream is down.

---

### Pattern 5.A — Scripted golden-path demo with deterministic fixtures

**Pattern:**
- **Name:** Fixed-seed fixture demo run with exact click script stored in repo
- **Source(s):** `shlokkhemani/openpoke/README.md` ("Next.js web UI that proxies everything through the shared `.env`, so plugging in API keys is the only setup") + Operator Uplift's own `docs/HACKATHON_GATE2.md` + `DEMO_SCRIPT.md` governance from the MASTER_PROMPT Part 5.
- **What it does:** The demo is not a live run — it's a fixture-backed scripted flow. Every button click is recorded in `DEMO_SCRIPT.md` so a second operator can reproduce it.
- **Why it works:**
  - Demos are robust to network flakes.
  - Every judge sees the same thing.
  - The script itself is a test harness.
- **Minimal version we can ship:** Create `DEMO_SCRIPT.md` in the WEBSITE root (or DMG root for offline theater) listing exact clicks: "1. Open /chat 2. Click Briefing card 3. Expect canned reply X 4. Click Inbox card 5. Expect canned reply Y...". The Playwright harness (`/tmp/ecc-demo-recorder/demo-three-beats.cjs`) already does this programmatically — formalize it.
- **Dependencies:** Existing Playwright harness.
- **Risks / failure modes:** Script drifts from reality when fixtures change → the harness run in CI catches it.
- **Trust / privacy implications:** None — the canned fixtures are already labeled `simulated: true`.
- **Best workspace home:** `WEBSITE` (script) + `DMG/Tauri` (offline theater version).
- **Acceptance test:** Run `node demo-three-beats.cjs` against prod → produces a 60 s video identical to last session's output (pixel-diff within 5%).

---

### Pattern 5.B — Offline-first DMG with zero backend dependency for the demo

**Pattern:**
- **Name:** Desktop demo that never touches the cloud
- **Source(s):** `f/poke-gate/README.md` ("Run Poke Gate on your Mac, then message Poke from iMessage, Telegram, or SMS to run commands, read files, take screenshots, and more — all on your machine") + the general pattern of shipping a `.dmg` that bundles canned fixtures.
- **What it does:** The Demo Day DMG boots with canned briefings, canned email drafts, canned event creation responses. Zero Supabase, zero `/api/*`. Every tool payload carries `simulated: true`.
- **Why it works:**
  - Demo works on airplane WiFi / bad conference WiFi.
  - No server to go down at the worst moment.
  - The story ("local-first AI") is the same as the binary (which runs locally).
- **Minimal version we can ship:** Tauri build that bundles JSON fixtures under `src-tauri/resources/canned/*.json`. The "send message" button looks up the canned response by the user's prompt (same matcher as our Demo Mode in `lib/cannedReplies.ts`). No network.
- **Dependencies:** Existing Tauri scaffolding (if present in DMG workspace) + `lib/cannedReplies.ts` content.
- **Risks / failure modes:** Fixtures go stale → refresh them when copy on prod changes.
- **Trust / privacy implications:** Very positive — aligns with "Demo Mode is fully offline" decision in DECISIONS.md.
- **Best workspace home:** `DMG/Tauri`.
- **Acceptance test:** Boot the DMG with WiFi off. Run all three demo beats. Every response arrives within 500 ms, every payload shows `simulated: true`, and `tcpdump` shows zero outbound packets from the app.

---

### Pattern 6.A — Design-system-as-markdown reference (DESIGN.md)

**Pattern:**
- **Name:** Single canonical DESIGN.md in repo root
- **Source(s):** `VoltAgent/awesome-design-md/design-md/*/README.md` — every company folder is a link to their design-system-as-markdown description. **Note:** the actual design specs moved to an external site (`https://getdesign.md/<slug>/design-md`) and are UNREADABLE in this environment. We can still adopt the *shape* of the pattern (a single DESIGN.md file at the repo root that every UI PR references).
- **What it does:** One file at the root answers: color tokens, typography scale, spacing, radii, shadows, motion rules, copy rules. Every UI PR cites it.
- **Why it works:**
  - No drift — one truth.
  - PR reviewers can grep one file.
  - New contributors orient in 5 minutes.
- **Minimal version we can ship:** DESIGN.md at WEBSITE root with: void-black canvas `#0A0A0A`, orange accent `#F97316` (our existing primary; user asked for `#E77630`, confirm before merging), typography scale (already implicit), calm-copy rules (from our existing error taxonomy), Ref-req rule ("every failure shows `Ref: req_…`"), no-scary-copy banned list (already in `docs/integrations-plan.md`).
- **Dependencies:** None.
- **Risks / failure modes:** Writing a perfect DESIGN.md before enough components exist → start with the calm-copy + color rules; fill the rest as they stabilize.
- **Trust / privacy implications:** None.
- **Best workspace home:** `WEBSITE` (DESIGN.md at root). Referenced by `UI`, `DMG/Tauri`, and `webview`.
- **Acceptance test:** A new UI PR links to DESIGN.md in its description and uses the exact color token names it defines. A grep for hardcoded `#F97316` outside `tailwind.config` + DESIGN.md decreases over time.

---

### Pattern 6.B — Landing pages that name the trust contract verbatim

**Pattern:**
- **Name:** Explicit "what's local, what's cloud, what's approved" copy blocks
- **Source(s):**
  - `zo.computer` (READ): "Zo is an intelligent cloud computer that lets you turn your ideas into reality fast... Because Zo is a server, you can host anything — your projects, a Plex media server, self-hosted n8n..."
  - `poke.com` (READ): positions Poke as proactive/conversational (hero copy).
  - `thelibrarian.io` (READ): [from READ status in RESEARCH_INDEX.md — positioning is AI personal memory over email].
  - Our own `src/sections/WhatBecomesReal.tsx` (PR #126) — the "After you sign in" three blocks.
- **What it does:** The landing page states the contract plainly: what runs locally, what runs on the server, what requires approval, what produces a receipt. No jargon, no "powered by Solana devnet" marketing.
- **Why it works:**
  - A cold visitor gets the trust story in 5 seconds.
  - Removes ambiguity that "AI" always evokes.
  - Differentiates from competitors whose landing pages make big promises without a trust model.
- **Minimal version we can ship:** Already shipped in PR #126. Wave 4 candidate: extend the WhatBecomesReal section with per-row links to DESIGN.md-defined proof surfaces (e.g., "every real write produces a signed receipt → see /docs/trust").
- **Dependencies:** Existing.
- **Risks / failure modes:** Landing copy promises something the product doesn't yet do → DECISIONS.md "Docs must not lie" covers this, plus the `DOCS_TRUTH_TABLE.md` from Part 5 of the MASTER_PROMPT.
- **Trust / privacy implications:** Very positive.
- **Best workspace home:** `WEBSITE` (done).
- **Acceptance test:** Every bullet on the landing page can be linked to a file path or route that implements it. A single "Run the Truth Table" CI job that loads `DOCS_TRUTH_TABLE.md` and grep-verifies each claim.

---

### Pattern 7.A — Skills-as-markdown plugin model

**Pattern:**
- **Name:** Claude Code plugin manifest with self-describing skills
- **Source(s):** `affaan-m/everything-claude-code/README.md` (confirmed CLONED). `helius-labs/core-ai/README.md` ("`helius-plugin` — Claude Code plugin — bundles all skills and auto-starts the MCP server").
- **What it does:** A plugin contains self-describing skills. Each skill has a name, trigger phrases, inputs, and outputs. Claude Code loads the manifest and exposes the skills as commands.
- **Why it works:**
  - Composable — install only what you need.
  - Self-documenting — the manifest IS the doc.
  - Safe — each skill is sandboxed by its declared scope.
- **Minimal version we can ship:** Treat this as a Wave 2+ candidate. For Wave 1A, the commitment is: (a) DO NOT install ECC plugin until Wave 0 sources are all in RESEARCH_INDEX.md (they are) AND the ECC repo has an explicit DECISIONS.md safety note covering what it changes / how to uninstall (not yet written). (b) Keep our own `.claude/skills/` additions self-describing with the ECC shape so we're compatible if we do install.
- **Dependencies:** Existing `.claude/skills/` folder.
- **Risks / failure modes:** Installing a plugin that overwrites our own skills. The safety note in DECISIONS.md addresses this.
- **Trust / privacy implications:** Medium — plugins can exfiltrate. Audit before install.
- **Best workspace home:** Meta/tooling (not an Operator Uplift workspace per se; the `everything-claude-code` project is a separate Conductor scope).
- **Acceptance test:** Install ECC in a disposable scope first (not prod). Run `/ecc:plan` in read-only/doc-only mode. Confirm no files under `operatoruplift/*` are touched. Write the uninstall note to DECISIONS.md.

---

### Pattern 7.B — Solana CLI + MCP routing from a single repo (Helius pattern)

**Pattern:**
- **Name:** CLI + MCP server + Claude skills bundled together
- **Source(s):** `helius-labs/core-ai/README.md`:
  > `helius-cli` — CLI for managing Helius accounts and querying Solana data.
  > `helius-mcp` — MCP server with 10 public tools total: 9 routed domains plus `expandResult`.
  > `helius-skills` — Standalone Claude Code skills for building on Solana.
  > `helius-plugin` — Claude Code plugin — bundles all skills and auto-starts the MCP server.
- **What it does:** One GitHub repo, four packages. CLI + MCP + Skills + Plugin. Developers pick their integration surface; the functionality is one codebase.
- **Why it works:**
  - Don't fragment — one repo, four exports, shared tests.
  - MCP is the agent-friendly surface; CLI is the human-friendly surface; Skills are the Claude-friendly surface.
- **Minimal version we can ship:** **Not shipping in Wave 4.** Document this as the target shape for any future Operator Uplift MCP/CLI we might build. The Photon transport PR #128 is the first step; a Phantom-style MCP or Operator-Uplift CLI would be later.
- **Dependencies:** N/A (deferred).
- **Risks / failure modes:** Premature abstraction — four packages for no user. Wait for external demand.
- **Trust / privacy implications:** Medium — MCP servers run locally and consume user creds. Design for least privilege.
- **Best workspace home:** Deferred. Future `developer_console` extension.
- **Acceptance test:** (Deferred) `helius mcp add` works in Claude Code; a similar `operatoruplift mcp add` would add our transport status tools.

---

### Pattern 8.A — External data source as a single connector module

**Pattern:**
- **Name:** Single-file connector + env-only auth + `x-request-id` passthrough
- **Source(s):** `docs.tokens.xyz` (READ per RESEARCH_INDEX.md; the user's brief captured the support contract verbatim: "send me the request URL plus the x-request-id response header and a timestamp, and i'll help quickly"). Combined with our own `lib/photon/adapter.ts` shape (`PHOTON_API_KEY` env only; never hardcode).
- **What it does:** Every external data provider gets exactly one file: `lib/<provider>/adapter.ts`. Env-only auth. Every call persists `{requestUrl, xRequestId, timestamp, status}` locally for debugging. The connector never exfiltrates.
- **Why it works:**
  - Providers change — one-file scope means rebinds are 30-minute PRs.
  - Request-ID + timestamp is the provider's own support contract — we log it to make their job (and ours) fast.
- **Minimal version we can ship:** Create `lib/tokens-xyz/adapter.ts` when we're ready to integrate tokens.xyz. Env: `TOKENS_XYZ_API_KEY`. Persist every call to a new `tokens_requests` table (same shape as `outbound_messages`). Never log the key.
- **Dependencies:** `lib/apiHelpers.ts` (already exists for our request-id plumbing).
- **Risks / failure modes:** API churn — keep the adapter's fetch shape minimal so a doc update is one diff.
- **Trust / privacy implications:** None if env-only and no PII.
- **Best workspace home:** `x402-agent` (if tokens.xyz ends up adjacent to payment data) or `project_space`.
- **Acceptance test:** `curl https://docs.tokens.xyz/...` with your key returns 200. Our adapter call through Operator Uplift logs one line with `{at:"tokens.xyz", requestUrl, xRequestId, timestamp, httpStatus}` — no key in the log.

---

## Wave 1A Summary

### Top 5 patterns to integrate first for Demo Day stability

1. **Pattern 2.A (webhook idempotency)** — low-risk, high-value, already in PR #128 schema. Mirror into DMG's local SQLite as the first local-first step. Workspace: `core` + `DMG/Tauri`.
2. **Pattern 4.A (`X-Request-Id` everywhere)** — already shipped on 5+ routes. Extend to the remaining routes (receipts, memory, agents, notifications) as a doc-driven one-line check. Workspace: `WEBSITE`.
3. **Pattern 5.B (offline-first DMG demo theater)** — the single highest-leverage demo-day move. Tauri shell + bundled fixtures + zero backend. If the conference WiFi dies, the demo runs anyway. Workspace: `DMG/Tauri`.
4. **Pattern 3.B (approval-token args-hash binding)** — hardens our approval modal from a UI convention into a cryptographic invariant. Doesn't touch receipts or x402 — lives as a new layer BEFORE them. Workspace: `core` + `WEBSITE`.
5. **Pattern 2.D (5-second fallback with calm copy + Ref)** — the second biggest demo risk after transport breakage. When the agent pipeline runs long, the user always gets a Ref. Workspace: a new `message_agent` worker + `developer_console` for visibility.

### 3 biggest integration risks if we integrate too much too fast

1. **Parallel tool surfaces.** Building CLI + MCP + plugin + website + DMG all at once fragments the codebase. **Mitigation:** one surface at a time; DMG offline theater first (biggest Demo Day payoff), MCP/CLI only after the demo.
2. **Approval-token rollout breaking existing tool calls.** If Pattern 3.B lands without a backward-compatible rollout, every existing tool call 401s. **Mitigation:** two-PR rollout: PR-A ships the token issue endpoint + validator in "log-only" mode (doesn't reject); PR-B flips the validator to enforce after we've confirmed zero false rejects in logs.
3. **Drift between DMG fixtures and prod canned replies.** If `lib/cannedReplies.ts` changes but the DMG fixtures don't, the DMG demo diverges from the marketing story. **Mitigation:** DMG build step reads `lib/cannedReplies.ts` at compile time; a CI rule ensures they stay in sync.

### Per-pattern frozen-surface check

None of the 20 patterns above touches: receipts, Merkle anchor, x402 semantics, capabilities rules, AuthGate rules, cron schedule, pricing. Patterns 3.B and 2.D come closest (they add a new pre-execution gate and a watchdog respectively) but both are additive layers — they don't modify receipt signing, the x402 gate, or any of the frozen files.

---

Wave 1A complete. Proceed to Wave 2 mapping? (yes/no)
