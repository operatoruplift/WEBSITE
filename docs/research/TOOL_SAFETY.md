# Tool Safety Policy

Trust-UX companion to the server-side x402 + capabilities gate.
See `lib/toolSafety.ts` for the code, `src/components/ui/ToolApprovalModal.tsx`
for the UI integration.

## Two classes

| Class | Definition | UI treatment |
|-------|-----------|--------------|
| **SAFE** | Read-only, cheap, reversible. No user-visible side effect if the call is repeated. | Normal one-click approve. |
| **RISKY** | Writes, sends, spends, or touches external state the user can't easily undo. | Stronger confirmation state + "what will happen" summary + explicit confirm before approve enables. |

**UNKNOWN** is a sub-case of RISKY — the action is not present in the
classification map at all. The UI adds a notice: _"This action is not
classified yet. Treating as risky."_ so the user knows we're not pretending
to have vetted it.

## Fail-closed default

`classifyToolAction` returns `'RISKY'` for anything not explicitly listed
in `KNOWN_ACTIONS`. That includes:

- A typo in `toolName` (`gmaill.list`)
- A new action the map hasn't caught up with yet (`calendar.decline`)
- A tool name fabricated by a prompt-injected message (`mysteryTool`)

Failing closed means a new unclassified action gets the stronger UI,
not a free pass. Adding an entry to the map is the mechanism for
downgrading a newly shipped action to SAFE once a human has confirmed
it's read-only.

## Examples

### SAFE actions (normal approve)

```ts
classifyToolAction({ toolName: 'calendar', operation: 'list' });        // 'SAFE'
classifyToolAction({ toolName: 'gmail', operation: 'read' });           // 'SAFE'
classifyToolAction({ toolName: 'tokens', operation: 'price' });         // 'SAFE'
classifyToolAction({ toolName: 'web', operation: 'fetch' });            // 'SAFE'
```

### RISKY known (writes / sends)

```ts
classifyToolAction({ toolName: 'calendar', operation: 'create' });      // 'RISKY'
classifyToolAction({ toolName: 'gmail', operation: 'send' });           // 'RISKY'
classifyToolAction({ toolName: 'imessage', operation: 'send' });        // 'RISKY'
classifyToolAction({ toolName: 'x402', operation: 'pay' });             // 'RISKY'
```

### UNKNOWN (classified RISKY, shows "not classified yet")

```ts
classifyToolAction({ toolName: 'mysteryTool' });                        // 'RISKY'
classifyToolAction({ toolName: 'calendar', operation: 'decline' });     // 'RISKY'
classifyToolAction({ toolName: 'gmaill', operation: 'list' });          // 'RISKY' (typo)
```

## What this is NOT

- **Not a security boundary.** The authoritative gate is server-side:
  - x402 payment invoices on gated actions (`lib/x402/pricing.ts`)
  - Capabilities enforcement on sensitive scopes (`lib/capabilities.ts`)
  - Supabase RLS on any database write
  - Privy JWT verification on every API route
  A user can defeat the client-side classification by editing their own
  browser state. That's fine — the server refuses the call anyway.
- **Not a permission model.** It's a UX hint that decides how loudly
  the approval modal asks the user to think before clicking approve.
- **Not a replacement for the per-tool risk pill.** The existing
  `TOOL_META` risk (HIGH / MEDIUM / LOW) is about the blast radius of
  the tool as a whole (Gmail is more dangerous than Notes). Safety is
  about the specific action (gmail.list is SAFE, gmail.send is RISKY).
  Both signals are shown together.

## Adding a new tool

1. Add the action to `KNOWN_ACTIONS` in `lib/toolSafety.ts` with an
   explicit `SAFE` or `RISKY` classification. Default to `RISKY` if
   there is any ambiguity.
2. Add the tool bucket to `TOOL_META` in `ToolApprovalModal.tsx` with
   its icon, label, color, and risk pill.
3. Add a narrative entry in `buildNarrative` so the approval modal
   shows honest "will happen" / "data accessed" copy instead of the
   generic fallback.
4. If the action should cost money, wire the price into
   `lib/x402/pricing.ts` — that's the server-side gate.

## Escape hatch

There is intentionally no runtime override. If a user needs to run an
action we haven't classified, they see the "not classified yet" notice
and can still approve it by ticking the explicit-confirm checkbox. That
keeps UX honest: we don't silently mark things as safe behind the scenes.
