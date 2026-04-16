# Agents / Hub — `/store`

**Dec source**: `/Users/rvaclassic/conductor/repos/UI/src/views/Dashboard/hub/index.tsx`
**Dec card**: `.../hub/components/AgentCard.tsx`

## JSX hierarchy

```
<div className="page-fade flex flex-col h-full w-full max-w-7xl mx-auto
                px-4 sm:px-6 lg:px-8 pt-8 pb-4 ...">
  {/* Header row — title + StatusChip + SearchBar */}
  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
    <div className="flex items-center gap-3">
      <Header />
      <StatusChip />
    </div>
    <SearchBar />
  </div>

  {/* Tabs + FilterSection row */}
  <div className="flex flex-col sm:flex-row items-start sm:items-center
                  justify-between gap-4 border-b border-foreground/10 pb-4">
    <Tabs activeTab={activeTab} />
    <FilterSection categories={categories} selectedType={selectedType} />
  </div>

  <AgentsGrid agents={filteredAgents} />
  {/* grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 */}
</div>
```

## Agent card

```
<div className="group relative overflow-hidden cursor-pointer
                p-4 flex flex-col gap-3 min-h-[140px]
                rounded-xl border border-foreground/10
                bg-foreground/[0.02] hover:bg-foreground/[0.05]
                hover:border-primary/30 animate-fade-in">
  <BorderBeam size={180} duration={5} />
  <div className="flex items-start gap-3">
    <div className="w-11 h-11 rounded-lg
                    bg-gradient-to-br from-foreground/10 to-foreground/5
                    border border-foreground/10">
      {/* logo or initial letter */}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-base font-medium text-foreground truncate
                     group-hover:text-primary">{name}</h3>
      <p className="text-xs text-foreground/50 line-clamp-2">{description}</p>
    </div>
    <ChevronRight className="text-foreground/20 group-hover:text-primary" />
  </div>
  <div className="mt-auto flex items-center gap-2">
    <span className="text-[10px] uppercase tracking-wider text-foreground/30">
      by {author}
    </span>
  </div>
</div>
```

## Key dimensions

| Element | Value |
|---|---|
| Page container | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4` |
| Grid | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3` |
| Card min height | `min-h-[140px]` |
| Card padding | `p-4` |
| Card surface | `bg-foreground/[0.02]` (more transparent than lists) |
| Card hover | `bg-foreground/[0.05]` + `border-primary/30` |
| Avatar | `w-11 h-11 rounded-lg bg-gradient-to-br` |
| Author line | `text-[10px] uppercase tracking-wider text-foreground/30` |

## What to replicate (behind DEC_UI flag)

- Grid gap: `gap-3` (tighter than current `gap-6`)
- Card surface: `bg-foreground/[0.02]` (more transparent)
- Card min height: `min-h-[140px]`
- Flatten the "featured" section into the main grid — no separate hero row
- Keep the chevron-right affordance

## What to skip

- `BorderBeam` — killed globally in PR #100, stays killed
- `animate-fade-in` — removed globally, stays removed unless we add
  a quiet page-fade back
