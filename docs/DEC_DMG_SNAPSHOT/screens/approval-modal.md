# Approval Modal

**Dec source**: `/Users/rvaclassic/conductor/repos/UI/src/views/Dashboard/chat/components/ApprovalModal.tsx`
**WEBSITE current**: `src/components/ui/ToolApprovalModal.tsx`

## Trigger

When the LLM emits a `<tool_use>` block in its streamed response, the
tool-call parser extracts the intent, the approval modal appears, and
execution is blocked until the user clicks Allow Once or Deny.

## JSX hierarchy (Dec)

```
<Dialog>
  <DialogContent className="bg-[#0b0b0b] border border-border
                            rounded-lg p-6 shadow-lg max-w-lg">
    {/* Header */}
    <div className="flex items-center gap-4 mb-5">
      <div className="w-12 h-12 rounded-xl border
                      {/* risk-colored: orange for HIGH, amber for MEDIUM */}">
        <Icon size={22} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">Tool Permission Request</h3>
          <RiskBadge level={risk} />
        </div>
        <p className="text-xs text-foreground/50">Agent "{name}" requests access</p>
      </div>
    </div>

    {/* Action block */}
    <div className="p-4 rounded-xl bg-foreground/[0.03] border border-foreground/10 mb-4">
      <div className="text-[10px] uppercase tracking-widest text-foreground/40 mb-2">Action</div>
      <div className="flex items-center gap-3">
        <Icon /> {tool}.{action}
      </div>
    </div>

    {/* Params block */}
    <div className="p-4 rounded-xl bg-foreground/[0.03] border border-foreground/10 mb-4">
      <div className="text-[10px] uppercase tracking-widest text-foreground/40 mb-2">Details</div>
      {paramSummary.map(...)}
    </div>

    {/* Warning for write actions */}
    {isWrite && (
      <div className="flex items-start gap-3 p-3 rounded-lg
                      bg-orange-500/5 border border-orange-500/15 mb-4">
        <AlertTriangle className="text-orange-400" />
        <p className="text-[11px] text-foreground/60">Cannot be undone from Operator Uplift.</p>
      </div>
    )}

    {/* Actions */}
    <div className="flex items-center gap-3 pt-4 border-t border-foreground/5">
      <button onClick={onDeny}
              className="flex-1 h-10 rounded-xl
                         bg-foreground/5 hover:bg-red-500/10 border border-foreground/10
                         text-foreground/60 hover:text-red-400">
        <X /> Deny
      </button>
      <button onClick={onApprove}
              className="flex-[2] h-10 rounded-xl
                         bg-primary hover:bg-primary/90 text-white">
        <Check /> Allow Once
      </button>
    </div>
  </DialogContent>
</Dialog>
```

## Risk encoding

| Tool | Action | Risk |
|---|---|---|
| calendar | list, free_slots | LOW (auto-approved in Dec) |
| calendar | create | MEDIUM |
| gmail | list, read | LOW |
| gmail | draft | MEDIUM |
| gmail | send, send_draft | HIGH |
| x402 | fetch | MEDIUM (flows into payment approval) |

## What to replicate (behind DEC_UI flag)

- Migrate to Radix `<Dialog>` for accessibility + focus trap
  (already installed — `@radix-ui/react-dialog` is a dep)
- Surface color `bg-[#0b0b0b]` (slightly lighter than `#0A0A0A` bg)
- Use `rounded-lg` (not `rounded-2xl`)
- Clean bottom border on the action row with `pt-4 border-t border-foreground/5`

## WEBSITE divergence (keep)

- **No "Remember this agent" checkbox.** WEBSITE enforces per-action
  approval — every approval stands on its own. See `docs/UI_PARITY.md`
  (first pass) for the rationale.
- **x402 payment inline section** — WEBSITE shows query cost badge
  when `queryPrice > 0`. Dec predates x402 integration.
