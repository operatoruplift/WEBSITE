# Operator Uplift Design System

> Local-first AI Agent Command Center. Privacy-first. Runs on your device.

## Brand

- **Name**: Operator Uplift
- **Mission**: Build the OS layer for AI agents that runs on your infrastructure, not someone else's cloud
- **Voice**: Direct, confident, technical but accessible. No jargon for jargon's sake.
- **Tone**: Enterprise-ready but human. Like talking to a senior engineer who also understands business.

## Colors

### Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#E77630` | Primary accent, CTAs, active states, brand orange |
| `primary-light` | `#F59E0B` | Secondary accent, amber highlights |
| `background` | `#050508` | Void-black canvas, page backgrounds |
| `card` | `#0c0c0c` | Card backgrounds, elevated surfaces |
| `card-hover` | `#111111` | Card hover state |

### Text Hierarchy

| Token | Value | Usage |
|-------|-------|-------|
| `text-primary` | `rgba(255,255,255,1.0)` | Headlines, primary content |
| `text-secondary` | `rgba(255,255,255,0.8)` | Body text, descriptions |
| `text-muted` | `rgba(255,255,255,0.6)` | Subheadings, labels |
| `text-subtle` | `rgba(255,255,255,0.4)` | Timestamps, metadata, captions |
| `text-ghost` | `rgba(255,255,255,0.2)` | Disabled states, dividers |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#22C55E` | Emerald, success states, connected, healthy |
| `warning` | `#F59E0B` | Amber, warnings, pending states |
| `error` | `#EF4444` | Red, errors, destructive actions |
| `info` | `#3B82F6` | Blue, informational, links |

## Typography

- **Font Family**: System sans-serif stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)
- **Mono Font**: `'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace`
- **Headings**: `font-medium tracking-tight` (not bold, clean and modern)
- **Body**: `text-sm` or `text-base`, `leading-relaxed`
- **Labels**: `text-xs font-bold tracking-[0.2em] uppercase` (monospace for tags)

### Scale

| Element | Size | Weight | Tracking |
|---------|------|--------|----------|
| Hero headline | `text-4xl md:text-6xl` | `font-medium` | `tracking-tight` |
| Section headline | `text-3xl md:text-4xl` | `font-medium` | `tracking-tight` |
| Card title | `text-xl md:text-2xl` | `font-medium` | `tracking-tight` |
| Body | `text-sm md:text-base` | `font-normal` | `leading-relaxed` |
| Label/Tag | `text-xs` | `font-bold` | `tracking-[0.2em]` |
| Caption | `text-[10px]` | `font-mono` | `tracking-widest` |

## Components

### Cards

```
rounded-2xl border border-dashed border-white/10 bg-white/[0.01]
hover:bg-white/[0.03] hover:border-white/20
transition-all duration-300
```

Corner accents: 4px border-t/border-l at each corner with `border-white/30`.

### Glass Cards

```
bg-black/40 backdrop-blur-xl border border-white/10
hover:border-white/20 transition-all
```

### Buttons

Primary:
```
bg-primary text-white px-6 py-3 rounded-lg
text-sm font-bold uppercase tracking-widest
hover:bg-primary/80 transition-colors
shadow-[0_0_20px_rgba(231,118,48,0.3)]
```

Outline:
```
bg-white/5 border border-white/10 text-white
hover:bg-white/10 transition-all
```

Ghost:
```
text-gray-400 hover:text-white transition-colors
```

### Badges

```
text-[10px] font-bold uppercase tracking-widest
px-2 py-1 rounded border
```

Variants: primary (`text-primary bg-primary/10 border-primary/20`), success, warning, error.

### Inputs

```
bg-white/5 border border-white/10 rounded-lg
px-4 py-3 text-white text-sm
focus:border-primary/50 focus:outline-none
transition-colors
```

## Layout

- **Max width**: `max-w-[1600px]` for sections, `max-w-[1200px]` for content
- **Padding**: `px-6 md:px-12` horizontal, `py-16 md:py-24` vertical
- **Grid**: `grid-cols-1 lg:grid-cols-2` for feature cards, `grid-cols-1 md:grid-cols-3` for stats
- **Spacing**: `space-y-8` between sections, `gap-6` between cards

## Animation

- **Entrance**: Fade in + slide up (`opacity 0->1, translateY 30px->0`) with `duration-1000 ease-out`
- **Stagger**: 100ms delay between siblings
- **Hover**: `transition-all duration-300` for cards and buttons
- **Scroll**: IntersectionObserver triggers at `threshold: 0.1`
- **Canvas**: `requestAnimationFrame` for HeroAnimation

### Timing

| Animation | Duration | Easing |
|-----------|----------|--------|
| Entrance (FadeIn) | 1000ms | ease-out |
| Hover state | 300ms | ease |
| Button press | 150ms | ease |
| Page transition | 500ms | ease-out |
| Canvas (60fps) | 16ms/frame | requestAnimationFrame |

## Dividers

Section dividers: `h-[2px] bg-gradient-to-r from-transparent via-white/15 to-transparent` with centered dot: `w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(231,118,48,0.6)]`.

## Shadows

- Card glow: `shadow-[0_0_20px_rgba(231,118,48,0.1)]`
- Button glow: `shadow-[0_0_20px_rgba(231,118,48,0.3)]`
- Status dot: `shadow-[0_0_8px_rgba(231,118,48,0.6)]`
- Active state: `shadow-[0_0_10px_rgba(255,85,0,0.8)]`

## Dark Mode Only

This design system is dark-mode only. The void-black canvas (`#050508`) is the foundation. All colors, opacities, and effects are calibrated for dark backgrounds. Light mode is not supported.

## File Reference

Every UI component in this project should reference this file for visual consistency. When building new pages or components, match these tokens exactly.
