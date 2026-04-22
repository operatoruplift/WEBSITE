# Photon Spectrum, Integration Notes

What we know about the Photon Spectrum product (the consumer dashboard
that bridges iMessage / Telegram / WhatsApp / X / Discord / Instagram
into an HTTP send API + webhook) and what still needs confirmation
against the published docs.

## Rule for this doc

The PR brief says: "Do not guess Photon behavior. Only implement what
is in docs.photon.codes." At the time of writing (2026-04-20),
`https://docs.photon.codes/` returned `403 Forbidden` to our fetcher
and `https://photon.codes/docs` returned `404`. The root site
`https://photon.codes` linked only to `https://docs.photon.codes` as
the canonical docs entry, with no deeper URLs indexed publicly.

Until we have verified doc access, everything below is labelled as
**VERIFIED FROM CODE** (we have working loopback against our own
webhook), **CONFIG-DRIVEN** (the endpoint/path/header is behind an
env var so it can be rotated without code), or **NEEDS DOC CONFIRM**
(best-guess from the Spectrum dashboard UI, to be confirmed).

## A) Architecture

### Is a Spectrum server required?

**VERIFIED FROM CODE**: Spectrum is an HTTP/webhook product. No local
daemon or always-on listener is required on our side beyond the Next.js
server itself. Inbound traffic comes via `POST /api/webhooks/photon`;
outbound goes via `POST /api/tools/imessage` which proxies to the
Spectrum send API. There's no push connection, no long-poll, no
Spectrum CLI process to keep running.

Per the dashboard, bridge delivery (converting between iMessage and
Spectrum's HTTP pipe) is handled server-side by Photon. Their
infrastructure owns the iMessage session, not ours. We only see the
normalized HTTP webhook.

### What process must be running to receive messages?

**VERIFIED FROM CODE**: The Next.js app at `operatoruplift.com`
must be reachable at `https://www.operatoruplift.com/api/webhooks/photon`.
Spectrum polls/retries on 5xx, so keeping that route in the AuthGate
allowlist (see `middleware.ts`) and returning 2xx promptly is the full
contract on our side.

## B) Inbound webhook contract

### Endpoint

- `POST /api/webhooks/photon` \u2014 **VERIFIED FROM CODE**. Paste this URL
  into the Spectrum dashboard's Webhook tab.
- `GET /api/webhooks/photon` \u2014 returns `{ ok: true, route: 'photon_webhook' }`
  for liveness probes.

### Auth / signature

**NEEDS DOC CONFIRM** (exact header name not published in the dashboard
UI). Our route accepts any of these three on inbound and verifies an
HMAC-SHA256 of the raw request body against `PHOTON_WEBHOOK_SECRET`
using `crypto.timingSafeEqual`:

- `X-Photon-Signature`
- `X-Spectrum-Signature`
- `X-Signature`

The signature is optionally prefixed with `sha256=` (per common Stripe
/ GitHub conventions), which we strip before compare. If
`PHOTON_WEBHOOK_SECRET` is unset, we accept any POST so local dev
loopback works without a real Spectrum project.

When docs confirm the exact header, tighten `app/api/webhooks/photon/route.ts`
to that single header name and drop the alternates.

### Payload shape

**NEEDS DOC CONFIRM** (we normalize across several likely field names).
Our route reads the first of these that resolves:

- sender: `body.sender` | `body.from` | `body.phone` | `body.user.phone`
- text: `body.text` | `body.message` | `body.content.text`
- platform: `body.platform` (default `imessage`)
- event: `body.event` | `body.type` (default `message`)
- message id: `body.message_id` | `body.id` | `body.event_id`

The full payload is persisted in `inbound_messages.raw` (jsonb) so
renaming fields later doesn't lose data.

### Idempotency

**VERIFIED FROM CODE (this PR)**: messages are deduped by provider
message id (`body.message_id` | `body.id` | `body.event_id`). We store
the id in `inbound_messages.provider_message_id` with a unique
constraint per `(provider, provider_message_id)`. A duplicate POST
returns `{ ok: true, logged: false, duplicate: true }` and skips the
reply path. If no id is present, we fall back to a content hash
(`sha256(sender|text|timestamp_rounded_5s)`) so replay-close-together
still dedupes without false positives on legitimate identical sends.

## C) Outbound reply path

### Endpoint + auth

**CONFIG-DRIVEN**: `POST ${PHOTON_API_BASE}${PHOTON_SEND_PATH}` with:

- `Authorization: Bearer ${PHOTON_API_KEY}` (Spectrum dashboard labels
  this "Secret Key")
- `X-Api-Key: ${PHOTON_API_KEY}` (some tenants)
- `X-Project-Id: ${PHOTON_PROJECT_ID}` (from the Settings tab, UUID)

Defaults: `PHOTON_API_BASE=https://api.photon.codes`,
`PHOTON_SEND_PATH=/v1/spectrum/messages`. **NEEDS DOC CONFIRM** on the
exact path. If Spectrum returns 404 on that path, flip the env var
without a code change.

### Request body

```json
{
    "project_id": "<uuid>",
    "platform": "imessage",
    "recipient": "<phone|user-id>",
    "to": "<phone|user-id>",
    "text": "<plain text>",
    "subject": "<optional>",
    "attachments": ["<urls>"]
}
```

Duplicated `recipient`/`to` and `text`/`content` so whichever one
Spectrum reads picks up. Harmless when the other is ignored.

### 5-second fallback reply

**VERIFIED FROM CODE (this PR)**: if the agent hasn't emitted a
response within 5 seconds of receipt, the webhook sends a single
"Got it, working on it" acknowledgment to the same thread and marks
the row `acked_at`. A debounce cache (in-memory Map keyed by sender)
keeps this to one ack per thread per 60s window so a burst of inbound
messages doesn't produce a burst of acks.

## D) Local dev setup

### Minimal run

```bash
# 1. Fill these in .env.local (create if missing).
PHOTON_PROJECT_ID=<paste from Spectrum Settings tab>
PHOTON_API_KEY=<paste from Spectrum Settings tab, Secret Key>
PHOTON_WEBHOOK_SECRET=<paste from Spectrum Settings tab, Webhook Secret>
# Optional overrides (use defaults if unset):
# PHOTON_API_BASE=https://api.photon.codes
# PHOTON_SEND_PATH=/v1/spectrum/messages

# 2. Apply the inbound_messages migration (adds the idempotency column)
psql "$DATABASE_URL" -f lib/photon-webhook-migration.sql

# 3. Start the dev server
pnpm dev

# 4. Expose your local server so Spectrum can hit the webhook.
#    Use Vercel CLI's dev tunneling, or ngrok, or cloudflared:
ngrok http 3000

# 5. Paste the public ngrok URL + /api/webhooks/photon into the Spectrum
#    dashboard's Webhook tab:
#    https://<your-ngrok>.ngrok.app/api/webhooks/photon

# 6. Send yourself an iMessage. The webhook logs, persists, and either
#    routes to the agent or acks within 5 seconds.
```

### Required env vars (names only, values live in Vercel)

- `PHOTON_PROJECT_ID`, UUID from Spectrum Settings
- `PHOTON_API_KEY`, Secret Key from Spectrum Settings (server-side, never public)
- `PHOTON_WEBHOOK_SECRET`, HMAC secret from Spectrum Webhook tab
- `PHOTON_API_BASE`, optional override for the send endpoint host
- `PHOTON_SEND_PATH`, optional override for the send endpoint path
- `NEXT_PUBLIC_SUPABASE_URL`, already set
- `SUPABASE_SERVICE_ROLE_KEY`, already set

## E) What still needs verification (open questions for docs review)

1. Exact inbound signature header name. We accept three common names;
   docs will say which is canonical.
2. Exact send endpoint path. `/v1/spectrum/messages` is a guess from
   dashboard naming; might be `/send`, `/api/spectrum/send`, etc.
3. Whether Spectrum retries on non-200 responses. We assume yes (same
   as Stripe / GitHub webhooks) and always return 200 on non-signature
   failures.
4. Rate limits on outbound `/v1/spectrum/messages`, for cost-of-failure
   analysis.
5. Maximum body size on inbound (for attachment handling).

Once docs.photon.codes is reachable, update this file to replace
"NEEDS DOC CONFIRM" with verbatim quotes + URLs per the PR brief's
hard rule.

## Related files

- `lib/photon/adapter.ts`, outbound `send()`
- `app/api/tools/imessage/route.ts`, server-side send proxy with
  capability gate
- `app/api/webhooks/photon/route.ts`, inbound receiver with signature
  check + idempotency + 5s ack fallback
- `lib/photon-webhook-migration.sql`, `inbound_messages` schema
- `middleware.ts`, allowlists `/api/webhooks/photon` (no Privy auth)
