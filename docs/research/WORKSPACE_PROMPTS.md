# WORKSPACE_PROMPTS.md

**Status: skeleton. Fleshed out after Wave 1 / Wave 2 so the prompt templates reference real patterns.**

Global governance (applies to every workspace):

1. Never claim implementation unless there's a commit hash + diff + PR link.
2. Never claim a source was read unless you can cite file paths, symbols, or quoted text.
3. One workspace per PR. No cross-repo PRs.
4. Trust-critical surfaces are **frozen** unless a backlog item explicitly requests a change: receipts, Merkle anchor, x402 semantics, capabilities rules, AuthGate rules, cron schedule, pricing.
5. If something is simulated, label it `SIMULATED`. Never fake tool execution.

---

## Template skeleton (applies to every workspace)

```
GOAL: <one sentence>

HARD RULES
1) One workspace only: <name>
2) Forbidden: receipts, Merkle, x402 semantics, capabilities, AuthGate, cron, pricing (unless explicitly allowed)
3) One PR only. Timebox <hours>
4) No refactors. No dependency churn unless required.

CONTEXT
- Pattern(s): <name + sources>
- Backlog item: <ID>

BUILD
A) <step>
B) <step>

ACCEPTANCE TEST
1) <manual step>
2) <expected>

ROLLBACK
- How to revert safely (files, flags)

DELIVERABLE
- PR link + checklist + screenshots/logs
STOP.
```

---

## Per-workspace templates (populated in Wave 2)

1. **WEBSITE** — marketing + /try + /chat UI + /settings + paywall UX + diagnostics.
   Forbidden: receipts, Merkle, x402 semantics, capabilities, AuthGate, cron, pricing.
   Required: `X-Request-Id` envelope + calm copy on errors; references DESIGN.md.
2. **UI** — shared components, tokens, layout primitives, aceternity, magicui.
   Rules: no business logic changes; document new deps.
3. **webview** — embedded surfaces, desktop-to-web bridges.
   Rules: explicit permission + toggle for any bridge; no silent data export.
4. **DMG/Tauri** — offline demo theater, local-first capture.
   Rules: screenshots OFF by default; "Delete all local data" button; demo never requires cloud.
5. **core** — schemas, capability defs, receipt structures.
   Rules: HIGH risk; only change with an explicit backlog item + migration plan.
6. **calendar_agent** — calendar briefing loop, parsing, free-busy, approvals.
   Rules: never write without approval; always return `X-Request-Id` envelope; deterministic fallbacks when Google not connected.
7. **x402-agent** — invoices, payment verification, subscription gating.
   Rules: do not change pricing; do not change receipt semantics; never log token bodies; always envelope errors.
8. **project_space** — documents, notes, memory objects, local vault indexing.
   Rules: local-first defaults; clear deletion semantics; no silent sync.
9. **developer_console** — admin tools, Part 2 runner, iMessage transport status, reliability dashboards.
   Rules: admin-gated; no PII in logs; show requestId + last 20 events.

Wave 2 fleshes out the "Allowed files," "Forbidden areas," "How to run tests," and "Required PR body sections" for each template.
