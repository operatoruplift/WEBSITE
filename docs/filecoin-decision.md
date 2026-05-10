# Filecoin decision

Wave 5 deliverable. Status: **shipped (2026-05-10, PR #515)**.

The deferral reasoning below is preserved as historical context — the decision was reversed when the user requested both Filecoin and ElevenLabs by demo day. See the "Shipped" section at the bottom for what actually landed.

## What was proposed

Anchor the daily x402 receipt-bundle hash on Filecoin. User-visible benefit: a "View on Filecoin" link next to each receipt. The implementation would be a column on `tool_receipts.filecoin_cid`, a sign + push job, and a UI link.

## Why deferred

1. **No user-visible benefit ships in 90 seconds**. The receipt is already signed with ed25519 + verifiable via `/api/receipts/public-key`. Adding "also on Filecoin" doesn't add a fact a judge can act on; it adds a logo.

2. **Estimated effort**: 2-3 hours of code (sign + push + DB column + UI link) + integration test against the Filecoin endpoint. The marginal trust gain over the existing ed25519 signature is small.

3. **Risk**: a Filecoin push that fails silently leaves the receipt without the CID and the UI either lies about durability or shows an awkward "pending" state. Either failure mode hurts the trust pitch.

4. **Alternatives that ship in the same time** (and did): SNS-anchored signer identity (`PR #460`) and the demo recording script (`docs/demo-recording-script.md`).

## When to revisit

Ship Filecoin if and only if **at least one** of these is true:

- The deck explicitly claims "durable receipts" as a pillar (it doesn't currently).
- A user has asked for off-our-infrastructure verifiability beyond ed25519.
- The team has 2+ hours of focused engineering plus integration testing time before recording.

## What to say if a judge asks about Filecoin

> "Receipts are signed ed25519 today and verifiable against our public-key endpoint. We considered Filecoin anchoring but the marginal trust gain over the existing signature didn't justify the implementation cost for the demo. If durability is the question, the better answer is to publish the receipt bundle to a public archive; Filecoin is one option, not the only one."

## What NOT to say

Do not put a Filecoin logo on the homepage hero, the Channels section, or the deck. The current `/integrations` integrations grid lists Filecoin as `coming_soon` (`app/(dashboard)/integrations/page.tsx`). That is the entire surface; do not add another.

## Code touched if/when shipped

- `lib/photon-pending-actions-migration.sql`: no change (this is for iMessage pending actions; receipts use `tool_receipts`).
- `lib/x402/receipts.ts`: add `filecoinCid: string | null` to the receipt shape.
- New `lib/filecoin/anchor.ts`: takes a receipt object, computes the canonical hash bundle, signs + pushes to a Filecoin storage provider, returns the CID.
- New migration adding `filecoin_cid` column to `tool_receipts`.
- `app/(dashboard)/security/page.tsx`: add the "View on Filecoin" link next to each receipt row when `filecoin_cid` is set.
- New cron at `/api/cron/filecoin-anchor` that batches receipts hourly (Vercel Hobby tier still capped at 2 crons; see `app/api/cron/photon-cleanup/route.ts` for the manually-triggered pattern).

## Owner

This decision is reversible. Anyone with two hours and an integration test pass can ship it. The deferral is to keep demo-day scope contained, not to cancel the work.

---

## Shipped (2026-05-10, PR #515)

What landed:

- `lib/filecoin/anchor.ts` — provider-agnostic anchor module supporting **Lighthouse** (single token, default) and **Pinata** (single JWT). Storacha is stubbed; the SDK pattern is the right path when we wire it.
- `lib/filecoin-anchor-migration.sql` — adds `filecoin_cid`, `filecoin_provider`, `filecoin_anchored_at` columns to `tool_receipts` plus a partial index on the un-anchored hot path.
- `app/api/cron/filecoin-anchor/route.ts` — manually-triggerable cron (auth: `Authorization: Bearer $CRON_SECRET`, same pattern as `photon-cleanup`). Pulls 25 un-anchored rows oldest-first, pushes to the configured provider, records the CID + provider on the row.
- `app/(dashboard)/security/page.tsx` — renders "filecoin: <cid>… (provider)" link next to each receipt row when `filecoin_cid` is set; hidden when NULL (no awkward "pending" state, no overclaim).
- `app/api/health/adapters/route.ts` — `filecoin` row in the admin adapter list. Reports active state + provider.
- `src/sections/LocalFirst.tsx` — Built On strip flipped Filecoin from "Soon" → Shipping.
- `tests/e2e/filecoin-anchor-cron.spec.ts` — hermetic 401 + secret-leak guard.
- `tests/e2e/localfirst-built-on-honest.spec.ts` — updated to reflect the new shipping/roadmap split (Solana/Vercel/Supabase/Photon/Filecoin/ElevenLabs shipping; Base/Ethereum still Soon).

What changed from the original plan:

- We did NOT add `filecoin_cid` to the signed `ReceiptPayload`. Doing so would have changed the canonical signed shape that PR #510 just realigned with `/docs/receipts`. The CID lives on the row outside the signed payload — it's external provenance metadata, not part of the trust chain.
- We picked Lighthouse as the default provider rather than Storacha. Lighthouse is a single-token API (one `LIGHTHOUSE_API_KEY` env var) vs Storacha's UCAN delegation flow (key + proof + space). Less to ship, less to operate, same Filecoin durability promise.

Operating notes:

- Vercel env vars to set: `FILECOIN_PROVIDER` (`lighthouse` or `pinata`), then `LIGHTHOUSE_API_KEY` or `PINATA_JWT`.
- The cron is **not** in `vercel.json` because the Hobby tier caps at 2 scheduled crons (currently used by daily-briefing + morning-briefing). Trigger via `curl -H "Authorization: Bearer $CRON_SECRET" https://www.operatoruplift.com/api/cron/filecoin-anchor` or wire to an external scheduler. See `app/api/cron/photon-cleanup/route.ts` for the same pattern.
- Public verification URL: `https://<cid>.ipfs.dweb.link` (dweb.link is the Protocol Labs maintained public IPFS gateway; works for both Lighthouse and Pinata pins).
