# Positioning — one-liner audit for the 0G APAC hackathon

Dragon's bar (advice for the final 5 days):

> Force yourself to describe the project in a single sentence. That line should work everywhere: hero section, project description, X bio, pinned tweet, deck cover. A good one-liner = **audience + core value + differentiation**.

This doc audits every tagline currently in production, applies that framework, and proposes a canonical one-liner with variants for each surface.

## Current inventory

Two competing one-liners are in active use plus a longer meta description:

| Variant | Surface | Length |
|---|---|---|
| "AI that runs on your terms." | `src/sections/Hero.tsx`, `src/sections/FinalCta.tsx`, `app/opengraph-image.tsx`, deck slide 1, `docs/deck-objections.md`, `docs/demo-day-walkthrough.md` | 28 chars |
| "AI for your inbox and calendar. You stay in charge." | `README.md`, `app/layout.tsx` (title) | 52 chars |
| "AI assistant that drafts your email, schedules your meetings, and sends your follow-ups. Approval before every action; signed receipt afterward." | `app/layout.tsx` (description, og:description, twitter:description, schema.org) | 144 chars |

The longer meta description is the only line that names what the assistant actually does (drafts email + schedules meetings) and what's different about it (approval + signed receipt). The two short lines are vibes-only.

## Dragon's framework applied

| Candidate | Audience | Core value | Differentiation | 0G judge fit |
|---|---|---|---|---|
| "AI that runs on your terms." | implied (everyone) | "AI" (vague) | "your terms" (vague) | zero |
| "AI for your inbox and calendar. You stay in charge." | inbox/calendar users (specific) | "AI for inbox/calendar" (specific) | "you stay in charge" (vague) | zero |
| Long meta description | inbox/calendar users (specific) | concrete tools | approval + signed receipt | partial (no "on-chain" hook) |

None of these tell a 0G judge **why 0G specifically**. That's the gap.

## What's different about this build (the differentiation we should claim)

From the README:

- **Real tool execution** — Google Calendar and Gmail through their actual APIs, not a chat-only fake.
- **Per-action approval** — every write surfaces a modal with the exact params, cost, and chain. One tap to confirm. No "remember this agent."
- **Dual-mirror archived receipts** — ed25519-signed, mirrored to Filecoin AND 0G testnet, plus a Merkle root on Solana devnet. A judge verifies the bytes against either mirror without trusting our database.
- **Optional on-chain agent identity** — each agent's hashed identity (name, description, capabilities, system prompt, model) can be minted as an ERC-7857 Intelligent NFT on 0G Galileo Testnet.

The trust stack is the differentiator. A one-liner that doesn't gesture at it leaves the 0G hackathon hook on the table.

## Four candidates

Each candidate is evaluated against: audience clarity, core value clarity, differentiation clarity, fit on hero / X / Product Hunt / deck cover, and 0G judge fit.

### A. "AI for your Gmail and Calendar — your tap to approve, our receipt to prove."

- **Audience:** Gmail/Calendar users (explicit, narrower than "inbox")
- **Core value:** AI for Gmail + Calendar (concrete)
- **Differentiation:** approve/prove rhyme captures consent + proof in 5 words
- **Length:** 76 chars (fits everywhere)
- **0G fit:** "receipt to prove" hints at verifiable archive
- **Tradeoff:** the rhyme might read cute to some audiences; doesn't say "on-chain" explicitly

### B. "Verifiable AI for your inbox and calendar — every action gated by your tap, signed, and mirrored on-chain."

- **Audience:** inbox/calendar users
- **Core value:** AI for inbox/calendar
- **Differentiation:** "verifiable" upfront + "signed" + "mirrored on-chain"
- **Length:** 109 chars
- **0G fit:** high — "verifiable AI" + "on-chain" are direct hackathon hooks
- **Tradeoff:** "verifiable" is dev-y; might lose consumer audience

### C. "The AI assistant for your Gmail and Calendar — every action waits for your tap, then ships a verifiable on-chain receipt."

- **Audience:** Gmail/Calendar users
- **Core value:** AI assistant for Gmail/Calendar
- **Differentiation:** "waits for your tap" + "verifiable on-chain receipt"
- **Length:** 125 chars
- **0G fit:** high
- **Tradeoff:** longer; reads like marketing copy; "ships" jargon

### D. "An AI agent for Gmail and Calendar that proves what it did — with a signed, on-chain receipt for every action."

- **Audience:** Gmail/Calendar users
- **Core value:** AI agent that takes actions
- **Differentiation:** "proves what it did" + signed + on-chain
- **Length:** 116 chars
- **0G fit:** high
- **Tradeoff:** "proves what it did" is the strongest verb but assumes the reader cares about provability

## Recommendation

**Use A as the canonical short one-liner. Use C or D as the hero subhead.**

A is short enough to work as X bio, Product Hunt tagline, deck cover, and hero supertitle. The approve/prove rhyme is memorable and captures both pillars in 76 chars. The 0G hook is implied via "receipt to prove" without making the line feel dev-y.

C and D are the longer subheads to use under A on the hero. C reads slightly less developer-coded; D leads with the strongest verb. Pick one.

## Surface plan

After picking (you decide, we then propagate in a follow-up PR):

| Surface | Use |
|---|---|
| Hero supertitle | A — "AI for your Gmail and Calendar — your tap to approve, our receipt to prove." |
| Hero subhead | C or D, whichever you prefer |
| README hero line | A (replaces "AI for your inbox and calendar. You stay in charge.") |
| FinalCta supertitle | A (replaces "AI that runs on your terms.") |
| OpenGraph image text | A (replaces "AI that runs on your terms") |
| `app/layout.tsx` title | "Operator Uplift — AI for your Gmail and Calendar" |
| `app/layout.tsx` description | A (replaces the long meta description) |
| X bio (160 chars) | "AI for your Gmail and Calendar. Your tap to approve. Our receipt to prove. Signed, on-chain, model-agnostic. operatoruplift.com" |
| Pinned tweet | "Operator Uplift: AI for your Gmail and Calendar. Every action waits for your tap, then ships an on-chain receipt anyone can verify. Built on 0G Storage + 0G AgenticID. https://operatoruplift.com/demo/hackathon" |
| Product Hunt tagline (60 chars) | "AI for Gmail and Calendar — approve once, verify forever." |
| Pitch deck cover | A as the slide subtitle under the wordmark |
| 0G submission form (project description) | A as the first sentence, then the longer trust-stack paragraph from the README |

## Why not the existing lines

**"AI that runs on your terms"** — this was correct for an earlier positioning where the differentiator was "switch models freely" (BYOK). After PRs #569-#588 the differentiator shifted to the trust stack. The current line is now stale relative to what we actually built.

**"AI for your inbox and calendar. You stay in charge."** — "you stay in charge" is fuzzy. It could mean BYOK, per-action approval, or just "consumer-first." Judges parse it as a generic claim. The new line replaces the fuzziness with the concrete rhyme.

## Decision needed

Pick one of A, B, C, or D for the canonical short line. Pick one of C, D, or "skip subhead for now" for the hero subhead. Once locked, the propagation PR rewrites every surface in the table above in a single sweep.

Defer items (require operator action after lock):
- Update X bio
- Update LinkedIn tagline / company page
- Update Product Hunt draft (if pre-launching)
- Update pitch deck cover slide
- Update the 0G submission form's "short description" field
