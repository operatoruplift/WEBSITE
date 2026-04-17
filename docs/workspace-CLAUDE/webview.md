# Operator Uplift — Webview (Tauri desktop shell)

## Role
Tauri 2 desktop shell. Packages the web chat into `Uplift.dmg` and `Uplift.exe`. Owns the menubar, system integrations (local FS plugin, Ollama sidecar, deep-link handoff from the website's Privy auth), and auto-updater. Does not reimplement chat UI — imports it from `repos/UI`.

## Must not touch
- Next.js routes, landing copy, `/api/*` — those are in `website/bucharest`. The DMG calls the same `/api/*` over HTTPS.
- Marketplace, pricing, settings, analytics UI — those live on the website only. The DMG links out.
- Any UI component duplication — import from `repos/UI`.

## May 14 priorities (in order)
1. Boot the shell, render the `/chat` React root from `repos/UI`, and talk to `operatoruplift.com/api/*` with the user's Privy JWT from the keychain.
2. `uplift://` deep link handshake for Privy auth — open the website in system browser, receive JWT back.
3. Menubar icon + hotkey to focus the window. Nothing more exotic for May 14.
4. Do NOT ship auto-updater or notarization flow in this release. Beta-gate the download behind Privy.

## Verification
- `cargo tauri dev` boots the window and loads `/chat`.
- Approve click in the DMG fires `/api/tool-call` on the website and produces a receipt in `/security`.
- Quitting → relaunching retains the Privy JWT via keychain.

## Current state snapshot
- Shipped: Tauri project scaffolding, Ollama sidecar plan, FS plugin skeleton.
- In-flight: Privy deep-link handoff, menubar.
- Deferred post-May-15: auto-updater, notarization, Windows signing, Ollama-first offline mode.
