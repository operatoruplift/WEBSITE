# Settings — `/profile`

**Dec source**: `/Users/rvaclassic/conductor/repos/UI/src/views/Dashboard/settings/index.tsx`
**Dec sidebar**: `.../settings/components/SettingsSidebar.tsx`

## JSX hierarchy

```
<div className="page-fade flex h-full bg-background overflow-hidden">

  {/* Settings sidebar */}
  <div className="w-52 lg:w-56 flex-shrink-0 border-r border-foreground/5
                  bg-foreground/[0.01]">
    <SettingsSidebar />
  </div>

  {/* Content area */}
  <div className="flex-1 flex flex-col min-w-0 min-h-0">

    {/* Sub-header with icon avatar + title + description */}
    <div className="flex-shrink-0 px-6 py-5 border-b border-foreground/5
                    bg-foreground/[0.01]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl
                        bg-orange-500/15 border border-orange-500/20">
          <ActiveIcon />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{label}</h2>
          <p className="text-sm text-foreground/40">{description}</p>
        </div>
      </div>
    </div>

    {/* Scrollable content */}
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="p-6 lg:p-8 max-w-4xl">
        <ActiveComponent />
      </div>
    </div>
  </div>
</div>
```

## Settings sidebar tabs

Grouped by section heading (`text-xs font-semibold uppercase tracking-wider text-foreground/40`):

- **Account**: Account (`User`)
- **Demo Mode**: Demo Mode (`Sparkles`), Demo Health (`Activity`)
- **Security**: Agentic Vault (`Key`), Permissions (`Shield`)
- **Data**: Connectors (`Plug`), Memory (`Brain`), Usage (`Zap`), Exports (`Download`)
- **System**: About (`Info`)

Each tab is a button:
- Default: `text-foreground/70 hover:text-foreground hover:bg-foreground/5`
- Active: `bg-primary/10 border-primary/20 text-primary`
- Layout: `icon + label + ChevronRight` on the right

## Key dimensions

| Element | Value |
|---|---|
| Sidebar width | `w-52 lg:w-56` (208px / 224px) |
| Sidebar border | `border-r border-foreground/5 bg-foreground/[0.01]` |
| Sub-header height | `px-6 py-5` + bottom border |
| Icon avatar | `w-10 h-10 rounded-xl bg-orange-500/15 border-orange-500/20` |
| Content padding | `p-6 lg:p-8 max-w-4xl` |

## What to replicate (behind DEC_UI flag)

- Left-nav settings layout (w-52 lg:w-56 inner sidebar)
- Inner header with icon avatar per active tab
- Tab groups with section headings

## WEBSITE divergence (keep)

- Tab list is different because WEBSITE has features Dec doesn't:
  API Keys (per-provider), Advanced (flag toggle), Data & Storage
  (localStorage export)
- WEBSITE uses Privy accounts — "Account" tab shows Privy DID + linked
  Google/email, not a local username
