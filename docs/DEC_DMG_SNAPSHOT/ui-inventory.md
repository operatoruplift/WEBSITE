# UI Inventory

## Dock

- **Width**: `w-14` (56px) fixed
- **Padding**: `px-2 pt-4`
- **Icon button**: `w-10 h-10`, `rounded-xl`, `border border-foreground/10`,
  `bg-foreground/5 hover:bg-foreground/10`, `hover:border-primary/30`,
  `hover:scale-105`
- **Icon inside button**: `w-5 h-5`, `text-foreground/60 group-hover:text-primary`
- **Tooltip**: appears `absolute left-full ml-3`, `bg-background/95 backdrop-blur-sm`,
  `border border-foreground/10`, `rounded-lg`, `px-2.5 py-1`, `text-xs`
- **Logo**: `w-7 h-7` at top of dock
- **No collapsed mode.** Dock is always `w-14`.
- **No active-state highlight.** Hover → orange only.

## Page container

- **Max width**: `max-w-7xl mx-auto`
- **Padding**: `px-4 sm:px-6 lg:px-8 pt-8 pb-4`
- **Fade-in class**: `page-fade` (15ms ease-out translateY, applied to
  every route root element)

## Section headings

- **Pattern**: `text-xs font-semibold uppercase tracking-wider text-foreground/40 mb-2`
- **Page title (h1)**: `text-2xl font-semibold`
- **Section title (h2)**: `text-lg font-semibold`

**Max 2 heading levels per page.** No deeper hierarchy.

## Typography

- **Body**: `text-sm` (14px)
- **Caption/helper**: `text-xs` (12px)
- **Meta chips**: `text-[9px]` or `text-[10px]` uppercase tracking-widest
- **Line height**: default (Tailwind `leading-normal` = 1.5)
- **Font family**: Geist (variable) + Geist Mono + SF Pro Display fallback

## Card surfaces

**The primary card pattern** (used everywhere — list items, grid cells,
stat cards, chat message bubbles):

```
rounded-xl
bg-foreground/[0.04]
border border-foreground/10
hover:border-primary/30 hover:bg-foreground/[0.06]
transition-all
```

- Radius: `rounded-xl` (12px)
- Padding inside: `p-4` for lists, `p-5` for larger cells, `p-8` for
  hero/feature blocks
- **No shadows, no glows, no backdrop blur on regular cards.**

## Buttons

Source: `/Users/rvaclassic/conductor/repos/UI/src/components/ui/button.tsx`

| Variant      | Classes                                                                |
|--------------|------------------------------------------------------------------------|
| default      | `bg-primary text-white hover:bg-primary/90`                            |
| gradient     | `bg-orange-500 text-white hover:bg-orange-600` (no actual gradient!)   |
| destructive  | `bg-destructive text-destructive-foreground hover:bg-destructive/90`   |
| outline      | `border border-input bg-background hover:bg-primary hover:text-white`  |
| secondary    | `bg-muted text-foreground hover:bg-muted/80`                           |
| ghost        | `hover:bg-primary hover:text-primary-foreground`                       |
| link         | `text-primary underline-offset-4 underline`                            |

| Size         | Height        |
|--------------|---------------|
| default      | `h-9 px-4 py-2`    |
| sm           | `h-8 rounded-md px-3 text-xs` |
| lg           | `h-10 rounded-md px-8`        |
| icon         | `h-9 w-9`                     |

**Primary CTA** is always `bg-orange-500 hover:bg-orange-600 text-white h-9 px-4 rounded-lg` — never a gradient, never a glow shadow.

## Badge / chip

Source: `/Users/rvaclassic/conductor/repos/UI/src/components/ui/status-chip.tsx`

```
text-[9px] uppercase tracking-wider font-semibold
px-1.5 py-0.5 rounded border
```

Color variants (status-encoding ONLY — not decorative):
- `offline-ready` / `online-enhanced` / `live-ok` → `emerald-500/10 border-emerald-500/30 text-emerald-500`
- `sync-paused` → `amber-500/10 border-amber-500/30 text-amber-500`
- `brand/pro` → `primary/15 border-primary/30 text-primary`

## Icon avatar containers

```
w-9 h-9 rounded-lg
bg-primary/10 border border-primary/20
flex items-center justify-center
```

For people/user avatars, swap `rounded-lg` → `rounded-full`.

## Input

Source: `/Users/rvaclassic/conductor/repos/UI/src/components/ui/input.tsx`

```
h-9 px-3 rounded-md
bg-foreground/5 border border-foreground/10
text-sm
focus:border-primary/50 focus:outline-none
```

**No ring, no glow on focus.** Just a border tint.

## Empty states

Source: `/Users/rvaclassic/conductor/repos/UI/src/components/ui/empty-state.tsx`

```
<div className="flex flex-col items-center justify-center py-20">
  <Icon size={48} className="text-foreground/20 mb-4" />
  <p className="text-sm text-foreground/50">Empty label</p>
  <p className="text-xs text-foreground/30 mt-1">Hint text</p>
</div>
```

## Motion

- **Page fade**: 15ms ease-out `translateY(4px) → 0` (applied once on mount)
- **Hover**: only border + text-color transitions, 200ms
- **No particle backgrounds, no border-beam, no shimmer sweeps, no count-up tickers** in the Dec build.
- `BackgroundBeams` at 40% opacity is used on `/chat` only (not everywhere).
- `framer-motion` is imported but used exclusively for the dock tooltip fade-in.

## Design tokens

From `/Users/rvaclassic/conductor/repos/UI/src/styles/input.css`:

```css
--foreground: #FAFAFA;
--background: #0A0A0A;
--primary: #F97316;
--secondary: #111111;
--muted: #1A1A1A;
--muted-foreground: #A1A1AA;
--border: #222222;
--radius: 0.625rem;
```

Font: Geist (variable) + Geist Mono + SF Pro Display.

## Spacing rhythm

- Card gap inside grids: `gap-3` (12px) for lists, `gap-6` (24px) for
  grids with larger cards
- Section gap: `mb-6` or `mb-8`
- Vertical padding on full-page routes: `pt-8 pb-4`
- Sidebar inner padding: `w-52 lg:w-56` for secondary nav, `w-14` for
  primary dock

## Enforcement rules (from DESIGN.md in the Dec source)

1. No orange gradients — solid `#F97316` only
2. No emerald/rose/sky as decorative accent (only for state)
3. Dark theme exclusively — `#0A0A0A` base, `#111111` cards
4. Focus-visible ring always `#F97316`
5. Respect `prefers-reduced-motion`
