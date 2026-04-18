# Reliability harness

Admin-only page at **`/dev/reliability`** that runs five scripted checks against the same internal tool-call routes `/chat` uses. The harness is for proving Real Mode is wired correctly — it is not a load test, it is not public, and it does not run parallel codepaths.

## Access

Gated by the same rule as `/api/whoami` and `/api/debug/subscription`:

- Signed in with an email on `PAYWALL_BYPASS_EMAILS` (comma-separated env), **or**
- Signed in with a user id on `PAYWALL_BYPASS_USER_IDS`.

Non-admins get a clean "Admin-only" notice. No server-side surface is exposed without the admin check — the page will not even load the check buttons.

`X-Debug-Key` curl access is not supported for the harness page (middleware requires a Privy token). The simulated-timeout endpoint can be curled directly with `X-Debug-Key` only when middleware is configured to pass `/api/dev/*` — by default it is not.

## What it checks

| # | Check | Route | Expected HTTP | Why |
|---|---|---|---|---|
| 1 | `calendar.list` | `POST /api/tools/calendar` `{action:'list'}` | 200 or 403 | Proves Google-connected users can read; 403 if not connected (also a pass — means the gate fires) |
| 2 | `calendar.free_slots` | `POST /api/tools/calendar` `{action:'free_slots'}` | 200 or 403 | Proves a second read path |
| 3 | `gmail.draft` | `POST /api/tools/gmail` `{action:'draft'}` | 402 or 403 | Proves the x402 gate fires on a priced write (402) or the google-connect gate fires (403). Either is correct trust behavior. |
| 4 | `calendar.create` | `POST /api/tools/calendar` `{action:'create'}` | 402 or 403 | Same as (3) for a different write |
| 5 | `provider.timeout` | `POST /api/dev/reliability/timeout` | 504 | Sleeps `delayMs` (default 6000) then 504 with a standard `{requestId, timestamp, message, nextAction, errorClass:'provider_unavailable'}` body. Proves the calm-copy error surface renders. |

Each row surfaces: pass/fail icon, HTTP status, next-action copy, and a per-check **Ref** button to copy the request ID.

## How to run

1. Sign in as an admin email (must be on `PAYWALL_BYPASS_EMAILS`). If you're not sure, visit `/api/whoami` — `bypass.session_email_on_allowlist` must be `true`.
2. Navigate to `https://www.operatoruplift.com/dev/reliability`.
3. Click **Run all checks**. Each check shows live status.
4. Green across all five = Real Mode tool surface is healthy end-to-end.

## Interpreting results

- **All 5 pass** — Real Mode is healthy. If a real user still hits a failure, they have a connection or x402 issue, not an infrastructure problem.
- **(1) fail** — calendar.list is broken. Check `/api/tools/calendar` logs for the requestId shown. Most likely Google OAuth row missing or invalid refresh token.
- **(3) or (4) returns anything other than 402 / 403** — x402 or google-connect gate behavior has changed. This is a trust-critical regression. Roll back the latest tool-route change.
- **(5) returns anything other than 504** — calm-copy error surface is broken. Check the `/api/dev/reliability/timeout` route is reachable and emits the standard envelope.
- **All 5 fail with 401** — your admin session has expired. Hit `/login` and re-run.

## What the harness will NOT catch

- Real Gmail/Calendar tool execution (requires signing a Phantom x402 invoice). The harness confirms the gate fires; it does not confirm the post-payment execution path. For that, run the actual user flow end-to-end.
- LLM provider health — covered by `GET /api/health/llm`.
- Receipt signing correctness — out of scope (don't touch receipts is a hard rule). Verify receipts via the Profile → Identity card.
- Supabase connectivity — surfaces indirectly as `provider_unavailable` on the subscription route.

## Observability

Every check on every route logs a single JSON line with: `at`, `event`, `ts`, `requestId`, `route`, `errorClass` (where applicable), and `jws` (header fields only — never the token). Tail them in Vercel logs filtered by the request ID the harness displays.
