# DESIGN_TOKENS.md — Extracted from @operatoruplift/ui Storybook (cody)

> Source: `/workspaces/ui/cody/src/styles/globals.css` + component source files.
> Apply these tokens to /chat and /swarm pages for visual consistency.

## Color Palette

| Token | Value | Usage |
|---|---|---|
| `--ou-primary` | `#E77630` | Brand orange, CTAs, active states |
| `--ou-primary-foreground` | `#ffffff` | Text on primary |
| `--ou-secondary` | `#F59E0B` | Amber accent, highlights |
| `--ou-background` | `#050508` | Page background |
| `--ou-card` | `#0c0c0c` | Card/panel backgrounds |
| `--ou-card-foreground` | `#ffffff` | Text on cards |
| `--ou-muted` | `#1a1a1e` | Muted surfaces |
| `--ou-muted-foreground` | `#9ca3af` | Gray-400, secondary text |
| `--ou-destructive` | `#ef4444` | Red, errors |
| `--ou-border` | `rgba(255, 255, 255, 0.05)` | Default borders — very subtle |
| `--ou-input` | `rgba(255, 255, 255, 0.05)` | Input backgrounds |
| `--ou-ring` | `#E77630` | Focus ring |

## Typography

| Property | Value |
|---|---|
| Font family | `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` |
| Headings | `font-medium text-white` (not bold) |
| Body | `text-sm text-gray-200` or `text-gray-400` |
| Labels | `text-xs font-medium` or `text-[10px] font-mono text-gray-500 uppercase tracking-widest` |
| Code | `text-primary text-xs` with `bg-black/40 rounded-lg p-3` |
| Timestamps | `text-[10px] text-gray-500` |

## Border Radius

| Token | Value | Tailwind |
|---|---|---|
| `--ou-radius-sm` | `0.25rem` | `rounded` |
| `--ou-radius-md` | `0.375rem` | `rounded-md` |
| `--ou-radius-lg` | `0.5rem` | `rounded-lg` |
| `--ou-radius-xl` | `0.75rem` | `rounded-xl` |

## Shadows

| Usage | Value |
|---|---|
| Card glow | `shadow-[0_0_20px_rgba(231,118,48,0.3)]` |
| Status dot | `shadow-[0_0_8px_currentColor]` |
| No default card shadow | Cards use border only, no box-shadow |

## Component Patterns (from Storybook)

### ChatBubble
- User: `bg-primary/20 text-white rounded-xl px-4 py-3 text-sm`
- Assistant: `bg-white/5 text-gray-200 rounded-xl px-4 py-3 text-sm`
- Code blocks: `bg-black/40 rounded-lg p-3 overflow-x-auto`, code text: `text-primary text-xs`
- Avatar: `h-8 w-8 rounded-full bg-white/5`
- Copy button: `opacity-0 group-hover:opacity-100 hover:bg-white/10`

### AgentCard
- Container: `rounded-lg border border-white/5 bg-card p-4 hover:border-white/10`
- Avatar: `h-10 w-10 rounded-lg bg-white/5` or `bg-primary/20 text-primary font-bold`
- Status dot: `h-3 w-3 rounded-full border-2 border-card` + color (green-400/gray-500/red-400)
- Name: `font-medium text-white truncate`
- Description: `text-sm text-gray-400 line-clamp-2`
- Action button: `bg-primary text-white hover:bg-primary/90` or `bg-white/5 text-gray-500`

### Key differences from current bucharest /chat page
- Storybook uses `bg-primary/20` for user bubbles (subtle), bucharest uses `bg-gradient-to-br from-[#E77630] to-[#F59E0B]` (bold gradient)
- Storybook uses `rounded-xl` everywhere, bucharest uses `rounded-2xl`
- Storybook borders are `border-white/5`, bucharest uses `border-white/10` (slightly more visible)
- Storybook uses `text-sm` for body, bucharest uses `text-[15px]`
