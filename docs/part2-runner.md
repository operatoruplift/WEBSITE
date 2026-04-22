# Part 2 Runner

Admin-only diagnostic at **`/settings/part2-runner`**. Replaces the hand-curled runbook with five human-clicked buttons that prove the Real-Mode happy path works on prod.

## Who sees it

Gated by the same rule as `/api/whoami` and `/dev/reliability`:

- Signed in with an email on `PAYWALL_BYPASS_EMAILS`, **or**
- Signed in with a userId on `PAYWALL_BYPASS_USER_IDS`.

Non-admins get a clean "Admin-only" notice — zero controls render.

## The five steps

Each step has a **single button** and a status chip (`pending` → `running` → `pass` / `fail`). No step fires without a click.

| # | What it checks | Route hit | Pass criteria |
|---|---|---|---|
| 1 | Signed in | `GET /api/capabilities` | `authenticated: true` |
| 2 | Google connected | `GET /api/capabilities` | `capability_google: true` |
| 3 | Subscription active | `GET /api/subscription` | `active: true, tier: 'pro'` |
| 4 | Gmail draft | `POST /api/tools/gmail` `{action:'draft'}` | HTTP 200 with `draft.draftId`; receipt present if `gate.type === 'paid'` |
| 5 | Calendar create | `POST /api/tools/calendar` `{action:'create'}` | HTTP 200 with `event.id`; receipt present if `gate.type === 'paid'` |

Steps 4 and 5 use `executeToolCall` from `lib/toolCalls.ts` — the **same function `/chat` uses**. Zero parallel codepath.

## What the runner is NOT

- **Not an auto-login.** Sign in at `/login` first; the runner only verifies the session.
- **Not a wallet auto-sign.** The $19/month USDC subscription (step 3) is paid through `/paywall` with Phantom. The runner only *checks* whether it landed.
- **Not a replacement for `/chat`.** It's diagnostic. `/chat` is the product.

## How to run

1. In an incognito window, visit `https://www.operatoruplift.com/`.
2. Sign in at `/login` with the admin Google account.
3. Navigate to `/settings/part2-runner`.
4. Click through steps 1 → 2 → 3 → 4 → 5 in order.
5. If step 3 fails (subscription not active), use the **Open paywall** link that appears, complete the $19 USDC payment, then come back and re-click **Check subscription**.
6. Steps 4 and 5 cost **$0.01 USDC each** (x402, server-settled on Solana devnet). A `Ref: req_…` shows for every attempt, pass or fail, with a Copy button.

## Reading the result panel

Each successful step shows:

```
gmail.draft — executed
Ref: req_…   [Copy]

▸ Raw envelope (click to expand)
  { "action": "draft", "draft": { "draftId": "r123…" }, "receipt": { ... } }
```

Each failed step shows:

```
gmail.draft — failed
<calm copy> <nextAction>
Ref: req_…   [Copy]

▸ Raw envelope
  { "errorClass": "reauth_required", "message": "…", "nextAction": "…", "requestId": "req_…" }
```

Copy the `Ref` and paste into a support ticket or into `/settings → Diagnostics`.

## Recent senders (step 4)

The **Load recent senders** button calls `/api/tools/gmail` with `{action:'list'}` — an x402-free read that returns message metadata. The runner extracts only the `from` field, dedupes, and shows up to 10 unique email addresses as clickable chips. **Subjects, snippets, bodies are never rendered.** If you'd rather type the recipient, the text box accepts any valid email.

## Trust invariants the runner respects

- **Nothing runs without a click.** Every button is human-gated.
- **No step creates a side effect on your behalf beyond what the button label promises.** The Gmail draft button creates a draft; it does not send. The calendar button creates an event on the date/time you selected.
- **Every tool call goes through the same route `/chat` uses.** Fixing the runner never changes chat behavior, and vice versa.
- **x402 + receipt semantics are unchanged.** The x402 gate still fires on steps 4 and 5. Receipts are still signed by `lib/receipts.ts` ed25519.
- **Admin gate is server-side at `/api/whoami`.** Defeating the client check (devtools) does not grant access to admin-only routes.

## What will NOT pass and why

- **Step 3 fails before payment** → expected. Complete `/paywall` first.
- **Step 4 fails with `reauth_required: google_not_connected`** → Google isn't connected for this account. Step 2 would have also failed.
- **Step 4 fails with `provider_unavailable: devnet_submit_failed`** → the x402 server wallet is underfunded on devnet. Ops: airdrop SOL to the wallet; `details.opsHint` in the raw envelope has the command.
- **Step 5 fails with `input_invalid`** → the date/time form produced an invalid ISO range. Reset the form and retry.

## What to do when something fails

1. Copy the `Ref: req_…` with the button in the result panel.
2. Note the HTTP status and `errorClass` from the raw envelope.
3. Grep Vercel logs for the `requestId` — every route logs one structured JSON line per attempt + one per failure.
4. If the failure is trust-critical (receipt missing for a successful write, event created without approval, payload mutated post-approval), **stop** and roll the offending PR back.
5. Otherwise, paste the scratchpad into the PR #124 follow-up thread; the next PR is scoped to just that one surface.
