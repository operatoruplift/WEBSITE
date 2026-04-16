# DEC DMG SNAPSHOT

Reference documentation for the December 2025 `uplift.exe` (a.k.a.
"Uplift Assistant" / `aven-assistant@0.0.1-beta`) Electron build. This
is the source of truth for the Dec-UI reface behind the `DEC_UI` /
`NEXT_PUBLIC_DEC_UI` feature flag.

## How this snapshot was produced

1. Located the build at `~/Downloads/Uplift.exe` (84.6 MB, signed
   Dec 19 2025). Note: no DMG exists — the Dec build ships as a
   Windows NSIS installer only. The macOS shell in this repo
   (`webview/san-francisco`) wraps the live web app.
2. Extracted the NSIS installer: `7z x Uplift.exe`
3. Extracted the Electron app bundle: `7z x -oapp '$PLUGINSDIR/app-64.7z'`
4. Extracted the asar: `npx @electron/asar extract app/resources/app.asar extracted`
5. The readable source lives at `/Users/rvaclassic/conductor/repos/UI/src/`
   — a mirror of the Electron renderer pre-build.
6. Tailwind-compiled classes confirmed in `extracted/dist/output.css`:
   `w-14`, `h-8`, `max-w-2xl`, `max-w-3xl`, `max-w-7xl`.

## Contents

- [nav-flow.md](./nav-flow.md) — dock order, routes, landing, hidden screens
- [ui-inventory.md](./ui-inventory.md) — spacing rhythm, typography, cards, icons, empty states
- [parity-checklist.md](./parity-checklist.md) — Dec DMG vs current WEBSITE; delta + fix plan
- [screens/](./screens/) — per-screen layout notes with actual JSX structure
  - [chat.md](./screens/chat.md)
  - [agents-hub.md](./screens/agents-hub.md)
  - [settings.md](./screens/settings.md)
  - [approval-modal.md](./screens/approval-modal.md)

## What's NOT in this snapshot

- **Runtime screenshots of Dec app running.** The macOS host cannot
  execute the Windows `.exe` without Wine, and attempting that would
  produce visual output that doesn't match the real Dec rendering
  environment. The parity checklist is based on the actual code
  (JSX + Tailwind classes + compiled CSS), which is more reliable
  than a smeared screenshot.
- **Extracted Electron source in this repo.** The extracted source
  lives at `/tmp/uplift-dmg-extract/extracted/` (not committed) and
  at `/Users/rvaclassic/conductor/repos/UI/src/` (separate repo).
  We reference file paths from there, never copy code into WEBSITE.

## Stack observations

- React 18 + Vite build (`dist/renderer.js` is 2.7 MB)
- Tailwind (output.css is 55 KB)
- React Router v6 (HashRouter)
- Radix UI primitives (`@radix-ui/react-dialog`, `react-dropdown-menu`,
  `react-scroll-area`, `react-slot`)
- Framer Motion (`motion`)
- `zustand` store
- `marked` for markdown
- `simplex-noise` (only used for background beams — not required)
- No Solana libs in the Dec bundle — auth + Solana integration added
  in the web app after the Dec snapshot
