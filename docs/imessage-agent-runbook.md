# Photon Spectrum iMessage Agent Runbook

What you need to text the bot from iPhone iMessage and get a Claude
Haiku reply back. End-to-end smoke test in roughly five minutes.

## "iMessage doesn't work" — symptom map

If you texted the bot and got nothing back, hit one of these in order. The first one that turns up missing is your blocker.

| Symptom | Most likely cause | What to check |
|---|---|---|
| No reply at all, no errors visible | Vercel env vars missing | curl `/api/health/adapters` as an admin (logged-in browser → DevTools → copy the request as curl). The `photon` adapter's `active` field tells you which side is dark. |
| `photon.active: false`, reason `not_configured` | `PHOTON_PROJECT_ID` and/or `PHOTON_API_KEY` not set in Vercel | Set both from the Spectrum dashboard's Settings tab. Redeploy. |
| `photon.active: true` but Spectrum console shows no inbound | Spectrum webhook URL not configured | In the Spectrum dashboard's Webhooks tab, set the webhook URL to `https://<your-domain>/api/webhooks/photon` and the secret to whatever you set in `PHOTON_WEBHOOK_SECRET`. |
| Inbound shows in `/dev/photon` but no reply text logged | `ANTHROPIC_API_KEY` missing | Set it in Vercel from console.anthropic.com. The agent falls back to the canned `"Got it, working on it."` reply when the LLM key is unavailable; that fallback uses the Photon adapter, so an empty reply means the *adapter* is also dark. |
| HMAC signature mismatch in logs | `PHOTON_WEBHOOK_SECRET` differs between Spectrum and Vercel | Re-copy the secret from Spectrum into Vercel verbatim. No quotes. |
| Bot reply works but YES doesn't execute | Sender's phone not verified, or Google not connected | Open `/integrations` while logged in as the same Privy user, verify the phone, click Connect Google. |

If `/api/health/adapters` returns 401, you're not logged in as an admin. The bypass list is `lib/auth.ts::isAdminAllowlisted`. Sign in with an email on that list, then retry.

If everything looks green and it still doesn't work, run `node scripts/photon-smoke.mjs` against prod (set `PHOTON_SMOKE_BASE` to your domain). Five PASS lines mean the loop is wired; anything else prints the failed leg.

## How the round trip works

1. You text the bot's iMessage number (the one set up in your Photon
   Spectrum dashboard).
2. Spectrum POSTs to `https://www.operatoruplift.com/api/webhooks/photon`.
3. The webhook verifies the HMAC signature, normalizes the payload,
   inserts an audit row in Supabase `inbound_messages`, then runs the
   5-stage dispatch chain (in order, first match wins):
   - **Opt-out gate.** If the sender previously sent STOP, the
     webhook logs the row and returns 200 without replying. A START
     keyword from the same sender clears the flag.
   - **Pending YES/NO.** If the sender has a row in
     `imessage_pending_actions` (a staged Gmail draft or Calendar
     event) and texts YES / NO / cancel / send / etc., the executor
     consumes the row. On YES the Google bridge fires the actual
     Gmail/Calendar API call (when the sender's verified phone is
     linked to a Privy user with Google OAuth). On NO the row is
     deleted and the reply is "Cancelled."
   - **Keyword short-circuit.** STOP, HELP, PING, STATUS map to
     canned replies that skip the LLM entirely.
   - **Intent classifier.** Cheap regex match for set_zodiac,
     set_location, set_model, weather, email_draft, calendar_create.
     `set_*` and `email_draft` / `calendar_create` require a verified
     phone (otherwise the reply bounces the user to /integrations).
     email_draft + calendar_create stage a `pending_actions` row and
     reply with the preview asking YES/NO.
   - **Agent fallback.** Otherwise, the agent loads up to 5 prior
     turns (`text` + `reply_text`) for the sender, hands them as
     multi-turn context to Claude Haiku 4.5 (max 200 tokens), strips
     any markdown the model emits, and sends the reply back via
     the Photon adapter. User prefs (zodiac, location, model_pref,
     system_prompt_override) are folded into the system prompt.
   - The audit row gets `processed_at`, `reply_message_id`, and
     `reply_text` so `/dev/photon` can show the round trip.
4. Your phone shows the reply, typically in 2-4 seconds.

The agent is `lib/photon/agent.ts::runAgentReply`. The webhook is
`app/api/webhooks/photon/route.ts`. Helpers live under `lib/photon/`:

- `agent.ts`, generates the LLM reply with timeout + markdown strip.
- `keyword-replies.ts`, STOP / HELP / PING / STATUS canned replies.
- `opt-outs.ts`, persisted opt-out flag (Supabase-backed).
- `users.ts`, imessage_users CRUD (zodiac, location, model_pref).
- `history.ts`, multi-turn conversation loader.
- `intents.ts`, regex intent classifier returning a discriminated union.
- `pending-actions.ts`, imessage_pending_actions buffer + 5-min TTL.
- `pending-replies.ts`, YES/NO consume + execute via Google bridge.
- `google-bridge.ts`, sender -> privy_user_id -> Google OAuth client.
- `verify-codes.ts`, 6-digit phone verification (issue + confirm).
- `weather.ts`, Open-Meteo / OpenWeatherMap forecast helper.
- `horoscope.ts`, ZODIAC_SIGNS const + parser.
- `strip-markdown.ts`, sanitizes Claude output before iMessage send.
- `webhook-helpers.ts`, signature verification + payload normalization.

Dashboard UI lives at `/integrations` (the `IMessageVerifyCard`
component). Operators watch `/dev/photon` for live inbound rows,
verified-user count, opt-outs, and pending tool calls.

## Required production env vars

Set these in the Vercel project (Production + Preview). Without them,
the webhook still 200s but the user gets no reply.

| Var | Purpose | Where to find it |
|---|---|---|
| `PHOTON_PROJECT_ID` | Spectrum project UUID | Spectrum dashboard, Settings |
| `PHOTON_API_KEY` | Spectrum Secret Key | Spectrum dashboard, Settings |
| `PHOTON_WEBHOOK_SECRET` | HMAC secret on inbound webhook | Spectrum dashboard, Webhook tab |
| `ANTHROPIC_API_KEY` | Claude Haiku reply model | console.anthropic.com |
| `NEXT_PUBLIC_SUPABASE_URL` | Audit table writes | Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Audit table writes | Supabase project settings |

Optional overrides (none required for the default behavior):

| Var | Default | Notes |
|---|---|---|
| `PHOTON_API_BASE` | `https://api.photon.codes` | Override if Spectrum docs name a different host |
| `PHOTON_SEND_PATH` | `/v1/spectrum/messages` | Override if the send endpoint moves |
| `PHOTON_AGENT_MODEL` | `claude-haiku-4-5-20251001` | Swap models without code change |
| `PHOTON_AGENT_MAX_TOKENS` | `200` | Reply length cap |
| `PHOTON_AGENT_SYSTEM` | (default prompt) | Custom system prompt |
| `PHOTON_AGENT_LLM_TIMEOUT_MS` | `10000` | Hard cap on the Anthropic call so a slow LLM never blows the 15s function budget |
| `DEBUG_ADMIN_KEY` | (unset) | Optional shared secret for admin routes. When set, callers can pass `X-Debug-Key: $DEBUG_ADMIN_KEY` instead of a Privy session |

## One-time database setup

Idempotent migrations to apply against your Supabase Postgres
database. All use `CREATE TABLE IF NOT EXISTS` and `ADD COLUMN IF
NOT EXISTS` so re-running them is safe.

```bash
psql "$DATABASE_URL" -f lib/photon-webhook-migration.sql
psql "$DATABASE_URL" -f lib/photon-optouts-migration.sql
psql "$DATABASE_URL" -f lib/photon-imessage-users-migration.sql
psql "$DATABASE_URL" -f lib/photon-pending-actions-migration.sql
```

- `photon-webhook-migration.sql` creates `public.inbound_messages`
  with the unique idempotency index, the unprocessed/sender lookup
  indexes, and the `reply_text` column the chat-history loader reads.
- `photon-optouts-migration.sql` creates `public.imessage_opt_outs`
  keyed by sender, with a partial index on active opt-outs.
- `photon-imessage-users-migration.sql` creates two tables:
  `imessage_users` (sender PK, privy_user_id, verified_at, timezone,
  location, zodiac, model_pref, system_prompt_override, summary)
  and `imessage_verifications` (sender PK, code_hash, expires_at,
  pending_for, attempts).
- `photon-pending-actions-migration.sql` creates
  `imessage_pending_actions` (sender PK, action_type, params jsonb,
  preview_text, expires_at, 5-min TTL).

Backward compat: if either table is missing, the webhook still
serves 200 and the agent still runs (with no history, no opt-out
gate, and no audit log). The reply still goes out.

## Spectrum dashboard config

In `https://photon.codes/spectrum`:

1. **Settings** tab, copy `PROJECT_ID` and `Secret Key` into Vercel.
2. **Webhook** tab, set the URL to:
   ```
   https://www.operatoruplift.com/api/webhooks/photon
   ```
3. **Webhook** tab, set the signing secret to the same value you put
   in `PHOTON_WEBHOOK_SECRET` in Vercel.
4. Connect the iMessage number under the **Channels** tab.

## Smoke tests

### Quickest: `pnpm photon:smoke`

```bash
pnpm photon:smoke
# 5-step report: liveness, unsigned POST, signed POST,
# Photon adapter env, Anthropic key. Exits non-zero only if a
# required leg fails. Set PHOTON_SMOKE_BASE to point at a preview.
```

If the script prints WARN for `PHOTON_PROJECT_ID`, `PHOTON_API_KEY`,
or `ANTHROPIC_API_KEY`, those are local-shell warnings — fine to
ignore as long as Vercel env has them. The PASS/FAIL lines for the
two webhook POSTs are what matters; FAIL means production is broken.

### 1. Webhook reachable

```bash
curl -i https://www.operatoruplift.com/api/webhooks/photon
# expect: 200 + {"ok":true,"route":"photon_webhook"}
```

### 2. Webhook accepts a POST

```bash
curl -i -X POST https://www.operatoruplift.com/api/webhooks/photon \
  -H "Content-Type: application/json" \
  -d '{"sender":"+15551234567","text":"ping","platform":"imessage"}'
# expect: 200 + {"ok":true,"logged":true|false,...}
```

If `logged: false` with `reason: "Could not find the table..."`, run
the migration above.

### 3. Browser-based admin verification: `/dev/photon`

Sign in with a bypass-listed email and visit
`https://www.operatoruplift.com/dev/photon`. The page renders the
last 20 inbound rows with their reply status and gives you three
operator tools:

- **Refresh** re-pulls the inbox.
- **Simulate webhook** posts a synthetic Spectrum payload at the
  real `/api/webhooks/photon` (signed with `PHOTON_WEBHOOK_SECRET`
  if configured), so you can verify the round trip end-to-end
  without a real phone.
- **Opt-outs** lists active STOP rows and lets you Clear them with
  one click (re-enables replies for that sender).

Each row shows the inbound text and, after the agent replies, the
outbound `reply_text` in green so the round trip is visible at a
glance.

### 4. Real iPhone test

Text the bot's number from your iPhone with something like:
`What time is it in Tokyo?`

Within ~4 seconds you should see a Claude Haiku reply on iMessage.
A second message in the same thread will pick up multi-turn
context (the agent loads up to 5 prior turns before the LLM call),
so "actually make it 8am" works as a follow-up to "wake me at 7am
with weather."

Recognized opt-out and orientation triggers (case-insensitive,
full-message match):

| Keyword | Effect |
|---|---|
| `STOP`, `unsubscribe`, `cancel` | Persist opt-out, no further replies |
| `START`, `resume` | Clear opt-out |
| `HELP`, `?` | Orientation reply with sign-up link |
| `PING`, `hello`, `are you there` | "Yes, I'm here" |
| `STATUS`, `health` | "Up and running" |

If nothing comes back:

- Hit `GET /api/admin/photon/recent` (admin-gated; pass
  `X-Debug-Key: $DEBUG_ADMIN_KEY` or sign in with a bypass-listed
  email) to see the last 20 inbound rows with their reply status.
  Each row carries `status: 'replied' | 'pending'`,
  `processed_at`, and `reply_message_id`. A tail of `pending`
  rows means the agent never finished its round trip.
- Check Vercel Function logs for `at: "photon.agent"` events.
  - `event: "llm_failed"` means `ANTHROPIC_API_KEY` is missing or invalid.
  - `event: "llm_timeout"` means the Anthropic call exceeded
    `PHOTON_AGENT_LLM_TIMEOUT_MS` (default 10s); the bot still
    sent the fixed-string ack via the fallback branch.
  - `event: "send_failed"` means `PHOTON_PROJECT_ID` / `PHOTON_API_KEY` is wrong, or the Spectrum send endpoint moved (override `PHOTON_SEND_PATH`).
  - `event: "agent_replied"` with `source: "fallback_no_llm"` means Anthropic credentials are bad and the fixed-string ack went out instead.

## Known limits

- Vercel function maxDuration is set to 15s. Haiku + Photon round trip
  is normally 2-4s; the LLM call itself is hard-capped at 10s
  (`PHOTON_AGENT_LLM_TIMEOUT_MS`), so a slow Anthropic still leaves
  ~5s for Photon send + Supabase writes.
- The 60s sender debounce means a burst of messages from the same
  thread produces one reply per minute, not one per message.
- Chat history is the last 5 completed turns by sender. Older
  context falls out of the window. Multi-thread context (e.g.
  separate iMessage and Telegram threads from the same person) is
  not merged today.
- Gmail / Calendar / other tool calls don't run over iMessage. Texting
  the bot to "draft an email" returns an LLM-generated reply that
  routes the user to `/chat` for the actual action. Tool routing
  over iMessage is on the roadmap.
