# Operator Uplift — Calendar Agent

## Role
OAuth tool node for Google Calendar + Gmail. Exposes `calendar.list`, `calendar.free_slots`, `calendar.create`, `gmail.list`, `gmail.draft`, `gmail.send`. Holds no UI — only the webhook interface and token storage.

## Must not touch
- Chat UI, ApprovalModal, landing copy — that's `website/bucharest` and `repos/UI`.
- x402 payment gate — that's `x402-agent/biarritz`. Calendar calls the gate; it doesn't implement it.
- Python runtime — that's `core/guangzhou`.

## May 14 priorities (in order)
1. `/tool/calendar` + `/tool/gmail` handlers must refuse every request where the caller has no Google refresh token. Never produce a partial execution.
2. Return shapes must match what `website/bucharest/lib/toolCalls.ts:formatToolResult` expects (event list, draftId, messageId).
3. Rate-limit per user (Google's own quota is easy to hit on demo day).
4. Token refresh is silent and idempotent — multiple concurrent calls during the demo must not 401.

## Verification
- `npm test` or `pytest tests/` (whichever this repo uses).
- Smoke: call `calendar.list` with a seeded refresh token → returns events.
- Smoke: call `gmail.draft` → returns draftId that renders in Gmail web UI.

## Current state snapshot
- Shipped: Google OAuth callback, refresh-token storage in `user_integrations`, Calendar + Gmail handlers.
- In-flight: better error codes for the UI's `humanizeToolError` map.
- Deferred post-May-15: Drive + Contacts scopes.
