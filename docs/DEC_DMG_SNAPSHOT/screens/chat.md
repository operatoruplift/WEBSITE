# Chat — `/chat`

**Dec source**: `/Users/rvaclassic/conductor/repos/UI/src/views/Dashboard/chat/index.tsx`

## JSX hierarchy

```
<div className="relative h-full w-full flex flex-row overflow-hidden">
  <div className="absolute inset-0 pointer-events-none">
    <BackgroundBeams className="opacity-40" />
  </div>

  <div className="relative z-10 flex flex-col flex-1 min-h-0 min-w-0">
    {/* Header row — model indicator */}
    <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 pt-3 pb-1">
      <span className="text-[10px] uppercase tracking-wider text-foreground/40">Inference</span>
      <ModelIndicator />
    </div>

    <MessageList />    {/* flex-1, max-w-2xl lg:max-w-3xl mx-auto, px-4 py-6 */}
    <ApprovalModal />
    <SendInput />      {/* flex-shrink-0 px-4 py-4 sm:px-6 sm:py-5 */}
  </div>

  <div className="relative z-10 flex-shrink-0">
    <AgentActivityPanel />   {/* w-10 collapsed, w-72 expanded */}
  </div>
</div>
```

## Message bubbles

```tsx
{/* User */}
<div className="max-w-[90%] sm:max-w-[80%] px-3 py-2
                rounded-2xl rounded-br-md
                bg-orange-500/15 border border-orange-500/20
                text-foreground">

{/* Assistant */}
<div className="max-w-[90%] sm:max-w-[80%] px-3 py-2
                rounded-2xl rounded-bl-md
                bg-foreground/[0.04] border border-foreground/5
                text-foreground/90">
```

## Send input

```tsx
<Spotlight className="relative rounded-2xl">
  <div className="flex items-end gap-2 p-2 sm:p-2.5 rounded-xl
                  bg-foreground/[0.05] border border-foreground/10">
    <ModelSelector />
    <Textarea placeholder="Ask anything. Do anything." />
    <button>Demo (Sparkles icon)</button>
    <button className="bg-orange-500 hover:bg-orange-600 text-white
                       uppercase tracking-wider">
      Run (Send icon)
    </button>
  </div>
</Spotlight>
```

## Key dimensions

| Element | Value |
|---|---|
| Message column max width | `max-w-2xl lg:max-w-3xl` (672px / 768px) |
| Message column padding | `px-4 py-6` |
| Message bubble max width | `max-w-[90%] sm:max-w-[80%]` |
| Send input padding | `p-2 sm:p-2.5` container, `px-4 py-4 sm:px-6 sm:py-5` outer |
| Header row padding | `px-4 sm:px-6 pt-3 pb-1` |
| Header eyebrow text | `text-[10px] uppercase tracking-wider text-foreground/40` |

## What to replicate (behind DEC_UI flag)

- Message column: `max-w-2xl lg:max-w-3xl mx-auto`
- User bubble: stronger orange-tint
- Header: `text-[10px]` "Inference" eyebrow, model indicator on the right
- Send input: solid `bg-orange-500` run button, no shadow, no gradient

## What to skip

- `BackgroundBeams` — too much atmosphere for consumer web
- `AgentActivityPanel` right rail — defer, Council transcript inline is enough
- `Spotlight` wrapper — removed globally in WEBSITE calm-UI pass
