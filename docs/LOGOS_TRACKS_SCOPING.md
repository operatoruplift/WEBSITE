# Logos Press Tracks Scoping

**Status as of 2026-05-21**: nothing built. This doc captures the honest state so future sessions do not silently fabricate Logos submissions in deck or blog copy.

## What we shipped (1 of 8 hackathon tracks)

| Track | Status | Code | Doc |
|---|---|---|---|
| Arkiv (Network School Ethereum Hackathon, AI track) | shipped, operator step pending | `lib/arkiv/` + `/api/arkiv/*` + `/arkiv` + `scripts/arkiv/publish-agents.mjs` | `docs/ARKIV_SUBMISSION.md` |

Operator-side remaining: fund Braga wallet at `https://braga.hoodi.arkiv.network/faucet/`, set `ARKIV_PRIVATE_KEY` in Vercel, run `pnpm arkiv:publish-agents`. Until then `/arkiv` shows an honest empty state.

## What we did NOT ship (0 of 7 Logos tracks)

The 7 Logos Press LP prizes were pasted into an earlier session and noted as out-of-scope. None of them has any code or doc artifact in this repo. To make sure nobody silently picks one up as "shipped":

| Prize | Codename | What we know | What we need from operator |
|---|---|---|---|
| LP-0002 | unknown | prize text not in repo | paste full prize requirements + check for funded LEZ wallet |
| LP-0005 | unknown | prize text not in repo | same |
| LP-0008 | unknown | prize text not in repo | same |
| LP-0012 | unknown | prize text not in repo | same |
| LP-0013 | unknown | prize text not in repo | same |
| LP-0016 | unknown | prize text not in repo | same |
| LP-0017 | unknown | prize text not in repo | same |

This table is intentionally empty for the "what we know" column. We are not going to guess what each LP-XXXX maps to and write a fake submission against the guess. That is the fabrication-rot pattern this repo's marketing-honesty net is built to prevent.

## Why nothing is built

Three reasons, in order of how blocking each one is:

1. **No funded LEZ testnet wallet.** Every Logos track that touches Risc0 / zk-proofs needs a testnet account with gas to deploy a contract or submit a proof. We have a Solana devnet wallet and an Arkiv Braga testnet wallet (operator-side); neither covers LEZ.
2. **No Risc0 / zk-proof infrastructure** in the codebase. There is no proving setup, no verifier contract, no proof-submission harness. Adding any of these is multi-day work per track, before you write the actual prize-specific logic.
3. **No canonical prize-requirements doc** in the repo. The LP-XXXX codes appear in chat history but never landed as a markdown file. Operator needs to paste each prize's full text into this doc so engineering can plan against it.

Until 1 and 3 are resolved, no Logos track can ship. Pretending otherwise on a deck slide is exactly the kind of overclaim that gets a hackathon entry disqualified.

## Recommended path

### Option A: pick the 1-2 highest-leverage tracks, ship them properly

For each track the operator picks:

1. Operator pastes the LP-XXXX prize text into this doc under a per-track heading.
2. Engineering scopes infra needs (does it need LEZ? Risc0? a Linea / Status / Codex integration?).
3. Engineering files a tracking spec like `docs/ARKIV_SUBMISSION.md` and ships a first PR.
4. The submission only goes on the deck slide / blog once an entity / artifact actually exists, just like Arkiv.

This produces 1-2 *real* Logos submissions that survive judge scrutiny.

### Option B: skip Logos entirely, double down on Arkiv + payment portal

Arkiv is the one Network School track we can actually finish before the hackathon deadline. The other Network School wedge is the payment portal getting end-to-end production-ready (PR #647 just fixed the $19 / $50 invoice price gap; on-chain settlement against the Solana RPC is the next thing in that thread).

Argument for this path: a working payment portal + a working Arkiv entry is more compelling to a Network School judge than seven scaffolded Logos tracks with no working code.

### Option C: scope first, decide later

If neither A nor B is the right call yet, just paste the 7 prize texts into this doc and let engineering attach a per-track ship/skip recommendation. That decision is then made on evidence rather than gut feel.

## Honest copy rule for surfaces

Until any LP-XXXX prize lands as code, the following surfaces MUST NOT mention Logos:

- `/demo/hackathon` page (judge VerifyCards)
- `docs/deck-objections.md` (slide 4 framing)
- `docs/distribution-kit.md` (community outreach rows)
- README "Further reading" + TOC
- Any blog post under `/blog`

If a session attempts to add a Logos mention to any of those surfaces before this doc has a non-empty "What we know" column, the marketing-honesty net should reject the PR.

## Next step

Operator: paste the prize texts (or link the Logos Press prizes page) into this doc, and confirm whether a funded LEZ wallet exists. Without one of those inputs, no Logos work can start.
