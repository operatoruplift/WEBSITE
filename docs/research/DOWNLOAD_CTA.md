# Download CTA

OS-aware download button in the Hero. Detects the visitor's platform
and offers the right installer by default, with a dropdown to override.

## Contract

- **Defaults without guessing wrong.** `detectOS()` prefers the
  high-entropy `navigator.userAgentData.platform` when available
  (Chromium 90+). Falls back to a regex on the classic `userAgent`
  string. Defaults to macOS when we can't tell (that's the platform
  we ship first).
- **Manual override always wins.** The dropdown flips `manuallyPicked`,
  which suppresses the auto-detect so a user who picks Linux on a Mac
  stays on Linux until they reload.
- **URLs are env-driven.** `NEXT_PUBLIC_DOWNLOAD_MACOS`,
  `NEXT_PUBLIC_DOWNLOAD_WINDOWS`, `NEXT_PUBLIC_DOWNLOAD_LINUX` (client-
  bundle inlined, safe for public URLs). Missing envs fall back to
  `/login?returnTo=/download&os=<os>` so a pre-launch click lands
  somewhere actionable instead of a 404.
- **No fragile UA sniffing.** Detection only picks a default, never
  gates a feature. The dropdown is always present.

## Files

- `config/downloads.ts` — `detectOS`, `downloadOptions`, `optionFor`,
  `OSKey`, `DownloadOption`. Env-aware URL resolution with fallback.
- `src/components/DownloadCTA.tsx` — the button + dropdown. Uses
  `detectOS` once on mount, tracks `manuallyPicked` so override sticks.
- `src/sections/Hero.tsx` — renders `<DownloadCTA />` above
  `<DownloadWidget />`.
- `tests/e2e/download-cta.spec.ts` — three Playwright specs: Mac UA,
  Windows UA, manual override to Linux.

## Env vars (to wire in production)

| Env var | Example |
|---------|---------|
| `NEXT_PUBLIC_DOWNLOAD_MACOS` | `https://downloads.operatoruplift.com/operator-uplift-1.0.0-mac.dmg` |
| `NEXT_PUBLIC_DOWNLOAD_WINDOWS` | `https://downloads.operatoruplift.com/operator-uplift-1.0.0-setup.exe` |
| `NEXT_PUBLIC_DOWNLOAD_LINUX` | `https://downloads.operatoruplift.com/operator-uplift-1.0.0-linux.AppImage` |

Rotate URLs by editing the Vercel env vars and redeploying. No code
change required.

## Acceptance tests

```bash
pnpm exec playwright test tests/e2e/download-cta.spec.ts --reporter=list
```

Expected:

```
  ✓ Mac UA gets "Download for Mac" CTA
  ✓ Windows UA gets "Download for Windows" CTA
  ✓ picking Linux from the dropdown overrides the default
  3 passed
```

## Manual smoke (Chrome DevTools)

1. Open DevTools → Sensors → Override user agent → "Safari - Mac" →
   reload. Primary button reads `Download for Mac`.
2. Switch to "Chrome - Windows" → reload. Primary button reads
   `Download for Windows`.
3. Click `Other downloads` dropdown, pick `Linux`. Primary button now
   reads `Download for Linux` and data-os attribute is `linux`.

## Rollback

```
git revert <W1A-download-1 commit>
```

Reverts `config/downloads.ts`, `src/components/DownloadCTA.tsx`, and
the one-line Hero import+render. `DownloadWidget` is untouched.
