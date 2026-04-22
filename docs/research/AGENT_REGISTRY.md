# Agent Registry

Single source of truth for which agents ship. Lives in `config/agents.ts`.

## Rules

- **Every agent in `LIVE_AGENTS` with `isLive: true` is wired end-to-end.**
  Clicking its card in the store lands in a working experience (the chat
  page with the test prompt pre-filled). Sending that test prompt returns
  a non-error response, possibly simulated.
- **`isLive: false` means hidden, not "coming soon".** The store never
  renders such entries. If an agent isn't finished, it stays off the store.
- **Never add `isLive: true` optimistically.** The PR that flips the flag
  is the same PR that wires the full path.

## Fields

| Field | Purpose |
|-------|---------|
| `id` | Stable ID used in the deep-link query string (`/chat?agent=<id>`). |
| `name`, `description`, `avatar` | Card copy. |
| `category` | Grouping + filter. |
| `isLive` | Boolean source of truth for store visibility. |
| `surfacesEnabled` | Which client surfaces the agent works on: `web`, `imessage`, `dmg`. |
| `requiresLogin`, `requiresKey`, `requiresGoogle` | Dependencies. Triggers the gating route when unmet. |
| `testPrompt` | Seeded into the chat textarea on deep-link click. Acts as the canonical "try me" prompt. |
| `tags` | Search terms shown on the card. |

## Gating routes

`dependencyRoute(agent, caps)` returns the deep-link to the calm gating
screen when a dependency is missing. Precedence:

1. `requiresLogin` + no token → `/login`
2. `requiresGoogle` + no Google connection → `/integrations`
3. `requiresKey` + no server LLM key → `/settings`

If none of those apply, the card shows "Try in Chat" instead of a gating
CTA. The store never dead-ends: every card routes somewhere actionable.

## Live agents (W1A-agents-1)

| ID | Name | Test prompt | Surfaces |
|----|------|-------------|----------|
| `briefing` | Daily Briefing | `What's on my calendar today?` | web, imessage, dmg |
| `inbox` | Inbox Triage | `Draft replies to my last 3 emails, ask me before sending.` | web, dmg |
| `reminders` | Morning Nudges | `Turn tomorrow morning into iMessage-style nudges: weather, calendar, one fun thing.` | web, imessage |
| `tokens` | Token Lookup | `What's the price of SOL right now and what's the risk grade on the top market?` | web, dmg |
| `web` | Web Researcher | `Summarize the front page of operatoruplift.com in 3 bullets.` | web, dmg |

All five have `requiresLogin: false` / `requiresGoogle: false` /
`requiresKey: false` so the simulated path is usable without any setup.
Signed-in users with Google connected run the same agents for real.

## Manual acceptance checklist

For each live agent in the store:

1. Navigate to `/agents` (logged out and logged in). Card renders with
   "Try in Chat" CTA, not a gating CTA.
2. Click the card. URL becomes `/chat?agent=<id>&prompt=<text>`, toast
   says `<Agent Name> ready. Edit the prompt or send as-is.`, textarea
   pre-fills with `testPrompt`.
3. Send the prompt as-is. Simulated mode returns the canned beat for
   briefing/inbox/reminders, and a simulated result for tokens/web.
4. Tool approval modal (if the canned beat emits one) says "Simulated"
   and Approve returns a mock result. No `/api/*` calls on the wire.

## Deep link contract

```
/chat?agent=<id>&prompt=<urlencoded>
```

`app/(dashboard)/chat/page.tsx::useEffect` reads both, pre-fills the
input, toasts the agent name, then strips the params from the URL so a
refresh doesn't re-seed.

## Related surfaces

- `/marketplace` still shows the Supabase-backed community catalogue.
  The registry will be its source of truth in a follow-up PR. For now,
  `/agents` is the canonical "what's live" surface.
- `/agents/builder` is the custom-agent creator, unchanged.
- `/agents/[id]` is the per-agent detail page, unchanged.

## Rollback

```
git revert <W1A-agents-1 commit>
```

Reverts `config/agents.ts`, the `/agents` page rewrite, and the
deep-link read in `/chat`. Nothing else touched.
