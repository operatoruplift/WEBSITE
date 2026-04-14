# DESIGN_TOKENS.md — Canonical tokens for Operator Uplift

> Source: `@operatoruplift/ui` (cody storybook) + uplift.exe asar extraction.
> These tokens are the single source of truth. Every component in bucharest
> must use these exact values.

## CSS Variables (globals.css)

```css
--color-primary:     #E77630
--color-muted:       #9ca3af      /* gray-400 */
--color-background:  #050508      /* deep void black */
--color-card:        #0c0c0c      /* card/panel surfaces */
--color-border:      rgba(255, 255, 255, 0.05)   /* default border */
```

## Color Palette

| Token | Hex / Value | Tailwind | Usage |
|---|---|---|---|
| Primary | `#E77630` | `text-primary`, `bg-primary` | Brand orange, CTAs, active states |
| Primary foreground | `#ffffff` | `text-white` | Text on primary |
| Secondary / Accent | `#F59E0B` | `text-amber-400` | Amber highlights (sparingly) |
| Background | `#050508` | `bg-background` | Page background |
| Card | `#0c0c0c` | `bg-card`, `bg-[#0c0c0c]` | Card/panel surfaces |
| Muted surface | `#1a1a1e` | `bg-[#1a1a1e]` | Muted backgrounds |
| Muted text | `#9ca3af` | `text-gray-400` | Secondary text, descriptions |
| Faint text | `#6b7280` | `text-gray-500` | Timestamps, labels |
| Ghost text | `rgba(255,255,255,0.2)` | `text-white/20` | Disabled, dividers |
| Destructive | `#ef4444` | `text-red-400` | Errors |
| Success | `#22c55e` | `text-green-400` | Running, connected |
| Border default | `rgba(255,255,255,0.05)` | `border-white/5` | All default borders |
| Border hover | `rgba(255,255,255,0.1)` | `border-white/10` | Hover/focus borders only |

## Typography

| Property | Value |
|---|---|
| Primary font | `"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` |
| Mono font | `font-mono` (system monospace) |
| Headings | `font-medium text-white tracking-tight` (NOT bold) |
| Body | `text-sm text-gray-200` |
| Secondary text | `text-sm text-gray-400` |
| Labels / Tags | `text-[10px] font-mono text-gray-500 uppercase tracking-widest` |
| Timestamps | `text-[10px] text-gray-500` |

## Border Radius

| Element | Value |
|---|---|
| Buttons (GlowButton) | `rounded-sm` (0.125rem) |
| Inputs, code blocks | `rounded-lg` (0.5rem) |
| Cards | `rounded-lg` (0.5rem) |
| Avatars | `rounded-full` |
| Agent card icons | `rounded-lg` (0.5rem) |
| Modals | `rounded-xl` (0.75rem) |

## Shadows

| Usage | Value |
|---|---|
| Primary glow (buttons) | `shadow-[0_0_20px_rgba(231,118,48,0.3)]` — on hover via GlowButton blur layer |
| Status dot glow | `shadow-[0_0_8px_currentColor]` |
| Cards | No shadow — border-only (`border-white/5`) |
| Modals | `shadow-2xl` |

## Component Tokens

### ChatBubble
```
User:      bg-primary/20 text-white rounded-xl px-4 py-3 text-sm
Assistant: bg-white/5 text-gray-200 border border-white/5 rounded-xl px-4 py-3 text-sm
Avatar:    h-8 w-8 rounded-full bg-white/5
Copy btn:  opacity-0 group-hover:opacity-100 hover:bg-white/10
Timestamp: text-[10px] text-gray-500
```

### Code Blocks
```
Container: bg-black/40 rounded-lg border border-white/5
Lang tag:  px-3 py-1.5 bg-white/5 border-b border-white/5 text-[10px] font-mono text-gray-500 uppercase tracking-widest
Code text: p-3 text-xs text-[#E77630] font-mono (text-primary)
```

### AgentCard (swarm)
```
Container: rounded-lg border border-white/5 bg-card p-4 hover:border-white/10
Icon:      h-10 w-10 rounded-lg bg-white/5 (or bg-primary/20 when active)
Name:      font-medium text-white truncate
Desc:      text-sm text-gray-400 line-clamp-2
Status:    h-3 w-3 rounded-full border-2 border-card
  running: bg-green-400
  idle:    bg-gray-500
  error:   bg-red-400
Action:    bg-primary text-white hover:bg-primary/90 rounded-sm px-3 py-1.5 text-xs
```

### GlowButton
```
Base:      rounded-sm px-6 py-2.5 font-medium text-white bg-primary hover:bg-primary/90
Glow:      blur-xl layer with #E77630 opacity-0 → group-hover:opacity-100
Outline:   bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10
```

### Input Bar (chat)
```
Container: rounded-lg bg-white/5 border border-white/5 focus-within:border-[#E77630]/40
Text:      text-[15px] text-white placeholder-gray-600
Send btn:  w-10 h-10 rounded-xl bg-primary hover:bg-primary/90
```

### Card
```
Default:   rounded-lg border border-white/5 bg-card
Glass:     rounded-lg border border-white/5 bg-white/5 backdrop-blur-md
Glass-dark: rounded-lg border border-white/5 bg-black/40 backdrop-blur-md
```
