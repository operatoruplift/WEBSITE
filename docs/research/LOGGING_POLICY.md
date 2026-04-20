# Logging policy

Operator Uplift's logging contract: **every log line should be shareable with support unredacted**. Secrets, auth material, and user-controlled payloads that might carry them never appear in logs. `requestId` stays intact so support can trace an incident.

Enforced by the `operatoruplift/logging-policy` rule set in `eslint.config.mjs` + the shared `lib/safeLog.ts` helper.

## Sensitive keys (blocked when logged)

```
authorization   cookie       set-cookie    token
apiKey          api_key      privyToken    privy
jwt             bearer       secret        password
privateKey      accessToken  refreshToken  sessionToken
xApiKey         x-api-key    x-auth-token
```

The full list lives in `SENSITIVE_KEY_PATTERN` in `eslint.config.mjs` and `SENSITIVE_KEY_RE` in `lib/safeLog.ts`. Keep them in sync.

## Examples

### ❌ Blocked by lint

```ts
// Direct object literal with a sensitive key.
console.log({ authorization: req.headers.get('authorization') });
// eslint: Do not log sensitive keys… Use safeLog()

// String-keyed same thing.
console.log({ 'set-cookie': cookieHeader });
// eslint: Do not log sensitive string-keyed fields…

// Raw bearer literal.
console.log('Authorization: Bearer abc.def.ghi');
// eslint: Do not log "Bearer <token>" literals.

// Header-name prefix.
console.log('Set-Cookie: privy-token=xyz; HttpOnly');
// eslint: Do not log Set-Cookie/Cookie header values.
```

### ✅ Allowed

```ts
// requestId is explicitly preserved — never redacted.
console.log(JSON.stringify({ at: 'chat', event: 'attempt', requestId, model }));

// Plain numeric / metric logging.
console.log(`latency=${elapsedMs}ms`);

// Use safeLog when the payload might contain auth material.
import { safeLog } from '@/lib/safeLog';
safeLog({
    at: 'subscription',
    event: 'auth-failed',
    requestId,
    headers: {
        authorization: request.headers.get('authorization'), // redacted automatically
        'x-forwarded-for': request.headers.get('x-forwarded-for'), // safe, not in sensitive list
    },
});
// Emits: {"at":"subscription","event":"auth-failed","ts":"…","requestId":"req_…","headers":{"authorization":"[REDACTED]","x-forwarded-for":"203.0.113.42"}}

// Bearer tokens embedded in a longer string are stripped by safeLog too.
safeLog({ at: 'tools.gmail', event: 'upstream-error', detail: 'rejected: Authorization: Bearer ey...' });
// Emits:  detail: "rejected: Bearer [REDACTED]"
```

## When to use `safeLog` vs `console.log` + manual redaction

- **Use `safeLog`** whenever the payload is an object that might carry request headers, error details from an SDK, or anything derived from user input.
- **Raw `console.log` is fine** for small fixed strings, numeric metrics, and hand-constructed JSON shapes where every field is known-safe.
- **Never** `console.log` a whole `request.headers` object, a cookie string, or an `Error.message` that quotes an upstream response body without passing it through `redact()` first.

## Escape hatch — when the rule seems wrong

1. Add a narrow disable comment with a reviewable reason:

   ```ts
   // eslint-disable-next-line no-restricted-syntax -- logging the provider error class, no secret material
   console.log({ authorization: 'none' });
   ```

   The next PR reviewer decides if the reason is real. Repeated disables in the same file without a clear reason are a smell.

2. If a whole file legitimately needs to log sensitive shapes (e.g. a test fixture), add it to `ignores` in `eslint.config.mjs`'s `operatoruplift/logging-policy` block with a comment.

## Current ignores

```
lib/safeLog.ts       # the redactor itself needs console access
docs/**              # research artifacts
scripts/**           # extractor / build scripts
tests/**             # may intentionally log bad examples
```

No other file is ignored. Everything else is enforced.

## What is NEVER logged — hard rules

- Raw request bodies (may contain user prompts with secrets pasted in).
- Raw response bodies from upstream providers (may contain tokens).
- OAuth authorization codes.
- Full JWT/JWS tokens (the `X-Request-Id` is fine; the bearer value is not).
- Supabase service-role keys.
- Solana wallet private keys or seed phrases.

## What IS logged (by design)

- `requestId` (always).
- `errorClass` from `lib/errorTaxonomy.ts`.
- Route name + event name.
- Bounded `detail` strings (≤240 chars, redacted).
- JOSE header fields (`alg`, `typ`, `kid`) on JWS auth failures — safe by spec.
- Last 4 digits of phone numbers in Photon logs (`senderLast4`).

## CI enforcement

`pnpm lint` runs on every PR via Next's built-in lint. A `console.log` that matches any banned pattern fails the build with the rule's message.

Acceptance self-check (from the W1A-obs-2 PR):

```bash
# Fails:
echo "console.log({ authorization: 'Bearer x' });" >> tmp-bad.ts
pnpm lint 2>&1 | grep -q "Do not log sensitive keys" && echo OK-caught
rm tmp-bad.ts

# Passes cleanly:
pnpm lint
```

## Scope caveat

This policy targets `console.*` calls in source. Third-party libraries that log internally are out of scope — if they ever leak auth material we redact at the source (the call site handing them the secret) or forbid that library.
