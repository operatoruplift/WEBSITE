# Operator Uplift — Integration Plan

Paste-ready source for `/docs/integrations` and for investor updates. This document is a design spec — it ships **no code**. All implementation work lives in the roadmap section.

**Authoritative:** this doc overrides any earlier one-off integration notes if they conflict.

---

## 1. Trust contract (non-negotiable)

These rules bind every current and future connector. They are non-negotiable, repeatable in plain language, and shown to the user in copy the UI emits verbatim.

| Mode | What can happen | What cannot happen |
|---|---|---|
| **Demo** | Simulated replies. Every tool call has `simulated: true` in its payload. No receipts are written. The `DEMO · SIMULATED` badge is always visible. | No real reads. No real writes. No receipts. No OAuth handshake. No side effects at any external service. |
| **Real (read)** | Real API reads from connected services (e.g. "list today's events"). Responses are labeled `tier: read` in the tool payload. No receipt. | No writes. No deletions. No shares. |
| **Real (write)** | Real API writes (send, draft, schedule, post, create) behind an **approval moment**. Every successful write produces an ed25519-signed receipt and is anchored in the Merkle audit root. | No auto-send. No background writes. No write without the approval click. |

Verbatim microcopy the UI is allowed to emit:

- "You're on the demo — every reply and tool call is simulated. No writes, no receipts."
- "Approve to run this for real. I won't send anything until you click Approve."
- "Done. I signed a receipt for this action — you can see it in Profile → Identity."
- "You can revoke access anytime from Settings → Connections."

Anything stronger (e.g. "auto-pilot", "autonomous agents that handle your inbox") is **not allowed** in user-facing surfaces until the trust contract explicitly covers that mode.

---

## 2. Integration tiers

| Tier | Qualifies | Disallowed |
|---|---|---|
| **Tier 0 — Demo** | Canned fixtures, synthetic tool payloads, pre-written briefings. Used in anonymous/logged-out flows and in product marketing. | Any outbound network call to the integrated service. |
| **Tier 1 — Real read** | OAuth-bound read scopes. Safe list/search/get endpoints. Aggressive caching. No state change on the integrated service. | Any write, delete, share, permission change, or email send. |
| **Tier 2 — Real write** | Write endpoints behind the approval moment. One write = one receipt. Kill-switch feature flag per connector. | Silent retries that submit new writes. Bulk writes without explicit per-item approval. Post-approval mutation of the payload server-side. |

Upgrade path: every connector ships Tier 1 first. It only moves to Tier 2 after a week of Tier 1 being green on `/api/health/*` and after the approval UI has been reviewed and instrumented.

---

## 3. Shipping Set — next 6–8 weeks (exactly 5 connectors)

Selected on an ICE-style basis (Impact × Confidence ÷ Effort):

| # | Connector | Segment | Tier at launch | ICE |
|---|---|---|---|---|
| 1 | **WhatsApp** | Consumer | **Write** (approval-gated) | 9 × 0.8 / 5 = 1.44 |
| 2 | **iMessage (read) + SMS (write fallback)** | Consumer | Read + limited write | 8 × 0.7 / 4 = 1.4 |
| 3 | **Slack** | Enterprise | Write (approval-gated) | 9 × 0.8 / 4 = 1.8 |
| 4 | **HubSpot** | Enterprise | Read-first, write week 7+ | 7 × 0.6 / 5 = 0.84 |
| 5 | **GitHub** | Devtools/Ops | Read + write (issue/PR comment) | 8 × 0.85 / 3 = 2.27 |

**Not shipping in this window (explicit):** Vercel (next-up, moves to weeks 9–12), Apple Reminders/Todoist, Notion, Linear/Jira, Spotify, Weather, Google Drive, Tokens.xyz, Photon, MagicBlock expansion.

For every chosen connector below: flagship workflow, what is real, what is simulated in Demo, required scopes, and the approval UX.

### 3.1 WhatsApp (write)

- **Flagship wow workflow:** morning briefing broadcast to self — "Good morning. Calendar: 3 events. Inbox: 2 need reply. Weather: 18°C."
- **Read vs write:** write-only (we never read WhatsApp conversations). Initial release is **self-send only**.
- **Required scopes / provider:** WhatsApp Business Cloud API + approved message templates. Phone verified via Meta Business.
- **Approval UX:** modal with recipient + full message preview + "Approve & Send" (orange primary) / "Edit" / "Cancel". Below: "First time sending via WhatsApp?" opt-in checkbox that explicitly enables the sender.
- **Demo behavior:** `simulated: true` payload, message rendered as a chat bubble in the UI only — never hits the API. Banner: "This is a demo message. It was not sent over WhatsApp."
- **Kill switch:** `INTEGRATION_WHATSAPP_WRITE_ENABLED=1` env flag, default off. Ops can flip to 0 to disable the path site-wide without a deploy.

Three v1 workflows (see §6 for full spec):
1. **Send drafted reply** — to an explicitly typed contact. User approves the exact text.
2. **Schedule a reminder/nudge** — server cron drafts a message at X time; user approves each scheduling, not each send. Sent message itself is logged as a receipt.
3. **Daily briefing to self** — opt-in, sent to the verified phone only.

### 3.2 iMessage (read) + SMS (write fallback)

- **Flagship workflow:** "what did I agree to over text yesterday?" — reads the last 24h of threads, surfaces commitments, drafts follow-ups.
- **Read vs write:** iMessage = read-only (macOS local DB bridge, user opt-in). SMS = write via Twilio for users without WhatsApp.
- **Scopes / provider:** iMessage via the user's local machine only (no cloud relay). SMS via Twilio — E.164 sender owned by Operator Uplift, delivered only to numbers the user has verified.
- **Approval UX:** same modal shape as WhatsApp. For SMS writes, the modal shows carrier + short code cost disclaimer.
- **Demo:** canned thread + canned draft. Never reads a real iMessage DB in Demo.
- **Kill switch:** `INTEGRATION_IMESSAGE_ENABLED`, `INTEGRATION_SMS_ENABLED`.

### 3.3 Slack (write)

- **Flagship workflow:** summarize a channel, draft a message in your voice, approve to post.
- **Workflows (exactly 2):**
  1. **Summarize a channel → draft a reply for approval.** Reads last N messages (scope: `channels:history`, `groups:history`). Drafts a reply. User approves to post (scope: `chat:write` as the user, not as a bot).
  2. **Create a task from a thread.** Reads thread. Drafts task description + assignee inferred from mentions. User approves to post a task message in the channel + (optional) create an issue in a linked tracker.
- **Scopes — permission minimization:**
  - Required: `channels:history`, `groups:history`, `chat:write`
  - Optional (per-workspace opt-in): `users:read` (for assignee inference), `reactions:write` (to mark approved)
  - **Not requested:** `im:read`, `mpim:read`, `files:read`, `admin:*`, `search:read`
- **Workspace install friction plan:** single-click install via Slack App Directory URL. We detect no-permissions gracefully and offer a re-consent link. Workspace admins get a preview page showing every scope with plain-language rationale.
- **Demo:** canned channel + canned draft. No workspace install in Demo mode.
- **Kill switch:** `INTEGRATION_SLACK_WRITE_ENABLED`.

### 3.4 HubSpot

- **Flagship workflow:** "give me a one-paragraph update on the [Acme] deal" — pulls contact + company + recent activity, summarizes.
- **Tier at launch:** Real read only. Write (log call, create note) gated behind Tier 2 review, planned for week 7+.
- **Scopes:** `contacts`, `crm.objects.contacts.read`, `crm.objects.companies.read`, `crm.objects.deals.read`. No delete, no merge, no settings scopes.
- **Approval UX:** for writes (week 7+), modal shows the CRM record being mutated + diff of fields. For reads, no approval modal — only a one-time OAuth consent.
- **Demo:** canned fixture of an "Acme Corp" account with 3 contacts and 2 deals. Explicit "Demo data" label in the card.

### 3.5 GitHub

- **Flagship workflow:** "summarize the open PRs in [repo] and draft a triage comment" — approval required for the comment to post.
- **Tier at launch:** Read (repos, PRs, issues, review comments) + Write (PR/issue comments only, no commits, no pushes, no branch deletion).
- **Scopes:** `repo:read`, `issues:write`, `pull_requests:write`. **Not requested:** `repo:write` (push), `admin:org`, `delete_repo`, `workflow`.
- **Approval UX:** modal with repo + issue/PR number + full comment markdown preview + dry-run rendering of mentions/notifications. "Approve & Post" primary, "Edit" secondary.
- **Demo:** fake repo `operatoruplift/demo-playground` with 5 canned PRs. Canned "triage" comment.

---

## 4. Connector contract (future-proof)

Every connector — current and future — implements this interface. Its shape is defined in `lib/connectors/types.ts` (file not yet created; design only).

```ts
export type ConnectorTier = 'demo' | 'read' | 'write';

export type ConnectorAuthType = 'oauth2' | 'api_key' | 'local_bridge' | 'signed_webhook';

export interface ConnectorScope {
    scope: string;               // provider-native scope name
    rationale: string;           // plain-language "why we ask for this"
    required: boolean;           // if false, connector degrades gracefully
}

export interface ConnectorRateLimits {
    readPerMinute?: number;
    writePerMinute?: number;
    writePerDay?: number;
    burst?: number;
}

export interface ConnectorDataModel {
    // Maps provider-native entities → the canonical shapes the agent
    // understands. Agents never see a raw Slack Message or HubSpot
    // Contact; they see the canonical shape and the connector adapts.
    readonly canonicalEntities: Array<'message' | 'thread' | 'contact' | 'company' | 'deal' | 'issue' | 'pr' | 'event' | 'email'>;
    readonly writeEntities: Array<'message' | 'draft' | 'comment' | 'reminder'>;
}

export interface ConnectorErrorTaxonomy {
    // Every error a connector surfaces maps to one of these — UI copy
    // depends on this class, not on the provider-native code.
    readonly classes: Array<
        | 'unauthenticated'       // user needs to re-connect
        | 'permission_denied'     // scope missing
        | 'rate_limited'          // calm wait copy
        | 'provider_down'         // calm fallback copy
        | 'input_invalid'         // user-correctable
        | 'kill_switched'         // feature flag off
        | 'unknown'               // logged + "temporarily unavailable"
    >;
}

export interface ConnectorTruthLabels {
    // Shown per tool call in the chat UI. Non-negotiable per §1.
    readonly demo: 'SIMULATED';
    readonly read: 'REAL · READ';
    readonly write: 'REAL · WRITE';
}

export interface Connector {
    id: string;                          // stable machine id, kebab-case
    name: string;                        // user-facing display name
    tier: ConnectorTier;                 // current tier — can upgrade
    authType: ConnectorAuthType;
    scopes: ConnectorScope[];
    rateLimits: ConnectorRateLimits;
    dataModel: ConnectorDataModel;
    errorTaxonomy: ConnectorErrorTaxonomy;
    truthLabels: ConnectorTruthLabels;

    /** Healthcheck surface — pings a zero-cost endpoint of the provider. */
    health(): Promise<{ ok: boolean; latencyMs: number; reason?: string }>;

    /** Demo behavior. MUST return `simulated: true` in every payload. */
    simulate(action: string, input: unknown): Promise<{ simulated: true; payload: unknown }>;

    /** Real execution. Caller MUST have approval proof. */
    execute(action: string, input: unknown, approvalProof: string): Promise<{ receiptId: string; payload: unknown }>;

    /** Feature flag check — source of truth for kill switch. */
    isEnabled(): boolean;
}
```

Registration: connectors register themselves into a global registry at server start. The registry exposes `listConnectors(tier?)` for the UI and `byId(id)` for the tool dispatch layer. The registry never renders unhealthy connectors in the Integration Gallery.

---

## 5. Approval UX + safety UX

### 5.1 The approval moment

Exactly this structure. Deviations require a design review.

```
┌─────────────────────────────────────────────────────┐
│ [icon] Approve action — Slack                       │
│                                                     │
│ What will happen:                                   │
│ Post message in #general as @matt                   │
│                                                     │
│ Preview:                                            │
│ ┌─────────────────────────────────────────────┐     │
│ │ "Heads up team, pushing the release to      │     │
│ │ Thursday. Ping me with blockers."           │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ Data I'll access:                                   │
│ - channel metadata for #general                     │
│ - your Slack display name                           │
│                                                     │
│ This produces a signed receipt.                     │
│                                                     │
│ [  Cancel  ]  [  Edit  ]  [ ✓ Approve & Send ]      │
└─────────────────────────────────────────────────────┘
```

- **Preview is the full payload** — no server-side mutation after approval. Any change requires a new approval.
- **Data I'll access** — enumerates every scope hit, in plain language.
- **"This produces a signed receipt"** — always shown for Tier 2, never for Tier 1.
- **Buttons:** Cancel (ghost) / Edit (secondary) / Approve & Send (primary, orange).
- **Shortcut:** `Enter` submits when focus is on the primary button. `Esc` cancels.

### 5.2 Confidence UI

Small, persistent, trust-anchoring elements:

- **Connection pill** in the top nav: `Slack · REAL · WRITE` with a green dot when healthy, amber when degraded. Click opens Settings → Connections.
- **Receipt trailer** on every real-write message: "Receipt `rcpt_abc123` · anchored at 15:42". Click copies the receipt ID.
- **Revocation banner** on every Connections page row: "You can revoke Operator Uplift's access from [Slack Connected Apps] anytime."
- **Failure copy standard:** every failure renders as `{calm explanation} {next action}  Ref: req_...` with a Copy button next to the Ref.

---

## 6. Reliability + observability

### 6.1 Defaults

Applied uniformly unless a connector justifies an override in writing.

| Dimension | Default |
|---|---|
| Request timeout | 15s (reads), 30s (writes) |
| Retries | 2 on reads (network/5xx/429 only), **0 on writes** |
| Backoff | 500ms → 1500ms (reads) |
| Circuit breaker | 5 failures in 60s → open circuit for 60s; GET `/api/health/<id>` reports `open` |
| Read cache TTL | 60s default, 300s for low-change entities (contacts, repos) |
| Write idempotency | every write carries an idempotency key derived from `{userId, approvalProof, payloadHash}` |
| Kill switch | env flag per connector, checked on every `execute()` |

### 6.2 Never show scary errors — copy rules

| Error class | Allowed copy template |
|---|---|
| `unauthenticated` | "Your {service} session expired. Reconnect to continue." + "Reconnect" CTA + Ref |
| `permission_denied` | "{service} didn't grant the `{scope}` permission. Update permissions to use this." + "Update permissions" CTA + Ref |
| `rate_limited` | "We're waiting for {service} to let us back in. Try again in {N}s." + Ref |
| `provider_down` | "{service} is having a moment. We'll retry, or you can switch to another tool." + Ref |
| `input_invalid` | "{specific field} looks off — {hint}. Edit to try again." + Ref |
| `kill_switched` | "{service} writes are paused for maintenance. Reads still work. We'll tell you when it's back." + Ref |
| `unknown` | "We hit an unexpected error. We logged it (Ref: ...) and will take a look." + Ref |

**Banned phrasing anywhere in user-facing error copy:**
- "Internal server error"
- "500 / 502 / 503 / Unknown error" (the number is fine in dev console; not in UI)
- "Check your API key" (except in the narrow ProviderError case where a key genuinely is missing)
- "Something went wrong" (vague; useless)
- "Try again later" without a specific actionable next step

### 6.3 Log fields (no secrets)

Every `execute()` and `simulate()` emits one JSON log line:

```json
{
  "at": "connector",
  "event": "attempt|success|failed|rate-limited|circuit-open",
  "ts": "2026-04-18T08:00:00.000Z",
  "requestId": "req_...",
  "connectorId": "slack",
  "tier": "write",
  "action": "post_message",
  "route": "POST /api/tools/slack/post",
  "provider": "slack",
  "status": 200,
  "latencyMs": 312,
  "userId": "did:privy:...",
  "approvalId": "apr_..."
}
```

**Never logged:** tokens, refresh tokens, OAuth codes, message bodies, email content, contact PII, scope strings beyond the class, cookies, `Authorization` headers.

For JWS auth failures, we log JOSE header fields only (`alg`, `typ`, `kid`, token length, 12-char prefix). Already implemented in `/api/subscription`.

---

## 7. QA that prevents demo failure

Every shipping connector has (a) a deterministic golden path script the demo narration follows, and (b) a "can't break" fallback that kicks in if any step of the golden path fails.

### 7.1 WhatsApp

- **Golden path:** "send myself the morning briefing" → approval modal → Approve → send confirmation → receipt ref.
- **Edge cases:** phone not verified, template unapproved, rate limit hit, message too long.
- **Can't-break fallback:** on any failure, chat bubble shows the simulated version of the send with an amber "Couldn't reach WhatsApp — showed you the simulated version. Ref: req_..." banner. Demo continues. No half-sent state.

### 7.2 iMessage (read) + SMS (write)

- **Golden path:** "what did I agree to over text yesterday?" → opens local bridge → returns 3 canned commitments → drafts one follow-up SMS → approval → send.
- **Edge cases:** local bridge not running, iMessage DB locked, Twilio number unverified, carrier filter.
- **Can't-break fallback:** if local bridge is unreachable, show simulated thread with "Demo thread — your local iMessage wasn't reached." If SMS send fails, show simulated send with receipt marked `retry_pending`.

### 7.3 Slack

- **Golden path:** "summarize #general" → reads 20 messages → drafts one-sentence summary → user types "post as me" → approval modal → post → receipt ref.
- **Edge cases:** scope missing, channel archived, message deleted mid-read, workspace revoked access, rate limit.
- **Can't-break fallback:** if Slack is down, demo uses the canned `#general` fixture and flags "Demo channel — Slack is down. Ref: req_...". Post flow is disabled (button grays out with tooltip).

### 7.4 HubSpot

- **Golden path:** "give me a one-paragraph update on Acme" → reads contact + company + 2 deals + 3 activities → returns summary paragraph → "View in HubSpot" link.
- **Edge cases:** OAuth expired, record deleted, field permission denied.
- **Can't-break fallback:** fall back to the canned "Acme Corp" fixture with "Demo data" pill. Explicit about why.

### 7.5 GitHub

- **Golden path:** "summarize open PRs in operatoruplift/website" → reads 5 PRs → drafts triage comment → approval modal → posts comment → receipt ref + link to the comment.
- **Edge cases:** repo archived, token scope missing `issues:write`, PR closed before comment posts, markdown invalid.
- **Can't-break fallback:** canned PR list from fixture. Approval modal still renders but posts to a sandbox repo if prod repo is unreachable.

### 7.6 Top 15 failure modes for WhatsApp write + Slack write

Ranked by likelihood × user impact.

**WhatsApp write:**
1. Template not approved → return `kill_switched` class + "WhatsApp requires an approved template for this message shape — draft saved."
2. Phone number not verified → `unauthenticated` class + verification CTA.
3. Rate limit (1/sec per phone) → `rate_limited` class + retry hint.
4. Recipient opted out → `input_invalid` class + "This contact has opted out of WhatsApp Business messages."
5. Media upload failed → `provider_down` class + fallback to text-only.
6. Webhook race — two simultaneous approvals → idempotency key dedupes, second approval becomes no-op with same receipt.
7. Meta Business billing inactive → `unauthenticated` + link to Meta Business Manager.
8. Pay-per-conversation quota exhausted → `rate_limited` + daily cap exposed.

**Slack write:**
9. Token expired mid-stream → `unauthenticated` + reconnect. Draft preserved.
10. Channel membership revoked between draft and post → `permission_denied`.
11. Workspace admin disabled user tokens → `permission_denied` + admin-facing copy.
12. Message length > 4000 → truncated with "…" and user confirms.
13. Blocks API malformed → server rewrites to mrkdwn fallback, shows "Posted as plain text."
14. Bot posting disabled by workspace setting → `permission_denied` + admin contact link.
15. Cross-workspace collision on idempotency key → fresh key, audit entry flags the collision.

Every failure class above maps to exactly one row in §6.2.

---

## 8. Conversion UX — Integration Gallery

### 8.1 Information architecture

One page at `/integrations` (already a free route). Grouped cards:

```
Communication     Calendar + Email    CRM + Sales    Dev + Ops
┌────────────┐    ┌────────────┐      ┌────────────┐   ┌────────────┐
│ WhatsApp   │    │ Google Cal │      │ HubSpot    │   │ GitHub     │
│ SIMULATED  │    │ REAL · R/W │      │ REAL · R   │   │ REAL · R/W │
└────────────┘    └────────────┘      └────────────┘   └────────────┘
┌────────────┐    ┌────────────┐      (next)           (next: Vercel)
│ iMessage   │    │ Gmail      │
│ SIMULATED  │    │ REAL · R/W │
└────────────┘    └────────────┘
┌────────────┐
│ Slack      │
│ SIMULATED  │
└────────────┘
```

Status pills, always visible on the card:
- **Demo** — orange outline
- **Connected · Read** — green outline
- **Connected · Write enabled** — filled green with receipt icon
- **Paused** — amber outline when kill-switched
- **Degraded** — amber outline with a ↻ icon when circuit breaker is open

Each card shows: logo, name, pill, one-line value prop, 1 CTA.

### 8.2 Two CTAs that move Demo → Login → Connection

- **Card-level CTA:** "Try in Demo" → opens the connector's golden-path chat in Demo mode with a pre-filled prompt.
- **Card-level CTA (second):** "Connect for real" → if logged out, `/login?returnTo=/integrations/<id>`; if logged in, kicks off OAuth.

Gallery header has a single sticky banner while user is in Demo mode:

> You're on the demo. Connect Google or add an API key to turn on real tool calls. **[Connect Google]**  **[Add API key]**

---

## 9. Roadmap

### 9.1 Now (weeks 1–2) — harden only, no new surface

- [x] PR #119 — Base App meta tag, subhead revert, Product bg blend, blog cleanup
- [x] PR #120 — `/api/health/llm`, retry/backoff in `callLLM`, `X-Request-Id`, calm fallback copy, Copy Request ID button
- [ ] Current PR — UI polish (Pricing badge, Comparison mobile, Solana + Privy logos), JWS-aware subscription error surface with Ref + Copy, log-safe JWS header debug
- [ ] Google OAuth cookie bridge verification (this PR — see §12)

### 9.2 Next (weeks 3–8) — ship the 5

Week 3: WhatsApp connector skeleton (simulate() only, no outbound). Slack app registration + read-only skeleton.
Week 4: WhatsApp write workflow 1 (drafted reply) behind flag, internal-only cohort. Slack channel summarize (read).
Week 5: WhatsApp write workflow 2 (scheduled nudge). Slack draft → approve → post (write).
Week 6: WhatsApp write workflow 3 (daily briefing to self). HubSpot read (contacts + deals).
Week 7: GitHub read (PR list) + write (PR/issue comment). HubSpot write (log call/note) — Tier 2 review.
Week 8: iMessage read bridge + SMS write fallback. Beta cohort expands to 100 users. Gallery IA ships.

Staged rollout per connector: **internal (1 day) → beta cohort 10 users (3 days) → wider 100 users (3 days) → general**. Abort criteria: any failure class ≥ `permission_denied` occurring > 5% of attempts.

### 9.3 Later (this quarter)

- Open connector platform — SDK + docs so third parties can register connectors.
- Vercel (devtools), Apple Reminders, Notion, Linear/Jira, Spotify, Weather.
- Connector telemetry dashboard (read-only) surfacing circuit-breaker state per workspace.

---

## 10. Acceptance tests

Per connector, these are the tests that must pass before Tier 2 is enabled.

- **Trust contract:** demo-mode tool payloads all carry `simulated: true`. Zero outbound network calls in Demo. Verified via integration test with network mocked off.
- **Approval moment:** approval UI shows exact payload; post-approval payload is byte-identical to preview. Verified via Playwright snapshot of the preview + server log comparison.
- **Receipt:** every successful `execute()` produces exactly one receipt with correct `{actor, action, target, payloadHash, timestamp}` fields and a valid ed25519 signature. Verified via unit test over the receipt signer + a Merkle inclusion test.
- **Error taxonomy:** synthetic failures of every class in §6.2 render the correct calm copy with a Ref and a Copy button. Verified via component test.
- **Kill switch:** flipping the env flag mid-session causes the next `execute()` to return `kill_switched`. Verified via integration test.
- **Observability:** every log line contains the required fields. Verified via log-assertion middleware in the test harness.
- **Copy:** every user-facing string matches one of the templates in §6.2 — no free-form error strings in production code. Verified via lint rule.

---

## 11. Investor-friendly 20-line summary

```
Operator Uplift is an agentic AI layer that actually runs on your terms.
We gate every real action behind a human click, sign a receipt, anchor it
on-chain, and never act without permission. That's the moat.

Today, anonymous users get a full Demo on prod — simulated calendar, inbox,
and reminders — with the DEMO · SIMULATED trust badge never hidden. Google
OAuth flips the same agent into Real mode with signed receipts.

The next six to eight weeks: five connectors. WhatsApp (write), iMessage +
SMS fallback, Slack (write), HubSpot (read first), GitHub (read + write).
Every one launches approval-gated, with a kill switch flag, and a
can't-break demo fallback.

We ship inside a non-negotiable trust contract. Demo is simulated, Real
asks before acting, every write produces a receipt, and users can revoke
anytime. That contract is enforced in the connector interface, the UI
copy, and the audit ledger — so trust stays measurable as we scale.

The north star: convert Demo to Real at double-digit rates. Every polish
shipped in the last three PRs raised that dial — healthcheck, request IDs,
calm error copy. The next five connectors give the Real mode enough
surface area to feel inevitable.
```

---

## 12. PR-local checklist — polish + hardening

This doc is part of a PR that also ships the following production-safe polish. The checklist is here so the investor-facing doc and the engineering work live next to each other.

- [x] Base meta `base:app_id` on `/`, `/chat`, `/paywall` (verified curl on prod)
- [x] Pricing "Recommended" badge → pill, inset from corner (no more bleed on mobile)
- [x] Comparison table → right-edge fade hint + tighter mobile padding
- [x] Solana logo → three parallel bars all slanting same direction (brand-correct)
- [x] Privy logo → cleaner P with proper counter
- [x] `/api/subscription` → `requestId` + `X-Request-Id` + JWS header debug log (alg/typ/kid only)
- [x] Paywall failure UI → Ref + Copy button on failed + reauth_required states
- [ ] Google OAuth cookie bridge — verified via /api/whoami (in smoke tests)

Not touched (explicit trust-critical list):
- `lib/receipts.ts` / receipt signing
- Merkle anchor program / `/api/cron/*` that commits roots
- `/api/tools/x402/*` payment gate
- `lib/capabilities.ts` capability primitive
- `middleware.ts` AuthGate rules
- Pricing tiers + amounts
