# Photon iMessage transport runbook

What's deployed after PR #128:

- **`POST /api/webhooks/photon`** — inbound, signature-verified, idempotent by `message_id`.
- **`POST /api/photon/imessage/send`** — outbound, admin-gated, wraps `lib/photon/adapter.ts`.
- **`GET  /api/photon/imessage/replay`** — admin-gated read of last N rows.
- **`/dev/imessage`** — admin-gated harness page with Send + Replay buttons.
- **Tables `inbound_messages` + `outbound_messages`** — schema in `lib/photon/migration.sql`.

The agent pipeline is **not** wired yet (hard rule 4). This PR proves transport round-trips first; LLM involvement is the next PR.

## One-time setup

1. **Create the tables.** Copy `lib/photon/migration.sql` into the Supabase SQL editor. Rerun safely — every statement is `create … if not exists`.
2. **Set Vercel env** (redeploy after):

   | Env | Required for | Source |
   |---|---|---|
   | `PHOTON_PROJECT_ID` | outbound send | Spectrum → Settings → Project ID |
   | `PHOTON_API_KEY` | outbound send | Spectrum → Settings → Secret Key |
   | `PHOTON_WEBHOOK_SECRET` | inbound verification (prod) | Spectrum → Webhook → Signing Secret |
   | `PHOTON_API_BASE` | optional override | default `https://api.photon.codes` |
   | `PHOTON_SEND_PATH` | optional override | default `/v1/spectrum/messages` |

3. **Wire Spectrum.** In the Spectrum Webhook tab paste:
   ```
   https://www.operatoruplift.com/api/webhooks/photon
   ```
   Save. Spectrum may GET the URL first — our route answers `{ok:true, route:"photon_webhook"}`.

4. **Check it's live.**
   ```bash
   curl -s https://www.operatoruplift.com/api/webhooks/photon | jq .
   # { "ok": true, "route": "photon_webhook" }
   ```

## Acceptance test (happy path)

1. Text **"ping"** from your phone to the Photon-connected number.
2. Open `/dev/imessage` as an admin. Click **Refresh**.
3. A new **Inbound** row appears within a few seconds:
   - `platform: imessage`, `sender: …` (your number, last 4 shown), `text: "ping"`.
   - `message_id`, `thread_id` present if Spectrum provided them.
   - `request_id: req_…`
4. The form auto-fills `to` = your number and `threadId` = your thread.
5. Click **Send "pong"**. Within 5s you receive "pong" on your phone in the same thread.
6. The **Outbound** pane shows the new row with `status: sent` and a copyable `photon_message_id` + matching `request_id`.

### Idempotency check

Spectrum retries aggressively on 5xx. To prove we dedupe cleanly:

```bash
# Re-POST the exact same payload twice. Second call must return status:"duplicate".
BODY='{"type":"message","platform":"imessage","sender":"+15550100","message_id":"test-idem-001","text":"ping"}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$PHOTON_WEBHOOK_SECRET" | awk '{print $2}')
curl -s -X POST https://www.operatoruplift.com/api/webhooks/photon \
  -H "Content-Type: application/json" \
  -H "x-photon-signature: $SIG" \
  -d "$BODY" | jq '.status'        # -> "new"

curl -s -X POST https://www.operatoruplift.com/api/webhooks/photon \
  -H "Content-Type: application/json" \
  -H "x-photon-signature: $SIG" \
  -d "$BODY" | jq '.status'        # -> "duplicate"
```

Only one row should appear in `inbound_messages` for `message_id = 'test-idem-001'`.

## "Where to look when X doesn't work"

### Inbound works, outbound doesn't

Symptom: your phone's "ping" shows up on `/dev/imessage` Inbound pane, but the pong doesn't arrive.

| Check | Where | What it tells you |
|---|---|---|
| **Outbound row appeared?** | `/dev/imessage` → Outbound pane after clicking Send | If no row: the UI click never reached `/api/photon/imessage/send`. Check browser Network tab for a 403 (admin gate) or 500. |
| **Row has `status: 'not_configured'`** | Outbound pane | `PHOTON_PROJECT_ID` or `PHOTON_API_KEY` missing on Vercel. Set them and redeploy. |
| **Row has `status: 'failed'` + `failure_reason` starts with `provider_rejected`** | Outbound pane | Photon API returned non-2xx. The reason quotes the body. Common: recipient not a registered Spectrum user, phone not iMessage-capable, project not active. |
| **Row has `status: 'failed'` + `failure_reason` starts with `network_error`** | Outbound pane | `PHOTON_API_BASE` is wrong or the provider is down. Set `PHOTON_API_BASE` to the correct root if different. |
| **Row has `status: 'sent'` + `photon_message_id` but phone never gets it** | Outbound pane | Spectrum accepted the send but didn't deliver. Open the Spectrum dashboard → Messages/Logs, filter by your `photon_message_id`. Common: bot number not provisioned on iMessage, recipient blocked the number. |
| **Send endpoint returns `x_request_id` but the UI shows no error** | DevTools Network | Envelope came back 4xx/5xx but the harness swallowed it. Expand the Raw envelope disclosure on the send panel — `nextAction` says what to check. |

### Outbound works, inbound doesn't

Symptom: "Send pong" works, but texts from your phone never hit the webhook.

| Check | Where | What it tells you |
|---|---|---|
| **Webhook URL responds to GET** | `curl https://www.operatoruplift.com/api/webhooks/photon` | Must return `{ok:true, route:"photon_webhook"}`. If 404, wrong URL in Spectrum. If 500, the route crashed — check Vercel logs. |
| **Spectrum dashboard shows delivery attempts** | Spectrum → Webhook → Logs | If Spectrum never attempted delivery: the Spectrum → number mapping is wrong (your phone isn't texting a Spectrum-connected number). |
| **Attempts show 401 `invalid_signature`** | Spectrum Webhook Logs | `PHOTON_WEBHOOK_SECRET` on Vercel doesn't match the signing secret in Spectrum. Rotate and set them identically. |
| **Attempts show 200 but nothing in `inbound_messages`** | Spectrum Webhook Logs + `/dev/imessage` | Supabase tables likely missing. Run `lib/photon/migration.sql`. Until then, the route returns `{ok:true, logged:false, reason:"…"}` — check Vercel logs for the reason. |
| **Attempts show 200 + new row has blank `sender`/`text`** | Inbound row on `/dev/imessage` | Spectrum uses field names the `normalize()` helper doesn't know. Expand the `raw` column (view row in Supabase) — add the missing key to the `normalize()` switch in `app/api/webhooks/photon/route.ts` and ship a one-line PR. |

### Both work but the reply goes to the wrong thread

Symptom: pong arrives but as a new conversation, not in the same thread.

- Check the Inbound row's `thread_id` — is it present? If blank, Spectrum didn't send one; reply will be to the recipient, not the thread.
- Spectrum's iMessage adapter may ignore `thread_id` on outbound and group by recipient alone. Run the acceptance test twice from the same number — both pongs should appear in the same iMessage thread. If not, this is a Spectrum-level limitation, not ours.

## Observability fields (logged as JSON, no secrets)

Every inbound writes one line:
```
{ at:"photon.webhook", event:"received", requestId, ts, platform,
  eventType, senderLast4, threadId, messageId, textLen }
```

Every outbound writes:
```
{ at:"photon.imessage.send", event:"sent" | "send-failed" | "not-configured",
  requestId, ts, photonMessageId?, providerStatus?, detail? }
```

`senderLast4` never shows the full number. `detail` truncated to 240 chars. Tokens + raw bodies are **never** logged.

## What the next PR does

- Wires the agent pipeline: on `status:'new'` inbound rows, enqueue `generate_reply(threadId, sender, text)`.
- Agent result goes through the existing approval modal for consumers, or through an allowlist for admins.
- Fallback: on agent failure, send a single calm reply with the `requestId` — exactly like `/chat` failures today.

Nothing in that next PR requires re-wiring Spectrum. The webhook URL and send endpoint are stable.
