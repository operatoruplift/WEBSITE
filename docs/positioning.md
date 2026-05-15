# Positioning — canonical one-liner

**Locked decision: `AI that runs on your terms.`**

This is the canonical short one-liner across every surface. Do not propose replacements without explicit founder approval — the line has been deliberately chosen and survived multiple revision cycles. Future copy work should align to it, not relitigate it.

## Why this line

- **Audience:** consumers of AI products (broad on purpose — the wedge is consumer-first; enterprise is expansion).
- **Core value:** AI that works the way the user wants it to work.
- **Differentiation:** "on your terms" carries the load: BYOK provider choice, per-action approval, signed receipts, channel agnostic, model agnostic. The line is intentionally compact rather than naming every pillar.
- **Length:** 28 chars. Fits anywhere — hero, X bio, Product Hunt, deck cover, OG image, schema.org.

## Surface coverage

| Surface | Status | Line |
|---|---|---|
| Hero (`src/sections/Hero.tsx`) | aligned | "AI that runs on your terms." |
| FinalCta (`src/sections/FinalCta.tsx`) | aligned | "AI that runs on your terms." |
| OpenGraph image (`app/opengraph-image.tsx`) | aligned | "AI that runs on your terms" |
| Deck slide 1 (`docs/deck-objections.md`) | aligned | "AI that runs on your terms." |
| `app/layout.tsx` title default | **aligned by this PR** | "Operator Uplift, AI that runs on your terms" |
| `README.md` hero | **aligned by this PR** | "AI that runs on your terms." |

## Longer descriptions (sub-canonical, vary per surface)

Below the one-liner, surfaces use a longer description that varies based on space and audience. The line below is allowed to differ; the one-liner above is not. Current long descriptions in production:

- `app/layout.tsx` description: "An AI assistant that drafts your email, schedules your meetings, and sends your follow-ups. Approval before every action; signed receipt afterward."
- `app/layout.tsx` openGraph + twitter description: "AI that drafts your email and schedules your meetings. Approval before every action; signed receipt afterward."
- README hero paragraph: covers real Gmail/Calendar tool execution, per-action approval, dual-mirror receipts, and 0G AgenticID.

These are appropriate to the surface. The canonical short line carries brand recall; the longer descriptions carry the trust-stack detail when there's room.

## Operator-side surfaces (require your action)

These live outside the codebase. Use "AI that runs on your terms." consistently:

| Surface | Action |
|---|---|
| X bio (@OperatorUplift) | "AI that runs on your terms. Real Gmail + Calendar. Tap to approve. Signed, on-chain receipt. operatoruplift.com" |
| Pinned tweet | "Operator Uplift: AI that runs on your terms. Every action waits for your tap and ships an on-chain receipt anyone can verify. Built on 0G Storage + 0G AgenticID. https://operatoruplift.com/demo/hackathon" |
| LinkedIn company tagline | "AI that runs on your terms" |
| Product Hunt tagline | "AI that runs on your terms" (28 chars; fits within PH's 60-char cap) |
| Pitch deck cover slide | "AI that runs on your terms" as subtitle under the wordmark |
| 0G submission form (short description) | "AI that runs on your terms" as the opening line, then the trust-stack paragraph from the README |

## Audit history (for the record)

Earlier in this branch we considered four alternatives — A/B/C/D — that mentioned "Gmail and Calendar" or "verifiable AI" or "approve / prove" rhymes. **All rejected.** The founder's view is that the canonical line is the existing one and the audit's job was confirming alignment across surfaces, not replacing the line. This doc records that decision so future contributors don't relitigate.

If a future surface needs more concrete copy (e.g. a hero subhead with verbs), the right place to add it is *under* the canonical line, not *replacing* it.
