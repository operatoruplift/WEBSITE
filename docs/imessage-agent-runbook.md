# Photon Spectrum iMessage Agent Runbook

What you need to text the bot from iPhone iMessage and get a Claude
Haiku reply back. End-to-end smoke test in roughly five minutes.

## How the round trip works

1. You text the bot's iMessage number (the one set up in your Photon
   Spectrum dashboard).
2. Spectrum POSTs to `https://www.operatoruplift.com/api/webhooks/photon`.
3. The webhook verifies the optional signature, normalizes the payload,
   inserts an audit row in Supabase `inbound_messages` (best-effort), then
   awaits one round trip:
   - Claude Haiku 4.5 generates a short reply (max 200 tokens).
   - The Photon adapter POSTs that reply back to your number.
   - The audit row gets `processed_at` + `reply_message_id`.
4. Your phone shows the LLM reply, typically in 2-4 seconds.

The agent is `lib/photon/agent.ts::runAgentReply`. The webhook is
`app/api/webhooks/photon/route.ts`.

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

## One-time database setup

Run the migration once against your Supabase Postgres database:

```bash
psql "$DATABASE_URL" -f lib/photon-webhook-migration.sql
```

This creates `public.inbound_messages` with the unique idempotency
index and the unprocessed/sender lookup indexes used by the agent.

If the table is missing, the webhook still serves 200 and the agent
still runs, you just lose the audit log. The reply still goes out.

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

### 3. Real iPhone test

Text the bot's number from your iPhone with something like:
`What time is it in Tokyo?`

Within ~4 seconds you should see a Claude Haiku reply on iMessage.

If nothing comes back:
- Check Vercel Function logs for `at: "photon.agent"` events.
  - `event: "llm_failed"` means `ANTHROPIC_API_KEY` is missing or invalid.
  - `event: "send_failed"` means `PHOTON_PROJECT_ID` / `PHOTON_API_KEY` is wrong, or the Spectrum send endpoint moved (override `PHOTON_SEND_PATH`).
  - `event: "agent_replied"` with `source: "fallback_no_llm"` means Anthropic credentials are bad and the fixed-string ack went out instead.

## Known limits

- Vercel function maxDuration is set to 15s. Haiku + Photon round trip
  is normally 2-4s; if it ever exceeds 15s the request 500s and Spectrum
  retries (idempotency on the unique index makes that safe).
- The 60s sender debounce means a burst of messages from the same
  thread produces one reply per minute, not one per message.
- The agent has no chat history yet. Each message is treated as a fresh
  one-shot exchange. Threading is on the roadmap.
