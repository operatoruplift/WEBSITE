# Filecoin decision

Wave 5 deliverable. Status: **deferred from demo day**, no code, not on the deck.

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
