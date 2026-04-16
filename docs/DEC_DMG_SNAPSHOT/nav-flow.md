# Nav Flow Map

## Shell

```
<div className="bg-background overflow-clip h-screen flex flex-col relative">
  <WindowNavbar />            {/* h-8 topbar, always visible */}
  <div className="flex-1 overflow-hidden">
    <Routes>                  {/* HashRouter */}
      <Route → <Dashboard id="/chat" /> />
      ...
    </Routes>
  </div>
</div>
```

Inside `<Dashboard>`:

```
<div className="h-[calc(100vh-32px)] flex flex-row">
  <div className="flex-shrink-0 border-r border-foreground/5 bg-background/50 backdrop-blur-sm">
    <Dock />   {/* w-14 fixed */}
  </div>
  <div className="flex-1 min-w-0 overflow-hidden">
    {/* active route */}
  </div>
</div>
```

## Dock items (in order)

Source: `/Users/rvaclassic/conductor/repos/UI/src/config/static.tsx:26`

| # | Title     | Icon        | Route         |
|---|-----------|-------------|---------------|
| 1 | Recent    | Sparkles    | `/recent`     |
| 2 | Uplift    | logo.svg    | `/chat`       |
| 3 | Hub       | LayoutGrid  | `/store`      |
| 4 | Trace     | Activity    | `/trace`      |
| 5 | Security  | Shield      | `/security`   |
| 6 | Audit     | ScrollText  | `/audit`      |
| 7 | Workspace | Puzzle      | `/workspace`  |
| 8 | Profile   | User        | `/profile`    |

Commented out in `static.tsx` (intentionally hidden):
- Projects (`/packages`, `Package` icon)
- Notifications (`/notifications`, `Bell` icon)

## Active state

Reading `/Users/rvaclassic/conductor/repos/UI/src/views/Dashboard/dock.tsx`
and `/Users/rvaclassic/conductor/repos/UI/src/components/ui/floating-dock.tsx`:

**No active-state highlight.** Icons simply transition to
`text-primary` on hover. There is no "current route" pill or glow.

The dock is presentational — navigation is the only purpose.

## Default landing

React Router loads `/chat` as the default route after auth. There
is no separate "home" or "dashboard" view — the chat surface IS
the landing.

## What's in the topbar

Source: `/Users/rvaclassic/conductor/repos/UI/src/views/Wrapper/WindowNavbar.tsx`

Left side:
- Logo (`w-4 h-4`)
- App name ("Operator Uplift") at `text-[11px] font-semibold`
- `<StatusChip size="sm" />` — connection state indicator

Right side:
- `CmdKHint` — ⌘K hint, `font-mono`, `text-[9px]`
- `PanicButton` — emergency lock-all button
- `GoldenPathButton` — walkthrough trigger
- `UserAvatar` — orange initials circle + auth badge
- Window controls (Minimize/Maximize/Close) on Electron only

Height: `h-8` (32px) fixed, `drag-region` so the Electron frame
stays draggable.

## Click paths

### First-time user, new install
1. App launches → `/chat` (default)
2. Model indicator shows "No model selected" state
3. Clicking the model indicator opens a dropdown → pick a provider
4. User types → chat streams from the chosen model
5. Agent emits a `tool_use` block → `ApprovalModal` appears
6. User approves → action executes → audit logged

### Power user, returning
1. App launches → `/chat` (last-used route persists in state)
2. `AgentActivityPanel` expanded on right (`w-72`) showing recent
   agent runs
3. User can ⌘K → command palette
4. Clicking Hub icon in dock → `/store` → agent library

### Settings flow
1. Click Profile icon → `/profile` → lands in a split-view:
   - Left: `SettingsSidebar` (`w-52 lg:w-56`) with Account / Demo Mode /
     Security / Data / System tab groups
   - Right: active tab content

## Routes NOT present in Dec build

Routes the current WEBSITE has that Dec does NOT:
- `/app` (we use as landing; Dec lands on `/chat`)
- `/agents`, `/agents/builder`, `/agents/[id]` (Dec uses `/store` +
  in-line flows)
- `/marketplace` (Dec calls it `/store`)
- `/swarm` (Dec doesn't have a swarm view; closest is `/trace`)
- `/memory` (Dec surfaces memory inside Settings)
- `/integrations` (Dec calls it `/workspace`)
- `/analytics`, `/notifications`, `/workflows`
- `/login`, `/signup`, `/paywall` (Dec assumes local install)

Routes Dec has that WEBSITE does NOT:
- `/recent` — home/dashboard view
- `/trace` — agent run timeline
- `/audit` — separate from Security (we combined them)
- `/workspace` — installed agents management
- `/voicechat` — voice-mode chat

**Fix plan (PR 2):** Keep existing routes. Add a thin redirect
`/app → /chat` when `NEXT_PUBLIC_DEC_UI=1`. Do NOT delete routes.
Route renaming is deferred.
