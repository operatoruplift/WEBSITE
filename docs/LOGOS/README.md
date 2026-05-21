# Logos Press λPrize tracks

This directory captures the actual prize text + per-track design notes for the 7 Logos Press λPrizes we are evaluating. The prize text was pulled from session history once it landed in chat; nothing here is fabricated.

**These are NOT shipped entries.** Every track is LEZ-runtime work (Risc0/zk circuits + LEZ programs) that cannot ship from this Next.js website repo. The per-track docs are the prerequisite for opening a sibling Rust/LEZ project per track.

## Tracks

| Prize | Title | Likely fit | Design doc |
|---|---|---|---|
| LP-0002 | Private M-of-N Multisig | Adjacent — our trust-stack story benefits from per-tenant approval primitives, but the work is fully inside LEZ. | [LP-0002.md](./LP-0002.md) |
| LP-0005 | Private Token Balance Attestation | Adjacent — we could use the attestation primitive to gate Pro features without revealing wallet balances. | [LP-0005.md](./LP-0005.md) |
| LP-0008 | Autonomous AI Module | **Strong fit** — direct overlap with Operator Uplift's "agent with its own wallet + storage + messaging" architecture. The Arkiv entry (PRs #620-#646) is the off-LEZ analogue. | [LP-0008.md](./LP-0008.md) |
| LP-0012 | Event/Log mechanism | Infrastructure — relevant if we publish events from any LEZ contract we ship downstream. | [LP-0012.md](./LP-0012.md) |
| LP-0013 | Token program authorities | Infrastructure — likely needed for any token primitive we use in LEZ. | [LP-0013.md](./LP-0013.md) |
| LP-0016 | Anonymous Forum with Threshold Moderation | Tangential — interesting standalone product, low overlap with the trust-stack assistant. | [LP-0016.md](./LP-0016.md) |
| LP-0017 | Whistleblower app | Tangential — censorship-resistant upload, low overlap with the assistant story. | [LP-0017.md](./LP-0017.md) |

## Status today

- **Prize text**: ✅ captured per track (see individual docs).
- **LEZ runtime**: ❌ not provisioned in this repo. LEZ programs run on the Logos Execution Zone testnet, which we don't yet have local tooling for.
- **Funded LEZ wallet**: ❌ unconfirmed. Operator has stated one exists; needs verification before any track ships.
- **Sibling project repos**: ❌ none. Each shipped track will live in its own Rust/LEZ project alongside `bucharest`.
- **Marketing surfaces**: locked silent by `tests/e2e/logos-honest-empty.spec.ts`. No deck or blog claim until a track actually ships.

## Recommended sequencing

If we are picking from the 7, two are clearly highest-fit:

1. **LP-0008 (Autonomous AI Module)** — direct overlap with Operator Uplift. The Arkiv entry already proves the off-LEZ analogue (agent identity + memory entities on a public verifiable network). Porting that pattern to LEZ + Logos Storage + Logos Messaging is the natural next step.
2. **LP-0005 (Private Token Balance Attestation)** — clean primitive, narrow scope, useful as a building block we could reuse for Pro-tier gating.

LP-0002, LP-0012, LP-0013 are infrastructure pieces that LP-0008 would lean on. LP-0016 and LP-0017 are standalone products that overlap less with our wedge.

## Next-step checklist

For any track we decide to enter:

1. Operator confirms funded LEZ wallet + paste private-key fingerprint into Vercel env (NEVER into source).
2. Engineering forks a sibling repo (e.g. `operatoruplift/lp-0008-autonomous-ai-module`).
3. Wire local LEZ dev tooling per Logos docs.
4. Convert the per-track design doc here into the sibling repo's README.
5. Ship the entry; only THEN unlock the per-track mention on marketing surfaces.

## Cross-references

- `docs/LOGOS_TRACKS_SCOPING.md` — high-level scoping doc (the "what now" file).
- `tests/e2e/logos-honest-empty.spec.ts` — enforces no-fabrication on marketing surfaces.
- `docs/ARKIV_SUBMISSION.md` — sister doc for the shipped Arkiv Network School entry.
