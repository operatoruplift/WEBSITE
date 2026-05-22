# Brand: Commitment Infrastructure

**Date locked**: 2026-05-22 (updated 2026-05-22 evening with the Operator Protocol consumer-product layer)
**Source**: founder brief (2026-05-22) + Operator Uplift OS + Branding zips (2026-05-22 evening)
**Status**: canonical. Supersedes [`PIVOT_GAMIFY_GROWTH.md`](./PIVOT_GAMIFY_GROWTH.md) (2026-05-21) and [`positioning.md`](./positioning.md) (pre-pivot AI-assistant voice).

## TL;DR

Operator Uplift is **commitment infrastructure** for VCs and partners (deck v3 frame), and **Operator Uplift OS / The Operator Protocol** for end users (LevelUp app frame, Solo Leveling–inspired). Same plumbing underneath: stake → upload proof → AI Game Master verifies → settle (honor or redistribute). The investor frame leads with consequences; the consumer frame leads with hunters, quests, ranks, and a survivor pool.

## Two coexisting frames

| Surface | Frame | Tagline | Vocabulary |
|---|---|---|---|
| Investor / press / GitHub README / OG cards / deck v3 | **Commitment infrastructure** | Keep your word. Bet on yourself. | stake · proof · AI verifies · pooled redistribution · protocol fee |
| Consumer / iOS + Android app / /goals dashboard / LevelUp landing | **Operator Uplift OS · The Operator Protocol** | Solo Leveling-inspired protocol for everyday quests. | hunter · quest · rank E→S · XP · class (scholar / hunter / envoy / monarch / tide) · AI Game Master · survivor pool · $XPER · Iron Crucible |

The website (`operatoruplift.com`) ships the **investor frame** because that's what first-time visitors and press read; the consumer frame lives in the iOS + Android apps when they ship, and in any `/app`, `/goals`, or future product-tour route on the web.

## Canonical copy

| Surface | Copy |
|---|---|
| Tagline | **Keep your word. Bet on yourself.** |
| Positioning label | **Commitment infrastructure** |
| Eyebrow / vision tag | **// COMMITMENT INFRASTRUCTURE** |
| One-line mechanic | Stake money on your commitments. Upload proof. AI verifies follow-through. If you fail, your stake is redistributed to operators who kept theirs, minus a small protocol fee. |
| OG headline | Keep your word. / Bet on yourself. |
| OG footer | OPERATORUPLIFT.COM · iOS · ANDROID · WEB · COMING SOON |

## Brand values

| Value | What it means |
|---|---|
| **Consequence** | The platform makes broken commitments cost something real. Money, reputation, both. |
| **Accountability** | Every check-in produces evidence. Every judgment is reasoned out loud. Every dispute has an appeal path. |
| **Trustless follow-through** | The user does not have to trust themselves, the people they made promises to, or the company. Stakes sit in escrow; AI verifies on uploaded proof; payouts settle automatically. |

## Brand voice rules

1. **Lead with the value, not the mechanic.** "Keep your word" before "stake money."
2. **Do not sound predatory.** The company does not profit from user failure. Pooled redistribution + small protocol fee is the model. Say this out loud everywhere it matters (homepage hero, FAQ, blog, deck).
3. **Wider than crypto.** Audiences: habit-builders, freelancers, creators, operators, service providers. Not "Gen Z and Millennials." Not "AI for productivity." Say "anyone who needs trusted follow-through and is tired of trusting themselves."
4. **No "gamification" framing.** The mechanic is consequence + verification, not points + streaks. Stakes are real money. Verification is real evidence. Streaks may exist as a UX surface but are not the brand.
5. **No "AI assistant" framing.** The AI is an impartial **Game Master** that adjudicates evidence and streams reasoning back to the user. It does not run errands; it judges proof.
6. **Plain English everywhere.** No "AI Operating System." No "questline." No "ambition." Use "commitment," "stake," "proof," "verification," "redistribution," "appeal." The mechanic is the language.
7. **Honesty about the money.** Failed stakes → pooled → redistributed to operators who kept their word during the same period. Small protocol fee covers operations (verification compute, settlement gas, support).

## Retired vocabulary

These appeared in earlier brand iterations and must not return to homepage, OG metadata, FAQ, or marketing pages:

- "AI that runs on your terms" (v7 AI-assistant lead)
- "AI assistant that drafts your email" (retired AI-assistant positioning)
- "Gamify Your Growth" (2026-05-21 LevelUp pivot, superseded)
- "AI-powered personal development for Gen Z and Millennials" (audience too narrow)
- "step-by-step questline" / "questline generator" (game-jargon)
- "Personal development, gamified" (eyebrow text from the 2026-05-21 pivot)
- "Multi-agent orchestration," "AI Operating System," "Self-Hosted Local-first AI" (dev/sci-fi vocabulary, retired in PRs #147–#271)
- "Founder Ops," "Commander," "Warp Network," "Uplift Core" (retired)

## Retired audience framings

- "Gen Z and Millennials" (too narrow; widens to all habit-builders, freelancers, creators, service providers, operators)
- "Productivity power users" (wrong frame; this is consequence, not productivity)
- "Crypto-native operators only" (the brand explicitly invites non-crypto via card payments)

## Required FAQ shape

The homepage FAQ has exactly four founder-required questions (locked 2026-05-22, see [`src/sections/faq-data.ts`](../src/sections/faq-data.ts)):

1. **How do the stakes work?**
2. **Where does the money go when someone fails?**
3. **How does AI verification work?**
4. **Who is this for?**

Supporting questions (habit-tracker compare, appeal flow, crypto onboarding, privacy) belong on `/docs` surfaces, not the homepage scroll.

## What carries forward from the trust stack

The hackathon plumbing (Solana audit roots, Filecoin + 0G Storage receipt mirrors, ed25519-signed receipts, Arkiv user-owned memory, ERC-7857 AgenticID) is real and supports the commitment-infrastructure brand: stakes settle on Solana devnet, every check-in produces a signed receipt, receipts mirror to two independent decentralized storage networks. A judge or auditor can verify any verdict against bytes the company does not control. This is the "trustless follow-through" pillar made concrete. See [`HACKATHON_GATE2.md`](./HACKATHON_GATE2.md) for the verifier cookbook.

## Surfaces that read from this doc

- `app/page.tsx` composition + per-section components in `src/sections/`
- `app/layout.tsx` metadata (description, OG, Twitter, JSON-LD WebApplication)
- `app/opengraph-image.tsx` (OG card)
- `src/components/Hero.tsx` (canonical tagline + sub-headline)
- `src/sections/FaqSection.tsx` reading `src/sections/faq-data.ts`
- `src/services/dataService.ts` (hero subhead one-liner)
- `app/blog/posts.ts` (canonical pivot story, pooled-stakes guide)
- README.md (top-level project lead)

## Companion specs

- `tests/e2e/consumer-copy.spec.ts` — homepage uses canonical tagline + positioning label; OG metadata + JSON-LD match.
- `scripts/copy-check.mjs` — em-dash guard + retired vocab guard (see `BANNED_TERMS` list).
- Per-section hermetic specs lock the canonical voice on `/`, `/pricing`, `/blog`, `/docs`.

## When to update this doc

- Tagline changes → update everywhere this doc lists, then this doc.
- Audience widens further → update "wider than crypto" section + retired-audience list.
- Mechanic changes (e.g. moving away from pooled redistribution) → escalate; this is the brand pillar, not a copy tweak.

Per project rules, brand sweeps land as a single focused PR that updates this doc, the surfaces it lists, and the specs at the same time. Drift one without the others and the consumer-copy spec or copy-check will fail CI on the next push.
