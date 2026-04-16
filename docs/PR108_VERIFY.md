# Verify PR #108 on production

**5-minute manual verification.** Run these in order. If any step
fails, the doc tells you exactly which file to instrument.

**Prereqs**:
- Logged into Privy Google on operatoruplift.com (same browser, no
  incognito)
- Browser devtools open (Network tab + Application tab)

---

## Step 1 — Privy login

1. Open `https://operatoruplift.com/login`
2. Click **Continue with Google** → pick your account
3. You should land on `/chat`

**Check in devtools → Application → Local Storage → `operatoruplift.com`**:
- `token` should be a string that looks like `eyJ...` (three dot-separated base64url segments), NOT `privy-session`.
- `user` should contain `{email, id: "did:privy:..."}`.

If `token` is `privy-session` → `PrivyTokenSync` didn't run. File to check: `src/components/providers/PrivyTokenSync.tsx`. Open a tiny PR that forces `getAccessToken()` on `authenticated=true` in `(auth)/login/page.tsx` line ~49.

---

## Step 2 — `/api/whoami` shape + claims

Grab your token from localStorage (devtools → Application → Local Storage → `token`).

```bash
TOKEN='<paste-token-here>'
ADMIN_KEY='<your-DEBUG_ADMIN_KEY>'

curl "https://operatoruplift.com/api/whoami" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Debug-Key: $ADMIN_KEY" | jq
```

**Expected**:
```json
{
  "privy_user_id": "did:privy:...",
  "session_email": "you@gmail.com",
  "auth_error": null,
  "jws_diagnostic": {
    "shape_ok": true,
    "length": 800+,
    "segments": 3,
    "header_alg": "ES256",
    "payload_aud": "<privy-app-id>",
    "payload_iss": "privy.io",
    ...
  },
  "bypass": {
    "session_email_on_allowlist": true,
    "user_id_on_allowlist": false
  },
  "used_identifier": "email",
  "subscription": { "tier": "pro", "active": true, "source": "bypass_email" }
}
```

**FAIL modes**:
- `jws_diagnostic.shape_ok: false` → token is wrong shape. Re-login. If still wrong, PrivyTokenSync is broken.
- `auth_error: "token_expired"` → token expired. PrivyTokenSync should auto-refresh every 10 min; if it doesn't, re-login.
- `session_email_on_allowlist: false` when it should be true → case sensitivity. `PAYWALL_BYPASS_EMAILS` is lowercased server-side; make sure your env value matches.

---

## Step 3 — Google Connect cookie bridge

1. Go to `/integrations`
2. **Open devtools → Application → Cookies → `operatoruplift.com`** and keep it open
3. Click **Connect** on Google Calendar (or Gmail)
4. **Before** the page redirects, you should see a `privy-token` cookie appear for ≤5 minutes (`Max-Age=300`, `SameSite=Lax`, `Secure`)
5. You should be redirected to `accounts.google.com/o/oauth2/v2/auth?...` (NOT a 401 page)
6. Consent on Google
7. You return to `/integrations?google=connected`

**Check**:
- The `privy-token` cookie should be **gone after callback** (we clear it in the `useEffect`)
- A success toast: "Google Calendar + Gmail connected!"

**FAIL modes**:
- Still see `/integrations?error=not_authenticated` → cookie isn't being sent. Check browser is sending cookies on top-level nav (usually fine). Add a tiny log in `app/api/integrations/google/connect/route.ts` before `verifySession`:
  ```ts
  console.log('[connect] cookie header:', request.headers.get('cookie')?.slice(0, 80));
  ```
  Ship that as a 1-line PR, reproduce, then remove.
- Redirected to `/integrations?error=invalid_state` → state expired (>10 min) or user clicked Connect twice. Normal. Click Connect again.

---

## Step 4 — Supabase token storage

```bash
# Using supabase CLI or SQL editor:
SELECT user_id, provider, created_at, updated_at
FROM user_integrations
WHERE user_id = 'did:privy:YOUR_ID'
  AND provider = 'google';
```

**Expected**: exactly 1 row with `provider = 'google'` and `updated_at` close to now.

**FAIL mode**: no row → `exchangeCode()` threw before the upsert. Check Vercel logs for `[google-callback]`.

---

## Step 5 — End-to-end paid tool call

1. Go to `/chat`
2. Type: **"Schedule a 30-minute coffee chat with me tomorrow at 3 PM called 'Loops House demo'"**
3. Approve the tool modal. You should see:
   - Cost badge: `$0.01 USDC · solana-devnet`
   - Click **Pay & Allow Once**
4. **Network tab**:
   - `POST /api/tools/calendar` → **402** with `invoice_reference: inv_cal_...`
   - `POST /api/tools/x402/pay` → **200** with `tx_signature: devnet_sim_...`
   - `POST /api/tools/calendar` (retry) with header `X-Payment-Proof: inv_cal_...` → **200** with `{event, receipt}`
5. Event should be created on your real Google Calendar
6. Go to `/security`. Under **Signed Receipts** you should see the new entry. Click **Copy JSON**.

**Expected receipt shape**:
```json
{
  "receipt": {
    "receipt_reference": "rcpt_cal_...",
    "timestamp": "2026-04-16T...",
    "user_id": "did:privy:...",
    "agent_id": null,
    "tool": "calendar",
    "action": "create",
    "params_hash": "<sha256 hex>",
    "result_hash": "<sha256 hex>",
    "invoice_reference": "inv_cal_...",
    "amount_usdc": 0.01,
    "chain": "solana-devnet",
    "payment_tx": "devnet_sim_..."
  },
  "signature": "<base64 ed25519>",
  "public_key": "<base64 raw 32-byte>"
}
```

**FAIL modes**:
- First POST doesn't 402 → `x402Gate()` is failing. Check `lib/x402/middleware.ts` import in `app/api/tools/calendar/route.ts`.
- 402 but pay fails → check `tool_invoices` table exists (run `lib/hackathon-gate2-migration.sql`).
- Retry succeeds but no receipt → `tool_receipts` table missing, or `RECEIPT_SIGNING_*` env vars malformed. Fallback is auto-generation — see server logs for `[receipts] auto-generated...`.

---

## If any step fails

Open a 1-line PR that adds a structured log at the failure point, push, observe on Vercel, fix, remove the log. Example template:

```diff
+ console.log('[oauth-connect] entering verifySession, cookie head:',
+   request.headers.get('cookie')?.slice(0, 50));
  const verified = await verifySession(request);
```

Never log the full token or full cookie value — only first 50 chars.
