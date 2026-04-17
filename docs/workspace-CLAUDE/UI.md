# Operator Uplift — UI (shared component library)

## Role
Shared React component library used by both the website (`website/bucharest`) and the Tauri desktop wrapper (`webview/san-francisco`). Chat view, ModelSelector, ApprovalModal, and other consumer surfaces live here so web and DMG render the same UI.

## Must not touch
- Next.js app routes, `/api/*` server code, or Supabase access — that's `website/bucharest`.
- Tauri shell + native integrations (menubar, FS plugin, Ollama sidecar) — that's `webview/san-francisco`.
- Python runtime — that's `core/guangzhou`.
- Business-logic tool execution (Calendar/Gmail/x402) — render UI only. The container owns execution.

## May 14 priorities (in order)
1. ApprovalModal reads a `demoMode` prop and renders a gray Simulated chip when true; CTA label switches to "Approve (Simulated)".
2. Demo/Real capability pill component — single visible state surface. Reused by web chat header and DMG menu.
3. Canned-reply renderer that matches the 3 demo beats (briefing, inbox, reminders) so web and DMG render the same bubbles.
4. No new marketing components. Do not add cards, testimonials, or enterprise vignettes to this library.

## Verification
- `npm run build` → library ships expected bundle.
- Storybook (if present) shows ApprovalModal in both Demo and Real states.
- Integration smoke: `website/bucharest` importing the latest UI build boots `/chat` without regression.

## Current state snapshot
- Shipped: chat shell, ModelSelector, SendInput, Sidebar primitives.
- In-flight: ApprovalModal Simulated prop, capability pill component.
- Deferred post-May-15: light mode, Storybook coverage for every export, full a11y audit.
