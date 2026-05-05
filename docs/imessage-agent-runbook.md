# Photon Spectrum iMessage Agent Runbook

What you need to text the bot from iPhone iMessage and get a Claude
Haiku reply back. End-to-end smoke test in roughly five minutes.

## How the round trip works

1. You text the bot's iMessage number (the one set up in your Photon
   Spectrum dashboard).
2. Spectrum POSTs to `https://www.operatoruplift.com/api/webhooks/photon`.
3. The webhook verifies the HMAC signature, normalizes the payload,
   inserts an audit row in Supabase `inbound_messages`, then runs:
   - **Opt-out gate.** If the sender previously sent STOP, the
     webhook logs the row and returns 200 without replying. A START
     keyword from the same sender clears the flag.
   - **Keyword short-circuit.** STOP, HELP, PING, STATUS map to
     canned replies that skip the LLM entirely.
   - **Agent reply.** Otherwise, the agent loads up to 5 prior
     turns (`text` + `reply_text`) for the sender, hands them as
     multi-turn context to Claude Haiku 4.5 (max 200 tokens), strips
     any markdown the model emits, and sends the reply back via
     the Photon adapter.
   - The audit row gets `processed_at`, `reply_message_id`, and
     `reply_text` so `/dev/photon` can show the round trip.
4. Your phone shows the reply, typically in 2-4 seconds.

The agent is `lib/photon/agent.ts::runAgentReply`. The webhook is
`app/api/webhooks/photon/route.ts`. Helpers live under `lib/photon/`:

- `agent.ts`, generates the LLM reply with timeout + markdown strip.
- `keyword-replies.ts`, STOP / HELP / PING / STATUS canned replies.
- `opt-outs.ts`, persisted opt-out flag (Supabase-backed).
- `history.ts`, multi-turn conversation loader.
- `strip-markdown.ts`, sanitizes Claude output before iMessage send.
- `webhook-helpers.ts`, signature verification + payload normalization.

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

Two idempotent migrations to apply against your Supabase Postgres
database. Both use `CREATE TABLE IF NOT EXISTS` and `ADD COLUMN IF
NOT EXISTS` so re-running them is safe.

```bash
psql "$DATABASE_URL" -f lib/photon-webhook-migration.sql
psql "$DATABASE_URL" -f lib/photon-optouts-migration.sql
```

`photon-webhook-migration.sql` creates `public.inbound_messages`
with the unique idempotency index, the unprocessed/sender lookup
indexes, and the `reply_text` column the chat-history loader reads.

`photon-optouts-migration.sql` creates `public.imessage_opt_outs`
keyed by sender, with a partial index on active opt-outs.

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
