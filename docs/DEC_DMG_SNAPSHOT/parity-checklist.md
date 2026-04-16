# UI Parity Checklist

Each row compares the Dec DMG behavior to the current WEBSITE dashboard.
**Delta** = what's different. **Fix plan** = whether PR 2 changes WEBSITE,
or we justify keeping the delta.

Status codes:
- ✅ Already matches
- 🟡 PR 2 will change WEBSITE to match
- ⏸ Deferred — documented, not changing in PR 2
- ❌ Intentional divergence — WEBSITE will NOT change (with reason)

## 1. Layout Shell

| Area | Dec DMG | WEBSITE | Delta | Fix plan |
|---|---|---|---|---|
| Topbar height | `h-8` (32px) always visible, drag-region | No topbar on dashboard routes | WEBSITE has no topbar | 🟡 PR 2: add a thin `h-8` topbar behind `NEXT_PUBLIC_DEC_UI` flag |
| Dock width | `w-14` (56px) fixed | `w-14` after recent reface ✅ | Matches | ✅ |
| Dock icons | 8 items, no collapsed mode, no active state highlight | 6+3 (Advanced) items, no active highlight | WEBSITE has 3 Advanced-gated items; Dec hides them by commenting out `static.tsx` entries | ✅ Same pattern, different mechanism |
| Page container | `max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-4` | `max-w-7xl` on several pages but `max-w-[1200px]` on sections. Dashboard uses `p-6 lg:p-8` | Inconsistent padding | 🟡 PR 2: unify to `pt-8 pb-4` via `PageContainerDec` wrapper |
| Page fade | `page-fade` class (15ms ease-out) on every route root | Removed in calm-UI pass (PR #100) | WEBSITE has no page fade | 🟡 PR 2: add `page-fade` animation class + apply conditionally |
| Background layers | Solid `bg-background` everywhere. `BackgroundBeams` only on `/chat` | Removed all Nebula/Particle (PR #100) ✅ | Matches (clean) | ✅ |

## 2. Chat screen

| Area | Dec DMG | WEBSITE | Delta | Fix plan |
|---|---|---|---|---|
| Message column width | `max-w-2xl lg:max-w-3xl mx-auto` | Full-width currently | WEBSITE chat is not width-constrained | 🟡 PR 2: constrain when DEC_UI flag on |
| Send input | Centered, constrained same as messages. Spotlight rounded container with textarea + model select + run button | Full-width with sidebar model picker | Different composition | 🟡 PR 2: center + constrain |
| User message bubble | `rounded-2xl rounded-br-md bg-orange-500/15 border border-orange-500/20` | `bg-primary/10` subtle bg | Similar but Dec has stronger orange tint | 🟡 PR 2: match bubble style |
| Assistant bubble | `rounded-2xl rounded-bl-md bg-foreground/[0.04] border border-foreground/5` | Similar | Close ✅ | ✅ |
| Model indicator | Top-right at `text-[10px] uppercase tracking-wider` | Already similar ✅ | Matches | ✅ |
| Right side `AgentActivityPanel` | Collapsible `w-10` (collapsed) / `w-72` (expanded) | Absent | Missing panel | ⏸ Deferred — Council transcript inline covers same need |

## 3. Agents / Hub / Marketplace

| Area | Dec DMG | WEBSITE | Delta | Fix plan |
|---|---|---|---|---|
| Route name | `/store` | `/marketplace` | Different | ⏸ Keep `/marketplace` (route churn not worth it) |
| Page structure | Header row (title + StatusChip + SearchBar) → Tabs+FilterSection row → agents grid | Similar (title + search + category tabs + grid) ✅ | Matches | ✅ |
| Agent card | `rounded-xl bg-foreground/[0.02] border border-foreground/10 hover:border-primary/30` + `BorderBeam` | WEBSITE card: `bg-foreground/[0.04]` with no BorderBeam (MagicUI gutted in PR #100) | WEBSITE cards slightly more opaque than Dec | 🟡 PR 2 minor: match `bg-foreground/[0.02]` when DEC_UI flag on |
| Card gap in grid | `gap-3` | `gap-6` (`marketplace/page.tsx`) | Dec is tighter | 🟡 PR 2: `gap-3` in flagged mode |
| Featured row | Same grid pattern, just featured=true filter | Separate featured section with different card size | Dec treats all cards uniformly; WEBSITE uses a hero row | 🟡 PR 2: flatten to single grid when flag on |
| Badges | Status chips only for install state | Verified checkmark, trending, LLM-only | WEBSITE has more, intentional | ❌ Keep — honest agent labeling from PR #103 |

## 4. Settings

| Area | Dec DMG | WEBSITE | Delta | Fix plan |
|---|---|---|---|---|
| Layout | Left inner sidebar `w-52 lg:w-56` + content area with top header | Horizontal tab bar at top + content below | Different layout pattern | 🟡 PR 2: left-nav layout when flag on |
| Tab groups | Account / Demo Mode / Security / Data / System | Profile / Notifications / Appearance / Security / API Keys / Data / Advanced | Overlap but different grouping | ⏸ Keep WEBSITE tabs — they reflect features Dec doesn't have (Privy, Solana Pay, Advanced toggle) |
| Inner content header | Icon avatar `w-10 h-10 rounded-xl bg-orange-500/15` + section title + description | h1 at top of page, no split header | Dec has a clearer "you are on tab X" marker | 🟡 PR 2: add inner header with icon avatar |
| Save button | Inline bottom of each section | Single bottom-of-page Save | Dec per-section, WEBSITE one button | ⏸ Keep — WEBSITE's single save is simpler |

## 5. Approval Modal

| Area | Dec DMG | WEBSITE | Delta | Fix plan |
|---|---|---|---|---|
| Trigger | Agent emits tool_use → modal | Same ✅ | Matches | ✅ |
| Dialog base | Radix Dialog, `rounded-lg bg-[#0b0b0b] border border-border shadow-lg` | Custom `fixed inset-0` + `bg-[#0c0c0c] border border-white/10` | Close, WEBSITE has slightly different surface | 🟡 PR 2: migrate to Radix Dialog when flag on (accessibility + animation consistency) |
| Risk badge | Per-tool (MEDIUM/HIGH) ✅ | Same ✅ | Matches | ✅ |
| Param summary | Readable list (who/what/when) ✅ | Same ✅ | Matches | ✅ |
| Allow button | `bg-primary h-10` solid | Was `shadow-[0_0_20px]` glow, fixed in PR #103 | WEBSITE now matches ✅ | ✅ |
| "Remember this agent" checkbox | Present in Dec | Absent in WEBSITE | WEBSITE requires per-action approval — more conservative | ❌ Keep WEBSITE stricter — every approval stands alone by design |

## 6. Colors, typography, motion

| Area | Dec DMG | WEBSITE | Delta | Fix plan |
|---|---|---|---|---|
| Primary accent | `#F97316` only | `#F97316` (after PR #100) ✅ | Matches | ✅ |
| Background | `#0A0A0A` base | `#0A0A0A` ✅ | Matches | ✅ |
| Card surface | `#111111` OR `bg-foreground/[0.04]` | `bg-foreground/[0.04]` ✅ | Matches | ✅ |
| Border | `#222222` or `border-foreground/10` | `border-foreground/10` ✅ | Matches | ✅ |
| Fonts | Geist + Geist Mono + SF Pro fallback | Same ✅ | Matches | ✅ |
| Hover effects | Border color + text color transition only | Same ✅ | Matches | ✅ |
| Scale hovers | None in Dec (dock is the ONE exception with `hover:scale-105`) | Removed in PR #100 | WEBSITE is slightly calmer than Dec | ✅ Acceptable — WEBSITE consumer-side calm is fine |

## 7. Routing / landing

| Area | Dec DMG | WEBSITE | Delta | Fix plan |
|---|---|---|---|---|
| Default landing | `/chat` | `/chat` after login (PR #100) ✅ | Matches | ✅ |
| Auth | Local install, no auth flow | Privy login + paywall | Completely different | ❌ Keep WEBSITE auth — the product is now web-delivered |
| Paywall | None in Dec | `/paywall` on gated routes | Web-app only requirement | ❌ Keep paywall |

## Summary

**Must-fix in PR 2** (🟡 items):
1. Add `h-8` topbar behind flag
2. Unify page container padding (`pt-8 pb-4`)
3. Add `page-fade` animation class (optional — reduced-motion aware)
4. Constrain chat message column to `max-w-2xl lg:max-w-3xl`
5. Match user message bubble style (stronger orange tint)
6. Tighter marketplace grid (`gap-3`, flatten featured row when flag on)
7. Match agent card surface (`bg-foreground/[0.02]`)
8. Add left-nav Settings layout when flag on
9. Add per-tab inner header with icon avatar in Settings
10. Migrate Approval Modal to Radix Dialog when flag on

**Defer** (⏸):
- `AgentActivityPanel` right rail
- Route renaming (`/marketplace` → `/store`, etc.)
- Settings tab regrouping

**Keep divergent** (❌):
- WEBSITE auth + paywall (product evolved past Dec)
- "Remember this agent" checkbox (WEBSITE is stricter)
- WEBSITE-specific settings tabs (API Keys, Advanced)
- Extra agent badges (LLM-only, verified, trending — honest labeling from PR #103)
