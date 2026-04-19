# Prod env checklist — Vercel

Follow this in `Vercel → Project → Settings → Environment Variables` (scope: **Production**). Do not paste secret values into chat; confirm presence/absence only. Every env below is already referenced by the current code on master — this doc is not a spec, it is a ground-truth audit.

## How to use

1. Open Vercel Settings → Environment Variables.
2. Walk the three columns below, top to bottom, confirming each entry is set.
3. Redeploy if you add/change anything (`Deployments → redeploy latest`).
4. Run the 10-minute smoke plan at the bottom.

## Legend

- **REQUIRED NOW** — Real Mode breaks without it today.
- **REQUIRED LATER** — Not load-bearing yet but wired; set to unblock a specific feature.
- **DEV ONLY** — Keep unset on production.

---

## Column 1 — Required for Real Mode (agent execution)

| Env | Label | Used in | Breaks if missing | Safe default |
|---|---|---|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | **REQUIRED NOW** | `lib/auth.ts::getPrivyClient`; `src/components/providers/PrivyWrapper.tsx` | Middleware + `verifySession()` can't verify any token. Every authed route 401s. | none — must set |
| `PRIVY_APP_SECRET` | **REQUIRED NOW** | `lib/auth.ts::getPrivyClient` | Same as above. `/api/subscription`, `/api/tools/*`, `/api/whoami` all 401. | none — must set |
| `NEXT_PUBLIC_SUPABASE_URL` | **REQUIRED NOW** | `lib/subscription.ts`, `lib/capabilities.ts::hasGoogleIntegration`, `/api/receipts`, `/api/tools/gmail`, `/api/tools/calendar` | `capability_google` always false → Real Mode never unlocks. Subscription check returns `no_backend` → paywall bypass side effect. | none — must set |
| `SUPABASE_SERVICE_ROLE_KEY` | **REQUIRED NOW** | same | Same as above. Also blocks receipt writes. | none — must set |
| `ANTHROPIC_API_KEY` | **REQUIRED NOW** (at least one of the 5) | `lib/llm.ts::callLLM`, `lib/llmHealth.ts::probeAllProviders`, `lib/capabilities.ts::hasServerLLMKey` | If NO LLM provider key is set, `capability_key` stays false, Real Mode never unlocks, `/api/chat` returns `ProviderError` envelope. | none — set at least one |
| `OPENAI_API_KEY` | **REQUIRED NOW** (alt) | same | same | — |
| `GOOGLE_AI_API_KEY` | **REQUIRED NOW** (alt) | same | same | — |
| `XAI_API_KEY` | **REQUIRED NOW** (alt) | same | same | — |
| `DEEPSEEK_API_KEY` | **REQUIRED NOW** (alt) | same | same | — |
| `GOOGLE_OAUTH_CLIENT_ID` | **REQUIRED NOW** | `lib/google/oauth.ts`, `/api/integrations/google/connect`, `/api/integrations/google/callback` | Google Connect flow never completes. `capability_google` stays false. Gmail + Calendar tools return 403 `reauth_required`. | none — must set |
| `GOOGLE_OAUTH_CLIENT_SECRET` | **REQUIRED NOW** | same | same | none — must set |
| `GOOGLE_OAUTH_STATE_SECRET` | **REQUIRED NOW** | `lib/google/oauth-state.ts` | Google OAuth callback validation fails; connect flow loops. | none — must set |
| `GOOGLE_OAUTH_REDIRECT_URI` | **REQUIRED NOW** (if non-default) | `lib/google/oauth.ts` | Must match the "Authorized redirect URI" in Google Cloud Console. Mismatch = `redirect_uri_mismatch` error. | Use prod URL: `https://www.operatoruplift.com/api/integrations/google/callback` |

**Confirm via:** `GET /api/health/llm` returns `{ok:true, upCount ≥ 1}` → LLM keys fine. `/settings → Diagnostics` (signed-in) shows `Google: Connected` after a successful Connect flow → Google OAuth triplet fine.

## Column 2 — Required for Payments ($19 subscription + $0.01 per write)

| Env | Label | Used in | Breaks if missing | Safe default |
|---|---|---|---|---|
| `NEXT_PUBLIC_TREASURY_WALLET` | **REQUIRED NOW** | `/api/subscription` (invoice creation), `/api/tools/x402/pay::submitTransfer` | Subscription invoice falls back to a literal `UpL1ft111…` placeholder address — **no payment will ever clear**. | Set to the funded treasury public key (base58). |
| `SOLANA_DEPLOY_WALLET_KEY` | **REQUIRED NOW** | `/api/tools/x402/pay::submitTransfer` | x402 server settlement fails with 503 `errorClass: provider_unavailable` → tool writes can't complete for subscribed users. | JSON array of 64 bytes (`solana-keygen` output). **Secret** — never commit. |
| `SOLANA_DEVNET_RPC` | **REQUIRED LATER** | same | Falls back to public `api.devnet.solana.com` (rate-limited). Acceptable for beta; set a paid RPC when traffic grows. | leave unset → default `https://api.devnet.solana.com` |
| `RECEIPT_SIGNING_PRIVATE_KEY` | **REQUIRED NOW** | `lib/receipts.ts` | Writes succeed but no receipt is produced. **Trust-critical**: violates the "every real write produces a signed receipt" contract. | ed25519 private key (32-byte hex or base64, check `lib/receipts.ts`). **Secret**. |
| `PAYWALL_BYPASS_EMAILS` | **REQUIRED NOW** (admin-only) | `lib/subscription.ts::bypassEmails`, `/api/whoami`, `/api/debug/subscription`, `/dev/reliability`, `/settings/part2-runner` | Without your admin email listed, you can't access `/dev/reliability` or `/settings/part2-runner`, and hit the paywall like a regular user. | Comma-separated lowercase emails — e.g. `operatoruplift@gmail.com` |
| `PAYWALL_BYPASS_USER_IDS` | **REQUIRED LATER** | same | Optional — userId-based bypass is stable across email changes. | Comma-separated Privy DIDs. |
| `NEXT_PUBLIC_PAYWALL_BYPASS` | **DEV ONLY** | `lib/subscription.ts::isBypassAllEnabled` | If `1` in prod, **everyone** bypasses the paywall → no revenue collected. | **Unset** on prod. Set to `1` only on staging. |

**Confirm via:** `/settings/part2-runner` step 3 passes with your bypass email (clickthrough) OR a real Phantom payment clears + `GET /api/subscription` returns `active:true`.

## Column 3 — Optional / Dev

| Env | Label | Used in | Notes |
|---|---|---|---|
| `OLLAMA_HOST` | **DEV ONLY** | `lib/llm.ts` (llama/mistral routing), `lib/llmHealth.ts` | Vercel serverless has no local Ollama; leave unset in prod. |
| `DEBUG_ADMIN_KEY` | **REQUIRED LATER** (optional) | `/api/whoami`, `/api/debug/subscription`, `/api/debug/solana-wallet`, `/api/dev/reliability/timeout` | Alternate admin gate via `X-Debug-Key` header — only needed for curl-only ops without a browser session. |
| `NEXT_PUBLIC_MAGICBLOCK_ENABLED` | **REQUIRED LATER** (optional) | `lib/magicblock/adapter.ts`, `/api/tools/x402/pay` | Flag-gated off. Set to `1` + provide the MagicBlock RPC URL when the ephemeral rollup path is ready. |
| `MAGICBLOCK_RPC_URL` | **REQUIRED LATER** (optional) | same | Only read when `NEXT_PUBLIC_MAGICBLOCK_ENABLED=1`. |
| `NEXT_PUBLIC_PAYMENT_SIMULATOR` | **DEV ONLY** | `app/(auth)/paywall/page.tsx`, `/api/subscription` dev_simulate | Exposes the "Dev Simulator — Skip Payment" button. **Unset on prod** (would let anyone comp themselves Pro). |
| `PAYMENT_SIMULATOR_ENABLED` | **DEV ONLY** | `/api/subscription` (POST dev_simulate in production) | Same class as above. Unset on prod. |
| `SNS_EXPECTED_OWNER` | **REQUIRED LATER** (optional) | `lib/sns.ts` | Controls whether `operatoruplift.sol` renders with a "Verified" badge on `/profile`. Cosmetic. |
| `ANTHROPIC_MODEL` / `OPENAI_MODEL` / ... | **DEV ONLY** | ad-hoc overrides | Use `mapModelId` defaults unless you have a reason. |
| `CRON_SECRET` (if cron hooks use header auth) | **REQUIRED LATER** | `/api/cron/*` | Set if you move cron off Vercel Cron's built-in auth. |

---

## 10-minute prod smoke plan (after envs are set)

Run sequentially. Stop at the first ❌; the env most likely missing is listed per step.

### Minute 0–1 — server-side health

```bash
curl -s https://www.operatoruplift.com/api/health/llm \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print('ok=', d['ok'],'up=', d['upCount'],'/',d['configuredCount'])"
```

**Pass:** `ok= True up= ≥1`.
**Fail →** At least one of `ANTHROPIC_API_KEY / OPENAI_API_KEY / GOOGLE_AI_API_KEY / XAI_API_KEY / DEEPSEEK_API_KEY` is missing or invalid on Vercel.

### Minute 1–3 — login

1. Incognito → `https://www.operatoruplift.com/` → CTA → lands at `/chat` OR `/login?returnTo=/chat`.
2. Sign in with Google as `operatoruplift@gmail.com`.
3. Hard refresh twice. You stay signed in.

**Fail ("Invalid Compact JWS" or kicked to /login):**
- `NEXT_PUBLIC_PRIVY_APP_ID` or `PRIVY_APP_SECRET` missing/invalid.
- Or a cookie/domain issue (`www` vs apex). Vercel's default preview domain is `www`; confirm Privy allowed origins includes `https://www.operatoruplift.com`.

### Minute 3–4 — Google connect

1. Navigate to `/integrations` (or the Connect Google entry wherever it lives).
2. Click Connect → Google consent → back to app.
3. Open `/settings → Diagnostics`. Expect: **Google: Connected**.

**Fail:**
- `Google: Not connected` after consent → one of `GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_STATE_SECRET` missing.
- `redirect_uri_mismatch` → `GOOGLE_OAUTH_REDIRECT_URI` doesn't match Google Cloud Console's authorized URI, or the Google Console hasn't been updated to include the prod URL.

### Minute 4–7 — paywall (real $19)

1. Visit `/paywall`. Clarifier line "Unlocks **Real Mode**..." visible under `$19/month`.
2. Click **Pay $19 USDC**.
3. Scan the Solana Pay URL or copy the recipient address into Phantom.
4. Pay. Poll flips to `active` within ~30s.
5. Redirects to `/chat?subscribed=1`, toast "Subscription active. Real Mode ready." fires, URL strips the param.

**Fail:**
- Polling never flips → `NEXT_PUBLIC_TREASURY_WALLET` is still the placeholder `UpL1ft111…` OR Supabase row isn't being written. Check `SUPABASE_SERVICE_ROLE_KEY`.
- Invoice creation 401 → Privy JWS issue (see Minute 1–3).

### Minute 7–9 — tool writes (via `/settings/part2-runner` or `/chat`)

**Via the runner (recommended):**
1. `/settings/part2-runner` → step 4 → load recent senders → pick one → create draft ($0.01).
2. Step 5 → fill title/time → create event ($0.01).

**Pass:** both steps show green pill + Ref + raw envelope with `receipt` object.
**Fail with `provider_unavailable` on step 4 or 5 x402:**
- `SOLANA_DEPLOY_WALLET_KEY` missing or the server wallet is underfunded on devnet.
- Look at the raw envelope's `details.opsHint` — it tells you the exact command (`solana airdrop 2 <pubkey> --url devnet`).

**Fail with `reauth_required: google_not_connected`:** Google connect didn't stick — go back to Minute 3–4.

### Minute 9–10 — receipts

1. In the Part 2 runner, the Recent receipts panel auto-refreshes after each success.
2. Confirm: 2 receipts listed, both with non-empty `signature` + `payload_hash` prefixes.

**Fail (writes succeeded but receipts panel empty):**
- `RECEIPT_SIGNING_PRIVATE_KEY` missing → writes completed but signer short-circuited. **Stop immediately** — this is a trust-contract violation.

---

## Critical DO-NOT-SET for prod

- `NEXT_PUBLIC_PAYWALL_BYPASS` — never `1` in production. Disables revenue globally.
- `NEXT_PUBLIC_PAYMENT_SIMULATOR` / `PAYMENT_SIMULATOR_ENABLED` — never in production. Let anyone comp themselves Pro.
- `OLLAMA_HOST` — Vercel can't reach localhost; wastes a startup probe.

## One-command presence audit (Vercel CLI)

If you have the Vercel CLI authed on this project:

```bash
vercel env ls production | awk 'NR>1 {print $1}' | sort > /tmp/present.txt
cat <<EOF | sort > /tmp/required.txt
NEXT_PUBLIC_PRIVY_APP_ID
PRIVY_APP_SECRET
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
GOOGLE_OAUTH_STATE_SECRET
GOOGLE_OAUTH_REDIRECT_URI
NEXT_PUBLIC_TREASURY_WALLET
SOLANA_DEPLOY_WALLET_KEY
RECEIPT_SIGNING_PRIVATE_KEY
PAYWALL_BYPASS_EMAILS
EOF
echo "=== Missing in Production ==="
comm -23 /tmp/required.txt /tmp/present.txt
```

Any line printed under "Missing in Production" is a REQUIRED NOW env that needs to be set before the 10-minute smoke plan can pass.
