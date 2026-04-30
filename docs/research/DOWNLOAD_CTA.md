# Download CTA — RETIRED

> **Status:** Retired in PR #312 (DownloadCTA + tests deleted) and
> PR #325 (DownloadWidget + config/downloads.ts deleted). The honest
> "Mac app (beta Q3 2026)" framing now lives in `src/sections/FAQ.tsx`
> Q5 and `app/(auth)/paywall/page.tsx` FREE_FEATURES (PR #324).

This doc is kept for code archaeology. Everything below describes a
component tree that no longer exists.

---

OS-aware download button in the Hero. Detects the visitor's platform
and offers the right installer by default, with a dropdown to override.

## Contract (historical)

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

## Files (historical, all deleted)

- `config/downloads.ts` — `detectOS`, `downloadOptions`, `optionFor`,
  `OSKey`, `DownloadOption`. Env-aware URL resolution with fallback.
- `src/components/DownloadCTA.tsx` — the button + dropdown.
- `src/components/DownloadWidget.tsx` — the secondary widget.
- `src/sections/Hero.tsx` — used to render `<DownloadCTA />` above
  `<DownloadWidget />`.
- `tests/e2e/download-cta.spec.ts` — Playwright specs.
- `tests/e2e/download-screenshots.spec.ts` — manual screenshot generator.

## Why retired

The desktop app slipped to Q3 2026 beta. Advertising a download in the
hero CTA implied the binary existed today; users who clicked got a
fallback path with no working installer. The new flow:

1. Hero CTA points at `/login?returnTo=/integrations` so the only
   advertised path is the working web app.
2. FAQ Q5 + paywall surface the upcoming Mac app honestly with a
   `(beta Q3 2026)` qualifier.
3. The `DownloadWidget` reference component said "Desktop app in
   development, macOS beta Q3 2026" but no live page imported it.
   PR #325 removed it as dead code.

When the desktop app actually ships, the implementation pattern in
git history (search for `DownloadCTA` or `detectOS`) is the starting
point.
