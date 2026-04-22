# Demo Script

Deterministic walkthrough of the Operator Uplift simulated-mode chat flow.
Used for Demo Day recordings, Playwright regression, and any time you want
a network-free run of the product.

## Contract

In simulated mode (no auth token in `localStorage`), the chat experience
is entirely client-side:

- **Zero `/api/*` calls.** Not even `/api/capabilities`. The chat page
  infers simulated mode from the missing token and sets `DEMO_CAPABILITIES`
  locally.
- **Canned replies only.** `lib/cannedReplies.ts::getCannedReply` is the
  single source of truth for what text the assistant returns for each
  prompt beat (briefing / inbox / reminders / fallback).
- **Tool calls run `executeMock`.** `lib/cannedReplies.ts::DEMO_TOOL_MOCKS`
  returns the simulated tool result after a short delay, so Approve to
  result transition feels like a real round-trip.
- **UI never says "Demo".** The pill reads `Simulated`. The banner reads
  `Every reply and tool action is simulated.` The only exception is an
  internal setting toggle label if one ever ships.

## How to run locally

```bash
# One terminal: start dev server
pnpm dev

# Another terminal: run the Playwright demo spec
pnpm exec playwright test tests/e2e/demo-flow.spec.ts --reporter=list
```

Against a preview URL:

```bash
PLAYWRIGHT_BASE_URL=https://preview.operatoruplift.com \
  pnpm exec playwright test tests/e2e/demo-flow.spec.ts --reporter=list
```

## Expected outputs

### Test 1, simulated chat, zero `/api/*` calls

- Navigates to `/chat` with no auth token
- Asserts the `Simulated` pill renders (`data-testid="simulated-indicator"`)
- Types `What's on my calendar today?` into the chat box
- Clicks the send button
- Asserts these strings render in the assistant bubble, verbatim:
  - `Here's what's on your calendar today:`
  - `9:00 AM`
  - `1:1 with Sarah`
- Asserts the `/api/*` request log is empty at the end of the test

### Test 2, tool approval modal, no network on deny

- Same prompt opens the approval modal on the briefing's `calendar.list`
  tool_use block
- Asserts `Tool Permission Request` is visible
- Asserts `Simulated` pill is visible inside the modal
- Clicks Deny
- Asserts the modal closes and still zero `/api/*` calls were made

## Canned reply beats

| User prompt keyword | Beat | Canned text opener | Tool blocks |
|---------------------|------|--------------------|-------------|
| "brief", "calendar today", "agenda" | `briefing` | `Here's what's on your calendar today:` | `calendar.list` |
| "inbox", "email", "draft", "reply" | `inbox` | `Three emails need a reply.` | 3x `gmail.draft` |
| "reminder", "nudge", "horoscope" | `reminders` | `Ok, three iMessage-style nudges scheduled...` | 3x `reminders.schedule` |
| Anything else | `fallback` | `Every reply here is simulated.` | none |

Full text lives in `lib/cannedReplies.ts::getCannedReply`.

## Recording walkthrough

For the 60-second Demo Day video:

1. Open `/chat` in a fresh incognito window (no token).
2. Wait for the Simulated pill to appear.
3. Click the `Briefing` prompt suggestion chip.
4. Press Enter.
5. Wait for the canned briefing to stream in.
6. Click Approve on the `calendar.list` modal. The Simulated pill inside
   the modal confirms no real Google call happens.
7. The tool result renders below the assistant message with a `Simulated`
   badge.
8. Move to the input box, type `Draft replies to my inbox`.
9. Press Enter. Three `gmail.draft` modals queue up.
10. Approve each one to watch the same no-network path trigger the mock
    draft results.

## Em-dash rule + grep

See `docs/research/COPY_RULES.md`. Shorthand:

```bash
# Must return zero in src/ and app/
grep -rn "—\|–" src/ app/ --include="*.ts" --include="*.tsx"
```

## Rollback

If the simulated-mode bypass ever causes a regression on real chat:

```bash
git revert <commit>
```

The only behavioral change vs. pre-W1A-demo-1b master is in
`app/(dashboard)/chat/page.tsx::handleSend` and the `useEffect`
that fetches capabilities. `/api/chat` server-side canned-reply branch
is unchanged, so a rollback leaves it working the old way.
