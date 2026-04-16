# UI Parity Checklist — uplift.exe vs operatoruplift.com

Tracking parity between the December 2025 Electron app (uplift.exe,
living in `/repos/UI/`) and the web dashboard (this repo). For each
screen, we list what matches, what doesn't, and — for each mismatch —
whether we changed the web app to match, or why we chose not to.

**Source of truth**: `/Users/rvaclassic/conductor/repos/UI/src/`
**Target**: `app/(dashboard)/` in this repo

**Last reviewed**: 2026-04-16

---

## 1. Chat — `/chat`

**Electron**: `src/views/Dashboard/chat/index.tsx`
**Web**: `app/(dashboard)/chat/page.tsx`

### Matches
- [x] Default landing after login (both redirect to `/chat`)
- [x] Background is plain `bg-[#0A0A0A]` — no particles, no nebula
- [x] Message bubbles: user right-aligned orange-tinted, assistant left-aligned muted surface
- [x] Centered message column with constrained width
- [x] Send input at bottom with model selector + send button
- [x] Agent picker at top of the page

### Mismatches — Web changed to match
- [x] **Before**: multicolor agent tabs with gradient backgrounds.
      **After**: subtle `bg-foreground/[0.04] text-foreground/70`, orange only when active.
- [x] **Before**: Orange glow shadow on send button.
      **After**: plain `bg-primary hover:bg-primary/90`.
- [x] **Before**: Blur blob in the corner (`blur-[120px]`).
      **After**: removed.

### Mismatches — justified, not changed
- Electron has a collapsible right-side `AgentActivityPanel` (w-10 / w-72).
  Web omits this for now — the Council transcript inline covers the same need, and a secondary sidebar hurts mobile. Revisit post-Demo Day.
- Electron uses `BackgroundBeams` at 40% opacity.
  Web omits because its presence violates the "no wow effects" rule for consumer UI. Electron keeps it because desktop app users expect more atmosphere.

---

## 2. Agents Library — `/marketplace`

**Electron**: `src/views/Dashboard/hub/index.tsx` + `components/AgentCard.tsx`
**Web**: `app/(dashboard)/marketplace/page.tsx`

### Matches
- [x] Agents loaded from a single data source (Supabase on web, local registry in Electron)
- [x] Search bar at top
- [x] Install/Installed state with clear CTA
- [x] Card grid with avatar, name, description, author, rating

### Mismatches — Web changed to match
- [x] **Before**: AnimatedCard with BorderBeam rotating gradient.
      **After**: plain bordered card with `hover:border-foreground/20`.
- [x] **Before**: Featured row with `BorderBeam size={250} duration={8}`.
      **After**: removed — featured agents still highlighted via border and badge, no rotating beam.
- [x] **Before**: Category pills used orange gradient.
      **After**: solid primary when active, muted when inactive.
- [x] **Before**: 5 seeded agents.
      **After**: 15 agents matching the Electron `agents/library/` registry.

### Mismatches — justified, not changed
- Electron hub has tabs (Installed / Discover / Trending). Web uses a single list with filters and sort. Reason: fewer clicks for consumer flow, same information.

---

## 3. Settings — `/settings`

**Electron**: `src/views/Dashboard/settings/index.tsx` + `components/SettingsSidebar.tsx`
**Web**: `app/(dashboard)/settings/page.tsx`

### Matches
- [x] Single settings page — no scattered pages per setting
- [x] Horizontal or left-side tab navigation inside the page
- [x] Tabs: Profile, Notifications, Appearance, Security, API Keys, Data, Advanced

### Mismatches — Web changed to match
- [x] **Before**: "API Keys" tab toggled Emerald/green switches with glow shadows.
      **After**: neutral toggles with `bg-primary` for on state, `bg-foreground/10` for off.
- [x] **New**: Added "Advanced" tab with `advanced_mode` toggle to hide/show Swarm, Recent, Workspace in the dock (matches Electron's hidden power-user routes).

### Mismatches — justified, not changed
- Electron's settings sidebar is a secondary nav `w-52 lg:w-56` *inside* the page. Web currently uses horizontal tabs at the top. On desktop (`md:` up) this is functionally equivalent; the left-nav pattern is worth adopting if we expand settings beyond 7 tabs.

---

## 4. Approval Modal — `ToolApprovalModal`

**Electron**: `src/views/Dashboard/chat/components/ApprovalModal.tsx`
**Web**: `src/components/ui/ToolApprovalModal.tsx`

### Matches
- [x] Triggered when an agent emits a `tool_use` block for Calendar/Gmail
- [x] Shows risk badge (MEDIUM/HIGH) and tool + action label
- [x] Parameter summary (who, what, when) displayed before the approve button
- [x] "Allow Once" and "Deny" as the only two outcomes
- [x] x402 payment cost shown inline when agent has `queryPrice > 0`

### Mismatches — Web changed to match
- [x] **Before**: Big orange gradient CTA with `shadow-[0_0_20px_rgba(231,118,48,0.2)]`.
      **After**: solid `bg-[#F97316]` — no gradient, no glow.
- [x] **Before**: "EXECUTING..." used a spinner + animate-pulse badge.
      **After**: plain spinner, no pulse.

### Mismatches — justified, not changed
- Electron's modal supports a "Remember this agent" checkbox for one-click future approvals. Web doesn't yet — deferred as a separate feature so the first audit trail entry always requires explicit consent.

---

## Anti-patterns Removed Globally

These were in the web app but not in uplift.exe. Stripped during the calm-UI pass:

1. **BorderBeam** rotating conic-gradient on cards — removed; `AnimatedCard` now renders plain.
2. **Spotlight** cursor-tracking radial glow — removed; `Spotlight` is now a passthrough.
3. **NumberTicker** count-up animations — removed; static numbers render instantly.
4. **StaggerChildren** sequential fade-in — removed; children render without delay.
5. **Nebula + Particle** backgrounds in the layout shell — removed.
6. **Glow shadows** (`shadow-[0_0_20px_rgba(...)]`) on primary CTAs — removed.
7. **Scale hovers** (`hover:scale-105`, `hover:scale-110`) — removed; subtle border hover only.
8. **Fade-in animations** on every card (`animate-fadeInUp`) — removed.
9. **Multicolor decorative accents** (amber, emerald, rose, sky, blue) — collapsed to the single orange primary unless the color encodes real state (success/error/warning).

---

## Acceptance Criteria

- [x] Open `/chat` — no visible beams, glows, particles, or pulsing
- [x] Open `/marketplace` — cards have subtle borders, no rotating gradients
- [x] Open `/settings` — no emerald glow dots, single page with tabs
- [x] Open `/security` — stats render instantly, no count-up animation
- [x] Login redirects to `/chat` (not `/app`)
- [x] Swarm is hidden unless Advanced mode is enabled
- [x] Max 2 heading levels per page (h1 for page, h2 for sections)

---

## Future Work

These are parity items we've flagged but haven't done yet:

- Add `AgentActivityPanel` (collapsible right panel) on `/chat`
- Move Settings to a left-nav layout at ≥`lg:` breakpoint
- Add "Remember this agent" checkbox to `ToolApprovalModal`
- Replace horizontal tab bar with `SettingsSidebar` component mirroring Electron
- Add the `StatusChip` pattern from Electron for connection state indicators
